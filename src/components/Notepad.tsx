import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NotepadProps {
  password: string;
}

export const Notepad = ({ password }: NotepadProps) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [fileMenuOpen, setFileMenuOpen] = useState(false);
  const { toast } = useToast();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();

  // Load content from database via edge function
  useEffect(() => {
    const loadContent = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('notepad', {
          body: { 
            password,
            action: 'get'
          }
        });

        if (error) {
          console.error('Error loading notepad:', error);
          toast({
            title: 'Error',
            description: 'Failed to load notepad content',
            variant: 'destructive',
          });
        } else if (data) {
          setContent(data.content || '');
        }
      } catch (err) {
        console.error('Failed to load notepad:', err);
        toast({
          title: 'Error',
          description: 'Failed to load notepad content',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadContent();
  }, [password, toast]);

  // Manual save function
  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase.functions.invoke('notepad', {
        body: { 
          password,
          action: 'update',
          content
        }
      });

      if (error) {
        console.error('Error saving notepad:', error);
        toast({
          title: 'Error',
          description: 'Failed to save notepad content',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Notepad saved successfully',
        });
      }
    } catch (err) {
      console.error('Failed to save notepad:', err);
      toast({
        title: 'Error',
        description: 'Failed to save notepad content',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
      setFileMenuOpen(false);
    }
  };

  // Auto-save content to database via edge function with debouncing
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.functions.invoke('notepad', {
          body: { 
            password,
            action: 'update',
            content
          }
        });

        if (error) {
          console.error('Error auto-saving notepad:', error);
        }
      } catch (err) {
        console.error('Failed to auto-save notepad:', err);
      }
    }, 2000); // Auto-save 2 seconds after user stops typing

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [content, isLoading, password]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Menu Bar */}
      <div className="flex bg-[hsl(var(--button-face))] border-b border-[hsl(var(--button-shadow))]">
        <DropdownMenu open={fileMenuOpen} onOpenChange={setFileMenuOpen}>
          <DropdownMenuTrigger asChild>
            <div className="px-3 py-1 text-xs hover:bg-[hsl(var(--menu-highlight))] cursor-pointer">
              File
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48">
            <DropdownMenuItem onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="px-3 py-1 text-xs hover:bg-[hsl(var(--menu-highlight))] cursor-pointer">Edit</div>
        <div className="px-3 py-1 text-xs hover:bg-[hsl(var(--menu-highlight))] cursor-pointer">Format</div>
        <div className="px-3 py-1 text-xs hover:bg-[hsl(var(--menu-highlight))] cursor-pointer">View</div>
        <div className="px-3 py-1 text-xs hover:bg-[hsl(var(--menu-highlight))] cursor-pointer">Help</div>
      </div>

      {/* Text Area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      ) : (
        <textarea
          className="flex-1 p-2 text-sm font-mono resize-none outline-none xp-scrollbar"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type here..."
        />
      )}
    </div>
  );
};
