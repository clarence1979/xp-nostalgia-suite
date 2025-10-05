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
  const [editMenuOpen, setEditMenuOpen] = useState(false);
  const [formatMenuOpen, setFormatMenuOpen] = useState(false);
  const [viewMenuOpen, setViewMenuOpen] = useState(false);
  const [wordWrap, setWordWrap] = useState(true);
  const [showStatusBar, setShowStatusBar] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const { toast } = useToast();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  // Edit menu handlers
  const handleUndo = () => {
    document.execCommand('undo');
  };

  const handleCut = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = content.substring(start, end);
      navigator.clipboard.writeText(selectedText);
      setContent(content.substring(0, start) + content.substring(end));
    }
  };

  const handleCopy = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      const selectedText = content.substring(start, end);
      navigator.clipboard.writeText(selectedText);
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        setContent(content.substring(0, start) + text + content.substring(end));
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
    }
  };

  const handleSelectAll = () => {
    textareaRef.current?.select();
  };

  const handleFind = () => {
    const searchTerm = prompt('Find:');
    if (searchTerm && textareaRef.current) {
      const index = content.toLowerCase().indexOf(searchTerm.toLowerCase());
      if (index !== -1) {
        textareaRef.current.setSelectionRange(index, index + searchTerm.length);
        textareaRef.current.focus();
      } else {
        toast({
          title: 'Not found',
          description: `"${searchTerm}" not found in document`,
        });
      }
    }
  };

  // Format menu handlers
  const toggleWordWrap = () => {
    setWordWrap(!wordWrap);
  };

  const increaseFontSize = () => {
    setFontSize(prev => Math.min(prev + 2, 32));
  };

  const decreaseFontSize = () => {
    setFontSize(prev => Math.max(prev - 2, 8));
  };

  const resetFontSize = () => {
    setFontSize(14);
  };

  // View menu handlers
  const toggleStatusBar = () => {
    setShowStatusBar(!showStatusBar);
  };

  // Calculate line and column for status bar
  const getLineAndColumn = () => {
    if (!textareaRef.current) return { line: 1, col: 1 };
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    return {
      line: lines.length,
      col: lines[lines.length - 1].length + 1
    };
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
          <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-gray-800 z-50">
            <DropdownMenuItem onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu open={editMenuOpen} onOpenChange={setEditMenuOpen}>
          <DropdownMenuTrigger asChild>
            <div className="px-3 py-1 text-xs hover:bg-[hsl(var(--menu-highlight))] cursor-pointer">
              Edit
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-gray-800 z-50">
            <DropdownMenuItem onClick={handleUndo}>Undo</DropdownMenuItem>
            <DropdownMenuItem onClick={handleCut}>Cut</DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>Copy</DropdownMenuItem>
            <DropdownMenuItem onClick={handlePaste}>Paste</DropdownMenuItem>
            <DropdownMenuItem onClick={handleSelectAll}>Select All</DropdownMenuItem>
            <DropdownMenuItem onClick={handleFind}>Find...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={formatMenuOpen} onOpenChange={setFormatMenuOpen}>
          <DropdownMenuTrigger asChild>
            <div className="px-3 py-1 text-xs hover:bg-[hsl(var(--menu-highlight))] cursor-pointer">
              Format
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-gray-800 z-50">
            <DropdownMenuItem onClick={toggleWordWrap}>
              {wordWrap ? '✓ ' : ''}Word Wrap
            </DropdownMenuItem>
            <DropdownMenuItem onClick={increaseFontSize}>Font Size +</DropdownMenuItem>
            <DropdownMenuItem onClick={decreaseFontSize}>Font Size -</DropdownMenuItem>
            <DropdownMenuItem onClick={resetFontSize}>Reset Font Size</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={viewMenuOpen} onOpenChange={setViewMenuOpen}>
          <DropdownMenuTrigger asChild>
            <div className="px-3 py-1 text-xs hover:bg-[hsl(var(--menu-highlight))] cursor-pointer">
              View
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-gray-800 z-50">
            <DropdownMenuItem onClick={toggleStatusBar}>
              {showStatusBar ? '✓ ' : ''}Status Bar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Text Area */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          Loading...
        </div>
      ) : (
        <>
          <textarea
            ref={textareaRef}
            className="flex-1 p-2 text-sm font-mono resize-none outline-none xp-scrollbar"
            style={{
              fontSize: `${fontSize}px`,
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              overflowWrap: wordWrap ? 'break-word' : 'normal',
              overflowX: wordWrap ? 'hidden' : 'auto'
            }}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type here..."
          />
          
          {/* Status Bar */}
          {showStatusBar && (
            <div className="flex justify-end items-center px-2 py-1 bg-[hsl(var(--button-face))] border-t border-[hsl(var(--button-shadow))] text-xs">
              <span>Ln {getLineAndColumn().line}, Col {getLineAndColumn().col}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
};
