import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { query } from '@/lib/db'
import { normalizeTheme } from '@/lib/admin/theme'

export async function POST(req: NextRequest) {
    const session = await getSession()
    if (!session || session.role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse body ONCE — avoids the "body already read" bug in the restore case
    let body: any = {}
    try {
        body = await req.json()
    } catch {
        return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { action } = body

    switch (action) {

        case 'export': {
            // Pull ALL tables + settings in one shot
            const [users, recitations, bookings, settingsRows, reviews, notifications, messages, announcements, emailTemplates] = await Promise.all([
                query(`SELECT id, name, email, role, is_active, approval_status, created_at FROM users ORDER BY created_at`),
                query(`SELECT id, student_id, assigned_reader_id, surah_name, status, created_at FROM recitations ORDER BY created_at`),
                query(`SELECT id, student_id, reader_id, status, scheduled_at, created_at FROM bookings ORDER BY created_at`),
                query(`SELECT setting_key, setting_value, setting_type FROM system_settings ORDER BY setting_key`),
                query(`SELECT id, student_id, reader_id, rating, created_at FROM reviews ORDER BY created_at`),
                query(`SELECT id, user_id, title, body, is_read, created_at FROM notifications ORDER BY created_at DESC LIMIT 5000`),
                query(`SELECT id, sender_id, receiver_id, body, created_at FROM messages ORDER BY created_at DESC LIMIT 5000`),
                query(`SELECT id, title, body, created_at FROM announcements ORDER BY created_at`),
                query(`SELECT id, name, subject, body FROM email_templates ORDER BY id`),
            ])

            const exportData = {
                exported_at: new Date().toISOString(),
                version: '2.0',
                data: {
                    users,
                    recitations,
                    bookings,
                    reviews,
                    notifications,
                    messages,
                    announcements,
                    email_templates: emailTemplates,
                    settings: settingsRows,
                },
                counts: {
                    users: (users as any[]).length,
                    recitations: (recitations as any[]).length,
                    bookings: (bookings as any[]).length,
                    reviews: (reviews as any[]).length,
                    notifications: (notifications as any[]).length,
                    messages: (messages as any[]).length,
                    announcements: (announcements as any[]).length,
                    email_templates: (emailTemplates as any[]).length,
                    settings: (settingsRows as any[]).length,
                }
            }

            await query(
                `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'backup_exported', 'Admin exported full database backup')`,
                [session.sub]
            )

            const filename = `itqaan-backup-${new Date().toISOString().split('T')[0]}.json`
            return new NextResponse(JSON.stringify(exportData, null, 2), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json; charset=utf-8',
                    'Content-Disposition': `attachment; filename="${filename}"`,
                },
            })
        }

        case 'restore': {
            const data = body.data
            if (!data) {
                return NextResponse.json({ error: 'No data provided in request body' }, { status: 400 })
            }

            // Support both v1 and v2 format
            const payload = data.data ?? data

            try {
                let restored = 0

                // Restore system_settings
                const settingsArr = payload.settings ?? []
                for (const s of settingsArr) {
                    if (!s.setting_key) continue
                    await query(
                        `INSERT INTO system_settings (setting_key, setting_value, setting_type)
                         VALUES ($1, $2::jsonb, $3)
                         ON CONFLICT (setting_key) DO UPDATE
                            SET setting_value = EXCLUDED.setting_value,
                                setting_type = EXCLUDED.setting_type`,
                        [s.setting_key, JSON.stringify(s.setting_value), s.setting_type ?? 'general']
                    )
                    restored++
                }

                // Restore users (no overwrite of existing to protect live data)
                for (const u of payload.users ?? []) {
                    if (!u.id || !u.email) continue
                    await query(
                        `INSERT INTO users (id, name, email, role, is_active, approval_status)
                         VALUES ($1, $2, $3, $4, $5, $6)
                         ON CONFLICT (id) DO NOTHING`,
                        [u.id, u.name, u.email, u.role, u.is_active, u.approval_status]
                    )
                    restored++
                }

                await query(
                    `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'backup_restored', $2)`,
                    [session.sub, `Admin restored backup. ${restored} records processed.`]
                )

                return NextResponse.json({
                    ok: true,
                    message: `تمت الاستعادة بنجاح — ${restored} سجل`,
                    restored
                })
            } catch (err: any) {
                return NextResponse.json({ error: `Restore failed: ${err.message}` }, { status: 500 })
            }
        }

        case 'clear_old_logs': {
            await query(`DELETE FROM activity_logs WHERE created_at < NOW() - INTERVAL '90 days'`)
            await query(
                `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'logs_cleared', 'Admin cleared activity logs older than 90 days')`,
                [session.sub]
            )
            return NextResponse.json({ ok: true, message: 'تم حذف سجلات النشاط الأقدم من 90 يوم' })
        }

        case 'clear_page_views': {
            await query(`DELETE FROM page_views WHERE created_at < NOW() - INTERVAL '90 days'`)
            return NextResponse.json({ ok: true, message: 'تم حذف بيانات زيارات الصفحات الأقدم من 90 يوم' })
        }

        case 'clear_notifications': {
            await query(`DELETE FROM notifications WHERE created_at < NOW() - INTERVAL '30 days' AND is_read = true`)
            return NextResponse.json({ ok: true, message: 'تم حذف الإشعارات المقروءة الأقدم من 30 يوم' })
        }

        case 'clear_cache': {
            const { revalidatePath } = await import('next/cache')
            revalidatePath('/')
            revalidatePath('/admin')
            revalidatePath('/reader')
            revalidatePath('/student')
            await query(
                `INSERT INTO activity_logs (user_id, action, description) VALUES ($1, 'cache_cleared', 'Admin cleared system cache')`,
                [session.sub]
            )
            return NextResponse.json({ ok: true, message: 'تم مسح ذاكرة التخزين المؤقت وإعادة تحديث الصفحات' })
        }

        case 'stats': {
            // Try to get counts — gracefully skip tables that may not exist
            const safe = async (sql: string): Promise<number> => {
                try {
                    const rows = await query<{ count: string }>(sql)
                    return parseInt((rows as any[])[0]?.count ?? '0', 10)
                } catch { return 0 }
            }

            const [
                users, recitations, bookings, reviews,
                notifications, activity_logs, page_views,
                messages, announcements, email_templates,
                settings_count, last_backup
            ] = await Promise.all([
                safe(`SELECT COUNT(*) FROM users`),
                safe(`SELECT COUNT(*) FROM recitations`),
                safe(`SELECT COUNT(*) FROM bookings`),
                safe(`SELECT COUNT(*) FROM reviews`),
                safe(`SELECT COUNT(*) FROM notifications`),
                safe(`SELECT COUNT(*) FROM activity_logs`),
                safe(`SELECT COUNT(*) FROM page_views`),
                safe(`SELECT COUNT(*) FROM messages`),
                safe(`SELECT COUNT(*) FROM announcements`),
                safe(`SELECT COUNT(*) FROM email_templates`),
                safe(`SELECT COUNT(*) FROM system_settings`),
                // Last backup log entry
                query(`SELECT created_at FROM activity_logs WHERE action = 'backup_exported' ORDER BY created_at DESC LIMIT 1`)
                    .catch(() => []),
            ])

            return NextResponse.json({
                tables: {
                    users, recitations, bookings, reviews,
                    notifications, activity_logs, page_views,
                    messages, announcements, email_templates,
                    settings_count,
                },
                lastBackup: (last_backup as any[])[0]?.created_at ?? null,
            })
        }

        default:
            return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
}
