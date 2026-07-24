import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Upload, ImageIcon, Clipboard } from 'lucide-react';

const ICON_OPTIONS = [
  '💻', '🖥️', '📱', '⌨️', '🖱', '🖲', '🕹', '📺', '📟', '📠',
  '💽', '💾', '💿', '📀', '📼', '📹', '📷', '🎥', '📽', '🎞',
  '🔋', '🔌', '📡', '🛰', '🛜', '📶', '📞', '🌐',
  '🔬', '🧪', '⚗️', '🧫', '🦠', '🧬', '🌡', '🔭', '⚛️', '🪐',
  '🤖', '🧠', '💡', '⚙️', '🔧', '🛠', '🔩', '🧲', '⛓', '🧰',
  '🪛', '🪚', '⛏', '🔨', '⚒', '🪜', '🧱',
  '🔒', '🔓', '🔐', '🔑', '🗝', '🛡',
  '📁', '🗂️', '📋', '🗃', '🗄', '📎', '🖇', '📌', '🔗', '🏷',
  '📧', '📨', '📩', '📤', '📥', '📦',
  '📝', '📚', '📖', '📓', '📄', '📜', '✏️', '🖊', '🖋', '🖌',
  '📊', '📈', '📉', '🗒', '🧾',
  '🧮', '📐', '📏', '♾', '🔍',
  '💬', '🗯', '🎙', '🎚', '🎛', '🔊', '📢',
  '⏰', '⏱', '⏲', '📅', '⌛',
  '🎮', '🎲', '🧩', '🎯', '🎬', '🎵', '🎨',
  '🏗', '🏭', '🏢',
  '🚀', '🛸', '✈️',
  '💳', '💰', '🛒', '💎',
  '🔮', '🪄', '🗺️', '🏆', '⭐', '🖨️', '🪪', '🕳',
];

const ICON_SIZE = 64;

function resizeImageToIcon(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = ICON_SIZE;
      canvas.height = ICON_SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const scale = Math.min(ICON_SIZE / img.width, ICON_SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (ICON_SIZE - w) / 2;
      const y = (ICON_SIZE - h) / 2;

      ctx.drawImage(img, x, y, w, h);
      resolve(canvas.toDataURL('image/png', 0.9));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function resizeImageFromDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = ICON_SIZE;
      canvas.height = ICON_SIZE;
      const ctx = canvas.getContext('2d')!;
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      const scale = Math.min(ICON_SIZE / img.width, ICON_SIZE / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (ICON_SIZE - w) / 2;
      const y = (ICON_SIZE - h) / 2;

      ctx.drawImage(img, x, y, w, h);
      resolve(canvas.toDataURL('image/png', 0.9));
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

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
  const [isDragOver, setIsDragOver] = useState(false);
  const [imageProcessing, setImageProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const processImageFile = useCallback(async (file: Blob) => {
    setImageProcessing(true);
    try {
      const dataUrl = await resizeImageToIcon(file);
      setIcon(dataUrl);
    } catch {
      console.error('Failed to process image');
    } finally {
      setImageProcessing(false);
    }
  }, []);

  const handlePaste = useCallback(async (e: ClipboardEvent) => {
    if (!open) return;
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await processImageFile(file);
        }
        return;
      }
    }

    for (const item of items) {
      if (item.type === 'text/plain') {
        item.getAsString(async (text) => {
          const trimmed = text.trim();
          if (trimmed.startsWith('data:image/')) {
            e.preventDefault();
            setImageProcessing(true);
            try {
              const resized = await resizeImageFromDataUrl(trimmed);
              setIcon(resized);
            } catch {
              console.error('Failed to process pasted data URL');
            } finally {
              setImageProcessing(false);
            }
          }
        });
        return;
      }
    }
  }, [open, processImageFile]);

  useEffect(() => {
    if (open) {
      document.addEventListener('paste', handlePaste);
      return () => document.removeEventListener('paste', handlePaste);
    }
  }, [open, handlePaste]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      await processImageFile(files[0]);
      return;
    }

    const html = e.dataTransfer.getData('text/html');
    if (html) {
      const match = html.match(/src="([^"]+)"/);
      if (match && match[1]) {
        setImageProcessing(true);
        try {
          const resp = await fetch(match[1]);
          const blob = await resp.blob();
          if (blob.type.startsWith('image/')) {
            await processImageFile(blob);
          }
        } catch {
          console.error('Failed to fetch dropped image URL');
        } finally {
          setImageProcessing(false);
        }
        return;
      }
    }

    const text = e.dataTransfer.getData('text/plain');
    if (text && text.startsWith('data:image/')) {
      setImageProcessing(true);
      try {
        const resized = await resizeImageFromDataUrl(text);
        setIcon(resized);
      } catch {
        console.error('Failed to process dropped data URL');
      } finally {
        setImageProcessing(false);
      }
    }
  }, [processImageFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current && !dropZoneRef.current.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      await processImageFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!name.trim()) return;
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

  const isCustomImage = icon.startsWith('data:image/');
  const isKali = theme === 'kali';

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-md max-h-[90vh] overflow-y-auto"
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
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description"
              maxLength={200}
            />
          </div>

          <div className="space-y-2">
            <Label>Icon</Label>

            {/* Current icon preview + image upload zone */}
            <div
              ref={dropZoneRef}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={`relative border-2 border-dashed rounded-lg p-4 transition-colors ${
                isDragOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded border flex items-center justify-center bg-muted shrink-0">
                  {imageProcessing ? (
                    <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-blue-500 rounded-full" />
                  ) : isCustomImage ? (
                    <img src={icon} alt="Custom icon" className="w-14 h-14 object-contain" />
                  ) : (
                    <span className="text-4xl">{icon}</span>
                  )}
                </div>
                <div className="flex flex-col gap-2 flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">
                    Drag & drop an image, paste from clipboard, or upload a file
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs"
                    >
                      <Upload className="w-3 h-3 mr-1" />
                      Upload
                    </Button>
                    {isCustomImage && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIcon('🌐')}
                        className="text-xs"
                      >
                        Clear Image
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {isDragOver && (
                <div className="absolute inset-0 flex items-center justify-center bg-blue-50/80 rounded-lg pointer-events-none">
                  <div className="flex items-center gap-2 text-blue-600 font-medium text-sm">
                    <ImageIcon className="w-5 h-5" />
                    Drop image here
                  </div>
                </div>
              )}
            </div>

            {/* Custom emoji input */}
            <div className="flex gap-1 items-center mt-2">
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
              <span className="text-xs text-muted-foreground ml-2">or pick below:</span>
            </div>

            {/* Emoji grid */}
            <div className="grid grid-cols-8 gap-1 max-h-36 overflow-y-auto p-1 border rounded">
              {ICON_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setIcon(emoji)}
                  className={`w-8 h-8 flex items-center justify-center rounded text-lg hover:bg-accent transition-colors ${
                    icon === emoji ? 'bg-primary/20 ring-1 ring-primary' : ''
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clipboard className="w-3 h-3" />
              Tip: Copy any image and press Ctrl+V to use it as an icon
            </p>
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
          <Button onClick={handleSave} disabled={!name.trim()}>
            {initialData ? 'Save Changes' : 'Add Icon'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
