'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { useI18n } from '@/lib/i18n/context'
import {
  User,
  Shield,
  Lock,
  Bell,
  Globe,
  Loader2,
  Save,
  Check,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Eye,
  EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface SessionUser {
  id: string
  name: string
  email: string
  role: string
  avatar_url?: string | null
  phone?: string | null
  city?: string | null
  preferred_language?: string | null
  notification_preferences?: {
    email?: boolean
    push?: boolean
    weeklyReport?: boolean
  } | null
}

type Section = 'account' | 'security' | 'notifications' | 'language'

const sections: { id: Section; icon: React.ElementType; key: 'accountInfo' | 'security' | 'notifications' | 'language' }[] = [
  { id: 'account',       icon: User,   key: 'accountInfo' },
  { id: 'security',      icon: Lock,   key: 'security' },
  { id: 'notifications', icon: Bell,   key: 'notifications' },
  { id: 'language',      icon: Globe,  key: 'language' },
]

export default function ParentProfilePage() {
  const { t, locale } = useI18n()
  const isAr = locale === 'ar'
  const ChevronIcon = isAr ? ChevronLeft : ChevronRight

  const [activeSection, setActiveSection] = useState<Section>('account')
  const [user, setUser] = useState<SessionUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Account fields
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')

  // Password fields
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)

  // Notification preferences
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(true)
  const [weeklyReport, setWeeklyReport] = useState(true)

  // Language
  const [language, setLanguage] = useState('ar')

  useEffect(() => { fetchSession() }, [])

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          const u: SessionUser = data.user
          setUser(u)
          setName(u.name || '')
          setPhone(u.phone || '')
          setCity(u.city || '')
          setLanguage(u.preferred_language === 'en' ? 'en' : 'ar')
          const np = u.notification_preferences
          if (np) {
            setEmailNotifications(np.email ?? true)
            setPushNotifications(np.push ?? true)
            setWeeklyReport(np.weeklyReport ?? true)
          }
        }
      }
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  const flash = () => { setSaved(true); setTimeout(() => setSaved(false), 2200) }

  const handleSaveAccount = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, city }),
      })
      if (res.ok) {
        flash()
        toast.success(t.parentPages.profile.saved)
        setUser((u) => u ? { ...u, name, phone, city } : u)
      } else {
        const d = await res.json().catch(() => null)
        toast.error(d?.error || t.parentPages.linkChild.errorOccurred)
      }
    } catch { toast.error(t.parentPages.linkChild.errorOccurred) }
    finally { setSaving(false) }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPassword !== confirmPassword) {
      toast.error(t.parentPages.profile.passwordMismatch); return
    }
    if (newPassword.length < 6) {
      toast.error(t.parentPages.profile.atLeast6Chars); return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (res.ok) {
        flash()
        toast.success(t.parentPages.profile.changePasswordSuccess)
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('')
      } else {
        const d = await res.json()
        toast.error(d.error || t.parentPages.linkChild.errorOccurred)
      }
    } catch { toast.error(t.parentPages.linkChild.errorOccurred) }
    finally { setSaving(false) }
  }

  const handleSavePreferences = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notification_preferences: { email: emailNotifications, push: pushNotifications, weeklyReport },
        }),
      })
      if (res.ok) { flash(); toast.success(t.parentPages.profile.saved) }
      else { const d = await res.json().catch(() => null); toast.error(d?.error || t.parentPages.linkChild.errorOccurred) }
    } catch { toast.error(t.parentPages.linkChild.errorOccurred) }
    finally { setSaving(false) }
  }

  const handleSaveLanguage = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preferred_language: language }),
      })
      if (res.ok) { flash(); toast.success(t.parentPages.profile.saved) }
      else { const d = await res.json().catch(() => null); toast.error(d?.error || t.parentPages.linkChild.errorOccurred) }
    } catch { toast.error(t.parentPages.linkChild.errorOccurred) }
    finally { setSaving(false) }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  )

  if (!user) return (
    <div className="max-w-3xl mx-auto p-6">
      <Card className="rounded-2xl">
        <CardContent className="p-12 text-center text-muted-foreground">
          {t.parentPages.profile.errorLoading}
        </CardContent>
      </Card>
    </div>
  )

  return (
    <div className="max-w-5xl mx-auto pb-16" dir={isAr ? 'rtl' : 'ltr'}>

      {/* Hero */}
      <div className="relative mb-8 rounded-2xl overflow-hidden bg-card border border-border/50">
        {/* subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '20px 20px' }}
        />
        <div className="relative px-6 py-8 flex flex-col sm:flex-row items-start sm:items-center gap-5">
          <div className="relative">
            <Avatar className="w-20 h-20 ring-2 ring-border shadow-md">
              <AvatarImage src={user.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-black text-2xl">
                {user.name?.charAt(0) || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-black text-foreground leading-tight">{user.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5 font-mono" dir="ltr">{user.email}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <Badge variant="secondary" className="gap-1 text-xs font-bold">
                <Shield className="w-3 h-3" />
                {t.parentPages.profile.parent}
              </Badge>
              {user.city && (
                <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  {user.city}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Layout: sidebar + content */}
      <div className="flex gap-6 items-start">

        {/* Sidebar */}
        <nav className="w-52 shrink-0 sticky top-6">
          <ul className="space-y-1">
            {sections.map((s) => {
              const Icon = s.icon
              const active = activeSection === s.id
              return (
                <li key={s.id}>
                  <button
                    onClick={() => setActiveSection(s.id)}
                    className={cn(
                      'w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                      active
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      {t.parentPages.profile[s.key]}
                    </span>
                    <ChevronIcon className={cn('w-3.5 h-3.5 opacity-50', active && 'opacity-100')} />
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* ── Account Info ── */}
          {activeSection === 'account' && (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-6 space-y-6">
                <SectionHeader
                  icon={<User className="w-5 h-5 text-primary" />}
                  title={t.parentPages.profile.accountInfo}
                  desc={t.parentPages.profile.updateAccountDesc}
                />
                <Separator />

                <div className="space-y-5">
                  <FieldRow
                    label={t.parentPages.profile.fullName}
                    icon={<User className="w-4 h-4 text-muted-foreground" />}
                  >
                    <Input value={name} onChange={(e) => setName(e.target.value)} className="rounded-xl" />
                  </FieldRow>

                  <FieldRow
                    label={t.parentPages.profile.email}
                    icon={<Mail className="w-4 h-4 text-muted-foreground" />}
                  >
                    <Input value={user.email} disabled className="rounded-xl opacity-60" dir="ltr" />
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {t.parentPages.profile.emailHint}
                    </p>
                  </FieldRow>

                  <FieldRow
                    label={t.parentPages.profile.phone}
                    icon={<Phone className="w-4 h-4 text-muted-foreground" />}
                  >
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} className="rounded-xl" dir="ltr" placeholder={t.parentPages.profile.phonePlaceholder} />
                  </FieldRow>

                  <FieldRow
                    label={t.parentPages.profile.city}
                    icon={<MapPin className="w-4 h-4 text-muted-foreground" />}
                  >
                    <Input value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl" placeholder={t.parentPages.profile.cityPlaceholder} />
                  </FieldRow>
                </div>

                <SaveButton saving={saving} saved={saved} onClick={handleSaveAccount} isAr={isAr} />
              </CardContent>
            </Card>
          )}

          {/* ── Security ── */}
          {activeSection === 'security' && (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-6 space-y-6">
                <SectionHeader
                  icon={<Lock className="w-5 h-5 text-amber-500" />}
                  title={t.parentPages.profile.security}
                  desc={t.parentPages.profile.changePasswordDesc}
                />
                <Separator />

                <form onSubmit={handlePasswordChange} className="space-y-5">
                  <FieldRow label={t.parentPages.profile.currentPassword} icon={<Lock className="w-4 h-4 text-muted-foreground" />}>
                    <div className="relative">
                      <Input
                        type={showCurrent ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="rounded-xl pe-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrent((v) => !v)}
                        className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FieldRow>

                  <FieldRow label={t.parentPages.profile.newPassword} icon={<Lock className="w-4 h-4 text-muted-foreground" />}>
                    <div className="relative">
                      <Input
                        type={showNew ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="rounded-xl pe-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNew((v) => !v)}
                        className="absolute inset-y-0 end-3 flex items-center text-muted-foreground hover:text-foreground"
                      >
                        {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </FieldRow>

                  <FieldRow label={t.parentPages.profile.confirmPassword} icon={<Lock className="w-4 h-4 text-muted-foreground" />}>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={cn('rounded-xl', confirmPassword && newPassword !== confirmPassword && 'border-red-500 focus-visible:ring-red-500/20')}
                      required
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] text-red-500 mt-1">{t.parentPages.profile.passwordMismatch}</p>
                    )}
                  </FieldRow>

                  {/* Strength indicator */}
                  {newPassword.length > 0 && (
                    <div className="space-y-1">
                      <div className="flex gap-1">
                        {[1,2,3,4].map((n) => (
                          <div
                            key={n}
                            className={cn(
                              'h-1 flex-1 rounded-full transition-colors',
                              newPassword.length >= n * 3
                                ? n <= 1 ? 'bg-red-500' : n === 2 ? 'bg-amber-500' : n === 3 ? 'bg-yellow-500' : 'bg-emerald-500'
                                : 'bg-muted'
                            )}
                          />
                        ))}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {newPassword.length < 6
                          ? t.parentPages.profile.tooWeak
                          : newPassword.length < 9
                            ? t.parentPages.profile.fair
                            : newPassword.length < 12
                              ? t.parentPages.profile.good
                              : t.parentPages.profile.strong}
                      </p>
                    </div>
                  )}

                  <SaveButton type="submit" saving={saving} saved={saved} isAr={isAr}
                    label={t.parentPages.profile.updatePassword}
                    savedLabel={t.parentPages.profile.changed}
                    disabled={!currentPassword || !newPassword || newPassword !== confirmPassword}
                  />
                </form>
              </CardContent>
            </Card>
          )}

          {/* ── Notifications ── */}
          {activeSection === 'notifications' && (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-6 space-y-6">
                <SectionHeader
                  icon={<Bell className="w-5 h-5 text-blue-500" />}
                  title={t.parentPages.profile.notifSettings}
                  desc={t.parentPages.profile.notifSettingsDesc}
                />
                <Separator />

                <div className="space-y-1">
                  <NotifRow
                    title={t.parentPages.profile.emailNotifications}
                    desc={t.parentPages.profile.emailNotificationsDesc}
                    checked={emailNotifications}
                    onChange={setEmailNotifications}
                  />
                  <Separator className="my-1" />
                  <NotifRow
                    title={t.parentPages.profile.pushNotifications}
                    desc={t.parentPages.profile.pushNotificationsDesc}
                    checked={pushNotifications}
                    onChange={setPushNotifications}
                  />
                  <Separator className="my-1" />
                  <NotifRow
                    title={t.parentPages.profile.weeklyReport}
                    desc={t.parentPages.profile.weeklyReportDesc}
                    checked={weeklyReport}
                    onChange={setWeeklyReport}
                  />
                </div>

                <SaveButton saving={saving} saved={saved} onClick={handleSavePreferences} isAr={isAr} />
              </CardContent>
            </Card>
          )}

          {/* ── Language ── */}
          {activeSection === 'language' && (
            <Card className="rounded-2xl border-border/50">
              <CardContent className="p-6 space-y-6">
                <SectionHeader
                  icon={<Globe className="w-5 h-5 text-emerald-500" />}
                  title={t.parentPages.profile.interfaceLanguage}
                  desc={t.parentPages.profile.interfaceLanguageDesc}
                />
                <Separator />

                <div className="grid grid-cols-2 gap-3 max-w-xs">
                  {[
                    { value: 'ar', label: t.parentPages.profile.arabic, sublabel: t.parentPages.profile.arabicSub },
                    { value: 'en', label: t.parentPages.profile.english, sublabel: t.parentPages.profile.englishSub },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setLanguage(opt.value)}
                      className={cn(
                        'flex flex-col items-center gap-1 px-4 py-4 rounded-xl border-2 transition-all text-center',
                        language === opt.value
                          ? 'border-primary bg-primary/5 shadow-sm'
                          : 'border-border hover:border-border/80 hover:bg-muted/40'
                      )}
                    >
                      <span className="text-2xl font-black leading-none">{opt.value === 'ar' ? 'ع' : 'A'}</span>
                      <span className="text-sm font-bold text-foreground">{opt.label}</span>
                      <span className="text-[10px] text-muted-foreground">{opt.sublabel}</span>
                      {language === opt.value && (
                        <Check className="w-3.5 h-3.5 text-primary mt-0.5" />
                      )}
                    </button>
                  ))}
                </div>

                <SaveButton saving={saving} saved={saved} onClick={handleSaveLanguage} isAr={isAr} />
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ── */

function SectionHeader({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 rounded-xl bg-muted flex items-center justify-center shrink-0 mt-0.5">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  )
}

function FieldRow({ label, icon, children }: { label: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase tracking-wider">
        {icon}
        {label}
      </Label>
      {children}
    </div>
  )
}

function NotifRow({
  title, desc, checked, onChange,
}: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 gap-4">
      <div>
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

function SaveButton({
  saving, saved, onClick, isAr, type = 'button', label, savedLabel, disabled,
}: {
  saving: boolean; saved: boolean; onClick?: () => void; isAr: boolean
  type?: 'button' | 'submit'; label?: string; savedLabel?: string; disabled?: boolean
}) {
  return (
    <Button
      type={type}
      onClick={onClick}
      disabled={saving || disabled}
      className="rounded-xl font-bold min-w-36"
    >
      {saving ? (
        <Loader2 className="w-4 h-4 animate-spin me-2" />
      ) : saved ? (
        <Check className="w-4 h-4 me-2" />
      ) : (
        <Save className="w-4 h-4 me-2" />
      )}
      {saving
        ? (isAr ? 'جاري الحفظ...' : 'Saving...')
        : saved
          ? (savedLabel || (isAr ? 'تم الحفظ' : 'Saved'))
          : (label || (isAr ? 'حفظ التغييرات' : 'Save Changes'))}
    </Button>
  )
}
