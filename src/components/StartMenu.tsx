import { useState } from 'react';
import { User, Folder, HardDrive, Globe, Settings, HelpCircle, Search, Terminal, LogOut, Power, ChevronRight, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Program {
  name: string;
  url: string;
  icon: string;
}

interface SubCategory {
  name: string;
  icon: string;
  programs: Program[];
}

interface Category {
  name: string;
  icon: string;
  programs?: Program[];
  subcategories?: SubCategory[];
}

interface StartMenuProps {
  onClose: () => void;
  onProgramClick: (program: Program) => void;
  onNotepadClick: () => void;
  onInfoClick: (title: string, content: React.ReactNode) => void;
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
    ]
  },
  {
    name: 'Primary School',
    icon: '🏫',
    programs: [
      { name: 'Dream Tales', url: 'https://dreamtales-ai-bedtim-jxhc.bolt.host', icon: '📚' },
    ]
  },
  {
    name: 'Shortcuts',
    icon: '🔗',
    subcategories: [
      {
        name: 'Games and Entertainment',
        icon: '🎮',
        programs: [
          { name: 'Lost Gamer', url: 'https://lostgamer.io', icon: '🎮' },
          { name: 'Classic Minecraft', url: 'https://classic.minecraft.net/', icon: '⛏️' },
        ]
      },
      {
        name: 'AI 2D Drawing Tools',
        icon: '✏️',
        programs: [
          { name: 'Auto Draw', url: 'https://autodraw.com', icon: '✏️' },
          { name: 'Quick Draw', url: 'https://quickdraw.withgoogle.com/', icon: '✍️' },
          { name: 'Sketches to Animations', url: 'https://sketch.metademolab.com/', icon: '🎨' },
          { name: 'Sketchpad', url: 'https://sketch.io/sketchpad/', icon: '🖌️' },
        ]
      },
      {
        name: '3D Drawing Tools',
        icon: '🎲',
        programs: [
          { name: 'Spline', url: 'https://app.spline.design/generate', icon: '🎲' },
          { name: 'Tinkercad', url: 'https://tinkercad.com', icon: '🔷' },
          { name: 'Poly Cam', url: 'https://poly.cam/tools/photogrammetry', icon: '📸' },
        ]
      },
      {
        name: 'Space Debris Visualisation',
        icon: '🛸',
        programs: [
          { name: 'Leo Labs', url: 'https://platform.leolabs.space/visualization', icon: '🛸' },
          { name: 'Stuff In Space', url: 'https://stuffin.space/', icon: '🌌' },
        ]
      },
      {
        name: 'Learn Coding',
        icon: '💻',
        programs: [
          { name: 'Code Wars', url: 'https://www.codewars.com/', icon: '⚔️' },
          { name: 'Coddy.tech', url: 'https://coddy.tech', icon: '💾' },
          { name: 'Code Craft', url: 'https://craft.buzzcoder.com/?lesson=python', icon: '🔨' },
          { name: 'Trinket', url: 'https://trinket.io', icon: '🔺' },
          { name: 'REPL', url: 'https://repl.it', icon: '⌨️' },
        ]
      },
      {
        name: 'Learn Hacking and Cybersecurity',
        icon: '🛡️',
        programs: [
          { name: 'Be Internet Awesome', url: 'https://beinternetawesome.withgoogle.com/en_au/interland/', icon: '🛡️' },
          { name: 'Phishing Quiz', url: 'https://phishingquiz.withgoogle.com/', icon: '🎣' },
          { name: 'Get Bad News', url: 'https://www.getbadnews.com/en/intro', icon: '📰' },
          { name: 'Lab Ex', url: 'https://labex.io/learn', icon: '🧪' },
          { name: 'K7 Cyber', url: 'https://kc7cyber.com/', icon: '🔐' },
          { name: 'Try Hack Me', url: 'https://tryhackme.com/', icon: '🎯' },
        ]
      },
      {
        name: 'General Productivity Tools',
        icon: '🔧',
        programs: [
          { name: 'Toy Maker', url: 'https://thetoymaker.com/', icon: '🧸' },
          { name: 'Home to Life', url: 'https://Home.by.me', icon: '🏠' },
        ]
      },
    ]
  },
];

import { PrivacyContent } from './legal/PrivacyContent';
import { TermsContent } from './legal/TermsContent';
import { AboutContent } from './legal/AboutContent';

export const StartMenu = ({ onClose, onProgramClick, onNotepadClick, onInfoClick }: StartMenuProps) => {
  const [showPrograms, setShowPrograms] = useState(false);
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [hoveredSubcategory, setHoveredSubcategory] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const [submenuTop, setSubmenuTop] = useState(0);
  const [categorySubmenuTop, setCategorySubmenuTop] = useState(0);
  const [subcategorySubmenuTop, setSubcategorySubmenuTop] = useState(0);

  const handleShowPrograms = () => {
    const element = document.getElementById('all-programs-item');
    if (element && !isMobile) {
      const rect = element.getBoundingClientRect();
      setSubmenuTop(rect.top);
    }
    setShowPrograms(true);
  };

  const handleSubcategoryHover = (subcategoryName: string, event: React.MouseEvent) => {
    if (!isMobile) {
      const rect = event.currentTarget.getBoundingClientRect();
      setSubcategorySubmenuTop(rect.top);
    }
    setHoveredSubcategory(subcategoryName);
  };

  const handleCategoryHover = (categoryName: string, event: React.MouseEvent) => {
    if (!isMobile) {
      const rect = event.currentTarget.getBoundingClientRect();
      setCategorySubmenuTop(rect.top);
    }
    setHoveredCategory(categoryName);
  };

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div className={`fixed ${isMobile ? 'inset-x-0 bottom-0 max-h-[85vh]' : 'bottom-[40px] left-0 w-[320px]'} bg-white ${isMobile ? 'border-t-2' : 'border-2'} border-[hsl(var(--window-border))] shadow-lg z-50 ${isMobile ? 'rounded-t-xl' : 'rounded-tr-lg'} flex flex-col`}>
        <div className={`${isMobile ? 'p-4' : 'p-4'} border-b border-gray-200 flex-shrink-0`}>
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'w-12 h-12' : 'w-12 h-12'} rounded bg-blue-500 flex items-center justify-center`}>
              <User className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'} text-white`} />
            </div>
            <span className={`font-bold ${isMobile ? 'text-lg' : 'text-sm'}`}>Teachingtools.dev</span>
          </div>
        </div>
        
        <div className={`py-2 overflow-y-auto flex-1 ${isMobile ? 'px-2' : ''}`}>
          <div
            className={`xp-menu-item ${isMobile ? 'text-base py-3' : ''}`}
            onClick={() => setShowPrograms(!showPrograms)}
            id="all-programs-item"
          >
            <Folder className={`${isMobile ? 'w-6 h-6' : 'w-5 h-5'}`} />
            <span className={`flex-1 ${isMobile ? 'text-base' : 'text-sm'}`}>All Programs</span>
            <ChevronRight className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${showPrograms ? 'rotate-90' : ''} transition-transform`} />
          </div>
              
          {showPrograms && (
            <div className={`${isMobile ? 'pl-4 pb-2' : 'fixed w-[300px] border-2'} bg-white ${isMobile ? '' : 'border-[hsl(var(--window-border))] shadow-lg'} ${isMobile ? 'max-h-none' : 'max-h-[calc(100vh-100px)]'} overflow-y-auto z-50`}
              style={!isMobile ? { left: '320px', top: `${submenuTop}px` } : undefined}
              onMouseLeave={() => !isMobile && (() => {
                setShowPrograms(false);
                setHoveredCategory(null);
                setHoveredSubcategory(null);
              })()}
            >
              <div className="py-1">
                {categories.map((category) => (
                  <div key={category.name}>
                    <div
                      className={`xp-menu-item ${isMobile ? 'text-base py-3' : 'whitespace-nowrap'} relative`}
                      onMouseEnter={(e) => !isMobile ? handleCategoryHover(category.name, e) : null}
                      onClick={() => setHoveredCategory(hoveredCategory === category.name ? null : category.name)}
                    >
                      <span className={isMobile ? 'text-2xl' : 'text-xl'}>{category.icon}</span>
                      <span className={`${isMobile ? 'text-base' : 'text-sm'} flex-1`}>{category.name}</span>
                      <ChevronRight className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${hoveredCategory === category.name ? 'rotate-90' : ''} transition-transform`} />
                    </div>
                        
                    {hoveredCategory === category.name && (
                      <div 
                        className={`${isMobile ? 'pl-6 pb-2 bg-gray-50' : 'fixed w-[280px] border-2'} bg-white ${isMobile ? '' : 'border-[hsl(var(--window-border))] shadow-lg'} ${isMobile ? 'max-h-none' : 'max-h-[400px]'} overflow-y-auto z-50`}
                        style={!isMobile ? { left: '620px', top: `${categorySubmenuTop}px` } : undefined}
                        onMouseLeave={() => !isMobile && setHoveredCategory(null)}
                      >
                        <div className="py-1">
                          {category.subcategories ? (
                            // Render subcategories
                            category.subcategories.map((subcategory) => (
                              <div key={subcategory.name}>
                                <div
                                  className={`xp-menu-item ${isMobile ? 'text-base py-3' : 'whitespace-nowrap'} relative`}
                                  onMouseEnter={(e) => !isMobile ? handleSubcategoryHover(subcategory.name, e) : null}
                                  onClick={() => setHoveredSubcategory(hoveredSubcategory === subcategory.name ? null : subcategory.name)}
                                >
                                  <span className={isMobile ? 'text-2xl' : 'text-xl'}>{subcategory.icon}</span>
                                  <span className={`${isMobile ? 'text-base' : 'text-sm'} flex-1`}>{subcategory.name}</span>
                                  <ChevronRight className={`${isMobile ? 'w-5 h-5' : 'w-4 h-4'} ${hoveredSubcategory === subcategory.name ? 'rotate-90' : ''} transition-transform`} />
                                </div>
                                
                                {hoveredSubcategory === subcategory.name && (
                                  <div 
                                    className={`${isMobile ? 'pl-6 pb-2 bg-gray-100' : 'fixed w-[280px] border-2'} bg-white ${isMobile ? '' : 'border-[hsl(var(--window-border))] shadow-lg'} ${isMobile ? 'max-h-none' : 'max-h-[400px]'} overflow-y-auto z-50`}
                                    style={!isMobile ? { left: '900px', top: `${subcategorySubmenuTop}px` } : undefined}
                                    onMouseLeave={() => !isMobile && setHoveredSubcategory(null)}
                                  >
                                    <div className="py-1">
                                      {subcategory.programs.map((program) => (
                                        <div
                                          key={program.name}
                                          className={`xp-menu-item ${isMobile ? 'text-base py-3 whitespace-normal' : 'whitespace-nowrap'}`}
                                          onClick={() => {
                                            onProgramClick(program);
                                            onClose();
                                          }}
                                        >
                                          <span className={isMobile ? 'text-2xl' : 'text-xl'}>{program.icon}</span>
                                          <span className={isMobile ? 'text-base' : 'text-sm'}>{program.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            // Render programs directly (for categories without subcategories)
                            category.programs?.map((program) => (
                              <div
                                key={program.name}
                                className={`xp-menu-item ${isMobile ? 'text-base py-3 whitespace-normal' : 'whitespace-nowrap'}`}
                                onClick={() => {
                                  onProgramClick(program);
                                  onClose();
                                }}
                              >
                                <span className={isMobile ? 'text-2xl' : 'text-xl'}>{program.icon}</span>
                                <span className={isMobile ? 'text-base' : 'text-sm'}>{program.name}</span>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
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
          
          <div className="border-t border-gray-200 my-2" />
          
          <div 
            className="xp-menu-item"
            onClick={() => {
              onInfoClick('Privacy Policy', <PrivacyContent />);
              onClose();
            }}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm">Privacy Policy</span>
          </div>
          <div 
            className="xp-menu-item"
            onClick={() => {
              onInfoClick('Terms of Use', <TermsContent />);
              onClose();
            }}
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm">Terms of Use</span>
          </div>
          <div 
            className="xp-menu-item"
            onClick={() => {
              onInfoClick('About Teachingtools.dev', <AboutContent />);
              onClose();
            }}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm">About</span>
          </div>
        </div>

      </div>
    </>
  );
};
