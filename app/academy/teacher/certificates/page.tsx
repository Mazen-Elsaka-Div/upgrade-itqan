"use client";

import React from "react";
import { motion } from "framer-motion";
import { Award, Download, ExternalLink, Calendar, Star, Loader2 } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Framer Motion Variants for Staggered Magic
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

export default function CertificatesPage() {
  const { data, error, isLoading } = useSWR("/api/academy/teacher/certificates", fetcher);

  const certificates = data?.issued?.map((cert: any, index: number) => {
    const gradients = [
      "from-indigo-500/20 to-indigo-500/0",
      "from-emerald-500/20 to-emerald-500/0",
      "from-amber-500/20 to-amber-500/0",
      "from-purple-500/20 to-purple-500/0",
      "from-rose-500/20 to-rose-500/0"
    ];
    const borders = [
      "group-hover:border-indigo-500/50",
      "group-hover:border-emerald-500/50",
      "group-hover:border-amber-500/50",
      "group-hover:border-purple-500/50",
      "group-hover:border-rose-500/50"
    ];
    const iconGlows = [
      "text-indigo-600 dark:text-indigo-400",
      "text-emerald-600 dark:text-emerald-400",
      "text-amber-600 dark:text-amber-400",
      "text-purple-600 dark:text-purple-400",
      "text-rose-600 dark:text-rose-400"
    ];
    const styleIdx = index % gradients.length;

    return {
      id: cert.id,
      title: cert.source_label || cert.template_name || "شهادة إتمام",
      issuer: "أكاديمية إتقان",
      date: new Date(cert.issued_at || cert.requested_at || new Date()).toLocaleDateString("ar-EG", { year: 'numeric', month: 'long', day: 'numeric' }),
      grade: cert.data?.grade || "اجتياز",
      type: cert.kind === "course" ? "دورة تدريبية" : "شهادة إنجاز",
      gradient: gradients[styleIdx],
      border: borders[styleIdx],
      iconGlow: iconGlows[styleIdx],
      pdf_url: cert.pdf_url
    };
  }) || [];

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-[#0A0A0A] p-6 md:p-12 font-sans selection:bg-indigo-500/30" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6"
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-sm font-medium">
              <Award className="w-4 h-4" />
              <span>إنجازاتك الأكاديمية</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white text-balance">
              شهاداتي واعتماداتي
            </h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-lg leading-relaxed text-sm md:text-base">
              تصفح وحمّل جميع شهاداتك والدورات التي اجتزتها بنجاح. هذه المساحة تعكس رحلتك المهنية وتطورك المستمر كمعلم.
            </p>
          </div>
        </motion.div>

        {/* Certificates Grid */}
        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
          </div>
        ) : error ? (
          <div className="text-center text-red-500 py-10">
            حدث خطأ أثناء تحميل الشهادات.
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center text-slate-500 py-20">
            لا توجد شهادات متاحة حالياً.
          </div>
        ) : (
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {certificates.map((cert: any) => (
            <motion.div
              key={cert.id}
              variants={itemVariants}
              whileHover={{ y: -4, scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              className={`group relative overflow-hidden bg-white dark:bg-[#111111] rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] dark:hover:shadow-[0_8px_30px_rgb(255,255,255,0.02)] transition-all duration-300 ease-out cursor-pointer ${cert.border}`}
            >
              {/* Subtle Top Glow Effect */}
              <div className={`absolute top-0 right-0 w-full h-32 bg-gradient-to-b ${cert.gradient} opacity-0 pointer-events-none transition-opacity duration-500 group-hover:opacity-100`} />
              
              <div className="p-6 relative z-10 flex flex-col h-full">
                {/* Top Bar: Icon & Type */}
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-white dark:bg-[#1A1A1A] rounded-xl border border-slate-100 dark:border-white/10 shadow-sm transition-colors duration-300 group-hover:border-transparent">
                    <Award className={`w-6 h-6 text-slate-700 dark:text-slate-300 transition-colors duration-300 ${cert.iconGlow}`} />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg">
                    {cert.type}
                  </span>
                </div>

                {/* Content */}
                <div className="space-y-1.5 mb-6 flex-grow">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 leading-tight transition-colors duration-300">
                    {cert.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {cert.issuer}
                  </p>
                </div>

                {/* Meta Information */}
                <div className="flex items-center gap-4 text-xs font-medium text-slate-500 dark:text-slate-400 mb-6">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{cert.date}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-amber-500" />
                    <span>{cert.grade}</span>
                  </div>
                </div>

                {/* Actions (Buttons) */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center gap-3">
                  <button 
                    onClick={() => cert.pdf_url && window.open(cert.pdf_url, '_blank')}
                    disabled={!cert.pdf_url}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-slate-900 text-sm font-semibold py-2.5 rounded-xl transition-all active:scale-[0.97]"
                  >
                    <Download className="w-4 h-4" />
                    تحميل PDF
                  </button>
                  <button 
                    onClick={() => cert.pdf_url && window.open(cert.pdf_url, '_blank')}
                    disabled={!cert.pdf_url}
                    className="p-2.5 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-all active:scale-[0.97]"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
