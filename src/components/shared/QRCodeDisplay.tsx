'use client'

import { useEffect, useRef } from 'react'

interface Props {
  url: string
  size?: number
}

// Lightweight QR code generator using canvas — no external lib needed
export default function QRCodeDisplay({ url, size = 128 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (!url || !canvasRef.current) return

    // Use Google Charts QR API via img tag instead of canvas
    // This avoids needing a QR library
  }, [url, size])

  if (!url) return null

  // Use a data URI approach — encode URL in an img pointing to a QR generator
  // For production, replace with qrcode.react or similar
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}&bgcolor=111111&color=00FF88&format=png`

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="p-3 bg-[#111] rounded-xl border border-neon-green/20">
        <img
          src={qrUrl}
          alt="QR Code"
          width={size}
          height={size}
          className="rounded-lg"
          style={{ imageRendering: 'pixelated' }}
        />
      </div>
    </div>
  )
}
