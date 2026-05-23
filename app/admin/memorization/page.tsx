"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart, Users, BookOpen, Clock, 
  Activity, Star, ChevronDown 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function MaqraaMemorizationAdmin() {
  const [stats, setStats] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/memorization')
      if (res.ok) {
        const data = await res.json()
        setStats(data.stats)
        setLogs(data.recentLogs || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        >
          <BarChart className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto" dir="rtl">
      
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-tr from-primary/10 via-primary/5 to-background border border-white/20 dark:border-white/5 p-8 backdrop-blur-xl"
      >
        <div className="relative z-10">
          <Badge variant="outline" className="mb-2 border-primary/50 text-primary">لوحة الإدارة</Badge>
          <h1 className="text-4xl font-black text-foreground tracking-tight">إحصائيات المقرأة</h1>
          <p className="text-muted-foreground mt-2 text-lg">نظرة عامة على نشاط الحفظ للطلاب والمقرئين</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'الطلاب النشطين', value: stats?.active_students || 0, icon: Users, color: 'text-blue-500' },
          { label: 'سجلات التسميع المعتمدة', value: stats?.total_logs || 0, icon: CheckCircle2, color: 'text-green-500' },
          { label: 'إجمالي الآيات المحفوظة', value: stats?.total_verses_memorized || 0, icon: BookOpen, color: 'text-purple-500' },
        ].map((stat, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * i }}
          >
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden group">
              <CardContent className="p-6 flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-black group-hover:scale-105 transition-transform origin-right">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-4 rounded-2xl bg-muted/50 ${stat.color}`}>
                  <stat.icon className="w-8 h-8" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" /> أحدث نشاطات التسميع
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {logs.map(log => (
                <div key={log.id} className="p-4 md:p-6 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                      <span className="text-primary">سورة {log.surah_number}</span>
                      <Badge variant={log.status === 'approved' ? 'default' : log.status === 'rejected' ? 'destructive' : 'secondary'}>
                        {log.status}
                      </Badge>
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      الطالب: <span className="font-medium text-foreground">{log.student_name}</span> | 
                      المُقرئ: <span className="font-medium text-foreground">{log.teacher_name || 'بانتظار المراجعة'}</span>
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{log.verses_count} آية</p>
                    {log.quality && <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="w-3 h-3 text-yellow-500"/> {log.quality}</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  )
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
