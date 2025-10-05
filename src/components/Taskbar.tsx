import { useState, useEffect } from 'react';

interface TaskbarProps {
  onStartClick: () => void;
  windows: Array<{ id: string; title: string; active: boolean }>;
  onWindowClick: (id: string) => void;
}

export const Taskbar = ({ onStartClick, windows, onWindowClick }: TaskbarProps) => {
  const [time, setTime] = useState(new Date());
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 h-[40px] bg-[#245EDC] border-t-2 border-[#0831D9] flex items-center px-1 gap-1 z-50">
      {/* Start Button */}
      <button
        className="flex items-center gap-2 px-3 h-[32px] rounded-sm font-bold text-white text-sm shadow-sm"
        style={{
          background: 'linear-gradient(180deg, hsl(120 48% 34%) 0%, hsl(120 48% 26%) 100%)',
          border: '1px outset rgba(255,255,255,0.4)',
        }}
        onClick={onStartClick}
      >
        <div className="w-5 h-5 bg-white/20 rounded-sm flex items-center justify-center text-xs">
          ⊞
        </div>
        <span>start</span>
      </button>

      {/* Quick Launch - hide on mobile */}
      {!isMobile && <div className="w-px h-[32px] bg-[#0831D9]" />}
      
      {/* Window Buttons */}
      <div className="flex-1 flex gap-0.5 overflow-x-auto">
        {windows.map((window) => (
          <button
            key={window.id}
            className={`px-2 h-[32px] ${isMobile ? 'min-w-[80px] max-w-[120px]' : 'min-w-[120px] max-w-[180px]'} text-xs text-left truncate rounded-sm border ${
              window.active
                ? 'bg-[#3C8EF3] border-white/40 text-white font-bold'
                : 'bg-[#245EDC] border-[#0831D9] text-white hover:bg-[#2868D9]'
            }`}
            onClick={() => onWindowClick(window.id)}
          >
            {window.title}
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div className="w-px h-[32px] bg-[#0831D9]" />
      <div className={`flex items-center gap-2 ${isMobile ? 'px-1' : 'px-3'} h-[32px] bg-[#12B2E8] rounded-sm border border-[#0831D9]`}>
        <span className={`${isMobile ? 'text-[10px]' : 'text-xs'} text-white font-bold`}>
          {time.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit', 
            hour12: true 
          })}
        </span>
      </div>
    </div>
  );
};
