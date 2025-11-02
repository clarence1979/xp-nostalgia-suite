import { useState } from 'react';
import { User, Folder, HardDrive, Globe, Settings, CircleHelp as HelpCircle, Terminal, LogOut, Power, ChevronRight, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface Program {
  name: string;
  url: string;
  icon: string;
  description?: string;
  category?: string;
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
  theme: 'xp' | 'kali';
  onThemeToggle: () => void;
  programs?: Program[];
  onLogout?: () => void;
  hasApiKey?: boolean;
}

const categories: Category[] = [
  {
    name: 'General Tools',
    icon: '🛠️',
    programs: [
      { name: 'AI Note Taker', url: 'https://note.bolt.host', icon: '📝' },
      { name: 'Tool Hub', url: 'https://tools.bolt.host', icon: '🔧' },
    ]
  },
  {
    name: 'Teacher Tools',
    icon: '👨‍🏫',
    programs: [
      { name: 'Magic Marker', url: 'https://magicmarker.bolt.host', icon: '✨' },
      { name: 'Teacher Scheduler', url: 'https://teacher.bolt.host', icon: '📅' },
      { name: 'Student Emotion Recognition', url: 'https://clarence.guru/emo4.html', icon: '😊' },
      { name: 'Quiz Master Pro', url: 'https://quizpro.bolt.host', icon: '📋' },
      { name: 'Class Tools', url: 'https://www.classtools.net/', icon: '🎯' },
    ]
  },
  {
    name: 'Secondary School Subjects',
    icon: '🎓',
    programs: [
      { name: 'Pantry Chef', url: 'https://chef.bolt.host', icon: '👨‍🍳' },
      { name: 'History', url: 'https://history.bolt.host', icon: '🎭' },
      { name: 'Drone Programming', url: 'https://drone.teachingtools.dev/', icon: '🚁' },
      { name: 'AUSLAN', url: 'https://auslan.bolt.host', icon: '👋' },
      { name: 'Voice to 3D Printing', url: 'https://print3d.bolt.host', icon: '🖨️' },
      { name: 'Network Route Tracer', url: 'https://network.bolt.host', icon: '🌐' },
      { name: 'Physics Simulator', url: 'https://physics.bolt.host/', icon: '⚛️' },
      { name: 'Tutoring Chatbot', url: 'https://tutor.bolt.host', icon: '🤖' },
      { name: 'Math Genius', url: 'https://math.bolt.host', icon: '🔢' },
      { name: 'Code Class', url: 'https://codeclass.bolt.host', icon: '💻' },
      { name: 'Code Blocks', url: 'https://codecraft.teachingtools.dev', icon: '🐍' },
    ]
  },
  {
    name: 'Primary School',
    icon: '🏫',
    programs: [
      { name: 'Dream Tales', url: 'https://dreamtales.bolt.host', icon: '📚' },
    ]
  },
  {
    name: 'Programs from the internet',
    icon: '🌐',
    subcategories: [
      {
        name: 'Games and Entertainment',
        icon: '🎮',
        programs: [
          { name: 'Lost Gamer', url: 'https://lostgamer.io', icon: '🎮' },
          { name: 'Classic Minecraft', url: 'https://classic.minecraft.net/', icon: '⛏️' },
          { name: 'Fake It till you make it', url: 'https://www.fakeittomakeitgame.com/', icon: '🎭' },
          { name: 'TV Garden', url: 'https://tv.garden/', icon: '📺' },
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
          { name: 'Grok Academy', url: 'https://groklearning.com', icon: '📖' },
          { name: 'Visual Studio Code', url: 'https://vscode.dev/', icon: '🔵' },
          { name: 'GitHub', url: 'https://github.com/', icon: '🐙' },
        ]
      },
      {
        name: 'Learn Computer Hardware',
        icon: '🖥️',
        programs: [
          { name: 'Build your own Computer in 3D', url: 'https://buildcores.com/', icon: '💻' },
          { name: 'Build Your own CPU', url: 'https://nandgame.com/', icon: '⚡' },
        ]
      },
      {
        name: 'Cybersafety',
        icon: '🔒',
        programs: [
          { name: 'Digital Footprint Scanner', url: 'https://www.malwarebytes.com/digital-footprint-app', icon: '👣' },
          { name: 'Password Strength Checker', url: 'https://bitwarden.com/password-strength/', icon: '🔑' },
          { name: 'Data Breach Checker', url: 'https://databreach.com/', icon: '🚨' },
          { name: 'Be Internet Awesome', url: 'https://beinternetawesome.withgoogle.com/en_au/interland/', icon: '🛡️' },
          { name: 'Spot the Troll', url: 'https://spotthetroll.org/start', icon: '🧌' },
          { name: 'Phishing Quiz', url: 'https://phishingquiz.withgoogle.com/', icon: '🎣' },
          { name: 'Get Bad News', url: 'https://www.getbadnews.com/en/intro', icon: '📰' },
          { name: 'Cat Park', url: 'https://www.catpark.game/', icon: '🐱' },
          { name: 'Fake Wifi', url: 'https://cybergamesuk.com/rogue-wifi', icon: '📡' },
          { name: 'Cyber-City', url: 'https://cybergamesuk.com/cyber-city', icon: '🏙️' },
          { name: 'Pranx', url: 'https://pranx.com', icon: '😈' },
        ]
      },
      {
        name: 'Learn Hacking and Cybersecurity',
        icon: '🛡️',
        programs: [
          { name: 'Grabify', url: 'https://grabify.org', icon: '🔗' },
          { name: 'Immersive Labs', url: 'https://immersivelabs.online/signin', icon: '🧪' },
          { name: 'Lab Ex', url: 'https://labex.io/learn', icon: '⚗️' },
          { name: 'K7 Cyber (Learn SQL)', url: 'https://kc7cyber.com/', icon: '🔐' },
          { name: 'Try Hack Me', url: 'https://tryhackme.com/', icon: '🎯' },
          { name: 'Cyber Mission', url: 'https://www.cybermission.tech/game', icon: '🎮' },
          { name: 'Texting Simulator', url: 'https://cybergamesuk.com/texting-simulator', icon: '💬' },
          { name: 'How to rob a bank', url: 'https://cyberskillslive.com/activity/how-to-rob-a-bank/', icon: '🏦' },
          { name: 'Cracking 1 Million Passwords', url: 'https://legacy.cyberskillslesson.com/lesson1/', icon: '🔓' },
          { name: 'How to steal a pizza', url: 'https://report.cyberskillslesson.com/', icon: '🍕' },
          { name: 'How to Solve a murder', url: 'https://forensics.cyberskillslesson.com/', icon: '🔍' },
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


export const StartMenu = ({ onClose, onProgramClick, onNotepadClick, onInfoClick, theme, onThemeToggle, programs, onLogout, hasApiKey }: StartMenuProps) => {
  const dynamicCategories: Category[] = programs && programs.length > 0 ? [
    {
      name: 'General Tools',
      icon: '🛠️',
      programs: programs.filter(p => p.category === 'general')
    },
    {
      name: 'Teacher Tools',
      icon: '👨‍🏫',
      programs: programs.filter(p => p.category === 'teacher')
    },
    {
      name: 'Secondary School Subjects',
      icon: '🎓',
      programs: programs.filter(p => p.category === 'secondary')
    },
    {
      name: 'Primary School',
      icon: '🏫',
      programs: programs.filter(p => p.category === 'primary')
    },
    ...categories.filter(c => c.name === 'Programs from the internet')
  ] : categories;
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
      <div className={`fixed ${isMobile ? 'inset-x-0 bottom-0 max-h-[85vh]' : 'bottom-[40px] left-0 w-[320px]'} ${isMobile ? 'border-t-2' : 'border-2'} shadow-lg z-50 ${isMobile ? 'rounded-t-xl' : 'rounded-tr-lg'} flex flex-col`}
        style={{
          background: 'hsl(var(--menu-bg))',
          borderColor: 'hsl(var(--window-border))',
        }}
      >
        <div className={`${isMobile ? 'p-4' : 'p-4'} flex-shrink-0`}
          style={{
            borderBottom: '1px solid hsl(var(--border))',
          }}
        >
          <div className="flex items-center gap-3">
            <div className={`${isMobile ? 'w-12 h-12' : 'w-12 h-12'} rounded flex items-center justify-center`}
              style={{ background: 'hsl(var(--primary))' }}
            >
              <User className={`${isMobile ? 'w-7 h-7' : 'w-8 h-8'}`} style={{ color: 'hsl(var(--primary-foreground))' }} />
            </div>
            <span className={`font-bold ${isMobile ? 'text-lg' : 'text-sm'}`} style={{ color: 'hsl(var(--foreground))' }}>Teachingtools.dev</span>
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
            <div className={`${isMobile ? 'pl-4 pb-2' : 'fixed w-[300px] border-2'} ${isMobile ? '' : 'shadow-lg'} ${isMobile ? 'max-h-none' : 'max-h-[calc(100vh-100px)]'} overflow-y-auto z-50`}
              style={{
                background: 'hsl(var(--menu-bg))',
                borderColor: isMobile ? 'transparent' : 'hsl(var(--window-border))',
                left: !isMobile ? '320px' : undefined,
                top: !isMobile ? `${submenuTop}px` : undefined,
              }}
              onMouseLeave={() => !isMobile && (() => {
                setShowPrograms(false);
                setHoveredCategory(null);
                setHoveredSubcategory(null);
              })()}
            >
              <div className="py-1">
                {dynamicCategories.map((category) => (
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
                        className={`${isMobile ? 'pl-6 pb-2 bg-gray-50' : 'fixed w-[280px] border-2'} ${isMobile ? '' : 'shadow-lg'} ${isMobile ? 'max-h-none' : 'max-h-[400px]'} overflow-y-auto z-50`}
                        style={{
                          background: isMobile ? 'hsl(var(--muted))' : 'hsl(var(--menu-bg))',
                          borderColor: isMobile ? 'transparent' : 'hsl(var(--window-border))',
                          left: !isMobile ? '620px' : undefined,
                          top: !isMobile ? `${categorySubmenuTop}px` : undefined,
                        }}
                        onMouseLeave={() => !isMobile && setHoveredCategory(null)}
                        onMouseEnter={() => !isMobile && setHoveredCategory(category.name)}
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
                                    className={`${isMobile ? 'pl-6 pb-2 bg-gray-100' : 'fixed w-[280px] border-2'} ${isMobile ? '' : 'shadow-lg'} ${isMobile ? 'max-h-none' : 'max-h-[400px]'} overflow-y-auto z-50`}
                                    style={{
                                      background: isMobile ? 'hsl(var(--accent))' : 'hsl(var(--menu-bg))',
                                      borderColor: isMobile ? 'transparent' : 'hsl(var(--window-border))',
                                      left: !isMobile ? '900px' : undefined,
                                      top: !isMobile ? `${subcategorySubmenuTop}px` : undefined,
                                    }}
                                    onMouseLeave={() => !isMobile && setHoveredSubcategory(null)}
                                  >
                                    <div className="py-1">
                                       {subcategory.programs.map((program) => (
                                        <div
                                          key={program.name}
                                          className={`xp-menu-item ${isMobile ? 'text-base py-3 whitespace-normal' : 'whitespace-nowrap'}`}
                                          onClick={() => {
                                            // Open VS Code directly in new tab since it blocks iframes
                                            if (program.name === 'Visual Studio Code') {
                                              window.open(program.url, '_blank');
                                              onClose();
                                            } else {
                                              onProgramClick(program);
                                              onClose();
                                            }
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
                                  // Open VS Code directly in new tab since it blocks iframes
                                  if (program.name === 'Visual Studio Code') {
                                    window.open(program.url, '_blank');
                                    onClose();
                                  } else {
                                    onProgramClick(program);
                                    onClose();
                                  }
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
              onThemeToggle();
              onClose();
            }}
          >
            <span className="text-xl">{theme === 'xp' ? '🐉' : '🖥️'}</span>
            <span className="text-sm">{theme === 'xp' ? 'Kali Linux Display' : 'Windows Display'}</span>
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

          <div className="border-t border-gray-200 my-2" />

          <div
            className="xp-menu-item"
            onClick={() => {
              onInfoClick('Privacy Policy', <div className="p-4"><h2 className="text-xl font-bold mb-4">Privacy Policy</h2><p>Privacy policy content coming soon.</p></div>);
              onClose();
            }}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm">Privacy Policy</span>
          </div>
          <div
            className="xp-menu-item"
            onClick={() => {
              onInfoClick('Terms of Use', <div className="p-4"><h2 className="text-xl font-bold mb-4">Terms of Use</h2><p>Terms of use content coming soon.</p></div>);
              onClose();
            }}
          >
            <FileText className="w-5 h-5" />
            <span className="text-sm">Terms of Use</span>
          </div>
          <div
            className="xp-menu-item"
            onClick={() => {
              onInfoClick('About Teaching Tools', <div className="p-4"><h2 className="text-xl font-bold mb-4">About Teaching Tools</h2><p>Teaching Tools is an educational platform with various learning applications.</p></div>);
              onClose();
            }}
          >
            <HelpCircle className="w-5 h-5" />
            <span className="text-sm">About</span>
          </div>

          {hasApiKey && onLogout && (
            <div
              className="xp-menu-item"
              onClick={() => {
                onLogout();
                onClose();
              }}
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Log Out</span>
            </div>
          )}
        </div>

      </div>
    </>
  );
};
