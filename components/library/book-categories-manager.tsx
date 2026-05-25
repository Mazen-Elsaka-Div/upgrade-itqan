"use client"

import { useEffect, useState } from "react"
import { Loader2, Plus, Save, Tags, Trash2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface BookCategory {
  id: string
  name: string
  slug: string
  color: string | null
  icon: string | null
  display_order: number
  books_count?: number
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\u0600-\u06ff]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
}

export function BookCategoriesManager({ apiPrefix = "/api/admin/library/categories" }: { apiPrefix?: string }) {
  const [categories, setCategories] = useState<BookCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch(apiPrefix)
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCategories(Array.isArray(data.categories) ? data.categories : [])
    } catch {
      setCategories([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch(apiPrefix)
        if (!res.ok) throw new Error()
        const data = await res.json()
        if (!cancelled) setCategories(Array.isArray(data.categories) ? data.categories : [])
      } catch {
        if (!cancelled) setCategories([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [apiPrefix])

  const handleCreate = async () => {
    const name = newName.trim()
    if (!name) {
      toast.error("اكتب اسم التصنيف")
      return
    }
    setCreating(true)
    try {
      const res = await fetch(apiPrefix, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug: slugify(name) }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "تعذر الإضافة")
      toast.success("تم إضافة التصنيف")
      setNewName("")
      await load()
    } catch (e: any) {
      toast.error(e?.message || "تعذر الإضافة")
    } finally {
      setCreating(false)
    }
  }

  const handleSaveEdit = async (id: string) => {
    const name = editingName.trim()
    if (!name) {
      toast.error("اكتب اسم التصنيف")
      return
    }
    try {
      const res = await fetch(`${apiPrefix}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "تعذر التعديل")
      }
      toast.success("تم التعديل")
      setEditingId(null)
      setEditingName("")
      await load()
    } catch (e: any) {
      toast.error(e?.message || "تعذر التعديل")
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا التصنيف؟ الكتب لن تُحذف لكنها ستفقد ارتباطها بالتصنيف.")) return
    try {
      const res = await fetch(`${apiPrefix}/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "تعذر الحذف")
      }
      toast.success("تم الحذف")
      await load()
    } catch (e: any) {
      toast.error(e?.message || "تعذر الحذف")
    }
  }

  return (
    <Card>
      <CardContent className="p-4 space-y-3" dir="rtl">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-base font-black flex items-center gap-2">
            <Tags className="w-4 h-4 text-primary" />
            تصنيفات الكتب
          </h2>
          <span className="text-xs text-muted-foreground">{categories.length}</span>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="اسم تصنيف جديد..."
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleCreate()
            }}
          />
          <Button
            type="button"
            onClick={handleCreate}
            disabled={creating || !newName.trim()}
            className="gap-1 font-bold whitespace-nowrap"
          >
            {creating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            إضافة
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : categories.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            لا توجد تصنيفات بعد
          </p>
        ) : (
          <div className="space-y-1.5">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border bg-card"
              >
                {editingId === c.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="h-8 text-sm flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") void handleSaveEdit(c.id)
                        if (e.key === "Escape") {
                          setEditingId(null)
                          setEditingName("")
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="default"
                      className="h-7 gap-1"
                      onClick={() => void handleSaveEdit(c.id)}
                    >
                      <Save className="w-3 h-3" />
                      حفظ
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7"
                      onClick={() => {
                        setEditingId(null)
                        setEditingName("")
                      }}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium truncate">{c.name}</span>
                    {typeof c.books_count === "number" && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {c.books_count}
                      </Badge>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs"
                      onClick={() => {
                        setEditingId(c.id)
                        setEditingName(c.name)
                      }}
                    >
                      تعديل
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-destructive hover:text-destructive"
                      onClick={() => void handleDelete(c.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
