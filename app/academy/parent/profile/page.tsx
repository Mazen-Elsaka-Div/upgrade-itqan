'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { useI18n } from '@/lib/i18n/context'
import {
  User,
  Mail,
  Shield,
  Lock,
  Bell,
  Globe,
  Loader2,
  Save,
  Check,
} from 'lucide-react'
import { toast } from 'sonner'

interface SessionUser {
  sub: string
  name: string
  email: string
  role: string
  avatar_url?: string | null
}

const languageOptions = [
  { value: 'ar', label: { ar: 'العربية', en: 'Arabic' } },
  { value: 'en', label: { ar: 'الإنجليزية', en: 'English' } },
]

export default function ParentProfilePage() {
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(true)

  // Language
  const [language, setLanguage] = useState('ar')

  useEffect(() => {
    fetchSession()
  }, [])

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
          setLanguage(data.user.preferred_language === 'en' ? 'en' : 'ar')
          const np = data.user.notification_preferences
          if (np) {
            setEmailNotifications(np.email ?? true)
            setPushNotifications(np.push ?? true)
            setWeeklyReport(np.weeklyReport ?? true)
          }
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error(isAr ? 'كلمتا المرور غير متطابقتين' : 'Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      toast.error(isAr ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        toast.success(isAr ? 'تم تغيير كلمة المرور' : 'Password changed')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const data = await res.json()
        toast.error(data.error || (isAr ? 'حدث خطأ' : 'Error'))
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error')
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          preferred_language: language,
          notification_preferences: {
            email: emailNotifications,
            push: pushNotifications,
            weeklyReport,
          },
        }),
      })
      if (res.ok) {
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
        toast.success(isAr ? 'تم الحفظ' : 'Saved')
      } else {
        const data = await res.json().catch(() => null)
        toast.error(data?.error || (isAr ? 'حدث خطأ' : 'Error'))
      }
    } catch {
      toast.error(isAr ? 'حدث خطأ' : 'Error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground font-medium">
            {isAr ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-3xl mx-auto p-6">
        <Card className="rounded-2xl">
          <CardContent className="p-12 text-center text-muted-foreground">
            {isAr ? 'حدث خطأ في تحميل البيانات' : 'Error loading data'}
          </CardContent>
        </Card>
      </div>
    )
  }

  const firstName = user.name.split(' ')[0]

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
          <User className="w-4 h-4" />
          {isAr ? 'الملف الشخصي' : 'Profile'}
        </div>
        <h1 className="text-3xl lg:text-4xl font-black tracking-tight text-foreground">
          {isAr ? 'إعدادات الحساب' : 'Account Settings'}
        </h1>
      </div>

      {/* Profile Card */}
      <Card className="rounded-2xl border-border/50 overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-background" />
        <CardContent className="p-6 -mt-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
            <Avatar className="w-24 h-24 ring-4 ring-background shadow-lg">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-3xl">
                {user.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-black text-foreground">{user.name}</h2>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {user.email}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-bold">
                  <Shield className="w-3 h-3" />
                  {isAr ? 'ولي أمر' : 'Parent'}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Change Password */}
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">
                  {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'حدّث كلمة المرور لحسابك' : 'Update your account password'}
                </p>
              </div>
            </div>

            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">
                  {isAr ? 'كلمة المرور الحالية' : 'Current Password'}
                </Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">
                  {isAr ? 'كلمة المرور الجديدة' : 'New Password'}
                </Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">
                  {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="rounded-xl"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={saving || !currentPassword || !newPassword}
                className="w-full rounded-xl font-bold"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                ) : (
                  <Lock className="w-4 h-4 me-2" />
                )}
                {isAr ? 'تغيير كلمة المرور' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card className="rounded-2xl border-border/50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">
                  {isAr ? 'التفضيلات' : 'Preferences'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {isAr ? 'إشعارات واللغة' : 'Notifications & language'}
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Language */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-bold text-foreground">
                      {isAr ? 'اللغة' : 'Language'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isAr ? 'لغة الواجهة' : 'Interface language'}
                    </p>
                  </div>
                </div>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="h-9 px-3 rounded-xl border border-border bg-card text-sm font-medium"
                >
                  {languageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label[locale]}
                    </option>
                  ))}
                </select>
              </div>

              <Separator />

              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {isAr ? 'إشعارات البريد' : 'Email Notifications'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? 'استلام إشعارات عبر البريد' : 'Receive notifications via email'}
                  </p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>

              {/* Push Notifications */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {isAr ? 'إشعارات الدفع' : 'Push Notifications'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? 'إشعارات فورية في المتصفح' : 'Real-time browser notifications'}
                  </p>
                </div>
                <Switch checked={pushNotifications} onCheckedChange={setPushNotifications} />
              </div>

              {/* Weekly Report */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-foreground">
                    {isAr ? 'التقرير الأسبوعي' : 'Weekly Report'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isAr ? 'إرسال ملخص أسبوعي للبريد' : 'Send weekly summary to email'}
                  </p>
                </div>
                <Switch checked={weeklyReport} onCheckedChange={setWeeklyReport} />
              </div>

              <Button
                onClick={handleSavePreferences}
                disabled={saving}
                className="w-full rounded-xl font-bold mt-2"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin me-2" />
                ) : saved ? (
                  <Check className="w-4 h-4 me-2" />
                ) : (
                  <Save className="w-4 h-4 me-2" />
                )}
                {saved
                  ? isAr
                    ? 'تم الحفظ'
                    : 'Saved'
                  : isAr
                  ? 'حفظ التفضيلات'
                  : 'Save Preferences'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
