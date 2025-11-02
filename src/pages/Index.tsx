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
import { useIsMobile, useIsLandscape } from '@/hooks/use-mobile';
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
  category?: string;
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
  const isLandscape = useIsLandscape();
  const { toast } = useToast();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      const savedApiKey = apiKeyStorage.get();
      if (savedApiKey) {
        setApiKey(savedApiKey);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'REQUEST_API_KEY') {
        const apiKey = apiKeyStorage.get();
        if (apiKey && event.source) {
          (event.source as WindowProxy).postMessage(
            { type: 'API_KEY_RESPONSE', apiKey },
            '*'
          );
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const hardcodedIcons: DesktopIconData[] = [
      { id: '1', name: 'My Computer', icon: 'HardDrive', description: 'System computer information', url: null, icon_type: 'system', position_x: 20, position_y: 20, position_x_mobile: 10, position_y_mobile: 10, category: null, open_behavior: 'special', sort_order: 1 },
      { id: '2', name: 'My Documents', icon: 'Folder', description: 'Personal documents folder', url: null, icon_type: 'system', position_x: 20, position_y: 120, position_x_mobile: 10, position_y_mobile: 90, category: null, open_behavior: 'special', sort_order: 2 },
      { id: '3', name: 'Recycle Bin', icon: 'Trash2', description: 'Deleted files storage', url: null, icon_type: 'system', position_x: 20, position_y: 220, position_x_mobile: 10, position_y_mobile: 170, category: null, open_behavior: 'special', sort_order: 3 },
      { id: '4', name: 'Internet Explorer', icon: 'Globe', description: 'Web browser', url: null, icon_type: 'system', position_x: 20, position_y: 320, position_x_mobile: 10, position_y_mobile: 250, category: null, open_behavior: 'special', sort_order: 4 },
      { id: '5', name: 'Notepad', icon: 'FileText', description: 'Text editor with password protection', url: null, icon_type: 'system', position_x: 20, position_y: 420, position_x_mobile: 10, position_y_mobile: 330, category: null, open_behavior: 'special', sort_order: 5 },
      { id: '6', name: 'Visual Studio Code', icon: 'Code', description: 'Professional code editor', url: 'https://vscode.dev/', icon_type: 'system', position_x: 20, position_y: 520, position_x_mobile: 10, position_y_mobile: 410, category: null, open_behavior: 'new_tab', sort_order: 6 },
      { id: '7', name: 'AI Note Taker', icon: '📝', description: 'Takes dictation notes up to 45 minutes and generates study notes in PDF, customized to suit age range of audience', url: 'https://note.bolt.host', icon_type: 'program', position_x: 140, position_y: 20, position_x_mobile: 95, position_y_mobile: 10, category: 'general', open_behavior: 'window', sort_order: 100 },
      { id: '8', name: 'Magic Marker', icon: '✨', description: 'Allows teachers to upload student assessments (hand-written or digital) and mark it either with a preset marking scheme or generated one. Gives constructive feedback in PDF', url: 'https://magicmarker.bolt.host', icon_type: 'program', position_x: 140, position_y: 120, position_x_mobile: 95, position_y_mobile: 90, category: 'teacher', open_behavior: 'window', sort_order: 200 },
      { id: '9', name: 'Student Emotion Recognition', icon: '😊', description: 'Helps recognise student emotions to determine if they are concentrating', url: 'https://clarence.guru/emo4.html', icon_type: 'program', position_x: 140, position_y: 220, position_x_mobile: 95, position_y_mobile: 170, category: 'teacher', open_behavior: 'window', sort_order: 202 },
      { id: '10', name: 'Pantry Chef', icon: '👨‍🍳', description: 'Suggests food that you can cook based on what is available in your pantry. Also gives steps and has a grocery list. The Food scientist analyses existing dishes and tells you how to make them.', url: 'https://chef.bolt.host', icon_type: 'program', position_x: 140, position_y: 320, position_x_mobile: 95, position_y_mobile: 250, category: 'secondary', open_behavior: 'window', sort_order: 300 },
      { id: '11', name: 'Drone Programming', icon: '🚁', description: 'Flies the Tello Drone via Scratch Blocks, Python and natural speech (voice and typed text)', url: 'https://drone.teachingtools.dev/', icon_type: 'program', position_x: 140, position_y: 420, position_x_mobile: 95, position_y_mobile: 330, category: 'secondary', open_behavior: 'new_tab', sort_order: 302 },
      { id: '12', name: 'Voice to 3D Printing', icon: '🖨️', description: 'Inputs voice or text to generate an STL for 3D printing', url: 'https://print3d.bolt.host', icon_type: 'program', position_x: 140, position_y: 520, position_x_mobile: 95, position_y_mobile: 410, category: 'secondary', open_behavior: 'window', sort_order: 304 },
      { id: '13', name: 'Tool Hub', icon: '🔧', description: 'Various Tools for File manipulation', url: 'https://tools.bolt.host', icon_type: 'program', position_x: 240, position_y: 20, position_x_mobile: 180, position_y_mobile: 10, category: 'general', open_behavior: 'window', sort_order: 101 },
      { id: '14', name: 'Teacher Scheduler', icon: '📅', description: 'Helps teachers stay organised by using AI Agents (Beta)', url: 'https://teacher.bolt.host', icon_type: 'program', position_x: 240, position_y: 120, position_x_mobile: 180, position_y_mobile: 90, category: 'teacher', open_behavior: 'window', sort_order: 201 },
      { id: '15', name: 'Quiz Master Pro', icon: '📋', description: 'Enables teachers to create Quizzes from uploaded PDF, Word or pictures and auto-generate answers. Lockdown mode will be enabled for students to take the quiz. Results are instantly available.', url: 'https://quizpro.bolt.host', icon_type: 'program', position_x: 240, position_y: 220, position_x_mobile: 180, position_y_mobile: 170, category: 'teacher', open_behavior: 'window', sort_order: 203 },
      { id: '16', name: 'History', icon: '🎭', description: 'Talk to your favorite historical character. You can upload information or allow it to research information about the character of your choice.', url: 'https://history.bolt.host', icon_type: 'program', position_x: 240, position_y: 320, position_x_mobile: 180, position_y_mobile: 250, category: 'secondary', open_behavior: 'window', sort_order: 301 },
      { id: '17', name: 'AUSLAN', icon: '👋', description: 'Australian Sign Language Learning Program', url: 'https://auslan.bolt.host', icon_type: 'program', position_x: 240, position_y: 420, position_x_mobile: 180, position_y_mobile: 330, category: 'secondary', open_behavior: 'window', sort_order: 303 },
      { id: '18', name: 'Network Route Tracer', icon: '🌐', description: 'Determines where you are, and does a trace to the target website from your location. Teaches you how the internet works.', url: 'https://network.bolt.host', icon_type: 'program', position_x: 240, position_y: 520, position_x_mobile: 180, position_y_mobile: 410, category: 'secondary', open_behavior: 'window', sort_order: 305 },
      { id: '19', name: 'Physics Simulator', icon: '⚛️', description: 'Simulates movements of balls and other objects and draws graphs to explain concepts in physics.', url: 'https://physics.bolt.host/', icon_type: 'program', position_x: 340, position_y: 20, position_x_mobile: 265, position_y_mobile: 10, category: 'secondary', open_behavior: 'window', sort_order: 306 },
      { id: '20', name: 'Tutoring Chatbot', icon: '🤖', description: 'Students can ask any questions about academic subjects.', url: 'https://tutor.bolt.host', icon_type: 'program', position_x: 340, position_y: 120, position_x_mobile: 265, position_y_mobile: 90, category: 'secondary', open_behavior: 'window', sort_order: 307 },
      { id: '21', name: 'Math Genius', icon: '🔢', description: 'Allow students from Years 7-10 to learn Maths using AI. Customises questions based on student interest and ability.', url: 'https://math.bolt.host', icon_type: 'program', position_x: 340, position_y: 220, position_x_mobile: 265, position_y_mobile: 170, category: 'secondary', open_behavior: 'window', sort_order: 308 },
      { id: '22', name: 'Code Class', icon: '💻', description: 'Teaches Coding - teachers can assign coding homework from here.', url: 'https://codeclass.bolt.host', icon_type: 'program', position_x: 340, position_y: 320, position_x_mobile: 265, position_y_mobile: 250, category: 'secondary', open_behavior: 'window', sort_order: 309 },
      { id: '23', name: 'Dream Tales', icon: '📚', description: 'Generates unique stories every time using the age, gender and interest of the child using AI.', url: 'https://dreamtales.bolt.host', icon_type: 'program', position_x: 340, position_y: 420, position_x_mobile: 265, position_y_mobile: 330, category: 'primary', open_behavior: 'window', sort_order: 400 },
      { id: '24', name: 'MP3 Player', icon: '🎵', description: 'Play your favorite music', url: 'https://mp3.bolt.host/', icon_type: 'program', position_x: 340, position_y: 520, position_x_mobile: 265, position_y_mobile: 410, category: 'primary', open_behavior: 'window', sort_order: 401 },
      { id: '25', name: 'Kali Linux Display', icon: '🐉', description: 'Switch to Kali Linux theme', url: null, icon_type: 'theme', position_x: 440, position_y: 20, position_x_mobile: 10, position_y_mobile: 490, category: null, open_behavior: 'special', sort_order: 310 },
      { id: '26', name: 'Code Blocks', icon: '🐍', description: 'Learn Python programming through interactive 3D objects', url: 'https://codecraft.teachingtools.dev', icon_type: 'program', position_x: 440, position_y: 120, position_x_mobile: 95, position_y_mobile: 490, category: 'secondary', open_behavior: 'window', sort_order: 310 },
      { id: '27', name: 'Scientific Simulations for Math, Physics, Chemistry and Biology', icon: '🔬', description: 'Interactive simulations for science and math education', url: 'https://phet.colorado.edu/', icon_type: 'program', position_x: 440, position_y: 220, position_x_mobile: 180, position_y_mobile: 490, category: 'secondary', open_behavior: 'window', sort_order: 311 },
    ];

    setDesktopIcons(hardcodedIcons);
    setIconsLoading(false);
  }, []);

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
    const apiKey = apiKeyStorage.get();
    let urlWithApiKey = program.url;

    if (apiKey) {
      const url = new URL(program.url);
      url.searchParams.set('apiKey', apiKey);
      urlWithApiKey = url.toString();
    }

    const iframeRef = (iframe: HTMLIFrameElement | null) => {
      if (iframe && apiKey) {
        iframe.addEventListener('load', () => {
          setTimeout(() => {
            iframe.contentWindow?.postMessage(
              { type: 'API_KEY_RESPONSE', apiKey },
              '*'
            );
          }, 500);
        });
      }
    };

    openWindow(
      program.name,
      <iframe
        ref={iframeRef}
        src={urlWithApiKey}
        className="w-full h-full border-none"
        title={program.name}
        allow="*"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation"
        referrerPolicy="no-referrer-when-downgrade"
      />,
      <span className="text-base">{program.icon}</span>
    );
  };

  const handleIconClick = (icon: DesktopIconData) => {
    if (icon.open_behavior === 'special' && icon.icon_type === 'system') {
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
          if (icon.url) {
            window.open(icon.url, '_blank');
          }
          break;
      }
    } else if (icon.icon_type === 'theme') {
      switchTheme();
    } else if (icon.open_behavior === 'new_tab' && icon.url) {
      window.open(icon.url, '_blank');
    } else if (icon.open_behavior === 'window' && icon.url) {
      openProgram({
        name: icon.name,
        url: icon.url,
        icon: icon.icon,
        description: icon.description
      });
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

      // Notify all iframes to clear their API keys
      windows.forEach((win) => {
        const iframe = document.querySelector(`iframe[title="${win.title}"]`) as HTMLIFrameElement;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'CLEAR_API_KEY' }, '*');
        }
      });

      toast({
        title: 'Logged out',
        description: 'Your API key has been cleared from local storage',
      });
    }
  };

  const handleApiKeyIconClick = () => {
    if (apiKey) {
      handleLogout();
    } else {
      setShowApiKeyLogin(true);
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

            const getIconPosition = () => {
              if (!isMobile) {
                return { x: icon.position_x, y: icon.position_y };
              }

              if (isLandscape && isMobile) {
                const landscapePositions: Record<string, { x: number; y: number }> = {
                  '1': { x: 10, y: 10 },
                  '2': { x: 10, y: 90 },
                  '3': { x: 10, y: 170 },
                  '4': { x: 10, y: 250 },
                  '5': { x: 10, y: 330 },
                  '6': { x: 10, y: 410 },
                  '7': { x: 95, y: 10 },
                  '8': { x: 95, y: 90 },
                  '9': { x: 95, y: 170 },
                  '10': { x: 95, y: 250 },
                  '11': { x: 95, y: 330 },
                  '12': { x: 95, y: 410 },
                  '13': { x: 180, y: 10 },
                  '14': { x: 180, y: 90 },
                  '15': { x: 180, y: 170 },
                  '16': { x: 180, y: 250 },
                  '17': { x: 180, y: 330 },
                  '18': { x: 180, y: 410 },
                  '19': { x: 265, y: 10 },
                  '20': { x: 265, y: 90 },
                  '21': { x: 265, y: 170 },
                  '22': { x: 265, y: 250 },
                  '23': { x: 265, y: 330 },
                  '24': { x: 265, y: 410 },
                  '25': { x: 350, y: 10 },
                  '26': { x: 350, y: 90 },
                  '27': { x: 350, y: 170 },
                };
                return landscapePositions[icon.id] || { x: icon.position_x_mobile || icon.position_x, y: icon.position_y_mobile || icon.position_y };
              }

              return { x: icon.position_x_mobile || icon.position_x, y: icon.position_y_mobile || icon.position_y };
            };

            return (
              <DesktopIcon
                key={icon.id}
                icon={getIconComponent(displayIcon)}
                label={displayLabel}
                onClick={() => handleIconClick(icon)}
                position={getIconPosition()}
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
          onProgramClick={openProgram}
          onNotepadClick={openNotepad}
          onInfoClick={(title, content) => openWindow(title, content)}
          theme={theme}
          onThemeToggle={switchTheme}
          onLogout={handleLogout}
          hasApiKey={apiKey !== null}
          programs={desktopIcons
            .filter((icon) => icon.icon_type === 'program' && icon.url)
            .map((icon) => ({
              name: icon.name,
              url: icon.url!,
              icon: icon.icon,
              description: icon.description,
              category: icon.category || undefined
            }))}
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
        hasApiKey={apiKey !== null}
        onApiKeyClick={handleApiKeyIconClick}
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
