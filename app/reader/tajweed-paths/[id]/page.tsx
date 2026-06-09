import { redirect } from "next/navigation"

export default async function LegacyTajweedPathDetailRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/reader/learning-paths/${id}`)
}
