import { Tone } from './types'

export const TONE_CLASSES: Record<Tone, { dot: string; text: string; bg: string }> = {
  amber: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  blue: { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-50' },
  emerald: {
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  rose: { dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
}

export const KIND_LABEL_AR: Record<string, string> = {
  course: 'دورة',
  learning_path: 'مسار تعليمي',
  memorization_path: 'مسار حفظ',
  tajweed_path: 'مسار تجويد',
  series: 'سلسلة',
  competition: 'مسابقة',
  recitation: 'تلاوة',
  custom: 'إنجاز',
}

export const KIND_LABEL_EN: Record<string, string> = {
  course: 'Course',
  learning_path: 'Learning Path',
  memorization_path: 'Memorization Path',
  tajweed_path: 'Tajweed Path',
  series: 'Series',
  competition: 'Competition',
  recitation: 'Recitation',
  custom: 'Achievement',
}

export const kindLabel = (k: string, isAr: boolean) =>
  isAr ? KIND_LABEL_AR[k] || k : KIND_LABEL_EN[k] || k
