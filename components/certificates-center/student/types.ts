export interface CertificateRequest {
  id: string
  kind: string
  status: string
  source_label: string | null
  template_name: string | null
  language: string
  rejection_reason: string | null
  requested_at: string
  submitted_at: string | null
  approved_at: string | null
  issued_at: string | null
  certificate_number: string | null
  pdf_url: string | null
  reason: string | null
  rank: number | null
  teacher_name?: string | null
  legacy?: boolean
}

export interface CertificatesPayload {
  data_required: CertificateRequest[]
  submitted: CertificateRequest[]
  approved: CertificateRequest[]
  rejected: CertificateRequest[]
  issued: CertificateRequest[]
}

export type Tone = 'amber' | 'blue' | 'emerald' | 'rose'
