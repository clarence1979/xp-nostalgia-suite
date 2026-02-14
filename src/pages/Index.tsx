import { useState, useEffect, useMemo, useCallback } from 'react';
import { Window } from '@/components/Window';
import { StartMenu } from '@/components/StartMenu';
import { Taskbar } from '@/components/Taskbar';
import { DesktopIcon } from '@/components/DesktopIcon';
import { Notepad } from '@/components/Notepad';
import { Browser } from '@/components/Browser';
import { OneDrive } from '@/components/OneDrive';
import { LoadingScreen } from '@/components/LoadingScreen';
import { ApiKeyLogin } from '@/components/ApiKeyLogin';
import { UserManagement } from '@/components/UserManagement';
import { ChangePassword } from '@/components/ChangePassword';
import blissWallpaper from '@/assets/bliss-wallpaper.jpg';
import kaliWallpaper from '@/assets/kali-wallpaper.jpg';
import { HardDrive, Folder, Trash2, Globe, FileText, Code, UserCog, Lock, Plus, Pencil, X } from 'lucide-react';
import { useIsMobile, useIsLandscape } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { apiKeyStorage } from '@/lib/apiKeyStorage';
import { apiCache } from '@/lib/apiCache';
import { supabase } from '@/integrations/supabase/client';
import { IconEditorDialog, type IconFormData } from '@/components/IconEditorDialog';
import { insertDesktopIcon, updateDesktopIcon, deleteDesktopIcon, updateIconPosition } from '@/lib/desktopIconService';

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
  icon_type: 'system' | 'program' | 'theme' | 'folder';
  position_x: number;
  position_y: number;
  position_x_mobile: number | null;
  position_y_mobile: number | null;
  category: string | null;
  open_behavior: 'window' | 'new_tab' | 'special' | 'folder';
  sort_order: number;
  folder_contents?: DesktopIconData[];
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
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState<'xp' | 'kali'>('xp');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [iconContextMenu, setIconContextMenu] = useState<{ x: number; y: number; icon: DesktopIconData } | null>(null);
  const [desktopIcons, setDesktopIcons] = useState<DesktopIconData[]>([]);
  const [iconsLoading, setIconsLoading] = useState(true);
  const [showIconEditor, setShowIconEditor] = useState(false);
  const [editingIcon, setEditingIcon] = useState<DesktopIconData | null>(null);
  const [addIconPosition, setAddIconPosition] = useState({ x: 100, y: 100 });
  const isMobile = useIsMobile();
  const isLandscape = useIsLandscape();
  const { toast } = useToast();

  useEffect(() => {
    apiCache.initializeSupabaseValues();

    const timer = setTimeout(() => {
      setIsLoading(false);
      const session = apiKeyStorage.getSession();
      if (session) {
        setUsername(session.username);
        setApiKey(session.apiKey);
        setIsAdmin(session.isAdmin || false);

        apiCache.saveAll({
          username: session.username,
          isAdmin: session.isAdmin || false,
          OPENAI_API_KEY: session.apiKey,
        });

        const apiKeys = apiKeyStorage.getApiKeys();
        apiCache.saveAll({
          OPENAI_API_KEY: apiKeys.OPENAI_API_KEY,
          CLAUDE_API_KEY: apiKeys.CLAUDE_API_KEY,
          GEMINI_API_KEY: apiKeys.GEMINI_API_KEY,
          REPLICATE_API_KEY: apiKeys.REPLICATE_API_KEY,
        });
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.data.type === 'REQUEST_API_KEY' || event.data.type === 'REQUEST_API_VALUES') {
        let allApiValues = apiCache.getAll();
        const session = apiKeyStorage.getSession();
        let apiKeys = apiKeyStorage.getApiKeys();

        if (!apiKeys.OPENAI_API_KEY && !apiKeys.CLAUDE_API_KEY && !apiKeys.GEMINI_API_KEY && !apiKeys.REPLICATE_API_KEY) {
          try {
            const { data: secrets, error } = await supabase
              .from('secrets')
              .select('key_name, key_value');

            if (!error && secrets) {
              const fetchedKeys = {
                OPENAI_API_KEY: secrets.find(s => s.key_name === 'OPENAI_API_KEY')?.key_value || '',
                CLAUDE_API_KEY: secrets.find(s => s.key_name === 'CLAUDE_API_KEY' || s.key_name === 'ANTHROPIC_API_KEY')?.key_value || '',
                GEMINI_API_KEY: secrets.find(s => s.key_name === 'GEMINI_API_KEY')?.key_value || '',
                REPLICATE_API_KEY: secrets.find(s => s.key_name === 'REPLICATE_API_KEY')?.key_value || '',
              };

              apiKeyStorage.saveApiKeys(fetchedKeys);
              apiCache.saveAll(fetchedKeys);
              apiKeys = fetchedKeys;
            }
          } catch (err) {
            console.error('Failed to fetch API keys:', err);
          }
        }

        const authToken = apiKeyStorage.getAuthToken();

        allApiValues = {
          ...allApiValues,
          OPENAI_API_KEY: apiKeys.OPENAI_API_KEY || '',
          CLAUDE_API_KEY: apiKeys.CLAUDE_API_KEY || '',
          GEMINI_API_KEY: apiKeys.GEMINI_API_KEY || '',
          REPLICATE_API_KEY: apiKeys.REPLICATE_API_KEY || '',
          username: session?.username || allApiValues.username || '',
          isAdmin: session?.isAdmin || allApiValues.isAdmin || false,
          authToken: authToken || '',
        };

        if (event.source) {
          (event.source as WindowProxy).postMessage(
            {
              type: 'API_VALUES_RESPONSE',
              data: allApiValues,
              apiKey: allApiValues.OPENAI_API_KEY
            },
            '*'
          );

          if (event.data.type === 'REQUEST_API_KEY') {
            (event.source as WindowProxy).postMessage(
              {
                type: 'API_KEY_RESPONSE',
                apiKey: allApiValues.OPENAI_API_KEY
              },
              '*'
            );
          }

          if (allApiValues.REPLICATE_API_KEY) {
            (event.source as WindowProxy).postMessage(
              {
                type: 'replicate-api-key',
                key: allApiValues.REPLICATE_API_KEY
              },
              '*'
            );
          }
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    const fetchDesktopIcons = async () => {
      try {
        const { data, error } = await supabase
          .from('desktop_icons')
          .select('*')
          .order('sort_order', { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          const iconsWithFolderContents = data.map((icon) => {
            if (icon.icon_type === 'folder' && icon.name === 'VCE Software Development') {
              return {
                ...icon,
                folder_contents: [
                  { id: '3-1', name: 'VCE Section A', icon: '📝', description: 'VCE Section A exam training', url: 'https://vce-section-a.bolt.host/', icon_type: 'program' as const, position_x: 20, position_y: 20, position_x_mobile: 20, position_y_mobile: 20, category: null, open_behavior: 'window' as const, sort_order: 1 },
                  { id: '3-2', name: 'VCE Section B', icon: '📊', description: 'VCE Section B exam training', url: 'https://vce.bolt.host/', icon_type: 'program' as const, position_x: 20, position_y: 120, position_x_mobile: 20, position_y_mobile: 120, category: null, open_behavior: 'window' as const, sort_order: 2 },
                  { id: '3-3', name: 'VCE Section C', icon: '💻', description: 'VCE Section C exam training', url: 'https://vce-section-c.bolt.host/', icon_type: 'program' as const, position_x: 20, position_y: 220, position_x_mobile: 20, position_y_mobile: 220, category: null, open_behavior: 'window' as const, sort_order: 3 },
                ]
              };
            }
            return icon;
          });

          setDesktopIcons(iconsWithFolderContents as DesktopIconData[]);
        }
      } catch (error) {
        console.error('Error fetching desktop icons:', error);
      } finally {
        setIconsLoading(false);
      }
    };

    fetchDesktopIcons();
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
    setIconContextMenu(null);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleClick = () => {
    setContextMenu(null);
    setIconContextMenu(null);
  };

  const switchTheme = () => {
    setTheme(theme === 'xp' ? 'kali' : 'xp');
    setContextMenu(null);
  };

  const handleIconRightClick = (e: React.MouseEvent, icon: DesktopIconData) => {
    setContextMenu(null);
    setIconContextMenu({ x: e.clientX, y: e.clientY, icon });
  };

  const refetchIcons = async () => {
    try {
      const { data, error } = await supabase
        .from('desktop_icons')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data) {
        const iconsWithFolderContents = data.map((icon: DesktopIconData) => {
          if (icon.icon_type === 'folder' && icon.name === 'VCE Software Development') {
            return {
              ...icon,
              folder_contents: [
                { id: '3-1', name: 'VCE Section A', icon: '\u{1F4DD}', description: 'VCE Section A exam training', url: 'https://vce-section-a.bolt.host/', icon_type: 'program' as const, position_x: 20, position_y: 20, position_x_mobile: 20, position_y_mobile: 20, category: null, open_behavior: 'window' as const, sort_order: 1 },
                { id: '3-2', name: 'VCE Section B', icon: '\u{1F4CA}', description: 'VCE Section B exam training', url: 'https://vce.bolt.host/', icon_type: 'program' as const, position_x: 20, position_y: 120, position_x_mobile: 20, position_y_mobile: 120, category: null, open_behavior: 'window' as const, sort_order: 2 },
                { id: '3-3', name: 'VCE Section C', icon: '\u{1F4BB}', description: 'VCE Section C exam training', url: 'https://vce-section-c.bolt.host/', icon_type: 'program' as const, position_x: 20, position_y: 220, position_x_mobile: 20, position_y_mobile: 220, category: null, open_behavior: 'window' as const, sort_order: 3 },
              ]
            };
          }
          return icon;
        });
        setDesktopIcons(iconsWithFolderContents as DesktopIconData[]);
      }
    } catch (err) {
      console.error('Error refetching icons:', err);
    }
  };

  const handleAddNewIcon = () => {
    const pos = contextMenu || { x: 100, y: 100 };
    setAddIconPosition({ x: pos.x, y: pos.y });
    setEditingIcon(null);
    setShowIconEditor(true);
    setContextMenu(null);
  };

  const handleEditIconClick = () => {
    if (!iconContextMenu) return;
    setEditingIcon(iconContextMenu.icon);
    setShowIconEditor(true);
    setIconContextMenu(null);
  };

  const handleDeleteIconClick = async () => {
    if (!iconContextMenu) return;
    const icon = iconContextMenu.icon;
    setIconContextMenu(null);

    if (icon.icon_type === 'system') {
      toast({ title: 'Cannot Delete', description: 'System icons cannot be deleted', variant: 'destructive' });
      return;
    }

    const confirmed = window.confirm(`Delete "${icon.name}" from the desktop?`);
    if (!confirmed) return;

    try {
      await deleteDesktopIcon(icon.id);
      await refetchIcons();
      toast({ title: 'Deleted', description: `"${icon.name}" has been removed` });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete icon', variant: 'destructive' });
    }
  };

  const handleSaveIcon = async (formData: IconFormData) => {
    try {
      if (editingIcon) {
        await updateDesktopIcon(editingIcon.id, {
          name: formData.name,
          icon: formData.icon,
          url: formData.url,
          description: formData.description,
          open_behavior: formData.open_behavior,
        });
        toast({ title: 'Updated', description: `"${formData.name}" has been updated` });
      } else {
        await insertDesktopIcon({
          name: formData.name,
          icon: formData.icon,
          url: formData.url,
          description: formData.description,
          open_behavior: formData.open_behavior,
          position_x: addIconPosition.x,
          position_y: addIconPosition.y,
        });
        toast({ title: 'Added', description: `"${formData.name}" has been added to the desktop` });
      }
      await refetchIcons();
      setShowIconEditor(false);
      setEditingIcon(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to save icon', variant: 'destructive' });
    }
  };

  const handleIconDragEnd = async (icon: DesktopIconData, x: number, y: number) => {
    if (icon.icon_type === 'system' || icon.icon_type === 'theme') return;
    try {
      await updateIconPosition(icon.id, x, y);
      setDesktopIcons((prev) =>
        prev.map((i) => i.id === icon.id ? { ...i, position_x: x, position_y: y } : i)
      );
    } catch {
      toast({ title: 'Error', description: 'Failed to move icon', variant: 'destructive' });
    }
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
    const allApiValues = apiCache.getAll();
    let urlWithApiKey = program.url;

    if (apiKey) {
      const url = new URL(program.url);
      url.searchParams.set('apiKey', apiKey);
      urlWithApiKey = url.toString();
    }

    const iframeRef = (iframe: HTMLIFrameElement | null) => {
      if (iframe) {
        iframe.addEventListener('load', async () => {
          const session = apiKeyStorage.getSession();
          let apiKeys = apiKeyStorage.getApiKeys();
          let updatedApiValues = { ...allApiValues };

          if (!apiKeys.OPENAI_API_KEY && !apiKeys.CLAUDE_API_KEY && !apiKeys.GEMINI_API_KEY && !apiKeys.REPLICATE_API_KEY) {
            try {
              const { data: secrets, error } = await supabase
                .from('secrets')
                .select('key_name, key_value');

              if (!error && secrets) {
                const fetchedKeys = {
                  OPENAI_API_KEY: secrets.find(s => s.key_name === 'OPENAI_API_KEY')?.key_value || '',
                  CLAUDE_API_KEY: secrets.find(s => s.key_name === 'CLAUDE_API_KEY' || s.key_name === 'ANTHROPIC_API_KEY')?.key_value || '',
                  GEMINI_API_KEY: secrets.find(s => s.key_name === 'GEMINI_API_KEY')?.key_value || '',
                  REPLICATE_API_KEY: secrets.find(s => s.key_name === 'REPLICATE_API_KEY')?.key_value || '',
                };

                apiKeyStorage.saveApiKeys(fetchedKeys);
                apiCache.saveAll(fetchedKeys);
                apiKeys = fetchedKeys;
              }
            } catch (err) {
              console.error('Failed to fetch API keys:', err);
            }
          }

          const authToken = apiKeyStorage.getAuthToken();

          updatedApiValues = {
            ...updatedApiValues,
            OPENAI_API_KEY: apiKeys.OPENAI_API_KEY || '',
            CLAUDE_API_KEY: apiKeys.CLAUDE_API_KEY || '',
            GEMINI_API_KEY: apiKeys.GEMINI_API_KEY || '',
            REPLICATE_API_KEY: apiKeys.REPLICATE_API_KEY || '',
            username: session?.username || updatedApiValues.username || '',
            isAdmin: session?.isAdmin || updatedApiValues.isAdmin || false,
            authToken: authToken || '',
          };

          setTimeout(() => {
            iframe.contentWindow?.postMessage(
              {
                type: 'API_VALUES_RESPONSE',
                data: updatedApiValues,
                apiKey: apiKey || updatedApiValues.OPENAI_API_KEY
              },
              '*'
            );

            if (updatedApiValues.REPLICATE_API_KEY) {
              iframe.contentWindow?.postMessage(
                {
                  type: 'replicate-api-key',
                  key: updatedApiValues.REPLICATE_API_KEY
                },
                '*'
              );
            }
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
        allow="microphone *; camera *; geolocation *; autoplay *; encrypted-media *; clipboard-read *; clipboard-write *; display-capture *; speaker-selection *; midi *; payment *"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation"
        referrerPolicy="no-referrer-when-downgrade"
      />,
      <span className="text-base">{program.icon}</span>
    );
  };

  const handleIconClick = (icon: DesktopIconData) => {
    if (icon.open_behavior === 'folder' && icon.folder_contents) {
      const folderContent = (
        <div className="p-4 bg-white h-full overflow-auto">
          <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
            {icon.folder_contents.map((item) => (
              <div
                key={item.id}
                className="flex flex-col items-center cursor-pointer hover:bg-blue-100 p-2 rounded"
                onClick={() => handleIconClick(item)}
              >
                <div className="text-4xl mb-1">{item.icon}</div>
                <div className="text-xs text-center break-words">{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      );
      openWindow(icon.name, folderContent, <Folder className="w-4 h-4" />);
    } else if (icon.open_behavior === 'special' && icon.icon_type === 'system') {
      switch (icon.name) {
        case 'My Computer':
          openWindow('My Computer', <div className="p-4">My Computer</div>, <HardDrive className="w-4 h-4" />);
          break;
        case 'My Documents':
          openWindow('My Documents', <OneDrive />, <Folder className="w-4 h-4" />);
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
        case 'User Management':
          if (isAdmin && username) {
            openWindow('User Management', <UserManagement currentUsername={username} />, <UserCog className="w-4 h-4" />);
          } else {
            toast({
              title: 'Access Denied',
              description: 'Only administrators can access User Management',
              variant: 'destructive',
            });
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

  const iconComponentMap = useMemo(() => ({
    'HardDrive': <HardDrive className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-gray-300`} />,
    'Folder': <Folder className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-yellow-300`} />,
    'Trash2': <Trash2 className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-gray-300`} />,
    'Globe': <Globe className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-400`} />,
    'FileText': <FileText className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-300`} />,
    'Code': <Code className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-500`} />,
    'UserCog': <UserCog className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-purple-500`} />,
  }), [isMobile]);

  const getIconComponent = useCallback((iconName: string) => {
    if (!iconName) {
      return <span className={isMobile ? 'text-3xl' : 'text-4xl'}>?</span>;
    }

    const normalizedIconName = iconName.trim();

    if (iconComponentMap[normalizedIconName]) {
      return iconComponentMap[normalizedIconName];
    }

    return <span className={isMobile ? 'text-3xl' : 'text-4xl'}>{normalizedIconName}</span>;
  }, [iconComponentMap, isMobile]);

  const handleApiKeyLogin = (user: string, key: string | null, admin: boolean) => {
    const authToken = apiKeyStorage.getAuthToken();
    apiKeyStorage.saveSession(user, key, admin, authToken || undefined);
    setUsername(user);
    setApiKey(key);
    setIsAdmin(admin);
    setShowApiKeyLogin(false);
    toast({
      title: 'Login Successful',
      description: `Welcome back, ${user}!${admin ? ' (Admin)' : ''}`,
    });
  };

  const handleApiKeyCancel = () => {
    if (username) {
      setShowApiKeyLogin(false);
    }
  };

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      'Are you sure you want to logout?\n\nThis will end your session and you will need to login again.'
    );

    if (confirmLogout) {
      apiKeyStorage.clearSession();
      setApiKey(null);
      setUsername(null);
      setIsAdmin(false);

      // Notify all iframes to clear their API keys
      windows.forEach((win) => {
        const iframe = document.querySelector(`iframe[title="${win.title}"]`) as HTMLIFrameElement;
        if (iframe?.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'CLEAR_API_KEY' }, '*');
        }
      });

      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      });

      setShowApiKeyLogin(true);
    }
  };

  const handleApiKeyIconClick = () => {
    if (username) {
      handleLogout();
    } else {
      setShowApiKeyLogin(true);
    }
  };

  const handleChangePassword = () => {
    if (username) {
      openWindow(
        'Change Password',
        <ChangePassword username={username} />,
        <Lock className="w-4 h-4" />
      );
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

  const isAuthenticated = username && !showApiKeyLogin;

  return (
    <div
      className="desktop-area w-screen h-screen relative overflow-hidden"
      style={{
        backgroundImage: theme === 'xp' ? `url(${blissWallpaper})` : `url(${kaliWallpaper})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
      onContextMenu={handleContextMenu}
      onClick={handleClick}
      onDragOver={(e) => e.preventDefault()}
    >
      {/* Blur overlay when not authenticated */}
      {!isAuthenticated && (
        <div
          className="absolute inset-0 backdrop-blur-md bg-black/20 z-40"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Desktop Icons */}
      {!iconsLoading && isAuthenticated && (
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
              : (icon.icon || '');

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
                  '28': { x: 350, y: 250 },
                  '29': { x: 350, y: 330 },
                  '30': { x: 350, y: 410 },
                };
                return landscapePositions[icon.id] || { x: icon.position_x_mobile || icon.position_x, y: icon.position_y_mobile || icon.position_y };
              }

              return { x: icon.position_x_mobile || icon.position_x, y: icon.position_y_mobile || icon.position_y };
            };

            const canDrag = isAdmin && icon.icon_type !== 'system' && icon.icon_type !== 'theme';

            return (
              <DesktopIcon
                key={icon.id}
                icon={getIconComponent(displayIcon)}
                label={displayLabel}
                onClick={() => handleIconClick(icon)}
                position={getIconPosition()}
                description={displayDescription}
                draggable={canDrag}
                onContextMenu={isAdmin ? (e) => handleIconRightClick(e, icon) : undefined}
                onDragEnd={canDrag ? (x, y) => handleIconDragEnd(icon, x, y) : undefined}
              />
            );
          })}
        </>
      )}

      {/* Open Windows */}
      {isAuthenticated && windows
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
      {isAuthenticated && showStartMenu && (
        <StartMenu
          onClose={() => setShowStartMenu(false)}
          onProgramClick={openProgram}
          onNotepadClick={openNotepad}
          onInfoClick={(title, content) => openWindow(title, content)}
          theme={theme}
          onThemeToggle={switchTheme}
          onLogout={handleLogout}
          hasApiKey={username !== null}
          onChangePasswordClick={handleChangePassword}
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
      {isAuthenticated && (
        <Taskbar
          onStartClick={() => setShowStartMenu(!showStartMenu)}
          windows={windows.map((w) => ({
            id: w.id,
            title: w.title,
            active: w.active,
          }))}
          onWindowClick={focusWindow}
          theme={theme}
          hasApiKey={username !== null}
          onApiKeyClick={handleApiKeyIconClick}
        />
      )}

      {/* Desktop Context Menu */}
      {isAuthenticated && contextMenu && (
        <div
          className="fixed bg-background border-2 shadow-lg z-50 min-w-[200px] py-1"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            borderColor: theme === 'kali' ? 'hsl(var(--kali-border))' : 'hsl(var(--border))',
            background: theme === 'kali' ? 'hsl(var(--kali-menu-bg))' : 'hsl(var(--menu-bg))',
          }}
        >
          {isAdmin && (
            <button
              onClick={handleAddNewIcon}
              className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors flex items-center gap-2"
              style={{ color: theme === 'kali' ? 'hsl(var(--kali-foreground))' : 'hsl(var(--foreground))' }}
            >
              <Plus className="w-4 h-4" />
              Add New Icon
            </button>
          )}
          <button
            onClick={switchTheme}
            className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors"
            style={{ color: theme === 'kali' ? 'hsl(var(--kali-foreground))' : 'hsl(var(--foreground))' }}
          >
            Switch to {theme === 'xp' ? 'Kali Desktop' : 'Windows XP Desktop'}
          </button>
        </div>
      )}

      {/* Icon Context Menu (admin only) */}
      {isAuthenticated && isAdmin && iconContextMenu && (
        <div
          className="fixed bg-background border-2 shadow-lg z-50 min-w-[180px] py-1"
          style={{
            left: iconContextMenu.x,
            top: iconContextMenu.y,
            borderColor: theme === 'kali' ? 'hsl(var(--kali-border))' : 'hsl(var(--border))',
            background: theme === 'kali' ? 'hsl(var(--kali-menu-bg))' : 'hsl(var(--menu-bg))',
          }}
        >
          <button
            onClick={handleEditIconClick}
            className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors flex items-center gap-2"
            style={{ color: theme === 'kali' ? 'hsl(var(--kali-foreground))' : 'hsl(var(--foreground))' }}
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit Icon
          </button>
          {iconContextMenu.icon.icon_type !== 'system' && (
            <button
              onClick={handleDeleteIconClick}
              className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-red-100 transition-colors flex items-center gap-2 text-red-600"
            >
              <X className="w-3.5 h-3.5" />
              Delete Icon
            </button>
          )}
        </div>
      )}

      {/* Icon Editor Dialog */}
      {isAdmin && (
        <IconEditorDialog
          open={showIconEditor}
          onClose={() => { setShowIconEditor(false); setEditingIcon(null); }}
          onSave={handleSaveIcon}
          initialData={editingIcon ? {
            name: editingIcon.name,
            icon: editingIcon.icon,
            url: editingIcon.url || '',
            description: editingIcon.description,
            open_behavior: (editingIcon.open_behavior === 'window' || editingIcon.open_behavior === 'new_tab') ? editingIcon.open_behavior : 'window',
          } : null}
          theme={theme}
        />
      )}

      {/* Login Overlay */}
      {!isAuthenticated && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <ApiKeyLogin onLogin={handleApiKeyLogin} onCancel={handleApiKeyCancel} />
        </div>
      )}
    </div>
  );
};

export default Index;
