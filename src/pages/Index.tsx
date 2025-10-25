import { useState, useEffect } from 'react';
import { Window } from '@/components/Window';
import { StartMenu } from '@/components/StartMenu';
import { Taskbar } from '@/components/Taskbar';
import { DesktopIcon } from '@/components/DesktopIcon';
import { Notepad } from '@/components/Notepad';
import { Browser } from '@/components/Browser';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ApiKeyLogin } from '@/components/ApiKeyLogin';
import blissWallpaper from '@/assets/bliss-wallpaper.jpg';
import kaliWallpaper from '@/assets/kali-wallpaper.jpg';
import { HardDrive, Folder, Trash2, Globe, FileText, Code } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { apiKeyStorage } from '@/lib/apiKeyStorage';

interface OpenWindow {
  id: string;
  title: string;
  content: React.ReactNode;
  active: boolean;
  minimized: boolean;
  icon?: React.ReactNode;
}

interface DesktopIconData {
  id: string;
  name: string;
  icon: string;
  description: string;
  url: string | null;
  icon_type: 'system' | 'program' | 'theme';
  position_x: number;
  position_y: number;
  position_x_mobile: number | null;
  position_y_mobile: number | null;
  category: string | null;
  open_behavior: 'window' | 'new_tab' | 'special';
  sort_order: number;
}

interface Program {
  name: string;
  url: string;
  icon: string;
  description: string;
}

const Index = () => {
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [nextWindowId, setNextWindowId] = useState(1);
  const [validatedPassword, setValidatedPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKeyLogin, setShowApiKeyLogin] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [theme, setTheme] = useState<'xp' | 'kali'>('xp');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [desktopIcons, setDesktopIcons] = useState<DesktopIconData[]>([]);
  const [iconsLoading, setIconsLoading] = useState(true);
  const isMobile = useIsMobile();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      const savedApiKey = apiKeyStorage.get();
      if (savedApiKey) {
        setApiKey(savedApiKey);
      } else {
        setShowApiKeyLogin(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const loadDesktopIcons = async () => {
      try {
        const { data, error } = await supabase
          .from('desktop_icons')
          .select('*')
          .order('sort_order', { ascending: true });

        if (error) {
          console.error('Error loading desktop icons:', error);
          toast({
            title: 'Error',
            description: 'Failed to load desktop icons',
            variant: 'destructive',
          });
        } else if (data) {
          setDesktopIcons(data);
        }
      } catch (err) {
        console.error('Failed to load desktop icons:', err);
      } finally {
        setIconsLoading(false);
      }
    };

    loadDesktopIcons();
  }, [toast]);

  useEffect(() => {
    // Update body class for theme
    if (theme === 'kali') {
      document.body.classList.add('kali-theme');
      document.body.classList.remove('xp-theme');
    } else {
      document.body.classList.add('xp-theme');
      document.body.classList.remove('kali-theme');
    }
  }, [theme]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClick = () => {
    setContextMenu(null);
  };

  const switchTheme = () => {
    setTheme(theme === 'xp' ? 'kali' : 'xp');
    setContextMenu(null);
  };

  const openWindow = (title: string, content: React.ReactNode, icon?: React.ReactNode) => {
    const id = `window-${nextWindowId}`;
    setNextWindowId(nextWindowId + 1);

    const newWindow: OpenWindow = {
      id,
      title,
      content,
      active: true,
      minimized: false,
      icon,
    };

    setWindows((prev) => [
      ...prev.map((w) => ({ ...w, active: false })),
      newWindow,
    ]);
  };

  const closeWindow = (id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  };

  const minimizeWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true, active: false } : w))
    );
  };

  const focusWindow = (id: string) => {
    setWindows((prev) =>
      prev.map((w) => ({
        ...w,
        active: w.id === id,
        minimized: w.id === id ? false : w.minimized,
      }))
    );
  };

  const openProgram = (program: Program) => {
    if (program.name === 'Drone Programming') {
      window.open(program.url, '_blank');
      return;
    }

    openWindow(
      program.name,
      <iframe
        src={program.url}
        className="w-full h-full border-none"
        title={program.name}
        allow="camera; microphone; geolocation; fullscreen"
      />,
      <span className="text-base">{program.icon}</span>
    );
  };

  const handleIconClick = (icon: DesktopIconData) => {
    if (icon.icon_type === 'system') {
      switch (icon.name) {
        case 'My Computer':
          openWindow('My Computer', <div className="p-4">My Computer</div>, <HardDrive className="w-4 h-4" />);
          break;
        case 'My Documents':
          openWindow('My Documents', <div className="p-4">My Documents</div>, <Folder className="w-4 h-4" />);
          break;
        case 'Recycle Bin':
          openWindow('Recycle Bin', <div className="p-4">Recycle Bin is empty</div>, <Trash2 className="w-4 h-4" />);
          break;
        case 'Internet Explorer':
          openWindow('Internet Explorer', <Browser />, <Globe className="w-4 h-4" />);
          break;
        case 'Notepad':
          openNotepad();
          break;
        case 'Visual Studio Code':
          window.open('https://vscode.dev/', '_blank');
          break;
      }
    } else if (icon.icon_type === 'theme') {
      switchTheme();
    } else if (icon.icon_type === 'program' && icon.url) {
      if (icon.open_behavior === 'new_tab') {
        window.open(icon.url, '_blank');
      } else {
        openWindow(
          icon.name,
          <iframe
            src={icon.url}
            className="w-full h-full border-none"
            title={icon.name}
            allow="camera; microphone; geolocation; fullscreen"
          />,
          <span className="text-base">{icon.icon}</span>
        );
      }
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'HardDrive': <HardDrive className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-gray-300`} />,
      'Folder': <Folder className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-yellow-300`} />,
      'Trash2': <Trash2 className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-gray-300`} />,
      'Globe': <Globe className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-400`} />,
      'FileText': <FileText className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-300`} />,
      'Code': <Code className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-500`} />,
    };

    return iconMap[iconName] || <span className={isMobile ? 'text-3xl' : 'text-4xl'}>{iconName}</span>;
  };

  const handleApiKeyLogin = (key: string) => {
    apiKeyStorage.save(key);
    setApiKey(key);
    setShowApiKeyLogin(false);
    toast({
      title: 'Success',
      description: 'API key saved successfully',
    });
  };

  const handleApiKeyCancel = () => {
    setShowApiKeyLogin(false);
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      'Are you sure you want to logout?\n\nThis will clear your stored API key from local storage. You will need to enter it again to use AI-powered programs.'
    );

    if (confirmLogout) {
      apiKeyStorage.clear();
      setApiKey(null);
      toast({
        title: 'Logged out',
        description: 'Your API key has been cleared from local storage',
      });
    }
  };

  const openNotepad = () => {
    // Create a custom password dialog
    const passwordDialog = document.createElement('div');
    passwordDialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #ECE9D8;
      border: 3px solid;
      border-color: #FFFFFF #808080 #808080 #FFFFFF;
      padding: 8px;
      z-index: 10000;
      font-family: 'Tahoma', sans-serif;
      box-shadow: 2px 2px 5px rgba(0,0,0,0.3);
    `;
    
    passwordDialog.innerHTML = `
      <div style="background: #0054E3; color: white; padding: 3px 5px; margin: -8px -8px 8px -8px; font-weight: bold; font-size: 11px;">
        Enter Password
      </div>
      <div style="padding: 10px; font-size: 11px;">
        <div style="margin-bottom: 8px;">Enter password to access Notepad:</div>
        <input type="password" id="notepad-password" style="width: 100%; padding: 3px; border: 1px solid #7F9DB9; font-size: 11px; margin-bottom: 10px;" />
        <div style="text-align: right;">
          <button id="password-ok" style="background: #ECE9D8; border: 1px solid; border-color: #FFFFFF #808080 #808080 #FFFFFF; padding: 3px 12px; margin-right: 5px; font-size: 11px; cursor: pointer;">OK</button>
          <button id="password-cancel" style="background: #ECE9D8; border: 1px solid; border-color: #FFFFFF #808080 #808080 #FFFFFF; padding: 3px 12px; font-size: 11px; cursor: pointer;">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(passwordDialog);
    
    const input = document.getElementById('notepad-password') as HTMLInputElement;
    const okBtn = document.getElementById('password-ok');
    const cancelBtn = document.getElementById('password-cancel');
    
    input.focus();
    
    const handleSubmit = () => {
      const password = input.value;
      document.body.removeChild(passwordDialog);

      if (password) {
        setValidatedPassword(password);
        openWindow(`Untitled - Notepad`, <Notepad password={password} />, <FileText className="w-4 h-4" />);
      }
    };
    
    okBtn?.addEventListener('click', handleSubmit);
    cancelBtn?.addEventListener('click', () => document.body.removeChild(passwordDialog));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleSubmit();
      if (e.key === 'Escape') document.body.removeChild(passwordDialog);
    });
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (showApiKeyLogin) {
    return <ApiKeyLogin onLogin={handleApiKeyLogin} onCancel={handleApiKeyCancel} />;
  }

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      style={{
        backgroundImage: theme === 'xp' ? `url(${blissWallpaper})` : `url(${kaliWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
    >
      {/* Desktop Icons */}
      {!iconsLoading && (
        <>
          {desktopIcons.map((icon) => {
            const displayLabel = icon.icon_type === 'theme'
              ? (theme === 'xp' ? 'Kali Linux Display' : 'Windows Display')
              : icon.name;

            const displayDescription = icon.icon_type === 'theme'
              ? (theme === 'xp' ? 'Switch to Kali Linux theme' : 'Switch to Windows XP theme')
              : icon.description;

            const displayIcon = icon.icon_type === 'theme'
              ? (theme === 'xp' ? '🐉' : '🖥️')
              : icon.icon;

            return (
              <DesktopIcon
                key={icon.id}
                icon={getIconComponent(displayIcon)}
                label={displayLabel}
                onClick={() => handleIconClick(icon)}
                position={isMobile
                  ? { x: icon.position_x_mobile || icon.position_x, y: icon.position_y_mobile || icon.position_y }
                  : { x: icon.position_x, y: icon.position_y }
                }
                description={displayDescription}
              />
            );
          })}
        </>
      )}

      {/* Open Windows */}
      {windows
        .filter((w) => !w.minimized)
        .map((window, index) => (
          <Window
            key={window.id}
            title={window.title}
            onClose={() => closeWindow(window.id)}
            onMinimize={() => minimizeWindow(window.id)}
            initialPosition={{ x: 150 + index * 30, y: 80 + index * 30 }}
            icon={window.icon}
            active={window.active}
            onFocus={() => focusWindow(window.id)}
          >
            {window.content}
          </Window>
        ))}

      {/* Start Menu */}
      {showStartMenu && (
        <StartMenu
          onClose={() => setShowStartMenu(false)}
          onProgramClick={(program) => {
            const iconData = desktopIcons.find(icon => icon.name === program.name && icon.icon_type === 'program');
            if (iconData) {
              handleIconClick(iconData);
            } else {
              openProgram(program);
            }
          }}
          onNotepadClick={openNotepad}
          onInfoClick={(title, content) => openWindow(title, content)}
          theme={theme}
          onThemeToggle={switchTheme}
          onLogout={handleLogout}
          hasApiKey={apiKey !== null}
          programs={desktopIcons
            .filter(icon => icon.icon_type === 'program')
            .map(icon => ({
              name: icon.name,
              url: icon.url || '',
              icon: icon.icon,
              description: icon.description
            }))
          }
        />
      )}

      {/* Taskbar */}
      <Taskbar
        onStartClick={() => setShowStartMenu(!showStartMenu)}
        windows={windows.map((w) => ({
          id: w.id,
          title: w.title,
          active: w.active,
        }))}
        onWindowClick={focusWindow}
        theme={theme}
      />

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-background border-2 shadow-lg z-50 min-w-[200px] py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            borderColor: theme === 'kali' ? 'hsl(var(--kali-border))' : 'hsl(var(--border))',
            background: theme === 'kali' ? 'hsl(var(--kali-menu-bg))' : 'hsl(var(--menu-bg))',
          }}
        >
          <button
            onClick={switchTheme}
            className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors"
            style={{
              color: theme === 'kali' ? 'hsl(var(--kali-foreground))' : 'hsl(var(--foreground))',
            }}
          >
            Switch to {theme === 'xp' ? 'Kali Desktop' : 'Windows XP Desktop'}
          </button>
        </div>
      )}
    </div>
  );
};

export default Index;
