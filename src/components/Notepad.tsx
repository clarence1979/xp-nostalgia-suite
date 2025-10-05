import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const NOTEPAD_ID = '00000000-0000-0000-0000-000000000001';

export const Notepad = () => {
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load content from database
  useEffect(() => {
    const loadContent = async () => {
      const { data, error } = await supabase
        .from('notepad')
        .select('content')
        .eq('id', NOTEPAD_ID)
        .single();

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
      setIsLoading(false);
    };

    loadContent();
  }, [toast]);

  // Auto-save content to database with debouncing
  useEffect(() => {
    if (isLoading) return; // Don't save during initial load

    const timeoutId = setTimeout(async () => {
      const { error } = await supabase
        .from('notepad')
        .update({ content })
        .eq('id', NOTEPAD_ID);

      if (error) {
        console.error('Error saving notepad:', error);
        toast({
          title: 'Error',
          description: 'Failed to save notepad content',
          variant: 'destructive',
        });
      }
    }, 1000); // Save 1 second after user stops typing

    return () => clearTimeout(timeoutId);
  }, [content, isLoading, toast]);

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
