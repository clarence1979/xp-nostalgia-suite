import { useState } from 'react';
import { Window } from '@/components/Window';
import { StartMenu } from '@/components/StartMenu';
import { Taskbar } from '@/components/Taskbar';
import { DesktopIcon } from '@/components/DesktopIcon';
import { Notepad } from '@/components/Notepad';
import blissWallpaper from '@/assets/bliss-wallpaper.jpg';
import { HardDrive, Folder, Trash2, Globe, FileText } from 'lucide-react';

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
  icon: React.ReactNode;
}

const Index = () => {
  const [showStartMenu, setShowStartMenu] = useState(false);
  const [windows, setWindows] = useState<OpenWindow[]>([]);
  const [nextWindowId, setNextWindowId] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  useState(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });

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
      />,
      <span className="text-base">{program.icon}</span>
    );
  };

  const openNotepad = () => {
    openWindow('Untitled - Notepad', <Notepad />, <FileText className="w-4 h-4" />);
  };

  return (
    <div
      className="w-screen h-screen relative overflow-hidden"
      style={{
        backgroundImage: `url(${blissWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Desktop Icons - hide on mobile */}
      {!isMobile && (
        <>
          <DesktopIcon
            icon={<HardDrive className="w-10 h-10 text-gray-300" />}
            label="My Computer"
            onClick={() => openWindow('My Computer', <div className="p-4">My Computer</div>, <HardDrive className="w-4 h-4" />)}
            position={{ x: 20, y: 20 }}
          />
          <DesktopIcon
            icon={<Folder className="w-10 h-10 text-yellow-300" />}
            label="My Documents"
            onClick={() => openWindow('My Documents', <div className="p-4">My Documents</div>, <Folder className="w-4 h-4" />)}
            position={{ x: 20, y: 120 }}
          />
          <DesktopIcon
            icon={<Trash2 className="w-10 h-10 text-gray-300" />}
            label="Recycle Bin"
            onClick={() => openWindow('Recycle Bin', <div className="p-4">Recycle Bin is empty</div>, <Trash2 className="w-4 h-4" />)}
            position={{ x: 20, y: 220 }}
          />
          <DesktopIcon
            icon={<Globe className="w-10 h-10 text-blue-400" />}
            label="Internet Explorer"
            onClick={() => openWindow('Internet Explorer', <div className="p-4">Internet Explorer</div>, <Globe className="w-4 h-4" />)}
            position={{ x: 20, y: 320 }}
          />
          <DesktopIcon
            icon={<FileText className="w-10 h-10 text-blue-300" />}
            label="Notepad"
            onClick={openNotepad}
            position={{ x: 20, y: 420 }}
          />
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
