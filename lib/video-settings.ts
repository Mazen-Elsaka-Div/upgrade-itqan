/**
 * Per-platform video/streaming settings. The same database row backs both
 * the admin "settings" page and the in-call logic that decides things like
 * whether to enable recording or screen sharing.
 */

import { query, queryOne } from '@/lib/db'
import type { HalaqaPlatform } from '@/lib/halaqat'

export interface VideoSettings {
  platform: HalaqaPlatform
  max_participants: number
  default_video_quality: 'h180' | 'h360' | 'h540' | 'h720' | 'h1080'
  default_audio_only: boolean
  recording_enabled: boolean
  recording_auto_start: boolean
  recording_storage_url: string | null
  allow_chat: boolean
  allow_screen_share: boolean
  allow_student_unmute: boolean
  allow_student_video: boolean
  require_approval_to_join: boolean
  max_duration_minutes: number
  inactivity_timeout_minutes: number
  show_participant_count: boolean
  enable_post_session_rating: boolean
  watermark_text: string | null
  updated_at: string
}

const DEFAULTS: Omit<VideoSettings, 'platform' | 'updated_at'> = {
  max_participants: 50,
  default_video_quality: 'h720',
  default_audio_only: false,
  recording_enabled: false,
  recording_auto_start: false,
  recording_storage_url: null,
  allow_chat: true,
  allow_screen_share: true,
  allow_student_unmute: true,
  allow_student_video: true,
  require_approval_to_join: false,
  max_duration_minutes: 180,
  inactivity_timeout_minutes: 15,
  show_participant_count: true,
  enable_post_session_rating: true,
  watermark_text: null,
}

export async function getVideoSettings(platform: HalaqaPlatform): Promise<VideoSettings> {
  const row = await queryOne<VideoSettings>(
    `SELECT * FROM video_settings WHERE platform = $1`,
    [platform]
  )
  if (row) return row
  // Seed-on-read fallback in case migration 038 hasn't been run yet.
  return {
    platform,
    ...DEFAULTS,
    updated_at: new Date().toISOString(),
  }
}

export const VIDEO_SETTINGS_FIELDS: Array<keyof Omit<VideoSettings, 'platform' | 'updated_at'>> = [
  'max_participants',
  'default_video_quality',
  'default_audio_only',
  'recording_enabled',
  'recording_auto_start',
  'recording_storage_url',
  'allow_chat',
  'allow_screen_share',
  'allow_student_unmute',
  'allow_student_video',
  'require_approval_to_join',
  'max_duration_minutes',
  'inactivity_timeout_minutes',
  'show_participant_count',
  'enable_post_session_rating',
  'watermark_text',
]

export async function updateVideoSettings(
  platform: HalaqaPlatform,
  patch: Partial<Omit<VideoSettings, 'platform' | 'updated_at'>>,
  actorId: string | null
): Promise<VideoSettings> {
  // Make sure the row exists.
  await query(
    `INSERT INTO video_settings (platform) VALUES ($1) ON CONFLICT (platform) DO NOTHING`,
    [platform]
  )
  const updates: string[] = []
  const values: unknown[] = []
  let i = 1
  for (const key of VIDEO_SETTINGS_FIELDS) {
    if (patch[key] !== undefined) {
      updates.push(`${key} = $${i++}`)
      values.push(patch[key])
    }
  }
  if (updates.length === 0) {
    return getVideoSettings(platform)
  }
  updates.push(`updated_by = $${i++}`)
  values.push(actorId)
  updates.push(`updated_at = NOW()`)
  values.push(platform)
  await query(
    `UPDATE video_settings SET ${updates.join(', ')} WHERE platform = $${i}`,
    values
  )
  return getVideoSettings(platform)
}
