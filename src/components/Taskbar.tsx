import { useState, useEffect } from 'react';
import logo from '@/assets/cla_sol.png';

interface TaskbarProps {
  onStartClick: () => void;
  windows: Array<{ id: string; title: string; active: boolean }>;
  onWindowClick: (id: string) => void;
  theme: 'xp' | 'kali';
}

export const Taskbar = ({ onStartClick, windows, onWindowClick, theme }: TaskbarProps) => {
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
    <div
      className="fixed bottom-0 left-0 right-0 flex items-center px-1 gap-1 z-50"
      style={{
        height: theme === 'xp' ? '40px' : '44px',
        background: theme === 'xp' ? '#245EDC' : 'hsl(0 0% 12%)',
        borderTop: theme === 'xp' ? '2px solid #0831D9' : '2px solid hsl(180 100% 30%)',
        boxShadow: theme === 'kali' ? '0 -2px 10px rgba(0, 255, 255, 0.2)' : 'none',
      }}
    >
      {/* Start Button */}
      <button
        className="flex items-center gap-2 px-3 h-[32px] rounded-sm font-bold text-sm shadow-sm"
        style={{
          background: theme === 'xp'
            ? 'linear-gradient(180deg, hsl(120 48% 34%) 0%, hsl(120 48% 26%) 100%)'
            : 'linear-gradient(180deg, hsl(180 100% 35%) 0%, hsl(180 100% 25%) 100%)',
          border: theme === 'xp' ? '1px outset rgba(255,255,255,0.4)' : '1px solid hsl(180 100% 45%)',
          color: theme === 'xp' ? '#ffffff' : 'hsl(180 100% 70%)',
          boxShadow: theme === 'kali' ? '0 0 10px rgba(0, 255, 255, 0.4)' : 'none',
        }}
        onClick={onStartClick}
      >
        <div
          className="w-5 h-5 rounded-sm flex items-center justify-center text-xs"
          style={{
            background: theme === 'xp' ? 'rgba(255,255,255,0.2)' : 'rgba(0,255,255,0.2)',
          }}
        >
          {theme === 'xp' ? '⊞' : '🐉'}
        </div>
        <span>{theme === 'xp' ? 'start' : 'MENU'}</span>
      </button>

      {/* Quick Launch - hide on mobile */}
      {!isMobile && <div className="w-px h-[32px]" style={{ background: theme === 'xp' ? '#0831D9' : 'hsl(180 100% 30%)' }} />}
      
      {/* Window Buttons */}
      <div className="flex-1 flex gap-0.5 overflow-x-auto">
        {windows.map((window) => (
          <button
            key={window.id}
            className={`px-2 h-[32px] ${isMobile ? 'min-w-[80px] max-w-[120px]' : 'min-w-[120px] max-w-[180px]'} text-xs text-left truncate rounded-sm border`}
            style={{
              background: window.active
                ? (theme === 'xp' ? '#3C8EF3' : 'hsl(180 100% 20%)')
                : (theme === 'xp' ? '#245EDC' : 'hsl(0 0% 15%)'),
              borderColor: window.active
                ? (theme === 'xp' ? 'rgba(255,255,255,0.4)' : 'hsl(180 100% 45%)')
                : (theme === 'xp' ? '#0831D9' : 'hsl(180 100% 30%)'),
              color: theme === 'xp' ? '#ffffff' : 'hsl(180 100% 70%)',
              fontWeight: window.active ? 'bold' : 'normal',
              boxShadow: theme === 'kali' && window.active ? '0 0 8px rgba(0, 255, 255, 0.3)' : 'none',
            }}
            onMouseEnter={(e) => {
              if (!window.active && theme === 'xp') {
                e.currentTarget.style.background = '#2868D9';
              } else if (!window.active && theme === 'kali') {
                e.currentTarget.style.background = 'hsl(0 0% 18%)';
              }
            }}
            onMouseLeave={(e) => {
              if (!window.active) {
                e.currentTarget.style.background = theme === 'xp' ? '#245EDC' : 'hsl(0 0% 15%)';
              }
            }}
            onClick={() => onWindowClick(window.id)}
          >
            {window.title}
          </button>
        ))}
      </div>

      {/* System Tray */}
      <div className="w-px h-[32px]" style={{ background: theme === 'xp' ? '#0831D9' : 'hsl(180 100% 30%)' }} />

      {/* Email Address */}
      {!isMobile && (
        <a
          href="mailto:clarence.guru.bring446@passmail.net"
          className="flex items-center h-[32px] px-2 hover:bg-white/10 rounded-sm transition-colors"
          title="Contact via email"
        >
          <span
            className="text-[11px] font-tahoma"
            style={{ color: theme === 'xp' ? '#ffffff' : 'hsl(180 100% 70%)' }}
          >
            clarence.guru.bring446@passmail.net
          </span>
        </a>
      )}

      {/* PayPal Donate Button */}
      <form
        action="https://www.paypal.com/donate"
        method="post"
        target="_top"
        className="flex items-center h-[32px] px-1"
      >
        <input type="hidden" name="hosted_button_id" value="PSXE6LDM3ZJDC" />
        <input
          type="image"
          src="https://www.paypalobjects.com/en_AU/i/btn/btn_donateCC_LG.gif"
          name="submit"
          title="PayPal - The safer, easier way to pay online!"
          alt="Donate with PayPal button"
          className={`${isMobile ? 'h-5' : 'h-6'} hover:opacity-80 transition-opacity`}
        />
      </form>

      {/* Logo */}
      <a
        href="https://clarence.guru/#contact"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center h-[32px] px-2 hover:bg-white/10 rounded-sm transition-colors"
        title="Contact Clarence"
      >
        <img
          src={logo}
          alt="Clarence's Solutions"
          className={isMobile ? 'h-6' : 'h-7'}
        />
      </a>
      
      <div
        className={`flex items-center gap-2 ${isMobile ? 'px-1' : 'px-3'} h-[32px] rounded-sm border`}
        style={{
          background: theme === 'xp' ? '#12B2E8' : 'hsl(0 0% 15%)',
          borderColor: theme === 'xp' ? '#0831D9' : 'hsl(180 100% 30%)',
          boxShadow: theme === 'kali' ? '0 0 5px rgba(0, 255, 255, 0.2)' : 'none',
        }}
      >
        <span
          className={`${isMobile ? 'text-[10px]' : 'text-xs'} font-bold`}
          style={{ color: theme === 'xp' ? '#ffffff' : 'hsl(180 100% 70%)' }}
        >
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
