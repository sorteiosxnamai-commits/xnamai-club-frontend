import { useEffect, useRef, useState } from 'react';
import { api, money } from '../api/client';

type PixCharge = {
  paymentId: string;
  encodedImage: string;
  payload: string;
  expirationDate?: string | null;
  amountCents: number;
};

const STORAGE_KEY = 'asaas_pix_checkout';

function qrSrc(encodedImage: string) {
  return encodedImage.startsWith('data:') ? encodedImage : `data:image/png;base64,${encodedImage}`;
}

export function PixQrPayment({ code, label, onPaid }: { code: string; label: string; onPaid: (validUntil: string | null) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [charge, setCharge] = useState<PixCharge | null>(null);
  const [waiting, setWaiting] = useState(false);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  useEffect(() => {
    if (!charge) return undefined;
    let stopped = false;
    const tick = async () => {
      try {
        const result = await api<{ paid: boolean; validUntil?: string | null }>(`/subscriptions/pix/${charge.paymentId}/confirm`, { method: 'POST', body: '{}' });
        if (stopped) return;
        if (result.paid) {
          sessionStorage.removeItem(STORAGE_KEY);
          setWaiting(false);
          onPaidRef.current(result.validUntil ?? null);
        }
      } catch (reason) {
        if (!stopped) setError((reason as Error).message);
      }
    };
    void tick();
    const timer = window.setInterval(() => { void tick(); }, 4000);
    return () => {
      stopped = true;
      window.clearInterval(timer);
    };
  }, [charge]);

  async function start() {
    if (busy) return;
    setBusy(true);
    setError('');
    setCopied(false);
    try {
      const result = await api<PixCharge>('/subscriptions/pix', { method: 'POST', body: JSON.stringify({ code }) });
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ...result, code }));
      setCharge(result);
      setWaiting(true);
    } catch (reason) {
      setError((reason as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    if (!charge) return;
    await navigator.clipboard.writeText(charge.payload);
    setCopied(true);
  }

  return (
    <div className="pix-qr">
      {!charge ? (
        <button className="btn primary large" type="button" disabled={busy} onClick={start}>
          {busy ? 'Gerando QR Code…' : label}
        </button>
      ) : (
        <>
          <img src={qrSrc(charge.encodedImage)} alt="QR Code PIX" width={220} height={220} />
          <strong>{waiting ? 'Aguardando o PIX' : 'Pagamento realizado'}</strong>
          <p>Valor: {money(charge.amountCents)}. O acesso libera assim que o pagamento for confirmado.</p>
          <code>{charge.payload}</code>
          <button className="btn ghost" type="button" onClick={copy}>{copied ? 'Código copiado' : 'Copiar código PIX'}</button>
        </>
      )}
      {error && <div className="error-box" role="alert">{error}</div>}
    </div>
  );
}
