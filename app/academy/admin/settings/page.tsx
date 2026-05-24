"use client"

import { useState, useEffect } from 'react'
import { Settings, Save, Globe, Loader2, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'

export default function AcademyAdminSettingsPage() {
    const [appUrl, setAppUrl] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(r => r.json())
            .then(d => {
                if (d.settings?.app_url !== undefined) {
                    const raw = d.settings.app_url
                    setAppUrl(typeof raw === 'string' ? raw.replace(/^"|"$/g, '') : raw || '')
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false))
    }, [])

    const handleSave = async () => {
        if (!appUrl.trim()) { toast.error('يرجى إدخال رابط الموقع'); return }
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: { app_url: appUrl.trim().replace(/\/$/, '') } }),
            })
            if (res.ok) {
                toast.success('تم حفظ رابط الموقع')
                setSaved(true)
                setTimeout(() => setSaved(false), 3000)
            } else {
                toast.error('حدث خطأ أثناء الحفظ')
            }
        } catch {
            toast.error('حدث خطأ')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-3xl mx-auto" dir="rtl">
            <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <Settings className="w-6 h-6 text-primary" />
                    إعدادات النظام
                </h1>
                <p className="text-sm text-muted-foreground mt-1">تكوين إعدادات منصة الأكاديمية</p>
            </div>

            {/* App URL Card */}
            <Card className="border-border rounded-2xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border px-6 py-5">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                            <Globe className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-lg font-bold">رابط الموقع (Domain)</CardTitle>
                            <CardDescription className="text-xs mt-0.5">
                                يُستخدم في روابط الدعوات المرسلة عبر البريد الإلكتروني للأكاديمية
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                    <div className="space-y-2">
                        <Label className="font-bold text-xs text-muted-foreground uppercase tracking-widest">
                            رابط الموقع
                        </Label>
                        <Input
                            dir="ltr"
                            value={appUrl}
                            onChange={e => setAppUrl(e.target.value)}
                            placeholder="https://your-domain.com"
                            className="h-11 border-border bg-muted/50 rounded-xl"
                        />
                        <p className="text-[11px] text-muted-foreground px-1">
                            مثال: <code className="bg-muted px-1 rounded">https://itqan.example.com</code> — بدون / في النهاية
                        </p>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8 h-11 rounded-xl"
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            <span className="mx-2">{saved ? 'تم الحفظ ✓' : 'حفظ الرابط'}</span>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
