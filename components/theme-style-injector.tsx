import { query } from "@/lib/db"
import {
  DEFAULT_THEME,
  THEME_FONTS,
  buildThemeCss,
  normalizeTheme,
  type ThemeConfig,
} from "@/lib/admin/theme"

// Server component. Reads the saved theme DIRECTLY from the DB (no in-memory
// cache) so the Super Admin's design choices apply immediately after saving —
// no stale serverless-instance cache can block the update.
export async function ThemeStyleInjector() {
  let theme: ThemeConfig = DEFAULT_THEME
  try {
    const rows = await query<{ setting_value: any }>(
      `SELECT setting_value FROM system_settings WHERE setting_key = 'theme_config'`,
      []
    )
    if (rows.length && rows[0].setting_value) {
      theme = normalizeTheme(rows[0].setting_value)
    }
  } catch {
    // Fall back to defaults; never block rendering on a settings failure.
  }

  const fontHref = THEME_FONTS[theme.font]?.href
  const css = buildThemeCss(theme)

  return (
    <>
      {fontHref ? <link rel="stylesheet" href={fontHref} /> : null}
      {/* eslint-disable-next-line react/no-danger */}
      <style id="itqan-theme-overrides" dangerouslySetInnerHTML={{ __html: css }} />
    </>
  )
}
