import { NextRequest, NextResponse } from 'next/server'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { getSession } from '@/lib/auth'
import {
  getRecordingS3Client,
  extractKeyFromUrl,
  getSignedRecordingUrl,
} from '@/lib/recordings-s3'

export const dynamic = 'force-dynamic'

function contentTypeForKey(key: string): string {
  const ext = key.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'mp4':
      return 'video/mp4'
    case 'webm':
      return 'video/webm'
    case 'ogg':
    case 'ogv':
      return 'video/ogg'
    case 'mov':
      return 'video/quicktime'
    case 'm4v':
      return 'video/x-m4v'
    default:
      return 'application/octet-stream'
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const urlStr = req.nextUrl.searchParams.get('url')
  if (!urlStr) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  const key = extractKeyFromUrl(urlStr)
  if (!key) return NextResponse.json({ error: 'Invalid url' }, { status: 400 })

  const ctx = getRecordingS3Client()
  if (!ctx) {
    return NextResponse.json({ error: 'Recording storage not configured' }, { status: 500 })
  }

  // Primary path: hand the browser a short-lived presigned URL and redirect to
  // it. The browser then streams directly from S3, which natively supports
  // Range requests / seeking and avoids piping large media through a
  // serverless function (which is slow, memory-heavy, and can truncate).
  const signed = await getSignedRecordingUrl(key)
  if (signed) {
    return NextResponse.redirect(signed, 302)
  }

  // Fallback: proxy-stream the object ourselves (used only if signing fails).
  const range = req.headers.get('range') || undefined
  try {
    const res = await ctx.client.send(
      new GetObjectCommand({
        Bucket: ctx.config.bucket,
        Key: key,
        Range: range,
      })
    )
    if (!res.Body) {
      return NextResponse.json({ error: 'Empty object' }, { status: 404 })
    }
    const body = (res.Body as any).transformToWebStream
      ? (res.Body as any).transformToWebStream()
      : (res.Body as any)

    const headers = new Headers()
    headers.set('Content-Type', res.ContentType || contentTypeForKey(key))
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Cache-Control', 'private, max-age=3600')
    if (res.ContentLength != null) headers.set('Content-Length', String(res.ContentLength))
    if (res.ContentRange) headers.set('Content-Range', res.ContentRange)

    const status = res.ContentRange ? 206 : 200
    return new NextResponse(body as any, { status, headers })
  } catch (err: any) {
    const code = err?.$metadata?.httpStatusCode
    if (code === 416) {
      return new NextResponse(null, { status: 416, headers: { 'Accept-Ranges': 'bytes' } })
    }
    if (code === 404 || err?.name === 'NoSuchKey') {
      return NextResponse.json({ error: 'Recording not found' }, { status: 404 })
    }
    console.error('[recordings/watch] stream failed', err)
    return NextResponse.json({ error: 'Failed to stream recording' }, { status: 500 })
  }
}
