import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { ADMIN_ROLES, type HalaqaPlatform } from '@/lib/halaqat'
import {
  VIDEO_SETTINGS_FIELDS,
  getVideoSettings,
  updateVideoSettings,
} from '@/lib/video-settings'
import { isRecordingConfigured, isLiveKitConfigured } from '@/lib/livekit'

function parsePlatform(req: NextRequest): HalaqaPlatform | null {
  const p = new URL(req.url).searchParams.get('platform')
  return p === 'maqraa' || p === 'academy' ? p : null
}

/** GET /api/video/settings?platform=academy|maqraa */
export async function GET(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const platform = parsePlatform(req)
  if (!platform) return NextResponse.json({ error: 'platform مطلوب' }, { status: 400 })
  if (!ADMIN_ROLES[platform].includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }
  const settings = await getVideoSettings(platform)
  return NextResponse.json({
    data: settings,
    capabilities: {
      livekit_configured: isLiveKitConfigured(),
      recording_configured: isRecordingConfigured(),
    },
  })
}

/** PATCH /api/video/settings?platform=academy|maqraa */
export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const platform = parsePlatform(req)
  if (!platform) return NextResponse.json({ error: 'platform مطلوب' }, { status: 400 })
  if (!ADMIN_ROLES[platform].includes(session.role)) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 403 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'JSON غير صالح' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  for (const key of VIDEO_SETTINGS_FIELDS) {
    if (body[key] !== undefined) {
      patch[key] = body[key]
    }
  }

  const updated = await updateVideoSettings(platform, patch, session.sub)
  return NextResponse.json({ data: updated })
}
