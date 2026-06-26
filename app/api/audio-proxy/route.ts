import { NextRequest, NextResponse } from 'next/server'

// Use Edge Runtime for audio streaming:
// - No timeout limits (unlike Serverless which has 10-60s)
// - No response body size restrictions
// - Efficient streaming without buffering entire file in memory
export const runtime = 'edge'

// Only allow proxying from known file hosts to prevent SSRF (matches pdf-proxy).
const ALLOWED_HOST_SUFFIXES = [
  'utfs.io',
  'ufs.sh',
  'amazonaws.com',
  'cloudinary.com',
  'res.cloudinary.com',
]

function isAllowedUrl(fileUrl: string): boolean {
  try {
    const u = new URL(fileUrl)
    if (u.protocol !== 'https:') return false
    return ALLOWED_HOST_SUFFIXES.some(
      (suffix) => u.hostname === suffix || u.hostname.endsWith(`.${suffix}`),
    )
  } catch {
    return false
  }
}

/**
 * Audio Proxy API
 * Proxies audio files from UploadThing (or any URL) while properly
 * handling HTTP Range Requests required by Safari/iOS for audio playback.
 *
 * Usage: /api/audio-proxy?url=<encoded-audio-url>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')

    if (!fileUrl) {
      return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
    }

    if (!isAllowedUrl(fileUrl)) {
      return NextResponse.json({ error: 'URL host not allowed' }, { status: 403 })
    }

    // Forward the Range header from the browser (critical for Safari/iOS)
    const rangeHeader = request.headers.get('range')

    const upstreamHeaders: HeadersInit = {
      'Accept-Encoding': 'identity', // Avoid compressed responses to allow byte-range accuracy
    }

    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader
    }

    const upstream = await fetch(fileUrl, {
      headers: upstreamHeaders,
      signal: request.signal,
    })

    if (!upstream.ok && upstream.status !== 206) {
      console.error('[audio-proxy] upstream error', upstream.status, fileUrl)
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status }
      )
    }

    // Determine content type - prefer upstream, fallback to extension detection
    const upstreamContentType = upstream.headers.get('content-type')
    const contentType =
      upstreamContentType && upstreamContentType !== 'application/octet-stream'
        ? upstreamContentType
        : detectAudioContentType(fileUrl)

    // Build response headers
    const responseHeaders = new Headers()
    responseHeaders.set('Content-Type', contentType)
    responseHeaders.set('Accept-Ranges', 'bytes') // Critical for Safari/iOS seeking
    responseHeaders.set('Cache-Control', 'public, max-age=3600')

    // Forward content-length (Safari needs this to know file duration and allow seeking)
    const contentLength = upstream.headers.get('content-length')
    if (contentLength) {
      responseHeaders.set('Content-Length', contentLength)
    } else if (!rangeHeader) {
      // If no Content-Length and not a range request, do a HEAD to get it
      // This helps Safari display correct duration
      try {
        const headRes = await fetch(fileUrl, { method: 'HEAD' })
        const headLength = headRes.headers.get('content-length')
        if (headLength) responseHeaders.set('Content-Length', headLength)
      } catch {
        // Non-fatal - continue without Content-Length
      }
    }

    // Forward content-range for partial responses (206)
    const contentRange = upstream.headers.get('content-range')
    if (contentRange) {
      responseHeaders.set('Content-Range', contentRange)
    }

    // Stream the response body
    return new Response(upstream.body, {
      status: upstream.status, // 200 or 206
      headers: responseHeaders,
    })
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return new Response(null, { status: 499 })
    }
    console.error('[audio-proxy] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function HEAD(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const fileUrl = searchParams.get('url')

    if (!fileUrl) {
      return new NextResponse(null, { status: 400 })
    }

    if (!isAllowedUrl(fileUrl)) {
      return new NextResponse(null, { status: 403 })
    }

    const upstream = await fetch(fileUrl, { method: 'HEAD' })

    const upstreamContentType = upstream.headers.get('content-type')
    const contentType =
      upstreamContentType && upstreamContentType !== 'application/octet-stream'
        ? upstreamContentType
        : detectAudioContentType(fileUrl)

    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'public, max-age=3600')

    const contentLength = upstream.headers.get('content-length')
    if (contentLength) headers.set('Content-Length', contentLength)

    return new NextResponse(null, { status: 200, headers })
  } catch (error) {
    console.error('[audio-proxy] HEAD error:', error)
    return new NextResponse(null, { status: 500 })
  }
}

/**
 * Detect audio content type from file URL extension.
 * MP4/M4A files should use audio/mp4 for best Safari compatibility.
 */
function detectAudioContentType(url: string): string {
  const lower = url.toLowerCase().split('?')[0] // strip query params
  if (lower.endsWith('.mp4') || lower.endsWith('.m4a')) return 'audio/mp4'
  if (lower.endsWith('.webm')) return 'audio/webm'
  if (lower.endsWith('.ogg') || lower.endsWith('.oga')) return 'audio/ogg'
  if (lower.endsWith('.wav')) return 'audio/wav'
  return 'audio/mpeg' // default for .mp3 and unknown
}
