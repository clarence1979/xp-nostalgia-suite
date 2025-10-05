import { useState } from 'react';
import { User, Folder, HardDrive, Globe, Settings, HelpCircle, Search, Terminal, LogOut, Power, ChevronRight } from 'lucide-react';

interface Program {
  name: string;
  url: string;
  icon: string;
}

interface Category {
  name: string;
  icon: string;
  programs: Program[];
}

interface StartMenuProps {
  onClose: () => void;
  onProgramClick: (program: Program) => void;
  onNotepadClick: () => void;
}

const categories: Category[] = [
  {
    name: 'General Tools',
    icon: '🛠️',
    programs: [
      { name: 'AI Note Taker', url: 'https://ai-note-taker-app-1476.bolt.host', icon: '📝' },
      { name: 'Tool Hub', url: 'https://comprehensive-online-921b.bolt.host/', icon: '🔧' },
    ]
  },
  {
    name: 'Teacher Tools',
    icon: '👨‍🏫',
    programs: [
      { name: 'Magic Marker', url: 'https://mark-magic-ai.lovable.app/', icon: '✨' },
      { name: 'Teacher Scheduler', url: 'https://teacher-scheduler-ai-bb0t.bolt.host', icon: '📅' },
      { name: 'Student Emotion Recognition', url: 'https://clarence.guru/emo4.html', icon: '😊' },
    ]
  },
  {
    name: 'Secondary School Subjects',
    icon: '🎓',
    programs: [
      { name: 'History', url: 'https://historical-figure-ai-p08i.bolt.host', icon: '🎭' },
      { name: 'Drone Programming', url: 'https://tello-drone-voice-te-r9q2.bolt.host', icon: '🚁' },
      { name: 'AUSLAN', url: 'https://auslan-gesture-recog-g78u.bolt.host', icon: '👋' },
      { name: 'Voice to 3D Printing', url: 'https://voice-to-3d-print-ap-9f4m.bolt.host/', icon: '🖨️' },
      { name: 'Network Route Tracer', url: 'https://network-route-tracer-r2zo.bolt.host/', icon: '🌐' },
      { name: 'Physics Simulator', url: 'https://interactive-3d-physi-3mdg.bolt.host', icon: '⚛️' },
      { name: 'Tutoring Chatbot', url: 'https://educational-chatbot-vtkh.bolt.host/', icon: '🤖' },
      { name: 'Math Genius', url: 'https://advanced-adaptive-ma-gtky.bolt.host/', icon: '🔢' },
    ]
  },
  {
    name: 'Primary School',
    icon: '🏫',
    programs: [
      { name: 'Dream Tales', url: 'https://dreamtales-ai-bedtim-jxhc.bolt.host', icon: '📚' },
    ]
  },
];

export const StartMenu = ({ onClose, onProgramClick, onNotepadClick }: StartMenuProps) => {
  const [showPrograms, setShowPrograms] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className="fixed bottom-[40px] left-0 w-[320px] bg-white border-2 border-[hsl(var(--window-border))] shadow-lg z-50 rounded-tr-lg overflow-hidden">
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
          >
            <Folder className="w-5 h-5" />
            <span className="flex-1 text-sm">All Programs</span>
            <ChevronRight className="w-4 h-4" />
              
            {showPrograms && (
              <div 
                className="fixed left-[320px] bottom-[40px] w-[300px] bg-white border-2 border-[hsl(var(--window-border))] shadow-lg max-h-[calc(100vh-100px)] overflow-y-auto z-50"
                onMouseLeave={() => {
                  setShowPrograms(false);
                  setHoveredCategory(null);
                }}
              >
                <div className="py-1">
                  {categories.map((category) => (
                    <div
                      key={category.name}
                      className="xp-menu-item whitespace-nowrap relative"
                      onMouseEnter={() => setHoveredCategory(category.name)}
                    >
                      <span className="text-xl">{category.icon}</span>
                      <span className="text-sm flex-1">{category.name}</span>
                      <ChevronRight className="w-4 h-4" />
                        
                      {hoveredCategory === category.name && (
                        <div 
                          className="fixed left-[620px] bottom-[40px] w-[280px] bg-white border-2 border-[hsl(var(--window-border))] shadow-lg max-h-[calc(100vh-100px)] overflow-y-auto z-50"
                          onMouseLeave={() => setHoveredCategory(null)}
                        >
                          <div className="py-1">
                            {category.programs.map((program) => (
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
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          <div
            className="xp-menu-item"
            onClick={() => {
              onProgramClick({ name: 'Classic Display', url: 'https://ba45d991-19a1-476a-891f-59137477946c.lovable.app/', icon: '🖥️' });
              onClose();
            }}
          >
            <span className="text-xl">🖥️</span>
            <span className="text-sm">Classic Display</span>
          </div>
          
          <div className="border-t border-gray-200 my-2" />
          
          <div className="xp-menu-item">
            <Folder className="w-5 h-5" />
            <span className="text-sm">My Documents</span>
          </div>
          <div className="xp-menu-item">
            <HardDrive className="w-5 h-5" />
            <span className="text-sm">My Computer</span>
          </div>
          <div className="xp-menu-item">
            <Globe className="w-5 h-5" />
            <span className="text-sm">My Network</span>
          </div>
          
          <div className="border-t border-gray-200 my-2" />
          
          <div className="xp-menu-item">
            <Settings className="w-5 h-5" />
            <span className="text-sm">Control Panel</span>
          </div>
          <div className="xp-menu-item">
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm">Help</span>
          </div>
          <div className="xp-menu-item">
            <Search className="w-5 h-5" />
            <span className="text-sm">Search</span>
          </div>
          <div className="xp-menu-item">
            <Terminal className="w-5 h-5" />
            <span className="text-sm">Run...</span>
          </div>
          
          <div className="border-t border-gray-200 my-2" />
          
          <div className="xp-menu-item">
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Log Off</span>
          </div>
          <div className="xp-menu-item">
            <Power className="w-5 h-5" />
            <span className="text-sm">Turn Off</span>
          </div>
        </div>

      </div>
    </>
  );
};
