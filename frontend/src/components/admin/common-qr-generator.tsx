import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { DownloadIcon, PrinterIcon, QrCodeIcon, ScanLineIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export type CommonQrData = {
  id: string
  label: string
  qrToken: string
  qrImage: string
  destinationUrl: string
  source: 'common_qr'
}

type SizePreset = 'small' | 'medium' | 'large' | 'packaging' | 'custom'

const PRINT_DPI = 300
const MIN_PHYSICAL_SIZE_CM = 0.5
const MAX_PHYSICAL_SIZE_CM = 10
const PACKAGING_SIZE_CM = 1.5

const presetSizes: Record<Exclude<SizePreset, 'custom'>, number> = {
  small: 240,
  medium: 420,
  large: 720,
  packaging: Math.round((PACKAGING_SIZE_CM / 2.54) * PRINT_DPI),
}

const presetLabels: Array<{ value: SizePreset; title: string; description: string }> = [
  { value: 'small', title: 'Small', description: '240 x 240 px' },
  { value: 'medium', title: 'Medium', description: '420 x 420 px' },
  { value: 'large', title: 'Large', description: '720 x 720 px' },
  { value: 'packaging', title: '1.5 cm x 1.5 cm', description: 'Packaging print size' },
  { value: 'custom', title: 'Custom', description: 'Enter a physical size in cm' },
]

function convertCentimetersToPixels(valueCm: number) {
  return Math.round((valueCm / 2.54) * PRINT_DPI)
}

function formatPhysicalSize(valueCm: number) {
  return valueCm % 1 === 0 ? valueCm.toFixed(0) : valueCm.toFixed(1)
}

function normalizePhysicalSize(value: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return null
  return Math.min(MAX_PHYSICAL_SIZE_CM, Math.max(MIN_PHYSICAL_SIZE_CM, parsed))
}

function triggerDownload(href: string, fileName: string) {
  const anchor = document.createElement('a')
  anchor.href = href
  anchor.download = fileName
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
}

interface CommonQrGeneratorProps {
  commonQr: CommonQrData | null
  loading?: boolean
  error?: string
  compact?: boolean
}

function CommonQrGenerator({
  commonQr,
  loading = false,
  error = '',
  compact = false,
}: CommonQrGeneratorProps) {
  const [preset, setPreset] = useState<SizePreset>('medium')
  const [customSizeCm, setCustomSizeCm] = useState('')
  const [generatedPng, setGeneratedPng] = useState('')
  const [generatedSvg, setGeneratedSvg] = useState('')
  const [generatedSvgMarkup, setGeneratedSvgMarkup] = useState('')
  const [generationError, setGenerationError] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [printMarkup, setPrintMarkup] = useState<{ markup: string; sizeCm: number } | null>(null)

  const resolvedPhysicalSizeCm = useMemo(() => {
    if (preset === 'packaging') return PACKAGING_SIZE_CM
    if (preset !== 'custom') return null
    if (!customSizeCm.trim()) return null
    return normalizePhysicalSize(customSizeCm)
  }, [customSizeCm, preset])

  const resolvedSize = useMemo(() => {
    if (preset === 'custom') {
      if (resolvedPhysicalSizeCm == null) return null
      return convertCentimetersToPixels(resolvedPhysicalSizeCm)
    }

    return presetSizes[preset]
  }, [preset, resolvedPhysicalSizeCm])

  const customSizeMessage = useMemo(() => {
    if (preset !== 'custom') return ''
    if (!customSizeCm.trim()) return 'Enter size'

    const sizeCm = Number(customSizeCm)
    if (!Number.isFinite(sizeCm)) {
      return `Enter a valid size between ${MIN_PHYSICAL_SIZE_CM} cm and ${MAX_PHYSICAL_SIZE_CM} cm.`
    }
    if (sizeCm < MIN_PHYSICAL_SIZE_CM) {
      return `Minimum supported size is ${MIN_PHYSICAL_SIZE_CM} cm. Output is clamped automatically.`
    }
    if (sizeCm > MAX_PHYSICAL_SIZE_CM) {
      return `Maximum supported size is ${MAX_PHYSICAL_SIZE_CM} cm. Output is clamped automatically.`
    }

    return ''
  }, [customSizeCm, preset])

  const previewDisplaySize = useMemo(() => {
    if (preset === 'small') return 148
    if (preset === 'medium') return 190
    if (preset === 'large') return 240
    if (preset === 'packaging') return 160
    if (resolvedPhysicalSizeCm == null) return null

    const ratio = (resolvedPhysicalSizeCm - MIN_PHYSICAL_SIZE_CM) / (MAX_PHYSICAL_SIZE_CM - MIN_PHYSICAL_SIZE_CM)
    return Math.round(148 + ratio * 92)
  }, [preset, resolvedPhysicalSizeCm])

  const outputLabel = useMemo(() => {
    if (preset === 'custom' && resolvedSize == null) return 'Enter size'
    if (resolvedSize == null) return 'Unavailable'

    if (resolvedPhysicalSizeCm != null) {
      const formattedSize = formatPhysicalSize(resolvedPhysicalSizeCm)
      return `${formattedSize} cm x ${formattedSize} cm (${resolvedSize} x ${resolvedSize} px @ ${PRINT_DPI} DPI)`
    }

    return `${resolvedSize} x ${resolvedSize} px`
  }, [preset, resolvedPhysicalSizeCm, resolvedSize])

  const printPhysicalSizeCm = useMemo(() => {
    if (preset === 'small') return 2
    if (preset === 'medium') return 3
    if (preset === 'large') return 5
    if (preset === 'packaging') return PACKAGING_SIZE_CM
    return resolvedPhysicalSizeCm
  }, [preset, resolvedPhysicalSizeCm])

  useEffect(() => {
    let active = true

    const generate = async () => {
      if (!commonQr || resolvedSize == null) {
        if (active) {
          setGeneratedPng('')
          setGeneratedSvg('')
          setGeneratedSvgMarkup('')
          setIsGenerating(false)
        }
        return
      }

      setIsGenerating(true)
      setGenerationError('')

      try {
        const [png, svg] = await Promise.all([
          QRCode.toDataURL(commonQr.destinationUrl, { width: resolvedSize, margin: 1 }),
          QRCode.toString(commonQr.destinationUrl, { type: 'svg', width: resolvedSize, margin: 1 }),
        ])

        if (!active) return
        setGeneratedPng(png)
        setGeneratedSvgMarkup(svg)
        setGeneratedSvg(`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`)
      } catch (reason) {
        if (!active) return
        setGenerationError(reason instanceof Error ? reason.message : 'Unable to generate the QR code.')
      } finally {
        if (active) setIsGenerating(false)
      }
    }

    void generate()
    return () => {
      active = false
    }
  }, [commonQr, resolvedSize])

  const previewSource = resolvedSize != null ? generatedPng : ''
  const downloadSizeLabel = resolvedPhysicalSizeCm != null
    ? `${formatPhysicalSize(resolvedPhysicalSizeCm)}cm`
    : `${resolvedSize ?? 'qr'}`

  const downloadPng = () => {
    if (!generatedPng || resolvedSize == null) return
    triggerDownload(generatedPng, `milletsnow-common-qr-${downloadSizeLabel}.png`)
  }

  const downloadSvg = () => {
    if (!generatedSvg || resolvedSize == null) return
    triggerDownload(generatedSvg, `milletsnow-common-qr-${downloadSizeLabel}.svg`)
  }

  const printQr = () => {
    if (!generatedSvgMarkup || resolvedSize == null || printPhysicalSizeCm == null) return

    setPrintMarkup({
      markup: generatedSvgMarkup,
      sizeCm: printPhysicalSizeCm,
    })
  }

  useEffect(() => {
    if (!printMarkup) return

    let cancelled = false
    let fallbackTimeout = 0
    let animationFrame = 0

    document.body.setAttribute('data-common-qr-printing', 'true')

    const cleanup = () => {
      if (cancelled) return
      cancelled = true
      window.cancelAnimationFrame(animationFrame)
      window.clearTimeout(fallbackTimeout)
      document.body.removeAttribute('data-common-qr-printing')
      setPrintMarkup(null)
    }

    const handleAfterPrint = () => {
      cleanup()
    }

    const triggerPrint = () => {
      const qr = document.querySelector('#common-qr-print-root .qr-frame svg')
      if (!qr || qr.tagName.toLowerCase() !== 'svg') {
        animationFrame = window.requestAnimationFrame(triggerPrint)
        return
      }

      qr.setAttribute('preserveAspectRatio', 'xMidYMid meet')
      window.addEventListener('afterprint', handleAfterPrint, { once: true })
      fallbackTimeout = window.setTimeout(cleanup, 1500)
      window.print()
    }

    animationFrame = window.requestAnimationFrame(() => {
      animationFrame = window.requestAnimationFrame(triggerPrint)
    })

    return () => {
      window.removeEventListener('afterprint', handleAfterPrint)
      if (!cancelled) {
        window.cancelAnimationFrame(animationFrame)
        window.clearTimeout(fallbackTimeout)
        document.body.removeAttribute('data-common-qr-printing')
      }
    }
  }, [printMarkup])

  return (
    <Card className="overflow-hidden border-[#d7eaf0] bg-white shadow-[0_24px_54px_rgba(16,76,89,0.08)]">
      {printMarkup ? (
        <>
          <style>{`
            @page {
              size: auto;
              margin: 10mm;
            }

            @media print {
              body[data-common-qr-printing="true"] * {
                visibility: hidden !important;
              }

              body[data-common-qr-printing="true"] #common-qr-print-root,
              body[data-common-qr-printing="true"] #common-qr-print-root * {
                visibility: visible !important;
              }

              body[data-common-qr-printing="true"] #common-qr-print-root {
                position: fixed;
                inset: 0;
                z-index: 2147483647;
                display: grid;
                place-items: center;
                background: #ffffff;
              }

              body[data-common-qr-printing="true"] {
                background: #ffffff !important;
              }
            }
          `}</style>
          <div id="common-qr-print-root" aria-hidden="true" className="pointer-events-none fixed inset-0 z-[2147483647] grid place-items-center bg-white">
            <div className="grid place-items-center bg-white p-[0.25cm]">
              <div
                className="qr-frame grid place-items-center bg-white"
                style={{
                  width: `${formatPhysicalSize(printMarkup.sizeCm)}cm`,
                  height: `${formatPhysicalSize(printMarkup.sizeCm)}cm`,
                }}
                dangerouslySetInnerHTML={{ __html: printMarkup.markup }}
              />
            </div>
          </div>
        </>
      ) : null}
      <CardContent className={compact ? 'p-5 sm:p-6' : 'p-5 sm:p-7'}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-[11px] font-bold tracking-[0.18em] text-[#2e9bb8] uppercase">Generate QR Code</p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight text-[#20323a]">Create a QR code in the size you need.</h2>
              </div>
            </div>

            <section className="rounded-[1.6rem] border border-[#dbecef] bg-[linear-gradient(180deg,#fcfeff_0%,#f5fbfd_100%)] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#20323a]">
                <QrCodeIcon className="size-4 text-[#2e9bb8]" />
                Choose QR size
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {presetLabels.map((option) => {
                  const selected = preset === option.value
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPreset(option.value)}
                      className={`rounded-[1.2rem] border p-4 text-left transition ${
                        selected
                          ? 'border-[#2e9bb8] bg-[#ecf8fb] shadow-[0_12px_26px_rgba(46,155,184,0.12)]'
                          : 'border-[#dbe9ee] bg-white hover:border-[#9fd4df]'
                      }`}
                    >
                      <p className="text-sm font-semibold text-[#20323a]">{option.title}</p>
                      <p className="mt-1 text-xs text-[#6b7f87]">{option.description}</p>
                    </button>
                  )
                })}
              </div>

              {preset === 'custom' ? (
                <div className="mt-4 rounded-[1.2rem] border border-dashed border-[#cae1e8] bg-white p-4 sm:max-w-xs">
                  <Label htmlFor="custom-qr-size" className="text-[#29434c]">Custom square size (cm)</Label>
                  <Input
                    id="custom-qr-size"
                    inputMode="decimal"
                    placeholder="e.g. 1.5"
                    value={customSizeCm}
                    onChange={(event) => setCustomSizeCm(event.target.value.replace(/[^\d.]/g, '').replace(/(\..*)\./g, '$1'))}
                    className="mt-2 border-[#d7e7eb] bg-[#fbfeff]"
                  />
                  <p className="mt-2 text-xs leading-5 text-[#61757d]">
                    {customSizeMessage || `Live preview updates automatically. Supported range: ${MIN_PHYSICAL_SIZE_CM} cm to ${MAX_PHYSICAL_SIZE_CM} cm.`}
                  </p>
                </div>
              ) : null}

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={downloadPng}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                    generatedPng && resolvedSize != null
                      ? 'border border-[#d4e6eb] bg-white text-[#20323a] hover:border-[#2e9bb8] hover:text-[#2e9bb8]'
                      : 'pointer-events-none border border-[#e0edf1] bg-[#f6fbfc] text-[#8ba0a8]'
                  }`}
                >
                  <DownloadIcon className="size-4" />
                  Download PNG
                </button>
                <button
                  type="button"
                  onClick={downloadSvg}
                  className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition ${
                    generatedSvg && resolvedSize != null
                      ? 'border border-[#d4e6eb] bg-white text-[#20323a] hover:border-[#2e9bb8] hover:text-[#2e9bb8]'
                      : 'pointer-events-none border border-[#e0edf1] bg-[#f6fbfc] text-[#8ba0a8]'
                  }`}
                >
                  <DownloadIcon className="size-4" />
                  Download SVG
                </button>
                <Button type="button" variant="outline" onClick={printQr} disabled={!generatedSvgMarkup || resolvedSize == null || printPhysicalSizeCm == null}>
                  <PrinterIcon className="size-4" />
                  Print
                </Button>
              </div>
            </section>

            {error || generationError ? (
              <div className="rounded-[1.2rem] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error || generationError}
              </div>
            ) : null}
          </div>

          <section className="rounded-[1.75rem] border border-[#d9ebf0] bg-[linear-gradient(180deg,#fbfeff_0%,#f0fafc_100%)] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)]">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#20323a]">
              <ScanLineIcon className="size-4 text-[#2e9bb8]" />
              Live preview
            </div>

            <div className="mt-5 flex min-h-[280px] items-center justify-center rounded-[1.5rem] border border-dashed border-[#cfe2e8] bg-white p-6">
              {loading || isGenerating ? (
                <p className="text-sm text-[#6d828a]">{loading ? 'Loading common QR...' : 'Refreshing preview...'}</p>
              ) : preset === 'custom' && resolvedSize == null ? (
                <p className="text-sm text-[#6d828a]">Enter a physical size in cm to generate the QR.</p>
              ) : previewSource ? (
                <img
                  src={previewSource}
                  alt="MilletsNow common feedback QR"
                  className="h-auto rounded-[1.5rem] border border-[#e2eef2] bg-white p-3 shadow-[0_14px_30px_rgba(25,86,97,0.08)] transition-[width] duration-200"
                  style={{ width: previewDisplaySize ? `${previewDisplaySize}px` : '190px', maxWidth: '100%' }}
                />
              ) : (
                <p className="text-sm text-[#6d828a]">No QR preview available.</p>
              )}
            </div>

            <div className="mt-5 space-y-3 text-sm text-[#59717a]">
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#dcecf0] bg-white px-3 py-2.5">
                <span>Output size</span>
                <span className="text-right font-semibold text-[#20323a]">{outputLabel}</span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#dcecf0] bg-white px-3 py-2.5">
                <span>QR type</span>
                <span className="font-semibold text-[#20323a]">Common QR</span>
              </div>
              <div className="rounded-xl border border-[#dcecf0] bg-white px-3 py-3">
                <p className="text-xs font-semibold tracking-[0.14em] text-[#2e9bb8] uppercase">Customer destination</p>
                <p className="mt-2 break-all font-mono text-xs text-[#5d7680]">{commonQr?.destinationUrl ?? '/scan'}</p>
              </div>
            </div>
          </section>
        </div>
      </CardContent>
    </Card>
  )
}

export { CommonQrGenerator }
export type { CommonQrGeneratorProps }
