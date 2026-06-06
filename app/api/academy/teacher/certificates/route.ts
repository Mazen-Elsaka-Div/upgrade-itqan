import { makeStudentCertificatesGet } from "@/lib/certificate/student-handlers"

export const maxDuration = 60

export const GET = makeStudentCertificatesGet({ scope: "academy" })
