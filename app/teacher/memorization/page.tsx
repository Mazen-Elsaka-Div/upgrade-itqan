"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BookOpen, Star, CheckCircle2, XCircle, 
  User, Award, MessageSquare, Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function MaqraaMemorizationTeacher() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/teacher/memorization')
      if (res.ok) {
        const data = await res.json()
        setLogs(data.data || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleEvaluate = async (id: string, status: string, quality: string) => {
    try {
      const res = await fetch('/api/teacher/memorization', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          status,
          quality,
          points_earned: status === 'approved' ? 10 : 0
        })
      })
      if (res.ok) {
        fetchLogs()
      }
    } catch (e) {
      console.error(e)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <BookOpen className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    )
  }

  const pendingLogs = logs.filter(l => l.status === 'pending')
  const evaluatedLogs = logs.filter(l => l.status !== 'pending')

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto" dir="rtl">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-bl from-indigo-500/10 to-blue-500/5 border border-white/20 dark:border-white/5 p-8 backdrop-blur-xl"
      >
        <div className="relative z-10">
          <Badge variant="outline" className="mb-2 border-indigo-500/50 text-indigo-600">لوحة المُقرئ</Badge>
          <h1 className="text-4xl font-black text-foreground tracking-tight">إدارة التسميع</h1>
          <p className="text-muted-foreground mt-2 text-lg">راجع تسميع الطلاب وقيم أداءهم</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pending Reviews */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Clock className="text-amber-500" /> بانتظار المراجعة
            <Badge variant="secondary" className="ml-2">{pendingLogs.length}</Badge>
          </h2>
          
          <div className="space-y-4">
            {pendingLogs.length > 0 ? pendingLogs.map((log, i) => (
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                key={log.id}
              >
                <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden">
                  <div className="w-1 h-full bg-amber-500 absolute top-0 right-0" />
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="font-bold">{log.student_name}</span>
                        </div>
                        <h4 className="text-lg font-bold text-primary">سورة رقم {log.surah_number}</h4>
                        <p className="text-sm text-muted-foreground">
                          الآيات: {log.ayah_from} - {log.ayah_to} ({log.verses_count} آية)
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
                        قيد المراجعة
                      </Badge>
                    </div>
                    
                    {log.student_notes && (
                      <div className="bg-muted/50 p-3 rounded-xl text-sm mb-4">
                        <MessageSquare className="w-4 h-4 inline-block me-2 opacity-50" />
                        {log.student_notes}
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2 border-t border-border/50">
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleEvaluate(log.id, 'approved', 'excellent')}
                      >
                        <CheckCircle2 className="w-4 h-4 ml-1" /> ممتاز (اعتماد)
                      </Button>
                      <Button 
                        size="sm" 
                        variant="secondary"
                        onClick={() => handleEvaluate(log.id, 'approved', 'good')}
                      >
                        جيد (اعتماد)
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        className="bg-red-500/10 text-red-600 hover:bg-red-500/20 hover:text-red-700 border-0"
                        onClick={() => handleEvaluate(log.id, 'rejected', 'needs_review')}
                      >
                        <XCircle className="w-4 h-4 ml-1" /> رفض
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )) : (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-3xl border border-dashed border-border">
                <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-20 text-green-500" />
                <p>لا توجد سجلات بانتظار المراجعة</p>
                <p className="text-sm mt-1">أنت على إطلاع تام بجميع التسميعات</p>
              </div>
            )}
          </div>
        </div>

        {/* Evaluated Logs */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Award className="text-primary" /> السجلات المقيمة
          </h2>
          
          <div className="space-y-4">
            {evaluatedLogs.length > 0 ? evaluatedLogs.map((log, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 * i }}
                key={log.id}
              >
                <Card className="border-0 shadow-sm bg-muted/10 opacity-80 hover:opacity-100 transition-opacity">
                  <CardContent className="p-5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm font-medium">{log.student_name}</span>
                      </div>
                      <p className="font-bold text-sm">سورة {log.surah_number} ({log.verses_count} آية)</p>
                    </div>
                    <div className="text-left">
                      <Badge variant={log.status === 'approved' ? 'default' : 'destructive'} className="mb-1">
                        {log.status === 'approved' ? 'معتمد' : 'مرفوض'}
                      </Badge>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 justify-end">
                        <Star className="w-3 h-3 text-yellow-500" /> {log.quality}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>لم تقم بتقييم أي سجلات بعد</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
