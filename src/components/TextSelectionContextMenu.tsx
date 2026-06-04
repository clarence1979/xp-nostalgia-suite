import { useState, useEffect, useCallback } from 'react';

interface MenuState {
  x: number;
  y: number;
  text: string;
  canDelete: boolean;
}

interface Props {
  theme: 'xp' | 'kali';
}

export function TextSelectionContextMenu({ theme }: Props) {
  const [menu, setMenu] = useState<MenuState | null>(null);

  const handleContextMenu = useCallback((e: MouseEvent) => {
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim();
    if (!selectedText) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.target as HTMLElement;
    const isEditable =
      target instanceof HTMLInputElement ||
      target instanceof HTMLTextAreaElement ||
      target.isContentEditable ||
      !!target.closest('[contenteditable="true"]');

    setMenu({
      x: e.clientX,
      y: e.clientY,
      text: selectedText,
      canDelete: isEditable,
    });
  }, []);

  const handleDismiss = useCallback(() => {
    setMenu(null);
  }, []);

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('click', handleDismiss);
    document.addEventListener('scroll', handleDismiss, true);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('click', handleDismiss);
      document.removeEventListener('scroll', handleDismiss, true);
    };
  }, [handleContextMenu, handleDismiss]);

  const handleCopy = () => {
    navigator.clipboard.writeText(menu!.text);
    setMenu(null);
  };

  const handleDelete = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const container = range.startContainer.parentElement;

      if (container instanceof HTMLInputElement || container instanceof HTMLTextAreaElement) {
        const el = container;
        const start = el.selectionStart ?? 0;
        const end = el.selectionEnd ?? 0;
        const value = el.value;
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
          window.HTMLInputElement.prototype, 'value'
        )?.set || Object.getOwnPropertyDescriptor(
          window.HTMLTextAreaElement.prototype, 'value'
        )?.set;
        nativeInputValueSetter?.call(el, value.slice(0, start) + value.slice(end));
        el.dispatchEvent(new Event('input', { bubbles: true }));
        el.setSelectionRange(start, start);
      } else {
        range.deleteContents();
      }
    }
    setMenu(null);
  };

  if (!menu) return null;

  const isKali = theme === 'kali';
  const menuStyle: React.CSSProperties = {
    position: 'fixed',
    left: menu.x,
    top: menu.y,
    zIndex: 99999,
    minWidth: 140,
    borderRadius: isKali ? 4 : 2,
    border: isKali ? '1px solid rgba(0,255,255,0.3)' : '2px solid #aaa',
    background: isKali ? 'rgba(8,12,12,0.96)' : '#fff',
    boxShadow: isKali
      ? '0 4px 16px rgba(0,0,0,0.6), 0 0 12px rgba(0,255,255,0.1)'
      : '2px 2px 6px rgba(0,0,0,0.2)',
    padding: '4px 0',
    fontFamily: "'Tahoma','Segoe UI',sans-serif",
    fontSize: 12,
  };

  const itemBase: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    padding: '6px 12px',
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: isKali ? 'hsl(180 80% 75%)' : '#1c1c1c',
  };

  return (
    <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
      <button
        style={itemBase}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = isKali
            ? 'rgba(0,255,255,0.1)'
            : '#e8e8e8';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'none';
        }}
        onClick={handleCopy}
      >
        <span style={{ width: 16, textAlign: 'center' }}>📋</span>
        Copy
      </button>
      {menu.canDelete && (
        <button
          style={{ ...itemBase, color: isKali ? '#ef5350' : '#c62828' }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.background = isKali
              ? 'rgba(239,83,80,0.1)'
              : '#fdecea';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = 'none';
          }}
          onClick={handleDelete}
        >
          <span style={{ width: 16, textAlign: 'center' }}>🗑</span>
          Delete
        </button>
      )}
    </div>
  );
}
