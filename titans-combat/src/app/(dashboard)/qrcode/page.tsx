'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import QRCode from 'qrcode'
import { Download, Printer, RefreshCw } from 'lucide-react'

const PRODUCTION_URL = 'https://titas-combat-git-master-danielsousa15-5043s-projects.vercel.app'

export default function QRCodePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [checkinUrl, setCheckinUrl] = useState(PRODUCTION_URL + '/checkin')

  const generateQR = useCallback((url: string) => {
    if (canvasRef.current && url) {
      QRCode.toCanvas(canvasRef.current, url, {
        width: 280,
        margin: 2,
        color: { dark: '#ffffff', light: '#141414' },
      })
    }
  }, [])

  useEffect(() => {
    generateQR(checkinUrl)
  }, [checkinUrl, generateQR])

  function handleDownload() {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement('a')
    link.download = 'titans-combat-checkin-qr.png'
    link.href = canvas.toDataURL()
    link.click()
  }

  return (
    <div className="space-y-6 fade-in max-w-lg">
      <div className="pt-0">
        <h1 className="text-2xl font-bold tracking-tight">QR Code Check-in</h1>
        <p className="text-sm text-zinc-500 mt-0.5">Imprima e cole na entrada da academia</p>
      </div>

      {/* URL configurável */}
      <div className="card p-4 print:hidden">
        <label className="block text-xs font-medium text-zinc-400 mb-1.5 uppercase tracking-wide">URL do Check-in</label>
        <div className="flex gap-2">
          <input
            type="url"
            value={checkinUrl}
            onChange={e => setCheckinUrl(e.target.value)}
            className="input-field text-xs font-mono"
          />
          <button onClick={() => generateQR(checkinUrl)} className="btn-ghost px-3 shrink-0">
            <RefreshCw size={14} />
          </button>
        </div>
        <p className="text-xs text-zinc-600 mt-1.5">
          Verifique se a URL está correta antes de imprimir.{' '}
          <button
            onClick={() => setCheckinUrl(PRODUCTION_URL + '/checkin')}
            className="text-[#dc2626] hover:underline"
          >
            Restaurar padrão
          </button>
        </p>
      </div>

      <div className="card p-8 text-center print:shadow-none print:border-none">
        <div id="print-area">
          <p className="font-black text-2xl tracking-widest mb-1">TITÃS COMBAT</p>
          <p className="text-zinc-400 text-sm mb-6">Escaneie para registrar presença</p>

          <div className="flex justify-center mb-6">
            <div className="p-3 bg-[#141414] rounded-2xl border border-white/10">
              <canvas ref={canvasRef} className="block" />
            </div>
          </div>

          <p className="text-xs text-zinc-600 font-mono break-all">{checkinUrl}</p>
        </div>

        <div className="flex gap-3 mt-6 justify-center print:hidden">
          <button onClick={handleDownload} className="btn-ghost">
            <Download size={16} /> Baixar PNG
          </button>
          <button onClick={() => window.print()} className="btn-red">
            <Printer size={16} /> Imprimir
          </button>
        </div>
      </div>

      <div className="card p-4 print:hidden">
        <h3 className="font-semibold text-sm mb-2">Como funciona</h3>
        <ol className="space-y-2 text-sm text-zinc-400">
          <li className="flex gap-2"><span className="text-[#dc2626] font-bold">1.</span>Imprima e cole o QR code na entrada</li>
          <li className="flex gap-2"><span className="text-[#dc2626] font-bold">2.</span>Aluno escaneia com o celular</li>
          <li className="flex gap-2"><span className="text-[#dc2626] font-bold">3.</span>Digita o email e confirma presença</li>
          <li className="flex gap-2"><span className="text-[#dc2626] font-bold">4.</span>Presença registrada automaticamente</li>
        </ol>
      </div>
    </div>
  )
}
