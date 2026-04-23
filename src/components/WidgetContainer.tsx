import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { apiKeyStorage } from '@/lib/apiKeyStorage';
import { useIsMobile } from '@/hooks/use-mobile';

const HEADER_H = 38;
const MIN_W = 200;
const MIN_H = 100;

interface Config {
  x: number;
  y: number;
  w: number;
  h: number;
  minimized: boolean;
}

interface Props {
  id: string;
  title: string;
  icon: string;
  theme: 'xp' | 'kali';
  isAdmin: boolean;
  children: React.ReactNode;
}

const XP = {
  bg: 'rgba(236,233,216,0.97)',
  headerBg: 'linear-gradient(180deg,#2868D9 0%,#1247BA 100%)',
  headerText: '#fff',
  headerBorder: '1px solid rgba(0,0,0,0.25)',
  border: '2px solid #7BABD4',
  shadow: '0 4px 20px rgba(0,0,0,0.35)',
  ctrlBg: 'rgba(255,255,255,0.18)',
  ctrlText: '#fff',
  resizeColor: 'rgba(255,255,255,0.5)',
  resizeBg: 'rgba(255,255,255,0.12)',
};

const KALI = {
  bg: 'rgba(8,8,8,0.95)',
  headerBg: 'rgba(0,15,15,0.92)',
  headerText: 'hsl(180 100% 70%)',
  headerBorder: '1px solid rgba(0,255,255,0.2)',
  border: '1px solid rgba(0,255,255,0.3)',
  shadow: '0 0 24px rgba(0,255,255,0.18),0 4px 20px rgba(0,0,0,0.6)',
  ctrlBg: 'rgba(0,255,255,0.12)',
  ctrlText: 'hsl(180 100% 70%)',
  resizeColor: 'rgba(0,255,255,0.6)',
  resizeBg: 'rgba(0,255,255,0.08)',
};

function getDefaults(id: string, taskbarH: number): Config {
  const sw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const sh = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const m = 16;
  const gap = 8;
  const fullH = Math.max(300, sh - taskbarH - m * 2);

  switch (id) {
    case 'weather':
      return { x: sw - m - 290, y: m, w: 290, h: fullH, minimized: false };
    case 'news':
      return { x: sw - m - 290 - gap - 310, y: m, w: 310, h: fullH, minimized: false };
    case 'notices':
      return { x: sw - m - 290 - gap - 310 - gap - 270, y: m, w: 270, h: 340, minimized: false };
    default:
      return { x: 100, y: m, w: 300, h: 400, minimized: false };
  }
}

async function saveWidgetState(id: string, cfg: Config) {
  const token = apiKeyStorage.getAuthToken();
  if (!token) return;
  await supabase.rpc('admin_update_widget_state', {
    p_token: token,
    p_widget_id: id,
    p_x: Math.round(cfg.x),
    p_y: Math.round(cfg.y),
    p_width: Math.round(cfg.w),
    p_height: Math.round(cfg.h),
    p_minimized: cfg.minimized,
  });
}

export function WidgetContainer({ id, title, icon, theme, isAdmin, children }: Props) {
  const isMobile = useIsMobile();
  const [cfg, setCfg] = useState<Config | null>(null);
  const cfgRef = useRef<Config>({ x: 0, y: 0, w: 300, h: 500, minimized: false });
  const dragRef = useRef({ active: false, ox: 0, oy: 0 });
  const resizeRef = useRef({ active: false, sx: 0, sy: 0, sw: 0, sh: 0 });

  const taskbarH = theme === 'xp' ? 40 : 44;
  const p = theme === 'xp' ? XP : KALI;
  const font = "'Tahoma','Segoe UI',sans-serif";

  // Load state from DB on mount
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('widget_states')
        .select('*')
        .eq('widget_id', id)
        .maybeSingle();

      const sw = window.innerWidth;
      const sh = window.innerHeight;
      let initial: Config;

      if (data) {
        initial = {
          x: Math.max(0, Math.min(sw - MIN_W, data.x)),
          y: Math.max(0, Math.min(sh - HEADER_H, data.y)),
          w: Math.max(MIN_W, Math.min(sw, data.width)),
          h: Math.max(MIN_H, data.height),
          minimized: data.minimized ?? false,
        };
      } else {
        initial = getDefaults(id, taskbarH);
      }

      cfgRef.current = initial;
      setCfg(initial);
    })();
  }, [id, taskbarH]);

  // Keep cfgRef in sync with state
  useEffect(() => {
    if (cfg) cfgRef.current = cfg;
  }, [cfg]);

  // Document-level mouse events for drag and resize
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragRef.current.active) {
        const newX = Math.max(0, Math.min(window.innerWidth - cfgRef.current.w, e.clientX - dragRef.current.ox));
        const newY = Math.max(0, Math.min(window.innerHeight - HEADER_H, e.clientY - dragRef.current.oy));
        setCfg(prev => prev ? { ...prev, x: newX, y: newY } : prev);
      } else if (resizeRef.current.active) {
        const dx = e.clientX - resizeRef.current.sx;
        const dy = e.clientY - resizeRef.current.sy;
        const newW = Math.max(MIN_W, resizeRef.current.sw + dx);
        const newH = Math.max(MIN_H, resizeRef.current.sh + dy);
        setCfg(prev => prev ? { ...prev, w: newW, h: newH } : prev);
      }
    };

    const onUp = async () => {
      if (dragRef.current.active || resizeRef.current.active) {
        dragRef.current.active = false;
        resizeRef.current.active = false;
        if (isAdmin) await saveWidgetState(id, cfgRef.current);
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
  }, [id, isAdmin]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (!isAdmin || !cfg) return;
    let el = e.target as HTMLElement | null;
    while (el) {
      if (el.dataset.noDrag) return;
      el = el.parentElement;
    }
    e.preventDefault();
    dragRef.current = { active: true, ox: e.clientX - cfgRef.current.x, oy: e.clientY - cfgRef.current.y };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    resizeRef.current = { active: true, sx: e.clientX, sy: e.clientY, sw: cfgRef.current.w, sh: cfgRef.current.h };
  };

  const toggleMinimize = async () => {
    if (!isAdmin || !cfg) return;
    const updated = { ...cfgRef.current, minimized: !cfgRef.current.minimized };
    cfgRef.current = updated;
    setCfg(updated);
    await saveWidgetState(id, updated);
  };

  const resetToDefault = async () => {
    if (!isAdmin) return;
    const d = getDefaults(id, taskbarH);
    cfgRef.current = d;
    setCfg(d);
    await saveWidgetState(id, d);
  };

  if (isMobile || !cfg) return null;

  const ctrlBtn: React.CSSProperties = {
    background: p.ctrlBg,
    color: p.ctrlText,
    border: 'none',
    borderRadius: '50%',
    width: 22,
    height: 22,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 12,
    fontFamily: font,
    padding: 0,
    flexShrink: 0,
    transition: 'background 0.15s',
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: cfg.x,
        top: cfg.y,
        width: cfg.w,
        height: cfg.minimized ? HEADER_H : cfg.h,
        transition: dragRef.current.active || resizeRef.current.active ? 'none' : 'height 0.2s ease',
        zIndex: 15,
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 8,
        overflow: 'hidden',
        background: p.bg,
        border: p.border,
        boxShadow: p.shadow,
        fontFamily: font,
        fontSize: 12,
        userSelect: dragRef.current.active ? 'none' : 'auto',
      }}
    >
      {/* ── Header ── */}
      <div
        onMouseDown={handleHeaderMouseDown}
        style={{
          height: HEADER_H,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '0 10px',
          background: p.headerBg,
          borderBottom: p.headerBorder,
          cursor: isAdmin ? (dragRef.current.active ? 'grabbing' : 'grab') : 'default',
        }}
      >
        <span style={{ fontSize: 17, flexShrink: 0 }}>{icon}</span>
        <span style={{
          flex: 1,
          fontWeight: 'bold',
          fontSize: 12,
          color: p.headerText,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          letterSpacing: theme === 'kali' ? 0.5 : 0,
          textTransform: theme === 'kali' ? 'uppercase' : 'none',
        }}>
          {title}
        </span>

        {isAdmin && (
          <div data-no-drag="true" style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
            <button
              data-no-drag="true"
              onClick={resetToDefault}
              title="Reset to default position & size"
              style={ctrlBtn}
            >
              ↺
            </button>
            <button
              data-no-drag="true"
              onClick={toggleMinimize}
              title={cfg.minimized ? 'Restore' : 'Minimize'}
              style={ctrlBtn}
            >
              {cfg.minimized ? '▲' : '—'}
            </button>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      {!cfg.minimized && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Scrollable content */}
          <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
            {children}
          </div>

          {/* SE resize handle (admin only) */}
          {isAdmin && (
            <div
              data-no-drag="true"
              onMouseDown={handleResizeMouseDown}
              title="Drag to resize"
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 20,
                height: 20,
                cursor: 'se-resize',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: p.resizeColor,
                background: p.resizeBg,
                borderTopLeftRadius: 4,
                fontSize: 13,
                zIndex: 2,
                flexShrink: 0,
              }}
            >
              ⤡
            </div>
          )}
        </div>
      )}
    </div>
  );
}
