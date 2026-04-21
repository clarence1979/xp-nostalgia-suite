import { useRef, useState, useCallback } from 'react';

interface DesktopIconProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  position?: { x: number; y: number };
  description?: string;
  draggable?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragEnd?: (x: number, y: number) => void;
  iconId?: string;
  isDropTarget?: boolean;
  onDropIcon?: (droppedIconId: string) => void;
}

export const DesktopIcon = ({
  icon,
  label,
  onClick,
  position,
  description,
  draggable = false,
  onContextMenu,
  onDragEnd,
  iconId,
  isDropTarget = false,
  onDropIcon,
}: DesktopIconProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!draggable || e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();

    dragMoved.current = false;
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };

    const handleMouseMove = (ev: MouseEvent) => {
      if (!dragMoved.current) {
        const dx = Math.abs(ev.clientX - startX);
        const dy = Math.abs(ev.clientY - startY);
        if (dx < 4 && dy < 4) return;
        dragMoved.current = true;
        setIsDragging(true);
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'grabbing';
      }

      const desktopArea = document.querySelector('.desktop-area');
      if (!desktopArea) return;
      const desktopRect = desktopArea.getBoundingClientRect();
      const x = Math.max(0, ev.clientX - desktopRect.left - dragOffset.current.x);
      const y = Math.max(0, ev.clientY - desktopRect.top - dragOffset.current.y);
      setDragPos({ x, y });
    };

    const handleMouseUp = (ev: MouseEvent) => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';

      if (!dragMoved.current) {
        setIsDragging(false);
        setDragPos(null);
        return;
      }

      const desktopArea = document.querySelector('.desktop-area');
      const desktopRect = desktopArea?.getBoundingClientRect();

      setIsDragging(false);
      setDragPos(null);

      const elements = document.elementsFromPoint(ev.clientX, ev.clientY);
      for (const el of elements) {
        const iconEl = el.closest('[data-icon-id]') as HTMLElement | null;
        if (
          iconEl &&
          iconEl.getAttribute('data-is-folder') === 'true' &&
          iconEl.getAttribute('data-icon-id') !== iconId
        ) {
          const folderId = iconEl.getAttribute('data-icon-id');
          if (folderId && onDropIcon) {
            onDropIcon(folderId);
            return;
          }
        }
      }

      if (!onDragEnd || !desktopRect) return;
      const x = Math.max(0, ev.clientX - desktopRect.left - dragOffset.current.x);
      const y = Math.max(0, ev.clientY - desktopRect.top - dragOffset.current.y);
      onDragEnd(x, y);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [draggable, iconId, onDropIcon, onDragEnd]);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isDropTarget) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    if (!isDropTarget || !onDropIcon) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    const droppedId = e.dataTransfer.getData('text/plain');
    if (droppedId && droppedId !== iconId) {
      onDropIcon(droppedId);
    }
  };

  const handleContext = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(e);
    }
  };

  const currentPos = dragPos ?? position;

  return (
    <div
      data-icon-id={iconId}
      data-is-folder={isDropTarget ? 'true' : undefined}
      className={`desktop-icon absolute group ${draggable ? 'cursor-grab' : 'cursor-pointer'} ${isDragging ? 'opacity-70' : ''} ${isDragOver ? 'scale-110' : ''}`}
      style={currentPos ? {
        left: currentPos.x,
        top: currentPos.y,
        zIndex: isDragging ? 999 : undefined,
        cursor: isDragging ? 'grabbing' : undefined,
        transition: isDragging ? 'none' : undefined,
      } : undefined}
      onDoubleClick={onClick}
      onContextMenu={handleContext}
      onMouseDown={handleMouseDown}
      onDragStart={(e) => e.preventDefault()}
      onDragOver={isDropTarget ? handleDragOver : undefined}
      onDragLeave={isDropTarget ? handleDragLeave : undefined}
      onDrop={isDropTarget ? handleDrop : undefined}
    >
      <div className={`text-4xl ${isDragOver ? 'scale-125 transition-transform' : ''}`} draggable={false}>{icon}</div>
      <span className={`text-white text-xs text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] ${isDragOver ? 'text-yellow-200' : ''}`}>{label}</span>
      {isDragOver && (
        <div className="absolute inset-0 rounded-lg ring-2 ring-yellow-300 ring-offset-1 pointer-events-none" />
      )}
      {description && !isDragging && !isDragOver && (
        <div className="absolute hidden group-hover:block bg-yellow-100 border border-gray-800 text-black text-xs p-2 rounded shadow-lg z-50 w-64 left-1/2 transform -translate-x-1/2 top-full mt-1 pointer-events-none">
          {description}
        </div>
      )}
    </div>
  );
};
