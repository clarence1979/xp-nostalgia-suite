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

const ICON_OPTIONS = [
  '🌐', '📱', '💻', '🎮', '🎨', '📊', '📈', '🔧',
  '⚙️', '📝', '📚', '🎵', '🎬', '📷', '🗂️', '📁',
  '🤖', '🧠', '💡', '🔬', '🧪', '🎯', '🏆', '⭐',
  '🚀', '🔒', '🛒', '💬', '📧', '🗺️', '⏰', '📅',
  '🖥️', '🖨️', '🔊', '🎲', '✏️', '🧮', '📐', '🔍',
];

interface IconEditorDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: IconFormData) => void;
  initialData?: IconFormData | null;
  theme: 'xp' | 'kali';
}

export interface IconFormData {
  name: string;
  icon: string;
  url: string;
  description: string;
  open_behavior: 'window' | 'new_tab' | 'iframe';
}

export const IconEditorDialog = ({ open, onClose, onSave, initialData, theme }: IconEditorDialogProps) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🌐');
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [openBehavior, setOpenBehavior] = useState<'window' | 'new_tab' | 'iframe'>('window');
  const [customEmoji, setCustomEmoji] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setIcon(initialData.icon);
      setUrl(initialData.url);
      setDescription(initialData.description);
      setOpenBehavior(initialData.open_behavior);
      setCustomEmoji('');
    } else {
      setName('');
      setIcon('🌐');
      setUrl('');
      setDescription('');
      setOpenBehavior('window');
      setCustomEmoji('');
    }
  }, [initialData, open]);

  const handleSave = () => {
    if (!name.trim() || !url.trim()) return;
    onSave({
      name: name.trim(),
      icon: icon,
      url: url.trim(),
      description: description.trim(),
      open_behavior: openBehavior,
    });
  };

  const handleCustomEmojiApply = () => {
    if (customEmoji.trim()) {
      setIcon(customEmoji.trim());
      setCustomEmoji('');
    }
  };

  const isKali = theme === 'kali';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md"
        style={{
          background: isKali ? 'hsl(var(--kali-menu-bg))' : undefined,
          borderColor: isKali ? 'hsl(var(--kali-border))' : undefined,
          color: isKali ? 'hsl(var(--kali-foreground))' : undefined,
        }}
      >
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Icon' : 'Add New Icon'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="App name"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label>URL</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              type="url"
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded border flex items-center justify-center text-3xl bg-muted">
                {icon}
              </div>
              <div className="flex gap-1 items-center">
                <Input
                  value={customEmoji}
                  onChange={(e) => setCustomEmoji(e.target.value)}
                  placeholder="Paste emoji"
                  className="w-28"
                  maxLength={4}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCustomEmojiApply}
                  disabled={!customEmoji.trim()}
                >
                  Set
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-8 gap-1 max-h-32 overflow-y-auto p-1 border rounded">
              {ICON_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setIcon(emoji)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-lg hover:bg-accent transition-colors ${
                    icon === emoji ? 'bg-primary/20 ring-1 ring-primary' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Open Behavior</Label>
            <div className="flex gap-2">
              <Button
                variant={openBehavior === 'window' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOpenBehavior('window')}
              >
                In Window
              </Button>
              <Button
                variant={openBehavior === 'iframe' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOpenBehavior('iframe')}
              >
                Iframe
              </Button>
              <Button
                variant={openBehavior === 'new_tab' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOpenBehavior('new_tab')}
              >
                New Tab
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={!name.trim() || !url.trim()}>
            {initialData ? 'Save Changes' : 'Add Icon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
