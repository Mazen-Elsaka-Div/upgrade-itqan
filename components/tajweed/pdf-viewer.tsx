"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import dynamic from "next/dynamic"
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2,
  ExternalLink, Download, FileText, Loader2, AlertTriangle,
} from "lucide-react"
import { useI18n } from "@/lib/i18n/context"
import { cn } from "@/lib/utils"

// react-pdf bundles its own worker; we serve a local copy from /public
// so the viewer works offline and doesn't depend on a third-party CDN.
//
// The dynamic imports below keep pdf.js out of the SSR bundle.
const Document = dynamic(
  () => import("react-pdf").then(mod => mod.Document),
  { ssr: false },
)
const Page = dynamic(
  () => import("react-pdf").then(mod => mod.Page),
  { ssr: false },
)

let workerConfigured = false
async function configureWorker() {
  if (workerConfigured) return
  const { pdfjs } = await import("react-pdf")
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf-worker/pdf.worker.min.mjs"
  workerConfigured = true
}

const MIN_SCALE = 0.5
const MAX_SCALE = 2.5
const SCALE_STEP = 0.2

// pdf.js fetches the file from the browser. PDFs hosted on S3 (or legacy
// UploadThing) can block cross-origin range requests, which makes the viewer
// fail with "Failed to load PDF". Routing those URLs through our same-origin
// proxy avoids the CORS problem AND lets us stream byte-ranges per page
// (the proxy forwards Range headers and returns 206 responses), so only the
// pages the reader actually scrolls to are downloaded.
const PROXY_HOST_SUFFIXES = ["amazonaws.com", "utfs.io", "ufs.sh", "cloudinary.com"]

function toFetchableSrc(src: string): string {
  if (!src) return src
  if (src.startsWith("/")) return src
  try {
    const u = new URL(src, typeof window !== "undefined" ? window.location.origin : "http://localhost")
    if (typeof window !== "undefined" && u.origin === window.location.origin) return src
    const needsProxy = PROXY_HOST_SUFFIXES.some(
      (suffix) => u.hostname === suffix || u.hostname.endsWith(`.${suffix}`),
    )
    return needsProxy ? `/api/pdf-proxy?url=${encodeURIComponent(src)}` : src
  } catch {
    return src
  }
}

export interface TajweedPdfViewerProps {
  src: string
  label?: string
  className?: string
}

export default function TajweedPdfViewer({ src, label, className }: TajweedPdfViewerProps) {
  const { t, dir } = useI18n()
  const v = (t as any).tajweedPaths?.pdfViewer ?? {}

  const [numPages, setNumPages] = useState<number>(0)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [scale, setScale] = useState<number>(1)
  const [expanded, setExpanded] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [containerWidth, setContainerWidth] = useState<number>(0)
  // Pages that have scrolled near the viewport at least once. Once rendered we
  // keep them mounted to avoid re-fetching / flicker while scrolling back.
  const [visiblePages, setVisiblePages] = useState<Set<number>>(() => new Set([1]))

  const scrollRef = useRef<HTMLDivElement | null>(null)
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  // URL pdf.js actually fetches (proxied for cross-origin file hosts).
  const fetchSrc = useMemo(() => toFetchableSrc(src), [src])

  useEffect(() => {
    void configureWorker()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
    setError(null)
    setIsLoading(true)
    setVisiblePages(new Set([1]))
    pageRefs.current.clear()
  }, [src])

  // Track container width so each page scales to fit horizontally.
  useEffect(() => {
    const node = scrollRef.current
    if (!node || typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width
        if (w > 0) setContainerWidth(w)
      }
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  // Base page width (before zoom) so it fits the container nicely.
  const basePageWidth = useMemo(() => {
    if (containerWidth <= 0) return undefined
    return Math.max(280, containerWidth - 32)
  }, [containerWidth])

  const pageWidth = useMemo(
    () => (basePageWidth ? Math.round(basePageWidth * scale) : undefined),
    [basePageWidth, scale],
  )

  // Estimated placeholder height (A4 ratio) before a page renders, so the
  // scrollbar length is roughly correct and lazy loading feels natural.
  const placeholderHeight = useMemo(
    () => (pageWidth ? Math.round(pageWidth * 1.414) : 560),
    [pageWidth],
  )

  const onDocumentLoadSuccess = ({ numPages: n }: { numPages: number }) => {
    setNumPages(n)
    setIsLoading(false)
    setError(null)
  }

  const onDocumentLoadError = (err: Error) => {
    setError(err.message || "PDF load error")
    setIsLoading(false)
  }

  // Lazy-render + current-page tracking via a single IntersectionObserver
  // that watches every page slot inside the scroll container.
  useEffect(() => {
    if (!numPages || typeof IntersectionObserver === "undefined") return
    const root = scrollRef.current
    if (!root) return

    const observer = new IntersectionObserver(
      entries => {
        let bestPage = 0
        let bestRatio = 0
        const toRender: number[] = []
        for (const entry of entries) {
          const pageNum = Number((entry.target as HTMLElement).dataset.page)
          if (!pageNum) continue
          if (entry.isIntersecting) {
            toRender.push(pageNum)
            if (entry.intersectionRatio > bestRatio) {
              bestRatio = entry.intersectionRatio
              bestPage = pageNum
            }
          }
        }
        if (toRender.length) {
          setVisiblePages(prev => {
            let changed = false
            const next = new Set(prev)
            for (const p of toRender) {
              if (!next.has(p)) { next.add(p); changed = true }
            }
            return changed ? next : prev
          })
        }
        if (bestPage) setCurrentPage(bestPage)
      },
      {
        root,
        // Preload the page just above/below the viewport for smoother scroll.
        rootMargin: "300px 0px 300px 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    )

    pageRefs.current.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [numPages])

  const setPageRef = useCallback(
    (pageNum: number) => (node: HTMLDivElement | null) => {
      if (node) pageRefs.current.set(pageNum, node)
      else pageRefs.current.delete(pageNum)
    },
    [],
  )

  const scrollToPage = useCallback((pageNum: number) => {
    const node = pageRefs.current.get(pageNum)
    if (node) node.scrollIntoView({ behavior: "smooth", block: "start" })
  }, [])

  const goPrev = () => scrollToPage(Math.max(1, currentPage - 1))
  const goNext = () => scrollToPage(Math.min(numPages || 1, currentPage + 1))
  const zoomIn = () => setScale(s => Math.min(MAX_SCALE, +(s + SCALE_STEP).toFixed(2)))
  const zoomOut = () => setScale(s => Math.max(MIN_SCALE, +(s - SCALE_STEP).toFixed(2)))
  const resetZoom = () => setScale(1)

  // Memoize options to avoid re-rendering Document on every parent render.
  // Range + streaming are enabled so pdf.js downloads only the byte-ranges it
  // needs for the pages on screen (bandwidth-friendly). Cross-origin files go
  // through our proxy which supports Range requests.
  const documentOptions = useMemo(
    () => ({
      cMapUrl: "https://unpkg.com/pdfjs-dist@5.4.296/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "https://unpkg.com/pdfjs-dist@5.4.296/standard_fonts/",
      disableRange: false,
      disableStream: false,
      disableAutoFetch: true, // don't greedily prefetch the whole file
    }),
    [],
  )

  return (
    <div
      className={cn(
        "bg-card border border-border rounded-xl overflow-hidden flex flex-col",
        className,
      )}
      dir={dir}
    >
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
          <span className="text-sm font-semibold truncate">
            {label || v.defaultLabel || "PDF"}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {/* Page navigation (scrolls to the page) */}
          <button
            type="button"
            onClick={goPrev}
            disabled={currentPage <= 1 || !!error}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            title={v.previous || "Previous"}
            aria-label={v.previous || "Previous"}
          >
            <ChevronRight className="w-4 h-4 rtl:hidden" />
            <ChevronLeft className="w-4 h-4 ltr:hidden" />
          </button>
          <span className="text-xs tabular-nums px-1 min-w-[64px] text-center">
            {numPages > 0
              ? `${currentPage} / ${numPages}`
              : "—"}
          </span>
          <button
            type="button"
            onClick={goNext}
            disabled={currentPage >= numPages || !!error}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
            title={v.next || "Next"}
            aria-label={v.next || "Next"}
          >
            <ChevronLeft className="w-4 h-4 rtl:hidden" />
            <ChevronRight className="w-4 h-4 ltr:hidden" />
          </button>

          {/* Zoom */}
          <div className="mx-1 h-5 w-px bg-border" />
          <button
            type="button"
            onClick={zoomOut}
            disabled={scale <= MIN_SCALE}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted disabled:opacity-40"
            title={v.zoomOut || "Zoom out"}
            aria-label={v.zoomOut || "Zoom out"}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="text-xs tabular-nums px-1 min-w-[44px] text-muted-foreground hover:bg-muted rounded"
            title={v.resetZoom || "Reset zoom"}
          >
            {Math.round(scale * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            disabled={scale >= MAX_SCALE}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted disabled:opacity-40"
            title={v.zoomIn || "Zoom in"}
            aria-label={v.zoomIn || "Zoom in"}
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          <div className="mx-1 h-5 w-px bg-border" />
          <button
            type="button"
            onClick={() => setExpanded(x => !x)}
            className="p-1.5 rounded text-muted-foreground hover:bg-muted"
            title={expanded ? (v.shrink || "Shrink") : (v.fullscreen || "Expand")}
            aria-label={expanded ? (v.shrink || "Shrink") : (v.fullscreen || "Expand")}
          >
            {expanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded text-muted-foreground hover:bg-muted"
            title={v.openNewTab || "Open in new tab"}
            aria-label={v.openNewTab || "Open in new tab"}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <a
            href={src}
            download
            className="p-1.5 rounded text-muted-foreground hover:bg-muted"
            title={v.download || "Download"}
            aria-label={v.download || "Download"}
          >
            <Download className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Document area — continuous vertical scroll */}
      <div
        ref={scrollRef}
        className={cn(
          "relative overflow-auto bg-muted/30",
          expanded ? "h-[80vh]" : "h-[520px]",
        )}
        // pdf.js renders left-to-right; force LTR so canvas pages aren't flipped.
        dir="ltr"
      >
        {error ? (
          <div className="flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground p-6 text-center w-full h-full">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
            <p className="font-semibold">{v.errorTitle || "Failed to load PDF"}</p>
            <p className="text-xs">{error}</p>
            <a
              href={src}
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-700 hover:underline text-xs mt-2"
            >
              {v.openNewTab || "Open in new tab"}
            </a>
          </div>
        ) : (
          <>
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            )}
            <Document
              file={fetchSrc}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={null}
              error={null}
              options={documentOptions}
              className="flex flex-col items-center gap-4 py-4"
            >
              {numPages > 0 && pageWidth
                ? Array.from({ length: numPages }, (_, i) => {
                    const pageNum = i + 1
                    const shouldRender = visiblePages.has(pageNum)
                    return (
                      <div
                        key={pageNum}
                        data-page={pageNum}
                        ref={setPageRef(pageNum)}
                        className="relative shadow-sm bg-white rounded-sm overflow-hidden"
                        style={{
                          width: pageWidth,
                          minHeight: shouldRender ? undefined : placeholderHeight,
                        }}
                      >
                        {shouldRender ? (
                          <Page
                            pageNumber={pageNum}
                            width={pageWidth}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            loading={
                              <div
                                className="flex items-center justify-center"
                                style={{ height: placeholderHeight }}
                              >
                                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                              </div>
                            }
                          />
                        ) : (
                          <div
                            className="flex items-center justify-center text-xs text-muted-foreground"
                            style={{ height: placeholderHeight }}
                          >
                            {pageNum}
                          </div>
                        )}
                      </div>
                    )
                  })
                : null}
            </Document>
          </>
        )}
      </div>
    </div>
  )
}
