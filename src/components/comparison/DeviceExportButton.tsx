import { useState } from 'react'
import { jsPDF } from 'jspdf'
import type { Device, Manufacturer, SpecCategory, DeviceSpec } from '../../types'

interface Props {
  device: Device
  manufacturer: Manufacturer | null | undefined
  categories: SpecCategory[]
  specs: DeviceSpec[]
}

const CONTACT = {
  company: 'Bit Space Development Ltd. (BSD XR)',
  location: 'Winnipeg, Manitoba, Canada',
  website: 'bsdxr.com',
  email: 'info@bsdxr.com',
}

const BRAND_BLUE = [27, 79, 216] as const

async function fetchDataUrl(url: string): Promise<string | null> {
  try {
    const resp = await fetch(url)
    if (!resp.ok) return null
    const blob = await resp.blob()
    return new Promise<string>(res => {
      const r = new FileReader()
      r.onload = () => res(r.result as string)
      r.onerror = () => res(null as unknown as string)
      r.readAsDataURL(blob)
    })
  } catch {
    return null
  }
}

function addFooter(doc: jsPDF, pageW: number, pageH: number, margin: number) {
  doc.setDrawColor(204, 204, 204)
  doc.setLineWidth(0.3)
  doc.line(margin, pageH - 12, pageW - margin, pageH - 12)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(6)
  doc.setTextColor(119, 119, 119)
  doc.text(
    `${CONTACT.company}  ·  ${CONTACT.location}  ·  ${CONTACT.website}  ·  ${CONTACT.email}`,
    pageW / 2,
    pageH - 7,
    { align: 'center' },
  )
}

export default function DeviceExportButton({ device, manufacturer, categories, specs }: Props) {
  const [loading, setLoading] = useState(false)

  async function handleExport() {
    setLoading(true)
    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 16
      const contentW = pageW - margin * 2

      // Load assets in parallel
      const [logoDataUrl, deviceImageDataUrl] = await Promise.all([
        fetchDataUrl('/logo-light.png'),
        device.image_url ? fetchDataUrl(device.image_url) : Promise.resolve(null),
      ])

      // ── Header bar ────────────────────────────────────────────────────────────
      doc.setFillColor(238, 238, 238)
      doc.rect(0, 0, pageW, 28, 'F')
      doc.setDrawColor(204, 204, 204)
      doc.setLineWidth(0.3)
      doc.line(0, 28, pageW, 28)

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', margin, 4, 44, 16)
      } else {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(...BRAND_BLUE)
        doc.text('BSD XR', margin, 16)
      }

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(14)
      doc.setTextColor(17, 17, 17)
      doc.text('PRODUCT BRIEF', pageW - margin, 14, { align: 'right' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(119, 119, 119)
      doc.text(
        new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }),
        pageW - margin,
        21,
        { align: 'right' },
      )

      let y = 36

      // ── Hero section ──────────────────────────────────────────────────────────
      const imgSize = 52
      const infoX = margin + imgSize + 8
      const infoW = contentW - imgSize - 8

      if (deviceImageDataUrl) {
        doc.addImage(deviceImageDataUrl, 'PNG', margin, y, imgSize, imgSize)
      } else {
        doc.setFillColor(228, 228, 228)
        doc.rect(margin, y, imgSize, imgSize, 'F')
      }

      // Device info
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(119, 119, 119)
      doc.text(device.brand.toUpperCase(), infoX, y + 8)

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(18)
      doc.setTextColor(17, 17, 17)
      const nameLines = doc.splitTextToSize(device.name.toUpperCase(), infoW)
      doc.text(nameLines, infoX, y + 15)
      const nameBlockH = nameLines.length * 7

      let infoY = y + 15 + nameBlockH + 2

      if (!device.is_in_production) {
        doc.setFillColor(180, 130, 0)
        doc.rect(infoX, infoY, 24, 5, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(5.5)
        doc.setTextColor(255, 255, 255)
        doc.text('DISCONTINUED', infoX + 2, infoY + 3.5)
        infoY += 8
      }

      if (manufacturer) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(119, 119, 119)
        doc.text('MANUFACTURER', infoX, infoY)
        doc.setTextColor(17, 17, 17)
        doc.text(manufacturer.name.toUpperCase(), infoX, infoY + 5)
        infoY += 10
      }

      if (device.price) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(14)
        doc.setTextColor(...BRAND_BLUE)
        doc.text(`${device.currency}$${device.price.toLocaleString()}`, infoX, infoY + 2)
        infoY += 10
      }

      if (device.buy_url) {
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7)
        doc.setTextColor(119, 119, 119)
        doc.text('bsdxr.com/contact for purchasing assistance', infoX, infoY)
      }

      y = Math.max(y + imgSize, infoY) + 6

      // Description
      if (device.description) {
        doc.setDrawColor(204, 204, 204)
        doc.setLineWidth(0.3)
        doc.line(margin, y, pageW - margin, y)
        y += 5

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(7.5)
        doc.setTextColor(60, 60, 60)
        const descLines = doc.splitTextToSize(device.description, contentW)
        doc.text(descLines, margin, y)
        y += descLines.length * 4 + 6
      }

      // ── Spec table ────────────────────────────────────────────────────────────
      doc.setDrawColor(204, 204, 204)
      doc.setLineWidth(0.3)
      doc.line(margin, y, pageW - margin, y)
      y += 5

      const rowH = 7
      const footerH = 18
      const labelW = contentW * 0.45

      for (const cat of categories) {
        const items = (cat.spec_items ?? []).filter(item =>
          specs.some(s => s.device_id === device.id && s.spec_item_id === item.id && s.value),
        )
        if (items.length === 0) continue

        const needed = 8 + items.length * rowH
        if (y + needed > pageH - footerH) {
          addFooter(doc, pageW, pageH, margin)
          doc.addPage()
          y = margin
        }

        // Category header
        doc.setFillColor(...BRAND_BLUE)
        doc.rect(margin, y, contentW, 7, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(255, 255, 255)
        doc.text(cat.name.toUpperCase(), margin + 3, y + 4.5)
        y += 8

        items.forEach((item, idx) => {
          if (y + rowH > pageH - footerH) {
            addFooter(doc, pageW, pageH, margin)
            doc.addPage()
            y = margin
          }

          const bg = idx % 2 === 0 ? [238, 238, 238] : [228, 228, 228]
          doc.setFillColor(bg[0], bg[1], bg[2])
          doc.rect(margin, y, contentW, rowH, 'F')

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(6.5)
          doc.setTextColor(119, 119, 119)
          doc.text(item.name.toUpperCase(), margin + 3, y + 4.5)

          const val = specs.find(s => s.device_id === device.id && s.spec_item_id === item.id)?.value ?? '—'
          doc.setTextColor(17, 17, 17)
          const truncated = doc.splitTextToSize(val, contentW - labelW - 6)[0] ?? val
          doc.text(truncated, margin + labelW + 3, y + 4.5)

          y += rowH
        })

        y += 3
      }

      addFooter(doc, pageW, pageH, margin)

      const safeName = `${device.brand}-${device.name}`.replace(/\s+/g, '-').replace(/[^a-zA-Z0-9-]/g, '')
      doc.save(`BSD-XR-${safeName}-${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="text-xs uppercase tracking-widest border border-border text-muted px-4 py-2 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
    >
      {loading ? 'Generating...' : '↓ Export PDF'}
    </button>
  )
}
