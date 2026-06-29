'use client'

import { useEffect, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { Download, Printer } from 'lucide-react'

export default function QRCodePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [url, setUrl] = useState('')

  useEffect(() => {
    const checkinUrl = `${window.location.origin}/checkin`
    setUrl(checkinUrl)
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, checkinUrl, {
        width: 280,
        margin: 2,
        color: { dark: '#ffffff', light: '#141414' },
      })
    }
  }, [])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'titans-combat-checkin-qr.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div className="space-y-6 fade-in max-w-lg">
      <div className="pt-2 lg:pt-0">
        <h1 className="text-2xl font-bold tracking-tight">QR Code Check-in</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Imprima e cole na entrada da academia</p>
      </div>

      <div className="card p-8 text-center print:shadow-none print:border-none">
        {/* Print area */}
        <div id="print-area">
          <p className="font-black text-2xl tracking-widest mb-1">TITÃS COMBAT</p>
          <p className="text-zinc-400 text-sm mb-6">Escaneie para registrar presença</p>

          <div className="flex justify-center mb-6">
            <div className="p-3 bg-[#141414] rounded-2xl border border-white/10">
              <canvas ref={canvasRef} className="block" />
            </div>
          </div>

          <p className="text-xs text-zinc-600 font-mono break-all">{url}</p>
        </div>

        <div className="flex gap-3 mt-6 justify-center print:hidden">
          <button onClick={handleDownload} className="btn-ghost">
            <Download size={16} /> Baixar PNG
          </button>
          <button onClick={handlePrint} className="btn-red">
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>

      <div className="card p-4">
        <h3 className="font-semibold text-sm mb-2">Como funciona</h3>
        <ol className="space-y-2 text-sm text-zinc-400">
          <li className="flex gap-2"><span className="text-[#dc2626] font-bold">1.</span>Imprima e cole o QR code na entrada</li>
          <li className="flex gap-2"><span className="text-[#dc2626] font-bold">2.</span>Aluno chega e escaneia com o celular</li>
          <li className="flex gap-2"><span className="text-[#dc2626] font-bold">3.</span>Se logado, aperta "Confirmar Presença"</li>
          <li className="flex gap-2"><span className="text-[#dc2626] font-bold">4.</span>Presença registrada automaticamente</li>
        </ol>
      </div>
    </div>
  )
}
