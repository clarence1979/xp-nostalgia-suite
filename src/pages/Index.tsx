import { useState, useEffect } from 'react';
import { Window } from '@/components/Window';
import { StartMenu } from '@/components/StartMenu';
import { Taskbar } from '@/components/Taskbar';
import { DesktopIcon } from '@/components/DesktopIcon';
import { Notepad } from '@/components/Notepad';
import { Browser } from '@/components/Browser';
import { LoadingScreen } from '@/components/LoadingScreen';
import blissWallpaper from '@/assets/bliss-wallpaper.jpg';
import kaliWallpaper from '@/assets/kali-wallpaper.jpg';
import { HardDrive, Folder, Trash2, Globe, FileText, Code } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface OpenWindow {
  id: string;
  title: string;
  content: React.ReactNode;
  active: boolean;
  minimized: boolean;
  icon?: React.ReactNode;
}

interface Program {
  name: string;
  url: string;
  icon: string;
  description: string;
}

const allPrograms: Program[] = [
  // General Tools
  { name: 'AI Note Taker', url: 'https://ai-note-taker-app-1476.bolt.host', icon: '📝', description: 'Takes dictation notes up to 45 minutes and generates study notes in PDF, customized to suit age range of audience' },
  { name: 'Tool Hub', url: 'https://tools.bolt.host', icon: '🔧', description: 'Various Tools for File manipulation' },
  // Teacher Tools
  { name: 'Magic Marker', url: 'https://magicmarker.bolt.host', icon: '✨', description: 'Allows teachers to upload student assessments (hand-written or digital) and mark it either with a preset marking scheme or generated one. Gives constructive feedback in PDF' },
  { name: 'Teacher Scheduler', url: 'https://teacher-scheduler-ai-bb0t.bolt.host', icon: '📅', description: 'Helps teachers stay organised by using AI Agents (Beta)' },
  { name: 'Student Emotion Recognition', url: 'https://clarence.guru/emo4.html', icon: '😊', description: 'Helps recognise student emotions to determine if they are concentrating' },
  { name: 'Quiz Master Pro', url: 'https://quizpro.bolt.host', icon: '📋', description: 'Enables teachers to create Quizzes from uploaded PDF, Word or pictures and auto-generate answers. Lockdown mode will be enabled for students to take the quiz. Results are instantly available.' },
  // Secondary School Subjects
  { name: 'Pantry Chef', url: 'https://chef.bolt.host/', icon: '👨‍🍳', description: 'Suggests food that you can cook based on what is available in your pantry. Also gives steps and has a grocery list. The Food scientist analyses existing dishes and tells you how to make them.' },
  { name: 'History', url: 'https://historical-figure-ai-p08i.bolt.host', icon: '🎭', description: 'Talk to your favorite historical character. You can upload information or allow it to research information about the character of your choice.' },
  { name: 'Drone Programming', url: 'https://drone.teachingtools.dev/', icon: '🚁', description: 'Flies the Tello Drone via Scratch Blocks, Python and natural speech (voice and typed text)' },
  { name: 'AUSLAN', url: 'https://auslan.bolt.host', icon: '👋', description: 'Australian Sign Language Learning Program' },
  { name: 'Voice to 3D Printing', url: 'https://voice-to-3d-print-ap-9f4m.bolt.host/', icon: '🖨️', description: 'Inputs voice or text to generate an STL for 3D printing' },
  { name: 'Network Route Tracer', url: 'https://network-route-tracer-r2zo.bolt.host/', icon: '🌐', description: 'Determines where you are, and does a trace to the target website from your location. Teaches you how the internet works.' },
  { name: 'Physics Simulator', url: 'https://interactive-3d-physi-3mdg.bolt.host', icon: '⚛️', description: 'Simulates movements of balls and other objects and draws graphs to explain concepts in physics.' },
  { name: 'Tutoring Chatbot', url: 'https://new-chat-kb4v.bolt.host/', icon: '🤖', description: 'Students can ask any questions about academic subjects.' },
  { name: 'Math Genius', url: 'https://advanced-adaptive-ma-gtky.bolt.host/', icon: '🔢', description: 'Allow students from Years 7-10 to learn Maths using AI. Customises questions based on student interest and ability.' },
  { name: 'Code Class', url: 'https://new-chat-oj8v.bolt.host', icon: '💻', description: 'Teaches Coding - teachers can assign coding homework from here.' },
  // Primary School
  { name: 'Dream Tales', url: 'https://dreamtales-ai-bedtim-jxhc.bolt.host', icon: '📚', description: 'Generates unique stories every time using the age, gender and interest of the child using AI.' },
];

const Index = () => {
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [nextWindowId, setNextWindowId] = useState(1);
  const [validatedPassword, setValidatedPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState<'xp' | 'kali'>('xp');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
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
        if (password === 'PVCC123' || password === 'PVCC321') {
          setValidatedPassword(password);
          const accessType = password === 'PVCC321' ? 'Full Access' : 'View Only';
          openWindow(`Untitled - Notepad (${accessType})`, <Notepad password={password} />, <FileText className="w-4 h-4" />);
        } else {
          alert('Incorrect password. Access denied.');
        }
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
      <>
        {/* System Icons */}
        <DesktopIcon
          icon={<HardDrive className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-gray-300`} />}
          label="My Computer"
          onClick={() => openWindow('My Computer', <div className="p-4">My Computer</div>, <HardDrive className="w-4 h-4" />)}
          position={isMobile ? { x: 10, y: 10 } : { x: 20, y: 20 }}
        />
        <DesktopIcon
          icon={<Folder className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-yellow-300`} />}
          label="My Documents"
          onClick={() => openWindow('My Documents', <div className="p-4">My Documents</div>, <Folder className="w-4 h-4" />)}
          position={isMobile ? { x: 10, y: 90 } : { x: 20, y: 120 }}
        />
        <DesktopIcon
          icon={<Trash2 className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-gray-300`} />}
          label="Recycle Bin"
          onClick={() => openWindow('Recycle Bin', <div className="p-4">Recycle Bin is empty</div>, <Trash2 className="w-4 h-4" />)}
          position={isMobile ? { x: 10, y: 170 } : { x: 20, y: 220 }}
        />
        <DesktopIcon
          icon={<Globe className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-400`} />}
          label="Internet Explorer"
          onClick={() => openWindow('Internet Explorer', <Browser />, <Globe className="w-4 h-4" />)}
          position={isMobile ? { x: 10, y: 250 } : { x: 20, y: 320 }}
        />
        <DesktopIcon
          icon={<FileText className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-300`} />}
          label="Notepad"
          onClick={openNotepad}
          position={isMobile ? { x: 10, y: 330 } : { x: 20, y: 420 }}
        />
        <DesktopIcon
          icon={<Code className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-500`} />}
          label="Visual Studio Code"
          onClick={() => window.open('https://vscode.dev/', '_blank')}
          position={isMobile ? { x: 10, y: 410 } : { x: 20, y: 520 }}
        />
        
        {/* Program Icons in Grid - adjusted for better visibility */}
        <DesktopIcon
          icon={<span className={isMobile ? 'text-3xl' : 'text-4xl'}>{theme === 'xp' ? '🐉' : '🖥️'}</span>}
          label={theme === 'xp' ? 'Kali Linux Display' : 'Windows Display'}
          onClick={() => setTheme(theme === 'xp' ? 'kali' : 'xp')}
          position={isMobile ? { x: 10, y: 490 } : { x: 20, y: 620 }}
          description={theme === 'xp' ? 'Switch to Kali Linux theme' : 'Switch to Windows XP theme'}
        />

        {allPrograms.map((program, index) => {
          const col = Math.floor(index / 6);
          const row = index % 6;
          return (
            <DesktopIcon
              key={program.name}
              icon={<span className={isMobile ? 'text-3xl' : 'text-4xl'}>{program.icon}</span>}
              label={program.name}
              onClick={() => openProgram(program)}
              position={isMobile
                ? { x: 95 + col * 85, y: 10 + row * 80 }
                : { x: 140 + col * 100, y: 20 + row * 100 }
              }
              description={program.description}
            />
          );
        })}
      </>

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
