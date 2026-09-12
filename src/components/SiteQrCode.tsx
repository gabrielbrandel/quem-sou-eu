import { useEffect, useId, useState } from 'react'
import QRCode from 'qrcode'
import { QrIcon } from './Icons'

function siteUrl() {
  const { origin, pathname } = window.location
  return `${origin}${pathname === '/' ? '' : pathname}`
}

export function SiteQrCode() {
  const [open, setOpen] = useState(false)
  const [dataUrl, setDataUrl] = useState('')
  const titleId = useId()
  const url = open ? siteUrl() : ''

  useEffect(() => {
    if (!open) return

    const target = siteUrl()
    let cancelled = false

    QRCode.toDataURL(target, {
      width: 280,
      margin: 2,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#121212',
        light: '#ffffff',
      },
    }).then((next) => {
      if (!cancelled) setDataUrl(next)
    })

    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        type="button"
        className="btn btn-ghost btn-spark site-qr-trigger"
        onClick={() => setOpen(true)}
      >
        <QrIcon className="btn-svg" />
        QR Code para o celular
      </button>

      {open && (
        <div
          className="site-qr-backdrop"
          role="presentation"
          onClick={() => setOpen(false)}
        >
          <div
            className="site-qr-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onClick={(event) => event.stopPropagation()}
          >
            <h2 id={titleId} className="site-qr-title">
              Abra no celular
            </h2>
            <p className="site-qr-text">
              Aponte a câmera para o código e entre direto no jogo.
            </p>
            <div className="site-qr-frame">
              {dataUrl ? (
                <img src={dataUrl} alt={`QR Code para ${url}`} width={280} height={280} />
              ) : (
                <div className="site-qr-loading" aria-hidden />
              )}
            </div>
            <p className="site-qr-url">{url}</p>
            <button
              type="button"
              className="btn btn-primary btn-spark"
              onClick={() => setOpen(false)}
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
