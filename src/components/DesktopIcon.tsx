import { useRef, useState } from 'react';

interface DesktopIconProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  position?: { x: number; y: number };
  description?: string;
  draggable?: boolean;
  onContextMenu?: (e: React.MouseEvent) => void;
  onDragEnd?: (x: number, y: number) => void;
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
}: DesktopIconProps) => {
  const dragOffset = useRef({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const handleDragStart = (e: React.DragEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
    setIsDragging(true);

    const desktopEl = document.querySelector('.desktop-area');
    if (desktopEl) {
      desktopEl.classList.add('show-grid');
    }
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);

    const desktopEl = document.querySelector('.desktop-area');
    if (desktopEl) {
      desktopEl.classList.remove('show-grid');
    }

    if (!onDragEnd) return;
    const desktopArea = (e.target as HTMLElement).closest('.desktop-area');
    if (!desktopArea) return;
    const desktopRect = desktopArea.getBoundingClientRect();
    const rawX = Math.max(0, e.clientX - desktopRect.left - dragOffset.current.x);
    const rawY = Math.max(0, e.clientY - desktopRect.top - dragOffset.current.y);

    const gridSize = 80;
    const snappedX = Math.round(rawX / gridSize) * gridSize;
    const snappedY = Math.round(rawY / gridSize) * gridSize;

    onDragEnd(snappedX, snappedY);
  };

  const handleContext = (e: React.MouseEvent) => {
    if (onContextMenu) {
      e.preventDefault();
      e.stopPropagation();
      onContextMenu(e);
    }
  };

  return (
    <div
      className={`desktop-icon absolute group ${draggable ? 'cursor-move hover:scale-105 transition-transform' : 'cursor-pointer'} ${isDragging ? 'opacity-50 scale-110' : ''}`}
      style={position ? { left: position.x, top: position.y } : undefined}
      onDoubleClick={onClick}
      onContextMenu={handleContext}
      title={description}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onDragEnd={draggable ? handleDragEnd : undefined}
    >
      <div className="text-4xl">{icon}</div>
      <span className="text-white text-xs text-center drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]">{label}</span>
      {draggable && !isDragging && (
        <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[8px] px-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          DRAG
        </div>
      )}
      {description && !isDragging && (
        <div className="absolute hidden group-hover:block bg-yellow-100 border border-gray-800 text-black text-xs p-2 rounded shadow-lg z-50 w-64 left-1/2 transform -translate-x-1/2 top-full mt-1 pointer-events-none">
          {description}
        </div>
      )}
    </div>
  );
};
