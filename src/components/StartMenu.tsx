import { useState } from 'react';
import { User, Folder, HardDrive, Globe, Settings, HelpCircle, Search, Terminal, LogOut, Power, ChevronRight } from 'lucide-react';

interface Program {
  name: string;
  url: string;
  icon: React.ReactNode;
}

interface StartMenuProps {
  onClose: () => void;
  onProgramClick: (program: Program) => void;
  onNotepadClick: () => void;
}

const programs: Program[] = [
  { name: 'AI Note Taker', url: 'https://ai-note-taker-app-1476.bolt.host', icon: '📝' },
  { name: 'Historical Figure Chat', url: 'https://historical-figure-ai-p08i.bolt.host', icon: '🎭' },
  { name: 'DreamTales Bedtime Stories', url: 'https://dreamtales-ai-bedtim-jxhc.bolt.host', icon: '📚' },
  { name: 'Tello Drone Voice Control', url: 'https://tello-drone-voice-te-r9q2.bolt.host', icon: '🚁' },
  { name: 'Auslan Gesture Recognition', url: 'https://auslan-gesture-recog-g78u.bolt.host', icon: '👋' },
  { name: 'Voice to 3D Print', url: 'https://voice-to-3d-print-ap-9f4m.bolt.host/', icon: '🖨️' },
  { name: 'Network Route Tracer', url: 'https://network-route-tracer-r2zo.bolt.host/', icon: '🌐' },
  { name: 'Interactive 3D Physics', url: 'https://interactive-3d-physi-3mdg.bolt.host', icon: '⚛️' },
  { name: 'Educational Chatbot', url: 'https://educational-chatbot-vtkh.bolt.host/', icon: '🤖' },
  { name: 'Adaptive Math Tutor', url: 'https://advanced-adaptive-ma-gtky.bolt.host/', icon: '🔢' },
  { name: 'Mark Magic AI', url: 'https://mark-magic-ai.lovable.app/', icon: '✨' },
  { name: 'Teacher Scheduler', url: 'https://teacher-scheduler-ai-bb0t.bolt.host', icon: '📅' },
];

export const StartMenu = ({ onClose, onProgramClick, onNotepadClick }: StartMenuProps) => {
  const [showPrograms, setShowPrograms] = useState(false);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed bottom-[40px] left-0 w-[800px] bg-white border-2 border-[hsl(var(--window-border))] shadow-lg z-50 flex rounded-tr-lg overflow-hidden">
        {/* Left side - white */}
        <div className="w-[30%] bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded bg-blue-500 flex items-center justify-center">
                <User className="w-8 h-8 text-white" />
              </div>
              <span className="font-bold text-sm">Administrator</span>
            </div>
          </div>
          <div className="py-2">
            <div
              className="xp-menu-item relative"
              onMouseEnter={() => setShowPrograms(true)}
              onMouseLeave={() => setShowPrograms(false)}
            >
              <Folder className="w-5 h-5" />
              <span className="flex-1 text-sm">All Programs</span>
              <ChevronRight className="w-4 h-4" />
              
              {showPrograms && (
                <div className="absolute left-full top-0 w-[500px] bg-white border-2 border-[hsl(var(--window-border))] shadow-lg ml-1">
                  <div className="py-1">
                    {programs.map((program) => (
                      <div
                        key={program.name}
                        className="xp-menu-item whitespace-nowrap"
                        onClick={() => {
                          onProgramClick(program);
                          onClose();
                        }}
                      >
                        <span className="text-xl">{program.icon}</span>
                        <span className="text-sm">{program.name}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-200 my-1" />
                    <div
                      className="xp-menu-item whitespace-nowrap"
                      onClick={() => {
                        onNotepadClick();
                        onClose();
                      }}
                    >
                      <span className="text-xl">📄</span>
                      <span className="text-sm">Notepad</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right side - blue gradient */}
        <div className="w-[70%] py-2" style={{ background: 'linear-gradient(180deg, hsl(210 89% 62%) 0%, hsl(215 100% 45%) 100%)' }}>
          <div className="xp-menu-item text-white hover:bg-white/20">
            <Folder className="w-5 h-5" />
            <span className="text-sm">My Documents</span>
          </div>
          <div className="xp-menu-item text-white hover:bg-white/20">
            <HardDrive className="w-5 h-5" />
            <span className="text-sm">My Computer</span>
          </div>
          <div className="xp-menu-item text-white hover:bg-white/20">
            <Globe className="w-5 h-5" />
            <span className="text-sm">My Network</span>
          </div>
          <div className="border-t border-white/30 my-2" />
          <div className="xp-menu-item text-white hover:bg-white/20">
            <Settings className="w-5 h-5" />
            <span className="text-sm">Control Panel</span>
          </div>
          <div className="xp-menu-item text-white hover:bg-white/20">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm">Help</span>
          </div>
          <div className="xp-menu-item text-white hover:bg-white/20">
            <Search className="w-5 h-5" />
            <span className="text-sm">Search</span>
          </div>
          <div className="xp-menu-item text-white hover:bg-white/20">
            <Terminal className="w-5 h-5" />
            <span className="text-sm">Run...</span>
          </div>
          <div className="border-t border-white/30 my-2" />
          <div className="xp-menu-item text-white hover:bg-white/20">
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Log Off</span>
          </div>
          <div className="xp-menu-item text-white hover:bg-white/20">
            <Power className="w-5 h-5" />
            <span className="text-sm">Turn Off</span>
          </div>
        </div>
      </div>
    </>
  );
};
