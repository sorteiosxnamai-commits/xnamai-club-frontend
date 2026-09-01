import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, ScrollText } from 'lucide-react';
import { api } from '../api/client';
import { AdminHeader } from '../components/AdminShell';

type VercelLogEntry = {
  id: string;
  at: string;
  level: string;
  source: string;
  message: string;
};

type VercelLogsPayload = {
  configured: boolean;
  message?: string;
  project: { id: string; name: string; teamId: string | null };
  deployment: {
    id: string;
    url: string | null;
    state: string;
    target: string | null;
    createdAt: string | null;
  } | null;
  logs: VercelLogEntry[];
};

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  return new Date(value).toLocaleString('pt-BR');
}

export function AdminVercelLogs() {
  const [data, setData] = useState<VercelLogsPayload | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    api<VercelLogsPayload>('/admin/vercel-logs')
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <>
      <AdminHeader
        title="Logs da Vercel"
        subtitle="Build e runtime do frontend publicado em xnamai-club-frontend."
      />
      <div className="logs-toolbar">
        <button className="btn ghost" type="button" onClick={load} disabled={loading}>
          <RefreshCw /> {loading ? 'Atualizando…' : 'Atualizar'}
        </button>
        {data?.deployment?.url && (
          <a className="btn ghost" href={data.deployment.url} target="_blank" rel="noreferrer">
            Abrir deploy
          </a>
        )}
      </div>
      {error && <div className="error-box">{error}</div>}
      {data && !data.configured && <div className="error-box">{data.message}</div>}
      {data?.configured && data.message && !error && <div className="success-box">{data.message}</div>}
      {loading && !data && <p className="admin-loading">Carregando logs da Vercel…</p>}
      {data && (
        <>
          <section className="kpi-grid forecast-kpis">
            <div className="kpi">
              <div className="kpi-icon"><ScrollText /></div>
              <div>
                <span>Projeto</span>
                <strong>{data.project.name || '—'}</strong>
                <small>{data.project.id || 'ID ainda n?o resolvido'}</small>
              </div>
            </div>
            <div className={`kpi ${data.deployment?.state === 'READY' ? 'positive' : ''}`}>
              <div className="kpi-icon"><ScrollText /></div>
              <div>
                <span>Deploy</span>
                <strong>{data.deployment?.state || 'Sem deploy'}</strong>
                <small>{data.deployment?.target || 'nenhum alvo'} · {formatDateTime(data.deployment?.createdAt)}</small>
              </div>
            </div>
            <div className="kpi">
              <div className="kpi-icon"><ScrollText /></div>
              <div>
                <span>Eventos</span>
                <strong>{String(data.logs.length)}</strong>
                <small>?ltimo build/runtime do frontend</small>
              </div>
            </div>
          </section>
          <section className="panel table-panel logs-panel">
            <div className="section-title">
              <h2>Sa?da do deploy</h2>
            </div>
            {data.logs.length === 0 ? (
              <p className="forecast-copy">Nenhum evento retornado para este deploy.</p>
            ) : (
              <pre className="vercel-log">
                {data.logs.map((entry) => (
                  <span key={entry.id} className={`vercel-log-line ${entry.level}`}>
                    <em>{formatDateTime(entry.at)}</em>
                    <b>{entry.source}</b>
                    {entry.message}
                  </span>
                ))}
              </pre>
            )}
          </section>
        </>
      )}
    </>
  );
}
