import { useRef } from 'react';

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

  const handleDragStart = (e: React.DragEvent) => {
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    if (!onDragEnd) return;
    const desktopEl = (e.target as HTMLElement).closest('.desktop-area');
    if (!desktopEl) return;
    const desktopRect = desktopEl.getBoundingClientRect();
    const newX = Math.max(0, e.clientX - desktopRect.left - dragOffset.current.x);
    const newY = Math.max(0, e.clientY - desktopRect.top - dragOffset.current.y);
    onDragEnd(Math.round(newX), Math.round(newY));
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
      className="desktop-icon absolute group"
      style={position ? { left: position.x, top: position.y } : undefined}
      onDoubleClick={onClick}
      onContextMenu={handleContext}
      title={description}
      draggable={draggable}
      onDragStart={draggable ? handleDragStart : undefined}
      onDragEnd={draggable ? handleDragEnd : undefined}
    >
      <div className="text-4xl">{icon}</div>
      <span className="text-white text-xs text-center">{label}</span>
      {description && (
        <div className="absolute hidden group-hover:block bg-yellow-100 border border-gray-800 text-black text-xs p-2 rounded shadow-lg z-50 w-64 left-1/2 transform -translate-x-1/2 top-full mt-1">
          {description}
        </div>
      )}
    </div>
  );
};
