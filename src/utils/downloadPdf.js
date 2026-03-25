import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

// Captures a DOM element and downloads it as a multi-page PDF.
// element: the ref.current to capture
// filename: output filename (without .pdf)
export async function downloadPdf(element, filename = 'report') {
  // Temporarily expand the element so nothing is clipped
  const originalOverflow = document.body.style.overflow
  document.body.style.overflow = 'visible'

  const canvas = await html2canvas(element, {
    scale: 2,           // 2x for crisp text
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
    windowHeight: element.scrollHeight,
  })

  document.body.style.overflow = originalOverflow

  const imgData = canvas.toDataURL('image/png')
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' })

  const pageWidth  = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 36  // 0.5 inch margins
  const contentWidth = pageWidth - margin * 2

  // Scale the canvas to fit the page width
  const imgWidth  = contentWidth
  const imgHeight = (canvas.height / canvas.width) * imgWidth

  let yOffset = 0
  let remainingHeight = imgHeight

  // Slice the image across pages
  while (remainingHeight > 0) {
    const sliceHeight = Math.min(pageHeight - margin * 2, remainingHeight)
    const srcY = (yOffset / imgHeight) * canvas.height
    const srcH = (sliceHeight / imgHeight) * canvas.height

    // Create a slice canvas for this page
    const sliceCanvas = document.createElement('canvas')
    sliceCanvas.width = canvas.width
    sliceCanvas.height = srcH
    const ctx = sliceCanvas.getContext('2d')
    ctx.drawImage(canvas, 0, srcY, canvas.width, srcH, 0, 0, canvas.width, srcH)

    const sliceData = sliceCanvas.toDataURL('image/png')
    if (yOffset > 0) pdf.addPage()
    pdf.addImage(sliceData, 'PNG', margin, margin, imgWidth, sliceHeight)

    yOffset += sliceHeight
    remainingHeight -= sliceHeight
  }

  pdf.save(`${filename}.pdf`)
}
