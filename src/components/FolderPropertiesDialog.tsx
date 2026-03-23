import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder } from 'lucide-react';

export const FOLDER_COLORS = [
  { key: 'yellow', label: 'Yellow', tw: 'text-yellow-400' },
  { key: 'blue',   label: 'Blue',   tw: 'text-blue-400'   },
  { key: 'red',    label: 'Red',    tw: 'text-red-400'    },
  { key: 'green',  label: 'Green',  tw: 'text-green-400'  },
  { key: 'orange', label: 'Orange', tw: 'text-orange-400' },
  { key: 'teal',   label: 'Teal',   tw: 'text-teal-400'   },
  { key: 'pink',   label: 'Pink',   tw: 'text-pink-400'   },
  { key: 'gray',   label: 'Gray',   tw: 'text-gray-400'   },
];

export function folderIconToColor(iconValue: string): string {
  if (!iconValue.startsWith('Folder:')) return 'yellow';
  return iconValue.replace('Folder:', '') || 'yellow';
}

export function colorToFolderIcon(color: string): string {
  return color === 'yellow' ? 'Folder' : `Folder:${color}`;
}

export function getFolderColorClass(iconValue: string, size: 'sm' | 'md' | 'lg' = 'md'): string {
  const color = folderIconToColor(iconValue);
  const found = FOLDER_COLORS.find(c => c.key === color);
  const colorClass = found ? found.tw : 'text-yellow-400';
  const sizeClass = size === 'sm' ? 'w-6 h-6' : size === 'lg' ? 'w-12 h-12' : 'w-10 h-10';
  return `${sizeClass} ${colorClass}`;
}

export interface FolderFormData {
  name: string;
  color: string;
}

interface FolderPropertiesDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: FolderFormData) => void;
  initialData?: { name: string; icon: string } | null;
  mode: 'create' | 'edit';
  theme: 'xp' | 'kali';
}

export const FolderPropertiesDialog = ({
  open,
  onClose,
  onSave,
  initialData,
  mode,
  theme,
}: FolderPropertiesDialogProps) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('yellow');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setColor(folderIconToColor(initialData.icon));
    } else {
      setName('');
      setColor('yellow');
    }
  }, [initialData, open]);

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ name: name.trim(), color });
  };

  const isKali = theme === 'kali';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-sm"
        style={{
          background: isKali ? 'hsl(var(--kali-menu-bg))' : undefined,
          borderColor: isKali ? 'hsl(var(--kali-border))' : undefined,
          color: isKali ? 'hsl(var(--kali-foreground))' : undefined,
        }}
      >
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'New Folder' : 'Folder Properties'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Folder name"
              maxLength={50}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-4 gap-3">
              {FOLDER_COLORS.map(({ key, label, tw }) => (
                <button
                  key={key}
                  onClick={() => setColor(key)}
                  title={label}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg border-2 transition-all ${
                    color === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-transparent hover:border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <Folder className={`w-8 h-8 ${tw}`} />
                  <span className="text-[10px] text-gray-600">{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>
            {mode === 'create' ? 'Create Folder' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
