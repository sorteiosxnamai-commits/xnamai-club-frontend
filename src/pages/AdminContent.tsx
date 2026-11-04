import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { AdminHeader } from '../components/AdminShell';
import { contentCatalog, ScreenKey } from '../content/catalog';

type ContentRow = { screen: string; values: Record<string, string>; revision: number; updatedAt?: string };
type HistoryRow = { id: string; revision: number; actorUserId: string; createdAt: string };
const screens = Object.keys(contentCatalog) as ScreenKey[];

export function AdminContent() {
  const [screen, setScreen] = useState<ScreenKey>('home');
  const [rows, setRows] = useState<ContentRow[] | null>(null);
  const [error, setError] = useState('');
  async function load() {
    setError('');
    try { setRows(await api<ContentRow[]>('/admin/content')); }
    catch (error) { setError((error as Error).message); }
  }
  useEffect(() => { void load(); }, []);
  return <>
    <AdminHeader title="Textos e telas" subtitle="Edite os textos, confira a prévia e publique no portal." />
    {error && <div className="error-box" role="alert">{error} <button className="btn ghost" onClick={load}>Tentar novamente</button></div>}
    {!rows && !error && <p>Carregando conteúdo…</p>}
    {rows && <ContentEditor key={screen} screen={screen} row={rows.find(row => row.screen === screen)}
      onScreen={setScreen} onSaved={saved => setRows(current => [...(current || []).filter(row => row.screen !== saved.screen), saved])} reload={load} />}
  </>;
}

function ContentEditor({ screen, row, onScreen, onSaved, reload }: {
  screen: ScreenKey; row?: ContentRow; onScreen(screen: ScreenKey): void; onSaved(row: ContentRow): void; reload(): Promise<void>;
}) {
  const page = contentCatalog[screen];
  const [values, setValues] = useState<Record<string, string>>(row?.values || {});
  const [savedValues, setSavedValues] = useState(row?.values || {});
  const [revision, setRevision] = useState(row?.revision || 0);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [conflict, setConflict] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(savedValues);
  const previewValues = useRef(values);
  previewValues.current = values;
  const sendPreview = () => frame.current?.contentWindow?.postMessage({ type: 'xnamai-content-preview', screen, values: previewValues.current }, window.location.origin);

  useEffect(() => {
    api<HistoryRow[]>(`/admin/content/${screen}/history`).then(setHistory).catch(() => setHistory([]));
  }, [screen, revision]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);
  useEffect(() => { sendPreview(); }, [values, preview]);
  useEffect(() => {
    const ready = (event: MessageEvent) => {
      if (event.origin === window.location.origin && event.source === frame.current?.contentWindow && event.data?.type === 'xnamai-preview-ready') sendPreview();
    };
    window.addEventListener('message', ready);
    return () => window.removeEventListener('message', ready);
  }, [screen]);

  async function publish() {
    setError(''); setMessage(''); setBusy(true);
    try {
      const saved = await api<ContentRow>(`/admin/content/${screen}`, { method: 'PUT', body: JSON.stringify({ revision, values }) });
      setRevision(saved.revision); setValues(saved.values); setSavedValues(saved.values); onSaved(saved); setConflict(false);
      window.dispatchEvent(new CustomEvent('xnamai-content-published', { detail: saved }));
      setMessage('Conteúdo publicado. A página pública já recebe esta versão.');
    } catch (error) {
      setError((error as Error).message);
      setConflict((error as { status?: number }).status === 409);
    } finally { setBusy(false); }
  }

  return <>
    <section className="panel content-toolbar">
      <label>Tela<select value={screen} disabled={busy} onChange={event => {
        if (!dirty || window.confirm('Descartar alterações ainda não publicadas?')) onScreen(event.target.value as ScreenKey);
      }}>{screens.map(key => <option key={key} value={key}>{contentCatalog[key].label}</option>)}</select></label>
      <div className="content-actions">
        <button className="btn ghost" onClick={() => setPreview(current => !current)}>{preview ? 'Fechar prévia' : 'Prévia da tela'}</button>
        <button className="btn ghost" disabled={busy || conflict} onClick={() => {
          if (window.confirm('Restaurar os textos padrão desta tela? A mudança só entra no portal ao publicar.')) { setValues({}); setMessage('Textos padrão carregados no rascunho.'); }
        }}>Restaurar padrão</button>
        <button className="btn primary" disabled={busy || !dirty || conflict} onClick={publish}>{busy ? 'Publicando…' : 'Publicar alterações'}</button>
      </div>
    </section>
    <p className="content-note">{dirty ? 'Rascunho com alterações não publicadas.' : `Versão publicada: ${revision}.`} Preços e links de pagamento são mantidos na configuração comercial.</p>
    {error && <div className="error-box" role="alert">{error}{conflict && <button className="btn ghost" onClick={async () => {
      if (window.confirm('Descartar seu rascunho e carregar a versão publicada?')) { await reload(); onScreen(screen); window.location.reload(); }
    }}>Recarregar versão publicada</button>}</div>}
    {message && <div className="success-box" role="status">{message}</div>}
    {preview && <section className="panel content-preview"><h2>Prévia do rascunho</h2><p>Confira o texto antes de publicar.</p>
      <iframe ref={frame} title={`Prévia de ${page.label}`} src={`/admin/previa/${screen}?contentPreview=1`} onLoad={sendPreview} />
    </section>}
    <section className="panel content-fields"><h2>{page.label}</h2>
      {page.fields.map(field => <label key={field.key}>{field.label}
        <textarea rows={field.value.length > 100 ? 4 : 2} maxLength={5000} disabled={busy} value={values[field.key] ?? field.value}
          onChange={event => { setMessage(''); setValues(current => ({ ...current, [field.key]: event.target.value })); }} />
      </label>)}
    </section>
    <section className="panel content-history"><h2>Últimas publicações</h2>
      {history.length ? <ul>{history.map(item => <li key={item.id}>Versão {item.revision} · {new Date(item.createdAt).toLocaleString('pt-BR')} · Administrador {item.actorUserId.slice(0, 8)}</li>)}</ul> : <p>Nenhuma publicação registrada.</p>}
    </section>
  </>;
}
