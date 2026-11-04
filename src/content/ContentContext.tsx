import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { api } from '../api/client';

export type PublishedContent = Record<string, { values: Record<string, string> }>;
const ContentContext = createContext<PublishedContent>({});

export function ContentProvider({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<PublishedContent>({});
  const previewDraft = useRef<PublishedContent>({});
  useEffect(() => {
    let active = true;
    const refresh = () => { api<PublishedContent>('/content').then(data => { if (active) setContent({ ...data, ...previewDraft.current }); }).catch(() => {}); };
    refresh();
    window.addEventListener('focus', refresh);
    // A draft can only affect this same-origin preview iframe, never the public parent page.
    const preview = (event: MessageEvent) => {
      if (window.parent === window || !new URLSearchParams(window.location.search).has('contentPreview')) return;
      if (event.origin !== window.location.origin || event.source !== window.parent || event.data?.type !== 'xnamai-content-preview') return;
      const { screen, values } = event.data;
      if (typeof screen === 'string' && values && typeof values === 'object') {
        previewDraft.current = { [screen]: { values } };
        setContent(current => ({ ...current, [screen]: { values } }));
      }
    };
    window.addEventListener('message', preview);
    const published = (event: Event) => {
      const row = (event as CustomEvent).detail;
      setContent(current => ({ ...current, [row.screen]: { values: row.values } }));
    };
    window.addEventListener('xnamai-content-published', published);
    if (window.parent !== window && new URLSearchParams(window.location.search).has('contentPreview')) {
      window.parent.postMessage({ type: 'xnamai-preview-ready' }, window.location.origin);
    }
    return () => { active = false; window.removeEventListener('focus', refresh); window.removeEventListener('message', preview); window.removeEventListener('xnamai-content-published', published); };
  }, []);
  return <ContentContext.Provider value={content}>{children}</ContentContext.Provider>;
}

export function usePageText(screen: string) {
  const content = useContext(ContentContext);
  return (key: string, fallback: string): string => {
    const value = content[screen]?.values[key];
    return typeof value === 'string' && value.trim() ? value : fallback;
  };
}
