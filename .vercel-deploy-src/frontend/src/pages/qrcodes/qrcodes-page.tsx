import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRightIcon } from 'lucide-react'
import { CommonQrGenerator, type CommonQrData } from '@/components/admin/common-qr-generator'
import { Button } from '@/components/ui/button'
import {
  PageContainer,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout'
import { apiPath } from '@/lib/api'

function QRCodesPage() {
  const [commonQr, setCommonQr] = useState<CommonQrData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    const load = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(apiPath('/qrcodes/common'), { credentials: 'include' })
        if (!response.ok) throw new Error('Unable to load the common QR code.')
        const body = (await response.json()) as CommonQrData
        if (active) setCommonQr(body)
      } catch (reason) {
        if (active) setError(reason instanceof Error ? reason.message : 'Unable to load the common QR code.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void load()
    return () => {
      active = false
    }
  }, [])

  return (
    <PageLayout className="bg-[linear-gradient(180deg,#f2fafc_0%,#f8fdfe_26%,#f7fbfc_100%)]">
      <PageContainer>
        <div className="space-y-6 pb-10">
          <PageHeader className="justify-end">
            <Button variant="outline" render={<Link to="/dashboard" />}>
              Back to Dashboard
              <ArrowRightIcon className="size-4" />
            </Button>
          </PageHeader>

          <div id="generator">
            <CommonQrGenerator commonQr={commonQr} loading={loading} error={error} />
          </div>
        </div>
      </PageContainer>
    </PageLayout>
  )
}

export default QRCodesPage
