import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotepadProps {
  password: string;
}

export const Notepad = ({ password }: NotepadProps) => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

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

  // Auto-save content to database via edge function with debouncing
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load

    const timeoutId = setTimeout(async () => {
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
        }
      } catch (err) {
        console.error('Failed to save notepad:', err);
        toast({
          title: 'Error',
          description: 'Failed to save notepad content',
          variant: 'destructive',
        });
      }
    }, 1000); // Save 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [content, isLoading, password, toast]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Menu Bar */}
      <div className="flex bg-[hsl(var(--button-face))] border-b border-[hsl(var(--button-shadow))]">
        <div className="px-3 py-1 text-xs hover:bg-[hsl(var(--menu-highlight))] cursor-pointer">File</div>
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
