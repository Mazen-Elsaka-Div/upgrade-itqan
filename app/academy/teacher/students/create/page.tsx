"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowRight, UserPlus, Mail, User, Info } from 'lucide-react'
import Link from 'next/link'
import { useI18n } from '@/lib/i18n/context'

export default function CreateStudentPage() {
    const router = useRouter()
    const { t, dir } = useI18n()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        gender: 'male',
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')
        setSuccess('')

        try {
            // We will create the API route /api/academy/teacher/students/create
            const res = await fetch('/api/academy/teacher/students/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.error || t.teacher.students.createError)
            }

            setSuccess(t.teacher.students.createSuccess)
            setFormData({ name: '', email: '', gender: 'male' })

            // Navigate back after a short delay
            setTimeout(() => {
                router.push('/academy/teacher/students')
            }, 2000)

        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFormData(prev => ({
            ...prev,
            [e.target.name]: e.target.value
        }))
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto" dir={dir}>
            <div className="flex items-center gap-4">
                <Link href="/academy/teacher/students">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold">{t.teacher.students.createTitle}</h1>
                    <p className="text-muted-foreground mt-1">{t.teacher.students.createSubtitle}</p>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserPlus className="w-5 h-5 text-primary" />
                        {t.teacher.students.studentDataCard}
                    </CardTitle>
                    <CardDescription>
                        {t.teacher.students.studentDataDesc}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 text-sm">
                            {error}
                        </div>
                    )}
                    {success && (
                        <div className="mb-6 p-4 bg-green-50 text-green-600 rounded-lg border border-green-200 text-sm">
                            {success}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">{t.teacher.students.fullName}</label>
                            <div className="relative">
                                <User className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder={t.teacher.students.fullNamePlaceholder}
                                    className="pr-10"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">{t.teacher.students.email}</label>
                            <div className="relative">
                                <Mail className="absolute right-3 top-3 w-4 h-4 text-muted-foreground" />
                                <Input
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    placeholder={t.teacher.students.emailPlaceholder}
                                    className="pr-10 text-left"
                                    dir="ltr"
                                    required
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900 flex gap-3">
                            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-800 dark:text-blue-300">
                                <p className="font-medium">{t.teacher.students.tempPasswordTitle}</p>
                                <p className="text-blue-600 dark:text-blue-400 mt-1">{t.teacher.students.tempPasswordDesc}</p>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-1">{t.teacher.students.gender}</label>
                            <select
                                name="gender"
                                value={formData.gender}
                                onChange={handleChange}
                                className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="male">{t.teacher.students.male}</option>
                                <option value="female">{t.teacher.students.female}</option>
                            </select>
                        </div>

                        <Button type="submit" disabled={loading} className="w-full mt-6">
                            {loading ? t.teacher.students.creatingBtn : t.teacher.students.createBtn}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
