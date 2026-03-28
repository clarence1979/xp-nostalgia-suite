import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
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
import { IframeProgram } from '@/components/IframeProgram';
import { FolderWindow } from '@/components/FolderWindow';
import blissWallpaper from '@/assets/bliss-wallpaper.jpg';
import kaliWallpaper from '@/assets/kali-wallpaper.jpg';
import { HardDrive, Folder, Trash2, Globe, FileText, Code, UserCog, Lock, Plus, Pencil, X, FolderPlus } from 'lucide-react';
import { useIsMobile, useIsLandscape } from '@/hooks/use-mobile';
import { useToast } from '@/hooks/use-toast';
import { apiKeyStorage } from '@/lib/apiKeyStorage';
import { apiCache } from '@/lib/apiCache';
import { authTokenService } from '@/lib/authTokenService';
import { supabase } from '@/integrations/supabase/client';
import { IconEditorDialog, type IconFormData } from '@/components/IconEditorDialog';
import { FolderPropertiesDialog, type FolderFormData, colorToFolderIcon } from '@/components/FolderPropertiesDialog';
import { insertDesktopIcon, updateDesktopIcon, deleteDesktopIcon, updateIconPosition, createFolder, moveIconToFolder, renameIcon } from '@/lib/desktopIconService';
import { logLoginEvent, shouldLogSessionRefresh } from '@/lib/loginLogger';

interface OpenWindow {
  id: string;
  title: string;
  content: React.ReactNode;
  active: boolean;
  minimized: boolean;
  icon?: React.ReactNode;
  autoMaximizeOnMobile?: boolean;
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
  open_behavior: 'window' | 'new_tab' | 'special' | 'folder' | 'iframe';
  sort_order: number;
  parent_id?: string | null;
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
  const nextWindowIdRef = useRef(1);
  const refetchIconsRef = useRef<(() => Promise<void>) | null>(null);
  const [validatedPassword, setValidatedPassword] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showApiKeyLogin, setShowApiKeyLogin] = useState(false);
  const [showForcedPasswordChange, setShowForcedPasswordChange] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [theme, setTheme] = useState<'xp' | 'kali'>('xp');
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [iconContextMenu, setIconContextMenu] = useState<{ x: number; y: number; icon: DesktopIconData } | null>(null);
  const [desktopIcons, setDesktopIcons] = useState<DesktopIconData[]>([]);
  const [iconsLoading, setIconsLoading] = useState(true);
  const [showIconEditor, setShowIconEditor] = useState(false);
  const [editingIcon, setEditingIcon] = useState<DesktopIconData | null>(null);
  const [addIconPosition, setAddIconPosition] = useState({ x: 100, y: 100 });
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<'create' | 'edit'>('create');
  const [folderDialogPosition, setFolderDialogPosition] = useState({ x: 100, y: 100 });
  const [folderDialogTarget, setFolderDialogTarget] = useState<DesktopIconData | null>(null);
  const isMobile = useIsMobile();
  const isLandscape = useIsLandscape();
  const { toast } = useToast();

  useEffect(() => {
    apiCache.initializeSupabaseValues();

    const timer = setTimeout(async () => {
      setIsLoading(false);
      const session = apiKeyStorage.getSession();
      if (session) {
        if (session.isAdmin) {
          const storedToken = apiKeyStorage.getAuthToken();
          if (!storedToken) {
            apiKeyStorage.clearSession();
            setShowApiKeyLogin(true);
            return;
          }
          const tokenData = await authTokenService.validateToken(storedToken);
          if (!tokenData) {
            apiKeyStorage.clearSession();
            setShowApiKeyLogin(true);
            return;
          }
        }

        setUsername(session.username);
        setUserId(session.userId || null);
        setApiKey(session.apiKey);
        setIsAdmin(session.isAdmin || false);

        if (shouldLogSessionRefresh(session.username)) {
          logLoginEvent(session.username);
        }

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

        console.log('[Index] Sending credentials via postMessage:', {
          hasKey: !!allApiValues.OPENAI_API_KEY,
          hasToken: !!authToken,
          hasUsername: !!allApiValues.username,
          isAdmin: allApiValues.isAdmin,
          tokenLength: authToken?.length || 0
        });

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
          let accessiblePrograms: string[] = [];

          if (userId) {
            try {
              const { data: programsData, error: programsError } = await supabase
                .rpc('get_accessible_programs_for_user', { target_user_id: userId });

              if (!programsError && programsData) {
                accessiblePrograms = programsData.map((p: { program_name: string }) => p.program_name);
              }
            } catch (err) {
              console.error('Error fetching accessible programs:', err);
            }
          }

          const allFilteredIcons = userId && accessiblePrograms.length > 0
            ? data.filter(icon =>
                icon.icon_type === 'system' ||
                icon.icon_type === 'theme' ||
                icon.icon_type === 'folder' ||
                accessiblePrograms.includes(icon.name)
              )
            : data;

          const rootIcons = allFilteredIcons.filter(icon => !icon.parent_id);

          setDesktopIcons(rootIcons as DesktopIconData[]);
        }
      } catch (error) {
        console.error('Error fetching desktop icons:', error);
      } finally {
        setIconsLoading(false);
      }
    };

    fetchDesktopIcons();
  }, [userId]);

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
        const rootIcons = (data as DesktopIconData[]).filter(icon => !icon.parent_id);
        setDesktopIcons(rootIcons);
      }
    } catch (err) {
      console.error('Error refetching icons:', err);
    }
  };
  refetchIconsRef.current = refetchIcons;

  const handleAddNewIcon = () => {
    const pos = contextMenu || { x: 100, y: 100 };
    setAddIconPosition({ x: pos.x, y: pos.y });
    setEditingIcon(null);
    setShowIconEditor(true);
    setContextMenu(null);
  };

  const handleCreateFolder = () => {
    const pos = contextMenu || { x: 100, y: 100 };
    setContextMenu(null);
    setFolderDialogMode('create');
    setFolderDialogPosition({ x: pos.x, y: pos.y });
    setFolderDialogTarget(null);
    setShowFolderDialog(true);
  };

  const handleEditFolderProperties = () => {
    if (!iconContextMenu) return;
    const icon = iconContextMenu.icon;
    setIconContextMenu(null);
    setFolderDialogMode('edit');
    setFolderDialogPosition({ x: icon.position_x, y: icon.position_y });
    setFolderDialogTarget(icon);
    setShowFolderDialog(true);
  };

  const handleFolderDialogSave = async (formData: FolderFormData) => {
    const iconValue = colorToFolderIcon(formData.color);
    try {
      if (folderDialogMode === 'create') {
        await createFolder(formData.name, folderDialogPosition.x, folderDialogPosition.y, null, iconValue);
        await refetchIcons();
        toast({ title: 'Folder created', description: `"${formData.name}" added to desktop` });
      } else if (folderDialogTarget) {
        await updateDesktopIcon(folderDialogTarget.id, { name: formData.name, icon: iconValue });
        await refetchIcons();
        toast({ title: 'Updated', description: 'Folder updated' });
      }
      setShowFolderDialog(false);
      setFolderDialogTarget(null);
    } catch (err) {
      console.error('Folder save error:', err);
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    }
  };

  const handleDropOnFolder = async (folderId: string, droppedIconId: string) => {
    if (folderId === droppedIconId) return;
    try {
      await moveIconToFolder(droppedIconId, folderId);
      await refetchIcons();
      toast({ title: 'Moved', description: 'Icon moved into folder' });
    } catch {
      toast({ title: 'Error', description: 'Failed to move icon', variant: 'destructive' });
    }
  };

  const handleDesktopDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    if (!isAdmin) return;
    const iconId = e.dataTransfer.getData('text/plain');
    if (!iconId) return;
    if (desktopIcons.some(i => i.id === iconId)) return;
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, e.clientX - rect.left);
    const y = Math.max(0, e.clientY - rect.top);
    try {
      await moveIconToFolder(iconId, null);
      await updateIconPosition(iconId, x, y);
      await refetchIcons();
      toast({ title: 'Moved', description: 'Icon moved to desktop' });
    } catch {
      toast({ title: 'Error', description: 'Failed to move icon to desktop', variant: 'destructive' });
    }
  };

  const handleEditIconClick = () => {
    if (!iconContextMenu) return;
    setEditingIcon(iconContextMenu.icon);
    setShowIconEditor(true);
    setIconContextMenu(null);
  };

  const handleRenameIconClick = async () => {
    if (!iconContextMenu) return;
    const icon = iconContextMenu.icon;
    setIconContextMenu(null);
    const newName = window.prompt('Rename to:', icon.name);
    if (!newName?.trim() || newName.trim() === icon.name) return;
    try {
      await renameIcon(icon.id, newName.trim());
      await refetchIcons();
      toast({ title: 'Renamed', description: `Renamed to "${newName.trim()}"` });
    } catch {
      toast({ title: 'Error', description: 'Failed to rename', variant: 'destructive' });
    }
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
    } catch (err) {
      const msg = (err instanceof Error ? err.message : (err as { message?: string })?.message) ?? '';
      if (msg.includes('Unauthorized') || msg.includes('expired') || msg.includes('Invalid')) {
        apiKeyStorage.clearSession();
        setApiKey(null);
        setUsername(null);
        setUserId(null);
        setIsAdmin(false);
        setShowIconEditor(false);
        setEditingIcon(null);
        toast({ title: 'Session expired', description: 'Your session has expired. Please log in again.', variant: 'destructive' });
        setShowApiKeyLogin(true);
      } else {
        toast({ title: 'Error', description: 'Failed to save icon', variant: 'destructive' });
      }
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

  const openWindow = useCallback((title: string, content: React.ReactNode, icon?: React.ReactNode, autoMaximizeOnMobile?: boolean) => {
    const id = `window-${nextWindowIdRef.current++}`;

    const newWindow: OpenWindow = {
      id,
      title,
      content,
      active: true,
      minimized: false,
      icon,
      autoMaximizeOnMobile,
    };

    setWindows((prev) => [
      ...prev.map((w) => ({ ...w, active: false })),
      newWindow,
    ]);
  }, []);

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

    let hasOpenedInNewTab = false;

    const iframeRef = (iframe: HTMLIFrameElement | null) => {
      if (iframe) {
        iframe.addEventListener('error', () => {
          if (!hasOpenedInNewTab) {
            hasOpenedInNewTab = true;
            window.open(urlWithApiKey, '_blank');
            toast({
              title: 'Opening in New Tab',
              description: `${program.name} cannot be embedded. Opening in a new tab instead.`,
            });
          }
        });

        iframe.addEventListener('load', async () => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc && !hasOpenedInNewTab) {
              hasOpenedInNewTab = true;
              window.open(urlWithApiKey, '_blank');
              toast({
                title: 'Opening in New Tab',
                description: `${program.name} cannot be embedded. Opening in a new tab instead.`,
              });
              return;
            }
          } catch (e) {
            if (!hasOpenedInNewTab) {
              hasOpenedInNewTab = true;
              window.open(urlWithApiKey, '_blank');
              toast({
                title: 'Opening in New Tab',
                description: `${program.name} cannot be embedded. Opening in a new tab instead.`,
              });
              return;
            }
          }
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

        setTimeout(() => {
          try {
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (!iframeDoc && !hasOpenedInNewTab) {
              hasOpenedInNewTab = true;
              window.open(urlWithApiKey, '_blank');
              toast({
                title: 'Opening in New Tab',
                description: `${program.name} cannot be embedded. Opening in a new tab instead.`,
              });
            }
          } catch (e) {
            if (!hasOpenedInNewTab) {
              hasOpenedInNewTab = true;
              window.open(urlWithApiKey, '_blank');
              toast({
                title: 'Opening in New Tab',
                description: `${program.name} cannot be embedded. Opening in a new tab instead.`,
              });
            }
          }
        }, 3000);
      }
    };

    openWindow(
      program.name,
      <iframe
        ref={iframeRef}
        src={urlWithApiKey}
        className="w-full h-full border-none"
        title={program.name}
        allow="microphone *; camera *; local-fonts *; geolocation *; fullscreen *; payment *; usb *; accelerometer *; gyroscope *; magnetometer *; display-capture *; clipboard-read *; clipboard-write *; web-share *; autoplay *; encrypted-media *; picture-in-picture *; midi *; storage-access *; serial *; hid *; bluetooth *; screen-wake-lock *; xr-spatial-tracking *"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads allow-modals allow-orientation-lock allow-pointer-lock allow-presentation allow-storage-access-by-user-activation allow-top-navigation allow-top-navigation-by-user-activation"
        referrerPolicy="no-referrer-when-downgrade"
      />,
      <span className="text-base">{program.icon}</span>
    );
  };

  const openFolderWindow = useCallback((folderId: string, folderName: string) => {
    const folderContent = (
      <FolderWindow
        folderId={folderId}
        folderName={folderName}
        isAdmin={isAdmin}
        theme={theme}
        onOpenProgram={(item) => handleIconClick(item as unknown as DesktopIconData)}
        onOpenFolder={(id, name) => openFolderWindow(id, name)}
        onExternalIconDropped={() => refetchIconsRef.current?.()}
      />
    );
    openWindow(folderName, folderContent, <Folder className="w-4 h-4" />);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, theme, openWindow]);

  const handleIconClick = (icon: DesktopIconData) => {
    if (icon.open_behavior === 'folder') {
      openFolderWindow(icon.id, icon.name);
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
    } else if (icon.open_behavior === 'iframe' && icon.url) {
      openWindow(
        icon.name,
        <IframeProgram url={icon.url} title={icon.name} />,
        <span className="text-base">{icon.icon}</span>,
        true
      );
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

    if (normalizedIconName.startsWith('Folder:')) {
      const colorKey = normalizedIconName.replace('Folder:', '');
      const colorMap: Record<string, string> = {
        yellow: 'text-yellow-400', blue: 'text-blue-400', red: 'text-red-400',
        green: 'text-green-400', orange: 'text-orange-400', teal: 'text-teal-400',
        pink: 'text-pink-400', gray: 'text-gray-400',
      };
      const colorClass = colorMap[colorKey] || 'text-yellow-400';
      return <Folder className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} ${colorClass}`} />;
    }

    if (iconComponentMap[normalizedIconName]) {
      return iconComponentMap[normalizedIconName];
    }

    return <span className={isMobile ? 'text-3xl' : 'text-4xl'}>{normalizedIconName}</span>;
  }, [iconComponentMap, isMobile]);

  const handleApiKeyLogin = (user: string, key: string | null, admin: boolean, userIdParam?: string, authToken?: string, mustChangePassword?: boolean) => {
    console.log('[Index] handleApiKeyLogin called with authToken:', {
      hasToken: !!authToken,
      tokenLength: authToken?.length || 0
    });

    apiKeyStorage.saveSession(user, key, admin, authToken || undefined, userIdParam);
    setUsername(user);
    setUserId(userIdParam || null);
    setApiKey(key);
    setIsAdmin(admin);
    setShowApiKeyLogin(false);
    if (mustChangePassword) {
      setShowForcedPasswordChange(true);
    } else {
      toast({
        title: 'Login Successful',
        description: `Welcome back, ${user}!${admin ? ' (Admin)' : ''}`,
      });
    }
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
      setUserId(null);
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
      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; }}
      onDrop={handleDesktopDrop}
    >
      {/* Blur overlay when not authenticated */}
      {!isAuthenticated && (
        <div
          className="absolute inset-0 backdrop-blur-md bg-black/20 z-40"
          style={{ pointerEvents: 'none' }}
        />
      )}

      {/* Desktop Icons */}
      {!iconsLoading && isAuthenticated && (() => {
        const iconWidth = 80;
        const iconHeight = 90;
        const padding = 10;

        const getMobileIconAreaSize = () => {
          const screenHeight = window.innerHeight - 40;
          if (isLandscape) {
            const colStep = 85;
            const rowStep = 80;
            const numCols = Math.ceil(desktopIcons.length / 6);
            const totalWidth = Math.max(window.innerWidth, padding + numCols * colStep + iconWidth);
            const totalHeight = Math.max(window.innerHeight - 40, 6 * rowStep + iconHeight + padding);
            return { width: totalWidth, height: totalHeight };
          }
          const rows = Math.max(1, Math.floor(screenHeight / (iconHeight + padding)));
          const numCols = Math.ceil(desktopIcons.length / rows);
          const totalWidth = Math.max(window.innerWidth, padding + numCols * (iconWidth + padding));
          const totalHeight = Math.max(screenHeight, rows * (iconHeight + padding) + padding);
          return { width: totalWidth, height: totalHeight };
        };

        const getIconPosition = (icon: DesktopIconData) => {
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
            if (landscapePositions[icon.id]) return landscapePositions[icon.id];
            const iconIndex = desktopIcons.findIndex(i => i.id === icon.id);
            if (iconIndex === -1) return { x: icon.position_x_mobile || icon.position_x, y: icon.position_y_mobile || icon.position_y };
            const col = Math.floor(iconIndex / 6);
            const row = iconIndex % 6;
            return { x: 10 + col * 85, y: 10 + row * 80 };
          }

          const screenHeight = window.innerHeight - 40;
          const rows = Math.max(1, Math.floor(screenHeight / (iconHeight + padding)));
          const iconIndex = desktopIcons.findIndex(i => i.id === icon.id);
          if (iconIndex === -1) {
            return { x: icon.position_x_mobile || icon.position_x, y: icon.position_y_mobile || icon.position_y };
          }
          const col = Math.floor(iconIndex / rows);
          const row = iconIndex % rows;
          return { x: padding + col * (iconWidth + padding), y: padding + row * (iconHeight + padding) };
        };

        const mobileAreaSize = isMobile ? getMobileIconAreaSize() : null;

        const iconElements = desktopIcons.map((icon) => {
          const displayLabel = icon.icon_type === 'theme'
            ? (theme === 'xp' ? 'Kali Linux Display' : 'Windows Display')
            : icon.name;

          const displayDescription = icon.icon_type === 'theme'
            ? (theme === 'xp' ? 'Switch to Kali Linux theme' : 'Switch to Windows XP theme')
            : icon.description;

          const displayIcon = icon.icon_type === 'theme'
            ? (theme === 'xp' ? '🐉' : '🖥️')
            : (icon.icon || '');

          const canDrag = isAdmin && icon.icon_type !== 'system' && icon.icon_type !== 'theme';
          const isFolder = icon.icon_type === 'folder';

          return (
            <DesktopIcon
              key={icon.id}
              iconId={icon.id}
              icon={getIconComponent(displayIcon)}
              label={displayLabel}
              onClick={() => handleIconClick(icon)}
              position={getIconPosition(icon)}
              description={displayDescription}
              draggable={canDrag}
              onContextMenu={isAdmin ? (e) => handleIconRightClick(e, icon) : undefined}
              onDragEnd={canDrag ? (x, y) => handleIconDragEnd(icon, x, y) : undefined}
              isDropTarget={isAdmin && isFolder}
              onDropIcon={isAdmin && isFolder ? (droppedId) => handleDropOnFolder(icon.id, droppedId) : undefined}
            />
          );
        });

        if (isMobile && mobileAreaSize) {
          return (
            <div
              className="absolute top-0 left-0 right-0 bottom-10 overflow-auto z-10"
              style={{ WebkitOverflowScrolling: 'touch' } as React.CSSProperties}
            >
              <div
                style={{
                  position: 'relative',
                  width: mobileAreaSize.width,
                  height: mobileAreaSize.height,
                  minWidth: '100%',
                  minHeight: '100%',
                }}
              >
                {iconElements}
              </div>
            </div>
          );
        }

        return <>{iconElements}</>;
      })()}

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
            autoMaximizeOnMobile={window.autoMaximizeOnMobile}
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
            <>
              <button
                onClick={handleAddNewIcon}
                className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors flex items-center gap-2"
                style={{ color: theme === 'kali' ? 'hsl(var(--kali-foreground))' : 'hsl(var(--foreground))' }}
              >
                <Plus className="w-4 h-4" />
                Add New Icon
              </button>
              <button
                onClick={handleCreateFolder}
                className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors flex items-center gap-2"
                style={{ color: theme === 'kali' ? 'hsl(var(--kali-foreground))' : 'hsl(var(--foreground))' }}
              >
                <FolderPlus className="w-4 h-4" />
                New Folder
              </button>
            </>
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
          {iconContextMenu.icon.icon_type === 'folder' ? (
            <button
              onClick={handleEditFolderProperties}
              className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors flex items-center gap-2"
              style={{ color: theme === 'kali' ? 'hsl(var(--kali-foreground))' : 'hsl(var(--foreground))' }}
            >
              <Pencil className="w-3.5 h-3.5" />
              Folder Properties
            </button>
          ) : (
            <>
              <button
                onClick={handleEditIconClick}
                className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors flex items-center gap-2"
                style={{ color: theme === 'kali' ? 'hsl(var(--kali-foreground))' : 'hsl(var(--foreground))' }}
              >
                <Pencil className="w-3.5 h-3.5" />
                Edit Icon
              </button>
              <button
                onClick={handleRenameIconClick}
                className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors flex items-center gap-2"
                style={{ color: theme === 'kali' ? 'hsl(var(--kali-foreground))' : 'hsl(var(--foreground))' }}
              >
                <Pencil className="w-3.5 h-3.5" />
                Rename
              </button>
            </>
          )}
          {iconContextMenu.icon.icon_type !== 'system' && (
            <button
              onClick={handleDeleteIconClick}
              className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-red-100 transition-colors flex items-center gap-2 text-red-600"
            >
              <X className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      )}

      {/* Icon Editor Dialog */}
      {isAdmin && (
        <IconEditorDialog
          key={editingIcon ? editingIcon.id : 'new-icon'}
          open={showIconEditor}
          onClose={() => { setShowIconEditor(false); setEditingIcon(null); }}
          onSave={handleSaveIcon}
          initialData={editingIcon ? {
            name: editingIcon.name,
            icon: editingIcon.icon,
            url: editingIcon.url || '',
            description: editingIcon.description,
            open_behavior: (editingIcon.open_behavior === 'window' || editingIcon.open_behavior === 'new_tab' || editingIcon.open_behavior === 'iframe') ? editingIcon.open_behavior : 'window',
          } : null}
          theme={theme}
        />
      )}

      {/* Folder Properties Dialog */}
      {isAdmin && (
        <FolderPropertiesDialog
          open={showFolderDialog}
          onClose={() => { setShowFolderDialog(false); setFolderDialogTarget(null); }}
          onSave={handleFolderDialogSave}
          initialData={folderDialogTarget ? { name: folderDialogTarget.name, icon: folderDialogTarget.icon } : null}
          mode={folderDialogMode}
          theme={theme}
        />
      )}

      {/* Login Overlay */}
      {!isAuthenticated && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <ApiKeyLogin onLogin={handleApiKeyLogin} onCancel={handleApiKeyCancel} />
        </div>
      )}

      {/* Forced Password Change Overlay */}
      {showForcedPasswordChange && username && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md mx-4 shadow-2xl rounded overflow-hidden border-2 border-gray-400">
            <div className="bg-gradient-to-b from-[#5A8FD8] to-[#5472B6] px-4 py-2">
              <h1 className="text-white text-sm font-bold" style={{ fontFamily: 'Tahoma, sans-serif' }}>
                Password Change Required
              </h1>
            </div>
            <ChangePassword
              username={username}
              forced={true}
              onPasswordChanged={() => {
                setShowForcedPasswordChange(false);
                toast({
                  title: 'Password Changed',
                  description: `Welcome, ${username}! Your password has been updated.`,
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
