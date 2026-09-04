import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { logAppEvent } from '../telemetry';

export function VercelTelemetry() {
  const location = useLocation();
  const route = location.pathname;

  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      logAppEvent('Erro no app', {
        message: String(event.message || 'erro').slice(0, 180),
        path: window.location.pathname,
      });
    };
    const onReject = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { message?: string } | string | undefined;
      const message = typeof reason === 'string' ? reason : reason?.message || 'promise';
      logAppEvent('Erro no app', {
        message: String(message).slice(0, 180),
        path: window.location.pathname,
      });
    };
    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onReject);
    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onReject);
    };
  }, []);

  return (
    <>
      <Analytics path={route} route={route} />
      <SpeedInsights route={route} />
    </>
  );
}
