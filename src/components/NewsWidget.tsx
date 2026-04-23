import { useState, useEffect, useCallback } from 'react';
import { WidgetContainer } from './WidgetContainer';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
const REFRESH_MS = 10 * 60 * 1000;

interface Article {
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  source: { name: string };
}

type Tab = 'top' | 'local' | 'technology' | 'business' | 'sports' | 'health';

const TABS: { id: Tab; label: string }[] = [
  { id: 'top', label: 'Top' },
  { id: 'local', label: 'Local' },
  { id: 'technology', label: 'Tech' },
  { id: 'business', label: 'Business' },
  { id: 'sports', label: 'Sports' },
  { id: 'health', label: 'Health' },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

async function fetchNews(tab: Tab): Promise<Article[]> {
  const params = new URLSearchParams({ pageSize: '20' });
  if (tab === 'local') {
    params.set('type', 'local');
  } else if (tab === 'top') {
    params.set('type', 'top');
  } else {
    params.set('type', 'category');
    params.set('category', tab);
  }

  const res = await fetch(
    `${SUPABASE_URL}/functions/v1/news-proxy?${params}`,
    { headers: { Authorization: `Bearer ${ANON_KEY}`, 'Content-Type': 'application/json' } }
  );
  const data = await res.json();
  if (!res.ok || data.status === 'error') throw new Error(data.message || 'News fetch failed');
  return (data.articles ?? []).filter((a: Article) => a.title !== '[Removed]');
}

interface Props {
  theme: 'xp' | 'kali';
  isAdmin: boolean;
}

const XP = {
  body: '#1c1c1c', muted: '#666', bg: '#f4f4f0',
  tabActiveBg: '#245EDC', tabActiveText: '#fff',
  tabBg: 'rgba(0,0,0,0.06)', tabText: '#444',
  tabBorder: '1px solid #ccc',
  articleBg: 'rgba(255,255,255,0.8)', articleBorder: '1px solid #ddd',
  articleHover: 'rgba(37,94,220,0.06)',
  divider: '#e0e0e0', errorColor: '#c62828',
};

const KALI = {
  body: '#cef3f3', muted: '#80deea', bg: 'transparent',
  tabActiveBg: 'rgba(0,100,100,0.9)', tabActiveText: 'hsl(180 100% 70%)',
  tabBg: 'rgba(0,255,255,0.06)', tabText: '#80deea',
  tabBorder: '1px solid rgba(0,255,255,0.15)',
  articleBg: 'rgba(0,255,255,0.04)', articleBorder: '1px solid rgba(0,255,255,0.12)',
  articleHover: 'rgba(0,255,255,0.08)',
  divider: 'rgba(0,255,255,0.1)', errorColor: '#ef5350',
};

export function NewsWidget({ theme, isAdmin }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('top');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const p = theme === 'xp' ? XP : KALI;
  const font = "'Tahoma','Segoe UI',sans-serif";

  const loadNews = useCallback(async (tab: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchNews(tab);
      setArticles(data);
      setImgErrors(new Set());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load news');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNews(activeTab);
    const t = setInterval(() => loadNews(activeTab), REFRESH_MS);
    return () => clearInterval(t);
  }, [activeTab, loadNews]);

  const handleImgError = (url: string) => {
    setImgErrors(prev => new Set(prev).add(url));
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: font, fontSize: 12, color: p.body }}>

      {/* Tab strip */}
      <div style={{ display: 'flex', gap: 4, padding: '8px 10px 6px', flexWrap: 'wrap', flexShrink: 0, borderBottom: `1px solid ${p.divider}` }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              background: activeTab === t.id ? p.tabActiveBg : p.tabBg,
              color: activeTab === t.id ? p.tabActiveText : p.tabText,
              border: p.tabBorder,
              borderRadius: 4,
              padding: '3px 8px',
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: font,
              transition: 'all 0.15s',
              fontWeight: activeTab === t.id ? 'bold' : 'normal',
            }}
          >
            {t.label}
          </button>
        ))}
        <button
          onClick={() => loadNews(activeTab)}
          title="Refresh"
          style={{ marginLeft: 'auto', background: 'none', border: 'none', color: p.muted, cursor: 'pointer', fontSize: 14, padding: '0 4px', fontFamily: font }}
        >
          ↻
        </button>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px 10px' }}>
        {loading && (
          <div style={{ padding: 24, textAlign: 'center', color: p.muted }}>
            <div style={{ fontSize: 24, marginBottom: 8 }}>📰</div>
            <div>Loading news…</div>
          </div>
        )}

        {!loading && error && (
          <div style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ color: p.errorColor, marginBottom: 8 }}>{error}</div>
            <button
              onClick={() => loadNews(activeTab)}
              style={{ background: p.tabActiveBg, color: p.tabActiveText, border: 'none', borderRadius: 4, padding: '5px 14px', cursor: 'pointer', fontFamily: font, fontSize: 12 }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && articles.length === 0 && (
          <div style={{ padding: 16, textAlign: 'center', color: p.muted }}>No articles found.</div>
        )}

        {!loading && !error && articles.map((article, i) => {
          const hasImage = article.urlToImage && !imgErrors.has(article.urlToImage);
          return (
            <div
              key={i}
              onClick={() => window.open(article.url, '_blank', 'noopener,noreferrer')}
              style={{
                display: 'flex',
                gap: 8,
                padding: '7px 8px',
                marginBottom: 4,
                borderRadius: 6,
                background: p.articleBg,
                border: p.articleBorder,
                cursor: 'pointer',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = p.articleHover)}
              onMouseLeave={e => (e.currentTarget.style.background = p.articleBg)}
            >
              {hasImage && (
                <img
                  src={article.urlToImage!}
                  alt=""
                  onError={() => handleImgError(article.urlToImage!)}
                  style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 4, flexShrink: 0 }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 'bold', fontSize: 12, lineHeight: 1.35,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  marginBottom: 3,
                }}>
                  {article.title}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  <span style={{ color: p.muted, fontSize: 10, fontWeight: 'bold' }}>{article.source.name}</span>
                  <span style={{ color: p.muted, fontSize: 10 }}>·</span>
                  <span style={{ color: p.muted, fontSize: 10 }}>{timeAgo(article.publishedAt)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <WidgetContainer id="news" title="Melbourne News" icon="📰" theme={theme} isAdmin={isAdmin}>
      {content}
    </WidgetContainer>
  );
}
