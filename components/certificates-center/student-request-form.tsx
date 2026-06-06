'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useI18n } from '@/lib/i18n/context'
import { XCircle } from 'lucide-react'

import { CertRequest } from './student-request/types'
import { RequestSkeleton } from './student-request/request-skeleton'
import { FormView } from './student-request/form-view'

interface StudentRequestFormProps {
  id: string
  apiBase: string
  backHref: string
}

export default function StudentCertificateRequestForm({
  id,
  apiBase,
  backHref,
}: StudentRequestFormProps) {
  const router = useRouter()
  const { locale } = useI18n()
  const isAr = locale === 'ar'

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [request, setRequest] = useState<CertRequest | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [displayName, setDisplayName] = useState('')
  const [arabicName, setArabicName] = useState('')
  const [phone, setPhone] = useState('')
  const [notes, setNotes] = useState('')
  const [confirmAccurate, setConfirmAccurate] = useState(false)

  const fetchRequest = useCallback(() => {
    setLoading(true)
    setError(null)
    fetch(`${apiBase}/requests/${id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) {
          setError(d.error)
        } else {
          setRequest(d.request)
          const data = d.request.data || {}
          setDisplayName(data.display_name || '')
          setArabicName(data.arabic_name || '')
          setPhone(data.phone || '')
          setNotes(data.notes || '')
        }
      })
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false))
  }, [apiBase, id])

  useEffect(() => {
    fetchRequest()
  }, [fetchRequest])

  const submit = async () => {
    if (!confirmAccurate) {
      alert(
        isAr
          ? 'يرجى تأكيد صحة البيانات قبل الإرسال'
          : 'Please confirm the details are accurate before submitting',
      )
      return
    }
    setSaving(true)
    try {
      const res = await fetch(`${apiBase}/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          data: {
            display_name: displayName,
            arabic_name: arabicName,
            phone,
            notes,
          },
        }),
      })
      if (res.ok) {
        router.push(backHref)
      } else {
        const d = await res.json().catch(() => null)
        alert(d?.error || (isAr ? 'فشل الإرسال' : 'Submit failed'))
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <RequestSkeleton />
  }

  if (error || !request) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <XCircle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-xl font-black">
          {isAr ? 'تعذر تحميل الطلب' : 'Failed to load request'}
        </h2>
        <p className="text-muted-foreground mt-2">{error}</p>
      </div>
    )
  }

  return (
    <FormView
      request={request}
      isAr={isAr}
      backHref={backHref}
      displayName={displayName}
      setDisplayName={setDisplayName}
      arabicName={arabicName}
      setArabicName={setArabicName}
      phone={phone}
      setPhone={setPhone}
      notes={notes}
      setNotes={setNotes}
      confirmAccurate={confirmAccurate}
      setConfirmAccurate={setConfirmAccurate}
      submit={submit}
      saving={saving}
    />
  )
}
