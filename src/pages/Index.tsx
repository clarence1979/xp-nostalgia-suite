import { useState, useEffect } from 'react';
import { Window } from '@/components/Window';
import { StartMenu } from '@/components/StartMenu';
import { Taskbar } from '@/components/Taskbar';
import { DesktopIcon } from '@/components/DesktopIcon';
import { Notepad } from '@/components/Notepad';
import { Browser } from '@/components/Browser';
import { LoadingScreen } from '@/components/LoadingScreen';
import blissWallpaper from '@/assets/bliss-wallpaper.jpg';
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
}

const allPrograms: Program[] = [
  // General Tools
  { name: 'AI Note Taker', url: 'https://ai-note-taker-app-1476.bolt.host', icon: '📝' },
  { name: 'Tool Hub', url: 'https://comprehensive-online-921b.bolt.host/', icon: '🔧' },
  // Teacher Tools
  { name: 'Magic Marker', url: 'https://mark-magic-ai.lovable.app/', icon: '✨' },
  { name: 'Teacher Scheduler', url: 'https://teacher-scheduler-ai-bb0t.bolt.host', icon: '📅' },
  { name: 'Student Emotion Recognition', url: 'https://clarence.guru/emo4.html', icon: '😊' },
  // Secondary School Subjects
  { name: 'Pantry Chef', url: 'https://pantrychef-ai-recipe-7nfz.bolt.host/', icon: '👨‍🍳' },
  { name: 'History', url: 'https://historical-figure-ai-p08i.bolt.host', icon: '🎭' },
  { name: 'Drone Programming', url: 'https://tello-drone-voice-te-r9q2.bolt.host', icon: '🚁' },
  { name: 'AUSLAN', url: 'https://auslan-vision-learn-knpa.bolt.host', icon: '👋' },
  { name: 'Voice to 3D Printing', url: 'https://voice-to-3d-print-ap-9f4m.bolt.host/', icon: '🖨️' },
  { name: 'Network Route Tracer', url: 'https://network-route-tracer-r2zo.bolt.host/', icon: '🌐' },
  { name: 'Physics Simulator', url: 'https://interactive-3d-physi-3mdg.bolt.host', icon: '⚛️' },
  { name: 'Tutoring Chatbot', url: 'https://new-chat-kb4v.bolt.host/', icon: '🤖' },
  { name: 'Math Genius', url: 'https://advanced-adaptive-ma-gtky.bolt.host/', icon: '🔢' },
  { name: 'Code Class', url: 'https://new-chat-oj8v.bolt.host', icon: '💻' },
  // Primary School
  { name: 'Dream Tales', url: 'https://dreamtales-ai-bedtim-jxhc.bolt.host', icon: '📚' },
  // Classic Display
  { name: 'Classic Display', url: 'https://ba45d991-19a1-476a-891f-59137477946c.lovable.app/', icon: '🖥️' },
];

const Index = () => {
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [nextWindowId, setNextWindowId] = useState(1);
  const [validatedPassword, setValidatedPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMobile = useIsMobile();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

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
        backgroundImage: `url(${blissWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
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
        {allPrograms.map((program, index) => {
          const col = Math.floor(index / 6); // Changed from 8 to 6 rows
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
      />
    </div>
  );
};

export default Index;
