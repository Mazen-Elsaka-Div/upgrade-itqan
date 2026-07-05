'use client'

import { useState, useEffect, useRef } from 'react'
import {
    Database, Download, Trash2, RefreshCcw, Loader2,
    CheckCircle, AlertTriangle, Archive, Upload,
    Settings, Clock, FileJson, ShieldCheck
} from 'lucide-react'
import { SettingsSkeleton } from '@/components/ui/skeletons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'

type Stats = {
    tables: {
        users: number
        recitations: number
        bookings: number
        reviews: number
        notifications: number
        activity_logs: number
        page_views: number
        messages: number
        announcements: number
        email_templates: number
        settings_count: number
    }
    lastBackup: string | null
}

export default function AdminBackupPage() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)
    const [actionLoading, setActionLoading] = useState<string | null>(null)
    const [messages, setMessages] = useState<{ type: 'success' | 'error', text: string }[]>([])
    const [includeTheme, setIncludeTheme] = useState(false)
    const restoreInputRef = useRef<HTMLInputElement>(null)
    const settingsRestoreInputRef = useRef<HTMLInputElement>(null)

    const loadStats = async () => {
        setLoading(true)
        try {
            const res = await fetch('/api/admin/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'stats' })
            })
            if (res.ok) setStats(await res.json())
        } catch {
            addMsg('error', 'فشل في تحميل إحصائيات قاعدة البيانات')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { loadStats() }, [])

    const addMsg = (type: 'success' | 'error', text: string) => {
        setMessages(p => [{ type, text }, ...p].slice(0, 5))
        setTimeout(() => setMessages(p => p.slice(1)), 6000)
    }

    // ── Export DB Backup ──────────────────────────────────────────────────────
    const handleExportDB = async () => {
        setActionLoading('export')
        try {
            const res = await fetch('/api/admin/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'export' })
            })
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error ?? 'فشل التصدير')
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `itqaan-db-backup-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
            addMsg('success', 'تم تصدير النسخة الاحتياطية لقاعدة البيانات بنجاح')
            await loadStats()
        } catch (e: any) {
            addMsg('error', e.message ?? 'فشل في تصدير قاعدة البيانات')
        } finally {
            setActionLoading(null)
        }
    }

    // ── Export Settings Backup ────────────────────────────────────────────────
    const handleExportSettings = async () => {
        setActionLoading('export_settings')
        try {
            const url = `/api/admin/settings/full-export?includeTheme=${includeTheme}`
            const res = await fetch(url)
            if (!res.ok) {
                const err = await res.json().catch(() => ({}))
                throw new Error(err.error ?? 'فشل تصدير الإعدادات')
            }
            const blob = await res.blob()
            const objectUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = objectUrl
            const suffix = includeTheme ? 'with-theme' : 'settings-only'
            a.download = `itqan-settings-backup-${suffix}-${new Date().toISOString().split('T')[0]}.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(objectUrl)
            addMsg('success', `تم تصدير نسخة الإعدادات${includeTheme ? ' (مع المظهر)' : ''} بنجاح`)
        } catch (e: any) {
            addMsg('error', e.message ?? 'فشل في تصدير الإعدادات')
        } finally {
            setActionLoading(null)
        }
    }

    // ── Restore DB Backup ─────────────────────────────────────────────────────
    const handleRestoreDB = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!confirm('تحذير: سيتم دمج بيانات ملف النسخة الاحتياطية مع قاعدة البيانات الحالية. هل تريد المتابعة؟')) return

        setActionLoading('restore')
        try {
            const text = await file.text()
            const json = JSON.parse(text)
            const res = await fetch('/api/admin/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'restore', data: json })
            })
            const data = await res.json()
            if (res.ok) {
                addMsg('success', data.message ?? 'تمت الاستعادة بنجاح')
                await loadStats()
            } else {
                addMsg('error', data.error ?? 'فشلت عملية الاستعادة')
            }
        } catch {
            addMsg('error', 'فشل في قراءة الملف — تأكد أنه ملف JSON صالح')
        } finally {
            setActionLoading(null)
            e.target.value = ''
        }
    }

    // ── Restore Settings Backup ───────────────────────────────────────────────
    const handleRestoreSettings = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!confirm('سيتم استعادة إعدادات المنصة من هذا الملف. هل تريد المتابعة؟')) return

        setActionLoading('restore_settings')
        try {
            const text = await file.text()
            const json = JSON.parse(text)
            const res = await fetch('/api/admin/settings/full-export', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: json })
            })
            const data = await res.json()
            if (res.ok) {
                addMsg('success', data.message ?? 'تمت استعادة الإعدادات بنجاح')
            } else {
                addMsg('error', data.error ?? 'فشلت عملية استعادة الإعدادات')
            }
        } catch {
            addMsg('error', 'فشل في قراءة الملف — تأكد أنه ملف JSON صالح')
        } finally {
            setActionLoading(null)
            e.target.value = ''
        }
    }

    // ── Generic Action ────────────────────────────────────────────────────────
    const handleAction = async (action: string, confirmMsg?: string) => {
        if (confirmMsg && !confirm(confirmMsg)) return
        setActionLoading(action)
        try {
            const res = await fetch('/api/admin/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action })
            })
            const data = await res.json()
            if (res.ok) {
                addMsg('success', data.message ?? 'تمت العملية بنجاح')
                await loadStats()
            } else {
                addMsg('error', data.error ?? 'حدث خطأ')
            }
        } catch {
            addMsg('error', 'حدث خطأ غير متوقع')
        } finally {
            setActionLoading(null)
        }
    }

    if (loading) return <SettingsSkeleton />

    const tableRows: { label: string; key: keyof Stats['tables']; color: string }[] = [
        { label: 'المستخدمون', key: 'users', color: 'text-blue-600' },
        { label: 'التسميعات', key: 'recitations', color: 'text-emerald-600' },
        { label: 'الحجوزات', key: 'bookings', color: 'text-purple-600' },
        { label: 'التقييمات', key: 'reviews', color: 'text-amber-600' },
        { label: 'الإشعارات', key: 'notifications', color: 'text-red-500' },
        { label: 'سجل النشاط', key: 'activity_logs', color: 'text-slate-600' },
        { label: 'زيارات الصفحات', key: 'page_views', color: 'text-indigo-500' },
        { label: 'الرسائل', key: 'messages', color: 'text-teal-600' },
        { label: 'الإعلانات', key: 'announcements', color: 'text-orange-500' },
        { label: 'قوالب البريد', key: 'email_templates', color: 'text-pink-500' },
        { label: 'الإعدادات', key: 'settings_count', color: 'text-gray-600' },
    ]

    return (
        <div className="p-6 max-w-5xl mx-auto space-y-6 font-arabic" dir="rtl">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Archive className="w-8 h-8 text-[#1B5E3B]" />
                <div>
                    <h1 className="text-2xl font-bold text-foreground">إدارة النسخ الاحتياطية</h1>
                    <p className="text-muted-foreground text-sm">تصدير واستعادة بيانات المنصة وإعداداتها</p>
                </div>
            </div>

            {/* Last backup banner */}
            {stats?.lastBackup && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-300">
                    <Clock className="w-4 h-4 shrink-0" />
                    <p className="text-sm">
                        آخر نسخة احتياطية:{' '}
                        <span className="font-semibold">
                            {new Date(stats.lastBackup).toLocaleString('ar-SA', { dateStyle: 'medium', timeStyle: 'short' })}
                        </span>
                    </p>
                </div>
            )}

            {/* Messages */}
            {messages.map((m, i) => (
                <div key={i} className={`flex items-center gap-3 p-4 rounded-xl border ${m.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-950 dark:border-green-800 dark:text-green-300' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-950 dark:border-red-800 dark:text-red-300'}`}>
                    {m.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
                    <p className="text-sm font-medium">{m.text}</p>
                </div>
            ))}

            {/* DB Stats */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-2">
                        <Database className="w-5 h-5 text-blue-500" />
                        <h2 className="font-semibold text-foreground">إحصائيات قاعدة البيانات</h2>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={loadStats}
                        disabled={loading}
                        className="gap-2 text-muted-foreground"
                    >
                        <RefreshCcw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        تحديث
                    </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {tableRows.map(row => (
                        <div key={row.key} className="bg-muted/60 rounded-xl p-3 text-center border border-border/50">
                            <p className={`text-2xl font-bold ${row.color}`}>
                                {((stats?.tables?.[row.key] as number) || 0).toLocaleString('ar-SA')}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">{row.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Section 1: DB Backup ───────────────────────────────────────── */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <FileJson className="w-5 h-5 text-emerald-600" />
                    <h2 className="font-semibold text-foreground">نسخة احتياطية من قاعدة البيانات</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    يشمل الملف المصدَّر: المستخدمين، التسميعات، الحجوزات، التقييمات، الرسائل، الإعلانات، قوالب البريد، وجميع الإعدادات.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                        onClick={handleExportDB}
                        disabled={!!actionLoading}
                        className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                        {actionLoading === 'export' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        تصدير نسخة قاعدة البيانات
                    </Button>

                    <div>
                        <input
                            ref={restoreInputRef}
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleRestoreDB}
                        />
                        <Button
                            variant="outline"
                            onClick={() => restoreInputRef.current?.click()}
                            disabled={!!actionLoading}
                            className="gap-2 w-full border-blue-300 text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-950"
                        >
                            {actionLoading === 'restore' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            استيراد واستعادة نسخة احتياطية
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Section 2: Settings Backup ─────────────────────────────────── */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <Settings className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold text-foreground">نسخة احتياطية من الإعدادات</h2>
                </div>
                <p className="text-sm text-muted-foreground">
                    يشمل: إعدادات الموقع العامة، المقرأة، الأكاديمية، SEO، الصفحة الرئيسية، بيانات الهوية والتواصل — مع خيار تضمين المظهر.
                </p>

                {/* Theme toggle */}
                <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <Checkbox
                        id="backup-include-theme"
                        checked={includeTheme}
                        onCheckedChange={(v) => setIncludeTheme(!!v)}
                        className="mt-0.5"
                    />
                    <div>
                        <Label htmlFor="backup-include-theme" className="text-sm font-medium cursor-pointer">
                            تضمين إعدادات المظهر (الألوان، الخط، الاستدارة) في ملف الإعدادات
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            عند استيراد الملف لاحقاً سيتم استعادة المظهر أيضاً. بدون هذا الخيار لن يتأثر المظهر عند الاستيراد.
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <Button
                        onClick={handleExportSettings}
                        disabled={!!actionLoading}
                        className="gap-2"
                        variant="outline"
                    >
                        {actionLoading === 'export_settings' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        تصدير نسخة الإعدادات
                        {includeTheme && actionLoading !== 'export_settings' && (
                            <Badge variant="secondary" className="text-[10px] px-1.5">+ مظهر</Badge>
                        )}
                    </Button>

                    <div>
                        <input
                            ref={settingsRestoreInputRef}
                            type="file"
                            accept=".json"
                            className="hidden"
                            onChange={handleRestoreSettings}
                        />
                        <Button
                            variant="outline"
                            onClick={() => settingsRestoreInputRef.current?.click()}
                            disabled={!!actionLoading}
                            className="gap-2 w-full border-primary/30 text-primary hover:bg-primary/5"
                        >
                            {actionLoading === 'restore_settings' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                            استيراد واستعادة إعدادات
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Section 3: Maintenance Actions ─────────────────────────────── */}
            <div className="bg-card rounded-xl border border-border shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2 mb-1">
                    <ShieldCheck className="w-5 h-5 text-amber-600" />
                    <h2 className="font-semibold text-foreground">عمليات الصيانة</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    <ActionCard
                        title="مسح الكاش"
                        desc="إعادة تحديث جميع صفحات الموقع"
                        color="amber"
                        loading={actionLoading === 'clear_cache'}
                        onClick={() => handleAction('clear_cache')}
                    />
                    <ActionCard
                        title="حذف سجلات النشاط القديمة"
                        desc="سجلات أقدم من 90 يوم"
                        color="red"
                        loading={actionLoading === 'clear_old_logs'}
                        onClick={() => handleAction('clear_old_logs', 'سيتم حذف سجلات النشاط الأقدم من 90 يوم. هل تريد المتابعة؟')}
                    />
                    <ActionCard
                        title="حذف الإشعارات القديمة"
                        desc="الإشعارات المقروءة أقدم من 30 يوم"
                        color="red"
                        loading={actionLoading === 'clear_notifications'}
                        onClick={() => handleAction('clear_notifications', 'سيتم حذف الإشعارات المقروءة الأقدم من 30 يوم. هل تريد المتابعة؟')}
                    />
                    <ActionCard
                        title="حذف بيانات الزيارات القديمة"
                        desc="بيانات زيارات الصفحات أقدم من 90 يوم"
                        color="red"
                        loading={actionLoading === 'clear_page_views'}
                        onClick={() => handleAction('clear_page_views', 'سيتم حذف بيانات زيارات الصفحات الأقدم من 90 يوم. هل تريد المتابعة؟')}
                    />
                </div>
            </div>

            {/* Warning */}
            <div className="bg-amber-500/10 border border-amber-200 dark:border-amber-900 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-amber-700 dark:text-amber-300 text-sm">
                    تحذير: عمليات الحذف والاستعادة لا يمكن التراجع عنها. تأكد دائماً من تصدير نسخة احتياطية قبل إجراء أي عملية صيانة.
                </p>
            </div>
        </div>
    )
}

// ── Small reusable card for maintenance actions ───────────────────────────────
function ActionCard({
    title, desc, color, loading, onClick
}: {
    title: string
    desc: string
    color: 'amber' | 'red' | 'blue'
    loading: boolean
    onClick: () => void
}) {
    const colorMap = {
        amber: 'border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950',
        red: 'border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950',
        blue: 'border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950',
    }
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className={`text-right p-4 rounded-xl border transition-colors disabled:opacity-60 ${colorMap[color]} space-y-1 w-full`}
        >
            <div className="flex items-center gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span className="font-medium text-sm">{title}</span>
            </div>
            <p className="text-xs opacity-70">{desc}</p>
        </button>
    )
}
