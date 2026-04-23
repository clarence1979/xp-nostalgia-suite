import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { apiKeyStorage } from '@/lib/apiKeyStorage';
import { WidgetContainer } from './WidgetContainer';

interface Notice {
  id: string;
  title: string;
  content: string;
  author: string;
  pinned: boolean;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  theme: 'xp' | 'kali';
  isAdmin: boolean;
}

const XP = {
  body: '#1c1c1c', muted: '#666', accent: '#245EDC',
  inputBg: '#fff', inputBorder: '1px solid #aaa', inputText: '#1c1c1c',
  inputFocus: '2px solid #245EDC',
  postBg: 'rgba(37,94,220,0.06)', postBorder: '1px solid #cce',
  noticeBg: 'rgba(255,255,255,0.8)', noticeBorder: '1px solid #ddd',
  pinnedBg: 'rgba(255,235,59,0.15)', pinnedBorder: '1px solid #f9c',
  divider: '#e0e0e0', errorColor: '#c62828',
  btnPrimary: '#245EDC', btnPrimaryText: '#fff',
  btnDanger: '#c62828', btnDangerText: '#fff',
  btnGhost: 'transparent', btnGhostText: '#666',
  emptyColor: '#999',
};

const KALI = {
  body: '#cef3f3', muted: '#80deea', accent: '#00e5ff',
  inputBg: 'rgba(0,255,255,0.06)', inputBorder: '1px solid rgba(0,255,255,0.25)', inputText: '#cef3f3',
  inputFocus: '2px solid rgba(0,255,255,0.5)',
  postBg: 'rgba(0,255,255,0.04)', postBorder: '1px solid rgba(0,255,255,0.2)',
  noticeBg: 'rgba(0,255,255,0.04)', noticeBorder: '1px solid rgba(0,255,255,0.12)',
  pinnedBg: 'rgba(0,255,255,0.1)', pinnedBorder: '1px solid rgba(0,255,255,0.3)',
  divider: 'rgba(0,255,255,0.1)', errorColor: '#ef5350',
  btnPrimary: 'rgba(0,100,100,0.9)', btnPrimaryText: 'hsl(180 100% 70%)',
  btnDanger: 'rgba(150,20,20,0.8)', btnDangerText: '#ffcdd2',
  btnGhost: 'transparent', btnGhostText: '#80deea',
  emptyColor: '#80deea',
};

export function NoticesWidget({ theme, isAdmin }: Props) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formError, setFormError] = useState('');

  const p = theme === 'xp' ? XP : KALI;
  const font = "'Tahoma','Segoe UI',sans-serif";

  const loadNotices = useCallback(async () => {
    const { data, error } = await supabase
      .from('notices')
      .select('*')
      .order('pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (!error && data) setNotices(data as Notice[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadNotices();
    // Real-time subscription
    const channel = supabase
      .channel('notices-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notices' }, loadNotices)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadNotices]);

  const handlePost = async () => {
    if (!formContent.trim()) { setFormError('Notice body is required.'); return; }
    setPosting(true);
    setFormError('');
    const token = apiKeyStorage.getAuthToken();
    if (!token) { setFormError('Not authenticated.'); setPosting(false); return; }

    const { error } = await supabase.rpc('admin_post_notice', {
      p_token: token,
      p_title: formTitle.trim(),
      p_content: formContent.trim(),
    });

    if (error) {
      setFormError(error.message);
    } else {
      setFormTitle('');
      setFormContent('');
      setShowForm(false);
      await loadNotices();
    }
    setPosting(false);
  };

  const handleDelete = async (id: string) => {
    const token = apiKeyStorage.getAuthToken();
    if (!token) return;
    await supabase.rpc('admin_delete_notice', { p_token: token, p_notice_id: id });
    await loadNotices();
  };

  const handlePin = async (id: string, pinned: boolean) => {
    const token = apiKeyStorage.getAuthToken();
    if (!token) return;
    await supabase.rpc('admin_pin_notice', { p_token: token, p_notice_id: id, p_pinned: !pinned });
    await loadNotices();
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    background: p.inputBg,
    border: p.inputBorder,
    borderRadius: 4,
    padding: '5px 8px',
    fontSize: 12,
    fontFamily: font,
    color: p.inputText,
    boxSizing: 'border-box',
    outline: 'none',
  };

  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: font, fontSize: 12, color: p.body }}>

      {/* Admin: post form */}
      {isAdmin && (
        <div style={{ padding: '8px 10px', borderBottom: `1px solid ${p.divider}`, flexShrink: 0 }}>
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              style={{
                width: '100%', background: p.btnPrimary, color: p.btnPrimaryText,
                border: 'none', borderRadius: 5, padding: '7px 0', fontSize: 12,
                cursor: 'pointer', fontFamily: font, fontWeight: 'bold', letterSpacing: theme === 'kali' ? 0.5 : 0,
              }}
            >
              + Post Notice
            </button>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: p.postBg, border: p.postBorder, borderRadius: 6, padding: '8px 10px' }}>
              <input
                placeholder="Title (optional)"
                value={formTitle}
                onChange={e => setFormTitle(e.target.value)}
                maxLength={80}
                style={inputStyle}
              />
              <textarea
                placeholder="Notice body…"
                value={formContent}
                onChange={e => setFormContent(e.target.value)}
                maxLength={600}
                rows={3}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 64 }}
              />
              {formError && <div style={{ color: p.errorColor, fontSize: 11 }}>{formError}</div>}
              <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                <button
                  onClick={() => { setShowForm(false); setFormTitle(''); setFormContent(''); setFormError(''); }}
                  style={{ background: p.btnGhost, color: p.btnGhostText, border: `1px solid ${p.muted}`, borderRadius: 4, padding: '5px 12px', fontSize: 12, cursor: 'pointer', fontFamily: font }}
                >
                  Cancel
                </button>
                <button
                  onClick={handlePost}
                  disabled={posting}
                  style={{ background: p.btnPrimary, color: p.btnPrimaryText, border: 'none', borderRadius: 4, padding: '5px 14px', fontSize: 12, cursor: posting ? 'wait' : 'pointer', fontFamily: font, fontWeight: 'bold', opacity: posting ? 0.7 : 1 }}
                >
                  {posting ? 'Posting…' : 'Post'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Notices list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px 10px' }}>
        {loading && (
          <div style={{ padding: 24, textAlign: 'center', color: p.muted }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>📋</div>
            <div>Loading notices…</div>
          </div>
        )}

        {!loading && notices.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: p.emptyColor, fontSize: 12 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>📭</div>
            <div>No notices yet.</div>
            {isAdmin && <div style={{ marginTop: 4, fontSize: 11 }}>Post one above.</div>}
          </div>
        )}

        {!loading && notices.map(notice => (
          <div
            key={notice.id}
            style={{
              marginBottom: 6,
              borderRadius: 6,
              padding: '8px 10px',
              background: notice.pinned ? p.pinnedBg : p.noticeBg,
              border: notice.pinned ? p.pinnedBorder : p.noticeBorder,
              position: 'relative',
            }}
          >
            {/* Header row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: notice.title ? 3 : 4 }}>
              {notice.pinned && <span title="Pinned" style={{ fontSize: 13 }}>📌</span>}
              {notice.title && (
                <span style={{ fontWeight: 'bold', fontSize: 12, flex: 1 }}>{notice.title}</span>
              )}
              {!notice.title && <span style={{ flex: 1 }} />}

              {/* Admin controls */}
              {isAdmin && (
                <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                  <button
                    onClick={() => handlePin(notice.id, notice.pinned)}
                    title={notice.pinned ? 'Unpin' : 'Pin'}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '0 2px', opacity: notice.pinned ? 1 : 0.4, transition: 'opacity 0.15s' }}
                  >
                    📌
                  </button>
                  <button
                    onClick={() => handleDelete(notice.id)}
                    title="Delete notice"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: '0 2px', color: p.errorColor }}
                  >
                    🗑
                  </button>
                </div>
              )}
            </div>

            {/* Body */}
            <div style={{ fontSize: 12, lineHeight: 1.45, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {notice.content}
            </div>

            {/* Footer */}
            <div style={{ marginTop: 5, display: 'flex', gap: 6, color: p.muted, fontSize: 10 }}>
              <span style={{ fontWeight: 'bold' }}>{notice.author}</span>
              <span>·</span>
              <span>{timeAgo(notice.created_at)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <WidgetContainer id="notices" title="Notices" icon="📋" theme={theme} isAdmin={isAdmin}>
      {content}
    </WidgetContainer>
  );
}
