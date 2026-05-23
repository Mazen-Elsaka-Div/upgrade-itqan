"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  BookOpen, Star, Clock, CheckCircle2, 
  Target, Flame, Award, History, Plus
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"

const SURAHS = [
  { number: 1, name: 'الفاتحة', ayahs: 7 },
  { number: 2, name: 'البقرة', ayahs: 286 },
  { number: 3, name: 'آل عمران', ayahs: 200 },
  // Short list for demo. Ideally this uses lib/quran-data
]

export default function MaqraaMemorizationStudent() {
  const [goal, setGoal] = useState<any>(null)
  const [logs, setLogs] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [goalRes, logsRes, statsRes] = await Promise.all([
        fetch('/api/student/memorization-goals'),
        fetch('/api/student/memorization'),
        fetch('/api/student/mushaf-progress')
      ])
      
      if (goalRes.ok) setGoal((await goalRes.json()).goal)
      if (logsRes.ok) setLogs((await logsRes.json()).data || [])
      if (statsRes.ok) setStats((await statsRes.json()).stats)
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
          <BookOpen className="w-12 h-12 text-primary" />
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto" dir="rtl">
      
      {/* Header section with Glassmorphism */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 border border-white/20 dark:border-white/5 p-8 backdrop-blur-xl"
      >
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-50" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Badge variant="outline" className="mb-2 border-primary/50 text-primary">المقرأة</Badge>
            <h1 className="text-4xl md:text-5xl font-black text-foreground tracking-tight">حفظ القرآن الكريم</h1>
            <p className="text-muted-foreground mt-2 text-lg">تابع أهدافك وسجّل حفظك وارتقِ في مسارك</p>
          </div>
          <Button 
            size="lg" 
            className="rounded-full shadow-lg hover:shadow-xl transition-all duration-300 gap-2"
            onClick={() => setIsModalOpen(true)}
          >
            <Plus className="w-5 h-5" /> تسجيل حفظ جديد
          </Button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Stats & Goals */}
        <div className="space-y-8 lg:col-span-1">
          {/* Stats Overview */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="border-0 shadow-xl bg-card/50 backdrop-blur-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500" />
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" /> إحصائياتي
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="font-medium">الإنجاز الكلي</span>
                    <span className="text-primary font-bold">{stats?.overallPercentage || 0}%</span>
                  </div>
                  <Progress value={stats?.overallPercentage || 0} className="h-3 rounded-full" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 p-4 rounded-2xl">
                    <p className="text-muted-foreground text-sm">الآيات</p>
                    <p className="text-2xl font-black">{stats?.totalMasteredAyahs || 0}</p>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-2xl">
                    <p className="text-muted-foreground text-sm">الأجزاء</p>
                    <p className="text-2xl font-black">{stats?.completedJuz || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Current Goal */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                  <Target className="w-5 h-5" /> هدف الأسبوع
                </CardTitle>
              </CardHeader>
              <CardContent>
                {goal ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">الآيات المستهدفة</span>
                      <Badge variant="secondary" className="bg-indigo-500/20 text-indigo-700 dark:text-indigo-300">
                        {goal.target_verses} آية
                      </Badge>
                    </div>
                    {goal.surah_from && (
                      <p className="text-sm text-muted-foreground">
                        من سورة رقم {goal.surah_from} إلى سورة رقم {goal.surah_to}
                      </p>
                    )}
                    {goal.status === 'completed' ? (
                      <div className="flex items-center gap-2 text-green-600 bg-green-500/10 p-3 rounded-xl">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-medium">تم إنجاز الهدف!</span>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground mt-4 text-center">
                        واصل الحفظ لتحقيق هدفك!
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>لم يتم تحديد هدف لهذا الأسبوع</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right Column: History */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="h-full"
          >
            <Card className="border-0 shadow-xl h-full">
              <CardHeader className="border-b border-border/50 bg-muted/20">
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" /> سجل التسميع
                </CardTitle>
                <CardDescription>
                  جميع جلسات التسميع التي قمت بتسجيلها وتنتظر المراجعة أو تم تقييمها
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {logs.length > 0 ? (
                  <div className="divide-y divide-border/50">
                    {logs.map((log, i) => (
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * i }}
                        key={log.id} 
                        className="p-6 hover:bg-muted/30 transition-colors flex items-center justify-between gap-4"
                      >
                        <div className="flex-1">
                          <h4 className="font-bold text-lg mb-1">سورة رقم {log.surah_number}</h4>
                          <p className="text-sm text-muted-foreground mb-2">
                            الآيات: {log.ayah_from} - {log.ayah_to} ({log.verses_count} آية)
                          </p>
                          <div className="flex items-center gap-3">
                            <Badge variant={
                              log.status === 'approved' ? 'default' : 
                              log.status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {log.status === 'approved' ? 'معتمد' : log.status === 'rejected' ? 'مرفوض' : 'قيد المراجعة'}
                            </Badge>
                            {log.quality && (
                              <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                                <Star className="w-3 h-3 text-yellow-500" /> جودة: {log.quality}
                              </span>
                            )}
                          </div>
                        </div>
                        {log.teacher_name && (
                          <div className="text-left hidden sm:block">
                            <p className="text-xs text-muted-foreground">المُقرئ</p>
                            <p className="text-sm font-medium">{log.teacher_name}</p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-20 text-muted-foreground">
                    <BookOpen className="w-16 h-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">لا يوجد سجلات تسميع بعد</p>
                    <p className="text-sm mt-1">اضغط على تسجيل حفظ جديد للبدء</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Modal for new log */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-border"
            >
              <div className="p-6 border-b border-border bg-muted/30">
                <h2 className="text-2xl font-bold">تسجيل حفظ جديد</h2>
              </div>
              
              <form onSubmit={async (e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const data = {
                  surah_number: Number(fd.get('surah')),
                  ayah_from: Number(fd.get('ayah_from')),
                  ayah_to: Number(fd.get('ayah_to')),
                  quality: fd.get('quality')
                }
                
                await fetch('/api/student/memorization', {
                  method: 'POST',
                  body: JSON.stringify(data)
                })
                
                setIsModalOpen(false)
                fetchData()
              }} className="p-6 space-y-6">
                
                <div>
                  <label className="block text-sm font-medium mb-2">رقم السورة</label>
                  <input required name="surah" type="number" min="1" max="114" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" placeholder="مثال: 1 للفاتحة" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">من آية</label>
                    <input required name="ayah_from" type="number" min="1" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">إلى آية</label>
                    <input required name="ayah_to" type="number" min="1" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">جودة الحفظ المبدئية</label>
                  <select name="quality" className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                    <option value="excellent">ممتاز</option>
                    <option value="good">جيد</option>
                    <option value="acceptable">مقبول</option>
                    <option value="needs_review">يحتاج مراجعة</option>
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setIsModalOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="flex-1 rounded-xl">
                    إرسال للمراجعة
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
