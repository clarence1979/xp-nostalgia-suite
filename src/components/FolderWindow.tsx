import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, FolderPlus, Pencil, X, Check, Folder as FolderIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { IconEditorDialog, type IconFormData } from '@/components/IconEditorDialog';
import { FolderPropertiesDialog, type FolderFormData, colorToFolderIcon, getFolderColorClass } from '@/components/FolderPropertiesDialog';
import { insertDesktopIcon, deleteDesktopIcon, updateDesktopIcon, createFolder, moveIconToFolder, renameIcon } from '@/lib/desktopIconService';
import { useToast } from '@/hooks/use-toast';

interface FolderIconData {
  id: string;
  name: string;
  icon: string;
  description: string;
  url: string | null;
  icon_type: 'system' | 'program' | 'theme' | 'folder';
  open_behavior: 'window' | 'new_tab' | 'special' | 'folder' | 'iframe';
  sort_order: number;
  parent_id: string | null;
}

interface FolderWindowProps {
  folderId: string;
  folderName: string;
  isAdmin: boolean;
  theme: 'xp' | 'kali';
  onOpenProgram: (icon: FolderIconData) => void;
  onOpenFolder: (folderId: string, folderName: string) => void;
  onExternalIconDropped?: () => void;
}

export const FolderWindow = ({ folderId, folderName, isAdmin, theme, onOpenProgram, onOpenFolder, onExternalIconDropped }: FolderWindowProps) => {
  const [icons, setIcons] = useState<FolderIconData[]>([]);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [iconContextMenu, setIconContextMenu] = useState<{ x: number; y: number; icon: FolderIconData } | null>(null);
  const [showIconEditor, setShowIconEditor] = useState(false);
  const [editingIcon, setEditingIcon] = useState<FolderIconData | null>(null);
  const [renameTarget, setRenameTarget] = useState<FolderIconData | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [isDragOverBackground, setIsDragOverBackground] = useState(false);
  const dragIconRef = useRef<string | null>(null);
  const [showFolderDialog, setShowFolderDialog] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState<'create' | 'edit'>('create');
  const [folderDialogTarget, setFolderDialogTarget] = useState<FolderIconData | null>(null);
  const { toast } = useToast();

  const fetchIcons = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('desktop_icons')
        .select('*')
        .eq('parent_id', folderId)
        .order('sort_order', { ascending: true });
      if (error) throw error;
      setIcons((data || []) as FolderIconData[]);
    } catch {
      toast({ title: 'Error', description: 'Failed to load folder contents', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [folderId, toast]);

  useEffect(() => {
    fetchIcons();
  }, [fetchIcons]);

  const handleBackgroundContextMenu = (e: React.MouseEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    setIconContextMenu(null);
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleIconContextMenu = (e: React.MouseEvent, icon: FolderIconData) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu(null);
    setIconContextMenu({ x: e.clientX, y: e.clientY, icon });
  };

  const handleCloseMenus = () => {
    setContextMenu(null);
    setIconContextMenu(null);
  };

  const handleIconDoubleClick = (icon: FolderIconData) => {
    if (icon.open_behavior === 'folder') {
      onOpenFolder(icon.id, icon.name);
    } else {
      onOpenProgram(icon);
    }
  };

  const handleAddNewIcon = () => {
    setEditingIcon(null);
    setShowIconEditor(true);
    setContextMenu(null);
  };

  const handleAddNewFolder = () => {
    setContextMenu(null);
    setFolderDialogMode('create');
    setFolderDialogTarget(null);
    setShowFolderDialog(true);
  };

  const handleFolderProperties = () => {
    if (!iconContextMenu) return;
    const icon = iconContextMenu.icon;
    setIconContextMenu(null);
    setFolderDialogMode('edit');
    setFolderDialogTarget(icon);
    setShowFolderDialog(true);
  };

  const handleFolderDialogSave = async (formData: FolderFormData) => {
    const iconValue = colorToFolderIcon(formData.color);
    try {
      if (folderDialogMode === 'create') {
        await createFolder(formData.name, 20, 20, folderId, iconValue);
        await fetchIcons();
        toast({ title: 'Folder created', description: `"${formData.name}" created` });
      } else if (folderDialogTarget) {
        await updateDesktopIcon(folderDialogTarget.id, { name: formData.name, icon: iconValue });
        await fetchIcons();
        toast({ title: 'Updated', description: 'Folder updated' });
      }
      setShowFolderDialog(false);
      setFolderDialogTarget(null);
    } catch (err) {
      console.error('Folder dialog save error:', err);
      toast({ title: 'Error', description: String(err), variant: 'destructive' });
    }
  };

  const handleEditIcon = () => {
    if (!iconContextMenu) return;
    setEditingIcon(iconContextMenu.icon);
    setShowIconEditor(true);
    setIconContextMenu(null);
  };

  const handleStartRename = () => {
    if (!iconContextMenu) return;
    setRenameTarget(iconContextMenu.icon);
    setRenameValue(iconContextMenu.icon.name);
    setIconContextMenu(null);
  };

  const handleRenameCommit = async () => {
    if (!renameTarget || !renameValue.trim()) {
      setRenameTarget(null);
      return;
    }
    try {
      await renameIcon(renameTarget.id, renameValue.trim());
      await fetchIcons();
      toast({ title: 'Renamed', description: `Renamed to "${renameValue.trim()}"` });
    } catch {
      toast({ title: 'Error', description: 'Failed to rename', variant: 'destructive' });
    }
    setRenameTarget(null);
  };

  const handleDeleteIcon = async () => {
    if (!iconContextMenu) return;
    const icon = iconContextMenu.icon;
    setIconContextMenu(null);
    if (icon.icon_type === 'system') {
      toast({ title: 'Cannot Delete', description: 'System icons cannot be deleted', variant: 'destructive' });
      return;
    }
    const confirmed = window.confirm(`Delete "${icon.name}"?`);
    if (!confirmed) return;
    try {
      await deleteDesktopIcon(icon.id);
      await fetchIcons();
      toast({ title: 'Deleted', description: `"${icon.name}" removed` });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
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
        toast({ title: 'Updated', description: `"${formData.name}" updated` });
      } else {
        await insertDesktopIcon({
          name: formData.name,
          icon: formData.icon,
          url: formData.url,
          description: formData.description,
          open_behavior: formData.open_behavior,
          position_x: 20,
          position_y: 20,
          parent_id: folderId,
        });
        toast({ title: 'Added', description: `"${formData.name}" added to ${folderName}` });
      }
      await fetchIcons();
      setShowIconEditor(false);
      setEditingIcon(null);
    } catch {
      toast({ title: 'Error', description: 'Failed to save icon', variant: 'destructive' });
    }
  };

  const handleDragStart = (e: React.DragEvent, icon: FolderIconData) => {
    dragIconRef.current = icon.id;
    e.dataTransfer.setData('text/plain', icon.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFolderId(targetFolderId);
  };

  const handleDragLeave = () => {
    setDragOverFolderId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverFolderId(null);
    const iconId = e.dataTransfer.getData('text/plain') || dragIconRef.current;
    if (!iconId || iconId === targetFolderId) return;
    dragIconRef.current = null;
    try {
      await moveIconToFolder(iconId, targetFolderId);
      await fetchIcons();
      toast({ title: 'Moved', description: 'Icon moved into folder' });
    } catch {
      toast({ title: 'Error', description: 'Failed to move icon', variant: 'destructive' });
    }
  };

  const handleBackgroundDragOver = (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOverBackground(true);
  };

  const handleBackgroundDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragOverBackground(false);
  };

  const handleBackgroundDrop = async (e: React.DragEvent) => {
    if (!isAdmin) return;
    e.preventDefault();
    setIsDragOverBackground(false);
    const iconId = e.dataTransfer.getData('text/plain') || dragIconRef.current;
    dragIconRef.current = null;
    if (!iconId || iconId === folderId) return;
    if (icons.some(i => i.id === iconId)) return;
    try {
      await moveIconToFolder(iconId, folderId);
      await fetchIcons();
      onExternalIconDropped?.();
      toast({ title: 'Moved', description: `Icon moved into ${folderName}` });
    } catch {
      toast({ title: 'Error', description: 'Failed to move icon into folder', variant: 'destructive' });
    }
  };

  const handleIconDragEnd = (e: React.DragEvent) => {
    if (e.dataTransfer.dropEffect === 'move') {
      fetchIcons();
    }
  };

  const isKali = theme === 'kali';
  const menuBg = isKali ? 'hsl(var(--kali-menu-bg))' : 'hsl(var(--menu-bg))';
  const menuBorder = isKali ? 'hsl(var(--kali-border))' : 'hsl(var(--border))';
  const menuFg = isKali ? 'hsl(var(--kali-foreground))' : 'hsl(var(--foreground))';

  return (
    <div
      className={`w-full h-full bg-white overflow-auto relative transition-colors ${isDragOverBackground ? 'bg-blue-50 ring-2 ring-inset ring-blue-400' : ''}`}
      onContextMenu={handleBackgroundContextMenu}
      onClick={handleCloseMenus}
      onDragOver={handleBackgroundDragOver}
      onDragLeave={handleBackgroundDragLeave}
      onDrop={handleBackgroundDrop}
    >
      {loading ? (
        <div className="flex items-center justify-center h-full text-gray-400 text-sm">Loading...</div>
      ) : icons.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm gap-2">
          <span className="text-4xl">📂</span>
          <span>This folder is empty</span>
          {isAdmin && <span className="text-xs">Right-click to add icons or folders</span>}
        </div>
      ) : (
        <div className="p-4 grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))' }}>
          {icons.map((icon) => (
            <div
              key={icon.id}
              className={`flex flex-col items-center cursor-pointer rounded p-2 transition-colors group relative ${
                dragOverFolderId === icon.id ? 'bg-blue-200 ring-2 ring-blue-400' : 'hover:bg-blue-50'
              } ${icon.open_behavior === 'folder' ? 'hover:bg-yellow-50' : ''}`}
              onDoubleClick={() => handleIconDoubleClick(icon)}
              onContextMenu={(e) => handleIconContextMenu(e, icon)}
              draggable={isAdmin}
              onDragStart={isAdmin ? (e) => handleDragStart(e, icon) : undefined}
              onDragEnd={isAdmin ? handleIconDragEnd : undefined}
              onDragOver={icon.open_behavior === 'folder' ? (e) => handleDragOver(e, icon.id) : undefined}
              onDragLeave={icon.open_behavior === 'folder' ? handleDragLeave : undefined}
              onDrop={icon.open_behavior === 'folder' ? (e) => handleDrop(e, icon.id) : undefined}
              title={icon.description}
            >
              {renameTarget?.id === icon.id ? (
                <div className="flex flex-col items-center gap-1 w-full">
                  <span>
                    {icon.icon_type === 'folder'
                      ? <FolderIcon className={getFolderColorClass(icon.icon, 'md')} />
                      : <span className="text-4xl">{icon.icon}</span>}
                  </span>
                  <input
                    className="text-xs text-center w-full border border-blue-400 rounded px-1 outline-none"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleRenameCommit(); if (e.key === 'Escape') setRenameTarget(null); }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex gap-1">
                    <button onClick={handleRenameCommit} className="text-green-600 hover:text-green-800"><Check className="w-3 h-3" /></button>
                    <button onClick={() => setRenameTarget(null)} className="text-red-500 hover:text-red-700"><X className="w-3 h-3" /></button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="mb-1">
                    {icon.icon_type === 'folder'
                      ? <FolderIcon className={getFolderColorClass(icon.icon, 'md')} />
                      : <span className="text-4xl">{icon.icon}</span>}
                  </span>
                  <span className="text-xs text-center break-words leading-tight max-w-full">{icon.name}</span>
                  {icon.description && (
                    <div className="absolute hidden group-hover:block bg-yellow-100 border border-gray-800 text-black text-xs p-2 rounded shadow-lg z-50 w-48 left-1/2 -translate-x-1/2 top-full mt-1 pointer-events-none whitespace-normal">
                      {icon.description}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {contextMenu && isAdmin && (
        <div
          className="fixed border-2 shadow-lg z-50 min-w-[180px] py-1"
          style={{ left: contextMenu.x, top: contextMenu.y, background: menuBg, borderColor: menuBorder }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={handleAddNewIcon}
            className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors flex items-center gap-2"
            style={{ color: menuFg }}
          >
            <Plus className="w-4 h-4" />
            Add New Icon
          </button>
          <button
            onClick={handleAddNewFolder}
            className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors flex items-center gap-2"
            style={{ color: menuFg }}
          >
            <FolderPlus className="w-4 h-4" />
            New Folder
          </button>
        </div>
      )}

      {iconContextMenu && isAdmin && (
        <div
          className="fixed border-2 shadow-lg z-50 min-w-[160px] py-1"
          style={{ left: iconContextMenu.x, top: iconContextMenu.y, background: menuBg, borderColor: menuBorder }}
          onClick={(e) => e.stopPropagation()}
        >
          {iconContextMenu.icon.icon_type === 'folder' ? (
            <button
              onClick={handleFolderProperties}
              className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors flex items-center gap-2"
              style={{ color: menuFg }}
            >
              <Pencil className="w-3.5 h-3.5" />
              Folder Properties
            </button>
          ) : (
            <>
              {iconContextMenu.icon.icon_type !== 'system' && (
                <button
                  onClick={handleEditIcon}
                  className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors flex items-center gap-2"
                  style={{ color: menuFg }}
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Edit Icon
                </button>
              )}
              <button
                onClick={handleStartRename}
                className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-accent transition-colors flex items-center gap-2"
                style={{ color: menuFg }}
              >
                <Pencil className="w-3.5 h-3.5" />
                Rename
              </button>
            </>
          )}
          {iconContextMenu.icon.icon_type !== 'system' && (
            <button
              onClick={handleDeleteIcon}
              className="w-full text-left px-4 py-2 text-sm font-tahoma hover:bg-red-100 transition-colors flex items-center gap-2 text-red-600"
            >
              <X className="w-3.5 h-3.5" />
              Delete
            </button>
          )}
        </div>
      )}

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
            open_behavior: (editingIcon.open_behavior === 'window' || editingIcon.open_behavior === 'new_tab' || editingIcon.open_behavior === 'iframe') ? editingIcon.open_behavior : 'window',
          } : null}
          theme={theme}
        />
      )}

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
    </div>
  );
};
