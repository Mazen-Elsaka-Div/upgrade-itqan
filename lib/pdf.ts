import { uploadToStorage } from './storage'
import { getCertificateHtml } from './pdf-html'

export async function generateCertificatePDF(studentId: string): Promise<{ url: string | null, buffer: Buffer | null }> {
  let browser
  try {
    console.log('Starting PDF generation for student:', studentId)

    // Generate server-rendered HTML directly (skip issued check since we're in the issuance flow)
    const html = await getCertificateHtml(studentId, true)
    if (!html) {
      throw new Error(`Failed to generate certificate HTML for student ${studentId}`)
    }
    console.log('HTML generated, length:', html.length)

    // Launch puppeteer based on environment
    const isLocal = process.env.NODE_ENV === 'development' || !process.env.VERCEL

    if (isLocal) {
      console.log('Using local puppeteer...')
      const puppeteer = (await import('puppeteer')).default
      browser = await puppeteer.launch({
        args: [
          '--no-sandbox', 
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage', // Critical for shared hosting (Hostinger)
          '--disable-gpu',           // Save overhead
          '--no-zygote',             // Minimize process fork memory
          '--single-process'         // Run in one process if possible (some environments)
        ],
        headless: true
      })
    } else {
      console.log('Using sparticuz/chromium for serverless...')
      const chromium = (await import('@sparticuz/chromium')).default
      const puppeteerCore = (await import('puppeteer-core')).default

      browser = await puppeteerCore.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      })
    }

    const page = await browser.newPage()

    // Set viewport to A4
    await page.setViewport({
      width: 794, // A4 width in pixels at 96 DPI
      height: 1123, // A4 height in pixels at 96 DPI
      deviceScaleFactor: 1,
    })

    console.log('Setting HTML content...')
    // Set the HTML content
    await page.setContent(html, { waitUntil: 'networkidle2' })

    console.log('Waiting for content to render...')
    // Wait for content to render
    await new Promise(resolve => setTimeout(resolve, 1000))

    console.log('Generating PDF...')
    // Generate PDF buffer
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '0px',
        right: '0px',
        bottom: '0px',
        left: '0px'
      }
    })

    console.log('PDF generated, buffer length:', pdfBuffer.length)

    // Ensure it's a proper Node.js Buffer (puppeteer may return Uint8Array)
    const nodeBuffer = Buffer.from(pdfBuffer)

    // Upload to Storage (AWS S3)
    const fileName = `certificate-${studentId}-${Date.now()}.pdf`
    console.log('Uploading to Storage...')
    const uploadResult = await uploadToStorage(nodeBuffer, fileName, 'application/pdf')

    console.log('Upload result:', uploadResult)

    return {
      url: uploadResult?.url || null,
      buffer: nodeBuffer
    }

  } catch (error) {
    console.error('Error generating certificate PDF:', error)
    return { url: null, buffer: null }
  } finally {
    if (browser) {
      try {
        // Use a timeout for closing the browser too
        await Promise.race([
          browser.close(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Browser close timeout')), 5000))
        ])
      } catch (e) {
        console.warn('Error/Timeout closing browser:', e)
      }
    }
  }
}
