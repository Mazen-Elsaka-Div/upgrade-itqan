export interface CertRequest {
  id: string
  student_id: string
  scope: string
  kind: string
  source_table: string | null
  source_id: string | null
  source_label: string | null
  status: string
  template_id: string | null
  template_name: string | null
  language: string
  data: Record<string, string> | null
  rejection_reason: string | null
  rank: number | null
  reason: string | null
  pdf_url: string | null
  teacher_name?: string | null
}
