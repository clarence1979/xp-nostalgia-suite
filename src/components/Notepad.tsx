import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

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
  const [findDialogOpen, setFindDialogOpen] = useState(false);
  const [replaceDialogOpen, setReplaceDialogOpen] = useState(false);
  const [gotoDialogOpen, setGotoDialogOpen] = useState(false);
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [gotoLineNumber, setGotoLineNumber] = useState('');
  const [fontFamily, setFontFamily] = useState('monospace');
  const [accessLevel, setAccessLevel] = useState<'view' | 'write'>('view');
  const { toast } = useToast();
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isReadOnly = accessLevel === 'view';

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
          setAccessLevel(data.accessLevel || 'view');
          
          if (data.accessLevel === 'view') {
            toast({
              title: 'View-only access',
              description: 'You have read-only access to this notepad',
            });
          }
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
    if (isReadOnly) {
      toast({
        title: 'Access denied',
        description: 'You have view-only access. Use password PVCC321 for write access.',
        variant: 'destructive',
      });
      setFileMenuOpen(false);
      return;
    }

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
          description: error.message || 'Failed to save notepad content',
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

  // File menu handlers
  const handleNew = () => {
    if (content && confirm('Are you sure you want to clear all content?')) {
      setContent('');
      toast({
        title: 'New document',
        description: 'Content cleared',
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Edit menu handlers
  const handleUndo = () => {
    document.execCommand('undo');
  };

  const handleCut = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start === end) return;
      const selectedText = content.substring(start, end);
      navigator.clipboard.writeText(selectedText);
      setContent(content.substring(0, start) + content.substring(end));
      setTimeout(() => textareaRef.current?.setSelectionRange(start, start), 0);
    }
  };

  const handleCopy = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start === end) return;
      const selectedText = content.substring(start, end);
      navigator.clipboard.writeText(selectedText);
      toast({
        description: 'Text copied to clipboard',
      });
    }
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const newContent = content.substring(0, start) + text + content.substring(end);
        setContent(newContent);
        setTimeout(() => textareaRef.current?.setSelectionRange(start + text.length, start + text.length), 0);
      }
    } catch (err) {
      console.error('Failed to read clipboard:', err);
      toast({
        title: 'Error',
        description: 'Failed to access clipboard',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = () => {
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start === end) return;
      setContent(content.substring(0, start) + content.substring(end));
      setTimeout(() => textareaRef.current?.setSelectionRange(start, start), 0);
    }
  };

  const handleSelectAll = () => {
    textareaRef.current?.select();
  };

  const handleTimeDate = () => {
    const now = new Date();
    const timeDate = now.toLocaleString();
    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const newContent = content.substring(0, start) + timeDate + content.substring(start);
      setContent(newContent);
      setTimeout(() => textareaRef.current?.setSelectionRange(start + timeDate.length, start + timeDate.length), 0);
    }
  };

  const handleFind = () => {
    setFindDialogOpen(true);
  };

  const performFind = (next = false) => {
    if (!findText || !textareaRef.current) return;
    
    const currentPos = next ? (textareaRef.current.selectionEnd || 0) : 0;
    const searchContent = content.toLowerCase();
    const searchTerm = findText.toLowerCase();
    
    const index = searchContent.indexOf(searchTerm, currentPos);
    
    if (index !== -1) {
      textareaRef.current.setSelectionRange(index, index + findText.length);
      textareaRef.current.focus();
    } else {
      toast({
        title: 'Not found',
        description: `Cannot find "${findText}"`,
      });
    }
  };

  const handleReplace = () => {
    setReplaceDialogOpen(true);
  };

  const performReplace = () => {
    if (!textareaRef.current || !findText) return;
    
    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const selectedText = content.substring(start, end);
    
    if (selectedText.toLowerCase() === findText.toLowerCase()) {
      const newContent = content.substring(0, start) + replaceText + content.substring(end);
      setContent(newContent);
      setTimeout(() => textareaRef.current?.setSelectionRange(start + replaceText.length, start + replaceText.length), 0);
    }
    performFind(true);
  };

  const performReplaceAll = () => {
    if (!findText) return;
    
    const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const newContent = content.replace(regex, replaceText);
    const count = (content.match(regex) || []).length;
    
    setContent(newContent);
    toast({
      description: `Replaced ${count} occurrence${count !== 1 ? 's' : ''}`,
    });
  };

  const handleGoTo = () => {
    setGotoDialogOpen(true);
  };

  const performGoTo = () => {
    const lineNum = parseInt(gotoLineNumber);
    if (isNaN(lineNum) || lineNum < 1) return;
    
    const lines = content.split('\n');
    if (lineNum > lines.length) {
      toast({
        title: 'Error',
        description: `Line number is beyond the end of file (max: ${lines.length})`,
        variant: 'destructive',
      });
      return;
    }
    
    let position = 0;
    for (let i = 0; i < lineNum - 1; i++) {
      position += lines[i].length + 1; // +1 for newline
    }
    
    textareaRef.current?.setSelectionRange(position, position);
    textareaRef.current?.focus();
    setGotoDialogOpen(false);
  };

  // Format menu handlers
  const toggleWordWrap = () => {
    setWordWrap(!wordWrap);
  };

  const handleFont = () => {
    const fonts = ['monospace', 'sans-serif', 'serif', 'Arial', 'Courier New', 'Georgia', 'Times New Roman', 'Verdana'];
    const currentIndex = fonts.indexOf(fontFamily);
    const nextIndex = (currentIndex + 1) % fonts.length;
    setFontFamily(fonts[nextIndex]);
    toast({
      description: `Font changed to ${fonts[nextIndex]}`,
    });
  };

  // View menu handlers
  const toggleStatusBar = () => {
    setShowStatusBar(!showStatusBar);
  };

  const handleZoomIn = () => {
    setFontSize(prev => Math.min(prev + 2, 48));
  };

  const handleZoomOut = () => {
    setFontSize(prev => Math.max(prev - 2, 8));
  };

  const handleZoomReset = () => {
    setFontSize(14);
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
    if (isLoading || isReadOnly) return; // Don't save during initial load or if read-only

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
  }, [content, isLoading, isReadOnly, password]);

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
            <DropdownMenuItem onClick={handleNew} disabled={isReadOnly}>New</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSave} disabled={isSaving || isReadOnly}>
              {isSaving ? 'Saving...' : isReadOnly ? 'Save (Read-only)' : 'Save'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handlePrint}>Print...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <DropdownMenu open={editMenuOpen} onOpenChange={setEditMenuOpen}>
          <DropdownMenuTrigger asChild>
            <div className="px-3 py-1 text-xs hover:bg-[hsl(var(--menu-highlight))] cursor-pointer">
              Edit
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-gray-800 z-50">
            <DropdownMenuItem onClick={handleUndo} disabled={isReadOnly}>Undo</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleCut} disabled={isReadOnly}>Cut</DropdownMenuItem>
            <DropdownMenuItem onClick={handleCopy}>Copy</DropdownMenuItem>
            <DropdownMenuItem onClick={handlePaste} disabled={isReadOnly}>Paste</DropdownMenuItem>
            <DropdownMenuItem onClick={handleDelete} disabled={isReadOnly}>Delete</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleFind}>Find...</DropdownMenuItem>
            <DropdownMenuItem onClick={() => performFind(true)}>Find Next</DropdownMenuItem>
            <DropdownMenuItem onClick={handleReplace} disabled={isReadOnly}>Replace...</DropdownMenuItem>
            <DropdownMenuItem onClick={handleGoTo}>Go To...</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSelectAll}>Select All</DropdownMenuItem>
            <DropdownMenuItem onClick={handleTimeDate} disabled={isReadOnly}>Time/Date</DropdownMenuItem>
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
            <DropdownMenuItem onClick={handleFont}>Font...</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu open={viewMenuOpen} onOpenChange={setViewMenuOpen}>
          <DropdownMenuTrigger asChild>
            <div className="px-3 py-1 text-xs hover:bg-[hsl(var(--menu-highlight))] cursor-pointer">
              View
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-48 bg-white dark:bg-gray-800 z-50">
            <DropdownMenuItem onClick={handleZoomIn}>Zoom In</DropdownMenuItem>
            <DropdownMenuItem onClick={handleZoomOut}>Zoom Out</DropdownMenuItem>
            <DropdownMenuItem onClick={handleZoomReset}>Restore Default Zoom</DropdownMenuItem>
            <DropdownMenuSeparator />
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
            className="flex-1 p-2 text-sm resize-none outline-none xp-scrollbar"
            style={{
              fontSize: `${fontSize}px`,
              fontFamily: fontFamily,
              whiteSpace: wordWrap ? 'pre-wrap' : 'pre',
              overflowWrap: wordWrap ? 'break-word' : 'normal',
              overflowX: wordWrap ? 'hidden' : 'auto',
              backgroundColor: isReadOnly ? '#f5f5f5' : 'white',
              cursor: isReadOnly ? 'not-allowed' : 'text'
            }}
            value={content}
            onChange={(e) => !isReadOnly && setContent(e.target.value)}
            placeholder={isReadOnly ? 'View-only mode - Use password PVCC321 for write access' : 'Type here...'}
            readOnly={isReadOnly}
          />
          
          {/* Status Bar */}
          {showStatusBar && (
            <div className="flex justify-between items-center px-2 py-1 bg-[hsl(var(--button-face))] border-t border-[hsl(var(--button-shadow))] text-xs">
              <div className="flex gap-4">
                <span>Ln {getLineAndColumn().line}, Col {getLineAndColumn().col}</span>
                <span className={isReadOnly ? 'text-orange-600 font-semibold' : 'text-green-600'}>
                  {isReadOnly ? '🔒 Read-only' : '✓ Writable'}
                </span>
              </div>
              <span>Zoom: {Math.round((fontSize / 14) * 100)}%</span>
            </div>
          )}
        </>
      )}

      {/* Find Dialog */}
      <Dialog open={findDialogOpen} onOpenChange={setFindDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Find</DialogTitle>
            <DialogDescription>Enter text to search for</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="find-text">Find what:</Label>
              <Input
                id="find-text"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performFind()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => performFind()}>Find Next</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Replace Dialog */}
      <Dialog open={replaceDialogOpen} onOpenChange={setReplaceDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Replace</DialogTitle>
            <DialogDescription>Find and replace text</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="replace-find">Find what:</Label>
              <Input
                id="replace-find"
                value={findText}
                onChange={(e) => setFindText(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="replace-with">Replace with:</Label>
              <Input
                id="replace-with"
                value={replaceText}
                onChange={(e) => setReplaceText(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => performFind()}>Find Next</Button>
            <Button variant="outline" onClick={performReplace}>Replace</Button>
            <Button onClick={performReplaceAll}>Replace All</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Go To Dialog */}
      <Dialog open={gotoDialogOpen} onOpenChange={setGotoDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Go To Line</DialogTitle>
            <DialogDescription>Enter line number</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="goto-line">Line number:</Label>
              <Input
                id="goto-line"
                type="number"
                min="1"
                value={gotoLineNumber}
                onChange={(e) => setGotoLineNumber(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && performGoTo()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={performGoTo}>Go To</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
