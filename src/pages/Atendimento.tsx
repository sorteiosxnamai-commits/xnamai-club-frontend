import { useEffect, useMemo, useState } from 'react';
import { Headset, RefreshCw } from 'lucide-react';
import { api, money } from '../api/client';
import { PublicHeader } from '../components/PublicHeader';
import { StatusBadge, formatDate, subscriptionStatusLabel } from './adminShared';

type DeskMember = {
  id: string;
  name?: string;
  email?: string;
  companyName?: string | null;
  document?: string | null;
  city?: string | null;
  state?: string | null;
  phone?: string | null;
  createdAt: string;
  subscription?: {
    status?: string;
    currentPeriodEnd?: string | null;
    plan?: { name?: string; monthlyPriceCents?: number | null } | null;
  } | null;
  cashback: {
    eligible: boolean;
    amountCents: number;
    used: boolean;
    usedAt?: string | null;
  };
};

function formatDocument(value?: string | null) {
  if (!value) return '';
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11) return digits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  if (digits.length === 14) return digits.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  return value;
}

const copy = {
  subtitle: 'Clientes que aderiram ao clube e controle do cashback de uma mensalidade no lan\u00e7amento.',
  available: 'Cashback dispon\u00edvel',
  loading: 'Carregando clientes\u2026',
  dash: '\u2014',
  perMonth: '/m\u00eas',
  used: 'J\u00e1 utilizado',
  availableOnce: 'Dispon\u00edvel uma vez',
  noBenefit: 'Sem benef\u00edcio',
};

export function Atendimento() {
  const [rows, setRows] = useState<DeskMember[] | null>(null);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [savingId, setSavingId] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  async function loadMembers() {
    const members = await api<DeskMember[]>('/atendimento/members');
    setError('');
    setRows(members);
  }

  useEffect(() => {
    let cancelled = false;
    async function load(attempt = 1) {
      try {
        const members = await api<DeskMember[]>('/atendimento/members');
        if (!cancelled) {
          setError('');
          setRows(members);
        }
      } catch (e) {
        if (cancelled) return;
        if (attempt < 4) {
          setTimeout(() => { void load(attempt + 1); }, 1200 * attempt);
          return;
        }
        setError((e as Error).message);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!rows) return [];
    if (!term) return rows;
    return rows.filter((row) => {
      const haystack = [
        row.name, row.email, row.companyName, row.document, row.phone, row.city, row.state,
      ].join(' ').toLowerCase();
      return haystack.includes(term);
    });
  }, [rows, query]);

  const available = rows?.filter((row) => row.cashback.eligible && !row.cashback.used).length ?? 0;
  const used = rows?.filter((row) => row.cashback.used).length ?? 0;

  async function markCashbackUsed(member: DeskMember) {
    if (member.cashback.used || !member.cashback.eligible || savingId) return;
    const confirmed = window.confirm(
      `Marcar o cashback de ${money(member.cashback.amountCents)} de ${member.name || member.email} como utilizado? Esta a\u00e7\u00e3o n\u00e3o pode ser desfeita.`,
    );
    if (!confirmed) return;
    setSavingId(member.id);
    setError('');
    try {
      const updated = await api<DeskMember>(`/atendimento/members/${member.id}/cashback-use`, { method: 'POST' });
      setRows((current) => (current ?? []).map((row) => (row.id === updated.id ? updated : row)));
    } catch (err) {
      setError((err as Error).message);
      try {
        setRows(await api<DeskMember[]>('/atendimento/members'));
      } catch {
        /* keep current rows */
      }
    } finally {
      setSavingId('');
    }
  }

  return (
    <>
      <PublicHeader />
      <main className="dashboard-page">
        <header className="admin-header">
          <div>
            <h1>Atendimento</h1>
            <p>{copy.subtitle}</p>
          </div>
          <div className="desk-actions">
            <span className="admin-chip"><Headset size={16} /> Time de atendimento</span>
            <button
              className="btn ghost"
              disabled={refreshing}
              onClick={() => {
                setRefreshing(true);
                loadMembers().catch((e) => setError((e as Error).message)).finally(() => setRefreshing(false));
              }}
            >
              <RefreshCw size={16} /> {refreshing ? 'Atualizando\u2026' : 'Atualizar'}
            </button>
          </div>
        </header>

        <section className="kpi-grid forecast-kpis">
          <div className="kpi"><div><span>Aderiram</span><strong>{rows?.length ?? copy.dash}</strong></div></div>
          <div className="kpi positive"><div><span>{copy.available}</span><strong>{rows ? available : copy.dash}</strong></div></div>
          <div className="kpi"><div><span>Cashback utilizado</span><strong>{rows ? used : copy.dash}</strong></div></div>
        </section>

        <label className="desk-search">
          Buscar cliente
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome, e-mail, empresa, CPF/CNPJ ou telefone"
          />
        </label>

        {error && <div className="error-box" role="alert">{error}</div>}
        {!rows && !error && <p className="admin-loading">{copy.loading}</p>}
        {rows && (
          <section className="panel table-panel">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Empresa</th>
                  <th>Plano</th>
                  <th>Status</th>
                  <th>Cashback</th>
                  <th>Utilizado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={6}>{rows.length === 0 ? 'Nenhum cliente aderiu ao clube ainda.' : 'Nenhum resultado para a busca.'}</td></tr>
                )}
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.name || copy.dash}</strong>
                      <div className="cell-muted">{row.email}</div>
                      {row.phone && <div className="cell-muted">{row.phone}</div>}
                    </td>
                    <td>
                      {row.companyName || copy.dash}
                      {(row.city || row.state) && (
                        <div className="cell-muted">{[row.city, row.state].filter(Boolean).join(' / ')}</div>
                      )}
                      {row.document && <div className="cell-muted">{formatDocument(row.document)}</div>}
                    </td>
                    <td>
                      {row.subscription?.plan?.name || 'Sem plano'}
                      {row.subscription?.plan?.monthlyPriceCents != null && (
                        <div className="cell-muted">{money(row.subscription.plan.monthlyPriceCents)}{copy.perMonth}</div>
                      )}
                    </td>
                    <td>
                      {row.subscription
                        ? <StatusBadge status={row.subscription.status || ''} labels={subscriptionStatusLabel} />
                        : <span className="badge pending">Sem assinatura</span>}
                    </td>
                    <td>
                      {row.cashback.eligible ? (
                        <>
                          <strong>{money(row.cashback.amountCents)}</strong>
                          <div className="cell-muted">{row.cashback.used ? copy.used : copy.availableOnce}</div>
                        </>
                      ) : (
                        <span className="cell-muted">{copy.noBenefit}</span>
                      )}
                    </td>
                    <td>
                      <label className={`cashback-check${row.cashback.used ? ' used' : ''}`}>
                        <input
                          type="checkbox"
                          checked={row.cashback.used}
                          disabled={!row.cashback.eligible || row.cashback.used || savingId === row.id}
                          onChange={() => { void markCashbackUsed(row); }}
                        />
                        <span>{row.cashback.used ? formatDate(row.cashback.usedAt) : 'Marcar uso'}</span>
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}
      </main>
    </>
  );
}
