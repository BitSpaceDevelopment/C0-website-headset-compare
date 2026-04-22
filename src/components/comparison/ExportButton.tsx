import { useState } from 'react'
import { jsPDF } from 'jspdf'
import type { Device, SpecCategory, DeviceSpec } from '../../types'

interface Props {
  selectedDevices: (Device | null)[]
  categories: SpecCategory[]
  specs: DeviceSpec[]
}

const CONTACT = {
  company: 'Bit Space Development Ltd. (BSD XR)',
  tagline: 'Immersive Technology Experts',
  location: 'Winnipeg, Manitoba, Canada',
  website: 'bsdxr.com',
  email: 'info@bsdxr.com',
}

const BRAND_BLUE = [27, 79, 216] as const

function getValue(deviceId: string, specItemId: string, specs: DeviceSpec[]): string {
  return specs.find(s => s.device_id === deviceId && s.spec_item_id === specItemId)?.value ?? '—'
}

export default function ExportButton({ selectedDevices, categories, specs }: Props) {
  const [loading, setLoading] = useState(false)

  const activeDevices = selectedDevices.filter(Boolean) as Device[]

  async function handleExport() {
    if (activeDevices.length === 0) return
    setLoading(true)

    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pageW = doc.internal.pageSize.getWidth()
      const pageH = doc.internal.pageSize.getHeight()
      const margin = 16
      const colW = (pageW - margin * 2) / (activeDevices.length + 1)

      // Load logo
      let logoDataUrl: string | null = null
      try {
        const resp = await fetch('/logo-light.png')
        const blob = await resp.blob()
        logoDataUrl = await new Promise<string>(res => {
          const r = new FileReader()
          r.onload = () => res(r.result as string)
          r.readAsDataURL(blob)
        })
      } catch {
        // continue without logo
      }

      let y = margin

      // ── Header bar ────────────────────────────────────────────────────────────
      doc.setFillColor(238, 238, 238)
      doc.rect(0, 0, pageW, 28, 'F')
      doc.setDrawColor(204, 204, 204)
      doc.setLineWidth(0.3)
      doc.line(0, 28, pageW, 28)

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', margin, 4, 52, 18)
      } else {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(16)
        doc.setTextColor(...BRAND_BLUE)
        doc.text('BSD XR', margin, 16)
      }

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7)
      doc.setTextColor(119, 119, 119)
      doc.text(CONTACT.tagline.toUpperCase(), margin, 23)

      doc.setFontSize(18)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(17, 17, 17)
      doc.text('VR HEADSET COMPARISON', pageW / 2, 14, { align: 'center' })
      doc.setFontSize(7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(119, 119, 119)
      doc.text(`Generated ${new Date().toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' })}`, pageW / 2, 21, { align: 'center' })

      y = 36

      // ── Device summary row ────────────────────────────────────────────────────
      // Label column
      doc.setFillColor(218, 218, 218)
      doc.rect(margin, y, colW, 22, 'F')

      activeDevices.forEach((device, i) => {
        const x = margin + colW * (i + 1)
        doc.setFillColor(228, 228, 228)
        doc.rect(x, y, colW - 1, 22, 'F')

        doc.setFont('helvetica', 'normal')
        doc.setFontSize(6)
        doc.setTextColor(119, 119, 119)
        doc.text(device.brand.toUpperCase(), x + 4, y + 7)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        doc.setTextColor(17, 17, 17)
        const nameLines = doc.splitTextToSize(device.name.toUpperCase(), colW - 8)
        doc.text(nameLines[0], x + 4, y + 13)

        if (device.price) {
          doc.setFont('helvetica', 'normal')
          doc.setFontSize(6)
          doc.setTextColor(119, 119, 119)
          doc.text(`${device.currency}$${device.price.toLocaleString()}`, x + 4, y + 19)
        }
      })

      y += 26

      // ── Spec table ────────────────────────────────────────────────────────────
      const rowH = 7
      const footerH = 18

      for (const cat of categories) {
        const items = cat.spec_items ?? []
        if (items.length === 0) continue

        // Check if category + items fit on remaining page
        const needed = 8 + items.length * rowH
        if (y + needed > pageH - footerH) {
          addFooter(doc, pageW, pageH, margin)
          doc.addPage()
          y = margin
        }

        // Category header
        doc.setFillColor(...BRAND_BLUE)
        doc.rect(margin, y, pageW - margin * 2, 7, 'F')
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(255, 255, 255)
        doc.text(cat.name.toUpperCase(), margin + 3, y + 4.5)
        y += 8

        // Spec rows
        items.forEach((item, idx) => {
          if (y + rowH > pageH - footerH) {
            addFooter(doc, pageW, pageH, margin)
            doc.addPage()
            y = margin
          }

          const bg = idx % 2 === 0 ? [238, 238, 238] : [228, 228, 228]
          doc.setFillColor(bg[0], bg[1], bg[2])
          doc.rect(margin, y, pageW - margin * 2, rowH, 'F')

          doc.setFont('helvetica', 'normal')
          doc.setFontSize(6)
          doc.setTextColor(119, 119, 119)
          doc.text(item.name.toUpperCase(), margin + 3, y + 4.5)

          activeDevices.forEach((device, di) => {
            const x = margin + colW * (di + 1)
            const val = getValue(device.id, item.id, specs)
            doc.setTextColor(17, 17, 17)
            doc.setFont('helvetica', 'normal')
            const truncated = doc.splitTextToSize(val, colW - 6)[0] ?? val
            doc.text(truncated, x + 3, y + 4.5)
          })

          y += rowH
        })

        y += 3
      }

      addFooter(doc, pageW, pageH, margin)

      doc.save(`BSD-XR-VR-Comparison-${new Date().toISOString().slice(0, 10)}.pdf`)
    } finally {
      setLoading(false)
    }
  }

  if (activeDevices.length === 0) return null

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="text-xs uppercase tracking-widest border border-border text-muted px-4 py-1.5 hover:border-accent hover:text-accent transition-colors disabled:opacity-40"
    >
      {loading ? 'Generating...' : '↓ Export PDF'}
    </button>
  )
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
