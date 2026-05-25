'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocalParticipant, useRoomContext } from '@livekit/components-react'
import { Track } from 'livekit-client'
import type {
  LocalAudioTrack,
  LocalParticipant,
  LocalVideoTrack,
  RemoteAudioTrack,
  RemoteVideoTrack,
} from 'livekit-client'
import { Circle, Loader2 } from 'lucide-react'

/**
 * Browser-driven recorder for a LiveKit room.
 *
 * Pulls the local host's audio + camera (and screen-share if active) into
 * one MediaStream, runs MediaRecorder with a 5 s timeslice, and ships each
 * Blob chunk directly to /api/recordings/multipart/upload-part. The server
 * keeps each chunk in S3 (multipart upload) so the browser never persists
 * media locally.
 *
 * On Complete (host stops recording or leaves), it calls
 * /api/recordings/multipart/complete to assemble the parts into a single
 * MP4/WebM in the bucket; a crash-recovery cron handles browsers that
 * disappear without a graceful close.
 *
 * Fallback: if /api/recordings/multipart/initiate returns 503 NOT_CONFIGURED
 * (i.e. no S3 env), we fall back to the legacy LiveKit Egress recorder.
 */
interface Props {
  sessionId: string
  /** Show the button (host UI only). */
  enabled: boolean
}

type RecState = 'off' | 'starting' | 'recording' | 'stopping' | 'fallback-recording'

interface UploadContext {
  recordingId: string
  uploadId: string
  bucket: string
  key: string
}

// S3 multipart parts must be ≥ 5 MB (except the final one). We buffer chunks
// from MediaRecorder until we accumulate that much before flushing one Part.
const MIN_PART_BYTES = 5 * 1024 * 1024
// MediaRecorder timeslice (ms). 5 s gives a good balance between upload
// granularity and recorder stability per the spec.
const RECORDER_TIMESLICE_MS = 5000

export function ClientRecorder({ sessionId, enabled }: Props) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [state, setState] = useState<RecState>('off')
  const [error, setError] = useState<string | null>(null)
  const uploadCtxRef = useRef<UploadContext | null>(null)
  const partNumberRef = useRef(1)
  const bufferRef = useRef<Blob[]>([])
  const bufferedBytesRef = useRef(0)
  const inFlightRef = useRef<Promise<void>>(Promise.resolve())
  const recorderRef = useRef<MediaRecorder | null>(null)
  const startedAtRef = useRef<number | null>(null)
  const stopRequestedRef = useRef(false)
  const mergedStreamRef = useRef<MediaStream | null>(null)

  // Build a merged MediaStream from the host's local audio + camera + (if
  // active) screen share. We listen to LiveKit track-published events so a
  // screen share started mid-recording gets added without re-mounting the
  // recorder.
  const buildMergedStream = useCallback((): MediaStream | null => {
    if (!localParticipant) return null
    const lp = localParticipant as LocalParticipant
    const tracks = lp.trackPublications

    const merged = new MediaStream()
    const collected: {
      cam?: LocalVideoTrack | RemoteVideoTrack
      mic?: LocalAudioTrack | RemoteAudioTrack
      screen?: LocalVideoTrack
      screenAudio?: LocalAudioTrack
    } = {}

    tracks.forEach((pub) => {
      if (!pub.track) return
      if (pub.track.kind === Track.Kind.Audio) {
        if (pub.source === Track.Source.ScreenShareAudio) {
          collected.screenAudio = pub.track as LocalAudioTrack
        } else if (pub.source === Track.Source.Microphone) {
          collected.mic = pub.track as LocalAudioTrack
        }
      } else if (pub.track.kind === Track.Kind.Video) {
        if (pub.source === Track.Source.ScreenShare) {
          collected.screen = pub.track as LocalVideoTrack
        } else if (pub.source === Track.Source.Camera) {
          collected.cam = pub.track as LocalVideoTrack
        }
      }
    })

    // Prefer screen-share when the teacher is presenting; otherwise their cam.
    const chosenVideo = collected.screen ?? collected.cam
    if (chosenVideo?.mediaStreamTrack) {
      merged.addTrack(chosenVideo.mediaStreamTrack)
    }
    if (collected.mic?.mediaStreamTrack) {
      merged.addTrack(collected.mic.mediaStreamTrack)
    }
    if (collected.screenAudio?.mediaStreamTrack) {
      merged.addTrack(collected.screenAudio.mediaStreamTrack)
    }
    if (merged.getTracks().length === 0) return null
    return merged
  }, [localParticipant])

  // Decide which mime-type to ask MediaRecorder for. webm/vp8 has the
  // broadest browser support; we prefer vp9/opus when available.
  const chosenMime = useMemo(() => {
    if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') return 'video/webm'
    const candidates = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=h264,aac',
    ]
    for (const c of candidates) {
      try {
        if (MediaRecorder.isTypeSupported(c)) return c
      } catch {
        /* ignore */
      }
    }
    return 'video/webm'
  }, [])

  // Serial chunk uploader so we never reorder Parts.
  const enqueueUpload = useCallback(async (partNumber: number, body: Blob) => {
    if (!uploadCtxRef.current) return
    const ctx = uploadCtxRef.current
    const fd = new FormData()
    fd.append('recordingId', ctx.recordingId)
    fd.append('partNumber', String(partNumber))
    fd.append('chunk', body, `part-${partNumber}`)
    const res = await fetch('/api/recordings/multipart/upload-part', {
      method: 'POST',
      body: fd,
      keepalive: false,
    })
    if (!res.ok) {
      const j = await res.json().catch(() => ({}))
      throw new Error(j.error || `فشل رفع الجزء ${partNumber}`)
    }
  }, [])

  // Drain the accumulated buffer into a single Part if it's >= MIN_PART_BYTES
  // (or `final` is true, which means flush whatever we have).
  const drainBuffer = useCallback(
    async (final: boolean) => {
      if (!uploadCtxRef.current) return
      if (bufferRef.current.length === 0) return
      if (!final && bufferedBytesRef.current < MIN_PART_BYTES) return

      const blob = new Blob(bufferRef.current, { type: chosenMime })
      bufferRef.current = []
      bufferedBytesRef.current = 0
      const partNumber = partNumberRef.current++
      // Serialise uploads so Part order matches our PartNumber assignment.
      inFlightRef.current = inFlightRef.current
        .then(() => enqueueUpload(partNumber, blob))
        .catch((err) => {
          console.error('[client-recorder] upload failed', err)
          setError(err instanceof Error ? err.message : 'فشل رفع جزء التسجيل')
        })
    },
    [chosenMime, enqueueUpload]
  )

  // Hook MediaRecorder.ondataavailable → buffer + drain.
  const handleData = useCallback(
    async (e: BlobEvent) => {
      if (!e.data || e.data.size === 0) return
      bufferRef.current.push(e.data)
      bufferedBytesRef.current += e.data.size
      await drainBuffer(false)
    },
    [drainBuffer]
  )

  // Fallback: when client recording isn't configured we keep the LiveKit
  // Egress path alive so a host can still record server-side.
  const startFallback = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch(`/api/video/sessions/${sessionId}/recording`, {
        method: 'POST',
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError(j.error || 'فشل بدء التسجيل (Egress)')
        return false
      }
      setState('fallback-recording')
      return true
    } catch (err) {
      console.error('[client-recorder] fallback start failed', err)
      setError('تعذّر بدء التسجيل البديل')
      return false
    }
  }, [sessionId])

  const stopFallback = useCallback(async () => {
    try {
      await fetch(`/api/video/sessions/${sessionId}/recording`, { method: 'DELETE' })
    } catch (err) {
      console.error('[client-recorder] fallback stop failed', err)
    } finally {
      setState('off')
    }
  }, [sessionId])

  const start = useCallback(async () => {
    if (state !== 'off') return
    setError(null)
    setState('starting')

    const stream = buildMergedStream()
    if (!stream) {
      setError('لا توجد مصادر فيديو/صوت محلية. تأكد من تشغيل الكاميرا/المايك قبل بدء التسجيل.')
      setState('off')
      return
    }
    mergedStreamRef.current = stream

    let initJson: { recordingId: string; uploadId: string; bucket: string; key: string } | null = null
    try {
      const res = await fetch('/api/recordings/multipart/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, mimeType: chosenMime }),
      })
      const j = await res.json().catch(() => ({}))
      if (res.status === 503 && j.code === 'NOT_CONFIGURED') {
        // Fall back to LiveKit Egress
        const ok = await startFallback()
        if (!ok) setState('off')
        return
      }
      if (!res.ok) {
        setError(j.error || 'فشل بدء التسجيل')
        setState('off')
        return
      }
      initJson = j as typeof initJson
    } catch (err) {
      console.error('[client-recorder] initiate failed', err)
      setError('تعذّر بدء التسجيل')
      setState('off')
      return
    }

    if (!initJson) {
      setState('off')
      return
    }

    uploadCtxRef.current = initJson
    partNumberRef.current = 1
    bufferRef.current = []
    bufferedBytesRef.current = 0
    inFlightRef.current = Promise.resolve()
    stopRequestedRef.current = false

    let recorder: MediaRecorder
    try {
      recorder = new MediaRecorder(stream, { mimeType: chosenMime })
    } catch (err) {
      console.error('[client-recorder] MediaRecorder failed', err)
      setError('متصفحك لا يدعم تسجيل الفيديو في الخلفية')
      setState('off')
      return
    }
    recorder.ondataavailable = handleData
    recorder.onerror = (ev) => {
      console.error('[client-recorder] recorder error', ev)
      setError('حدث خطأ أثناء التسجيل')
    }
    recorder.onstop = async () => {
      // Flush whatever is left in the buffer.
      try {
        await drainBuffer(true)
        await inFlightRef.current
      } catch (err) {
        console.error('[client-recorder] final drain failed', err)
      }
      // Complete the multipart upload.
      try {
        const seconds = startedAtRef.current
          ? Math.round((Date.now() - startedAtRef.current) / 1000)
          : null
        await fetch('/api/recordings/multipart/complete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recordingId: uploadCtxRef.current?.recordingId,
            durationSeconds: seconds,
          }),
        })
      } catch (err) {
        console.error('[client-recorder] complete failed', err)
        setError('تم إيقاف التسجيل لكن فشل تجميع الأجزاء — سيُحاول النظام استعادتها لاحقاً.')
      } finally {
        uploadCtxRef.current = null
        recorderRef.current = null
        startedAtRef.current = null
        setState('off')
      }
    }

    recorderRef.current = recorder
    startedAtRef.current = Date.now()
    try {
      recorder.start(RECORDER_TIMESLICE_MS)
      setState('recording')
    } catch (err) {
      console.error('[client-recorder] start() failed', err)
      setError('تعذّر بدء MediaRecorder')
      setState('off')
    }
  }, [
    buildMergedStream,
    chosenMime,
    drainBuffer,
    handleData,
    sessionId,
    startFallback,
    state,
  ])

  const stop = useCallback(async () => {
    if (state === 'fallback-recording') {
      setState('stopping')
      await stopFallback()
      return
    }
    if (!recorderRef.current) return
    setState('stopping')
    stopRequestedRef.current = true
    try {
      recorderRef.current.stop()
    } catch (err) {
      console.error('[client-recorder] stop() failed', err)
      setState('off')
    }
  }, [state, stopFallback])

  // Best-effort upload of remaining parts on tab close. We can't await on a
  // page-unload, but MediaRecorder.stop is synchronous enough to surface the
  // final ondataavailable to enqueueUpload, and the crash-recovery cron will
  // assemble whatever already landed in S3.
  useEffect(() => {
    if (state !== 'recording') return
    const handler = () => {
      try {
        recorderRef.current?.requestData?.()
        recorderRef.current?.stop?.()
      } catch {
        /* swallow */
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [state])

  // Keep the recorder alive even when LiveKit reconnects — Room emits
  // disconnect/reconnect; we only stop when the actual room ends.
  useEffect(() => {
    if (!room) return
    const onDisconnected = () => {
      if (recorderRef.current && recorderRef.current.state !== 'inactive') {
        try {
          recorderRef.current.stop()
        } catch {
          /* swallow */
        }
      }
    }
    room.on('disconnected', onDisconnected)
    return () => {
      room.off('disconnected', onDisconnected)
    }
  }, [room])

  if (!enabled) return null

  const isBusy = state === 'starting' || state === 'stopping'
  const isRecording = state === 'recording' || state === 'fallback-recording'
  return (
    <div className="flex items-center gap-1.5">
      <button
        onClick={isRecording ? stop : start}
        disabled={isBusy}
        className={
          isRecording
            ? 'inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 hover:bg-rose-500/30 transition-colors disabled:opacity-50'
            : 'inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-full bg-white/10 border border-white/10 hover:bg-white/20 transition-colors disabled:opacity-50'
        }
        title={state === 'fallback-recording' ? 'يستخدم LiveKit Egress كبديل' : undefined}
      >
        {isBusy ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Circle className={`w-3 h-3 ${isRecording ? 'fill-rose-400 text-rose-400 animate-pulse' : ''}`} />
        )}
        {state === 'recording'
          ? 'إيقاف التسجيل'
          : state === 'fallback-recording'
            ? 'إيقاف (Egress)'
            : isBusy
              ? '...'
              : 'بدء التسجيل'}
      </button>
      {error && (
        <span className="text-[10px] text-rose-300/80 max-w-[200px] truncate" title={error}>
          {error}
        </span>
      )}
    </div>
  )
}
