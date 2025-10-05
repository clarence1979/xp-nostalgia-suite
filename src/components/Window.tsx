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
  const [resizeDirection, setResizeDirection] = useState('');
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isMaximized, setIsMaximized] = useState(false);
  const [preMaximize, setPreMaximize] = useState({ position: initialPosition, size: initialSize });
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        });
      }
      if (isResizing) {
        let newWidth = size.width;
        let newHeight = size.height;
        let newX = position.x;
        let newY = position.y;

        if (resizeDirection.includes('e')) {
          newWidth = Math.max(300, e.clientX - position.x);
        }
        if (resizeDirection.includes('s')) {
          newHeight = Math.max(200, e.clientY - position.y);
        }
        if (resizeDirection.includes('w')) {
          const delta = e.clientX - position.x;
          newWidth = Math.max(300, size.width - delta);
          newX = position.x + delta;
        }
        if (resizeDirection.includes('n')) {
          const delta = e.clientY - position.y;
          newHeight = Math.max(200, size.height - delta);
          newY = position.y + delta;
        }

        setSize({ width: newWidth, height: newHeight });
        setPosition({ x: newX, y: newY });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeDirection('');
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragOffset, position, size, resizeDirection, isMaximized]);

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

  const handleResizeMouseDown = (e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
  };

  const handleMaximize = () => {
    if (isMaximized) {
      // Restore
      setPosition(preMaximize.position);
      setSize(preMaximize.size);
      setIsMaximized(false);
    } else {
      // Maximize
      setPreMaximize({ position, size });
      setPosition({ x: 0, y: 0 });
      setSize({ width: window.innerWidth, height: window.innerHeight - 40 }); // 40px for taskbar
      setIsMaximized(true);
    }
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
        zIndex: active ? 100 : 10,
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
              handleMaximize();
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
        
        {/* Resize handles - only show when not maximized */}
        {!isMaximized && (
          <>
            {/* Corner handles */}
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'se')}
            />
            <div
              className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'ne')}
            />
            <div
              className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'nw')}
            />
            <div
              className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'sw')}
            />
            
            {/* Edge handles */}
            <div
              className="absolute top-0 left-4 right-4 h-1 cursor-n-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'n')}
            />
            <div
              className="absolute bottom-0 left-4 right-4 h-1 cursor-s-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 's')}
            />
            <div
              className="absolute left-0 top-4 bottom-4 w-1 cursor-w-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'w')}
            />
            <div
              className="absolute right-0 top-4 bottom-4 w-1 cursor-e-resize"
              onMouseDown={(e) => handleResizeMouseDown(e, 'e')}
            />
          </>
        )}
      </div>
    </div>
  );
};
