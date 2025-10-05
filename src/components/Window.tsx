import { useState, useRef, useEffect } from 'react';
import { X, Minus, Square } from 'lucide-react';

interface WindowProps {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onMinimize?: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  icon?: React.ReactNode;
  active?: boolean;
  onFocus?: () => void;
}

export const Window = ({
  title,
  children,
  onClose,
  onMinimize,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 600, height: 400 },
  icon,
  active = true,
  onFocus,
}: WindowProps) => {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
      if (isResizing) {
        const newWidth = Math.max(300, e.clientX - position.x);
        const newHeight = Math.max(200, e.clientY - position.y);
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (onFocus) onFocus();
    const rect = windowRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
      setIsDragging(true);
    }
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  return (
    <div
      ref={windowRef}
      className="xp-window absolute"
      style={{
        left: position.x,
        top: position.y,
        width: size.width,
        height: size.height,
        zIndex: active ? 1000 : 999,
      }}
      onClick={onFocus}
    >
      <div
        className={`xp-title-bar ${!active ? 'inactive' : ''}`}
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-1">
          {icon && <div className="w-4 h-4">{icon}</div>}
          <span className="text-white text-xs font-bold">{title}</span>
        </div>
        <div className="flex gap-0.5">
          {onMinimize && (
            <button
              className="w-5 h-5 flex items-center justify-center bg-[hsl(var(--button-face))] border border-white hover:brightness-105 active:brightness-95"
              onClick={(e) => {
                e.stopPropagation();
                onMinimize();
              }}
            >
              <Minus className="w-3 h-3" />
            </button>
          )}
          <button
            className="w-5 h-5 flex items-center justify-center bg-[hsl(var(--button-face))] border border-white hover:brightness-105 active:brightness-95"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Square className="w-2.5 h-2.5" />
          </button>
          <button
            className="w-5 h-5 flex items-center justify-center bg-[hsl(var(--button-face))] border border-white hover:brightness-105 active:brightness-95"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="h-[calc(100%-28px)] overflow-hidden bg-white relative">
        {children}
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={handleResizeMouseDown}
        />
      </div>
    </div>
  );
};
