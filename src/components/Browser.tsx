import { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Browser = () => {
  const [url, setUrl] = useState('https://www.google.com');
  const [currentUrl, setCurrentUrl] = useState('https://www.google.com');
  const [history, setHistory] = useState<string[]>(['https://www.google.com']);
  const [historyIndex, setHistoryIndex] = useState(0);

  const navigate = (newUrl: string) => {
    let formattedUrl = newUrl.trim();
    
    // Add https:// if no protocol specified
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      // If it looks like a domain, add https://
      if (formattedUrl.includes('.') || formattedUrl.startsWith('localhost')) {
        formattedUrl = 'https://' + formattedUrl;
      } else {
        // Otherwise, search on Google
        formattedUrl = `https://www.google.com/search?q=${encodeURIComponent(formattedUrl)}`;
      }
    }

    // Open in new tab (many sites block iframes)
    window.open(formattedUrl, '_blank');
    
    setCurrentUrl(formattedUrl);
    setUrl(formattedUrl);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(formattedUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(url);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setUrl(history[newIndex]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setCurrentUrl(history[newIndex]);
      setUrl(history[newIndex]);
    }
  };

  const refresh = () => {
    setCurrentUrl(currentUrl + ''); // Force refresh
  };

  const goHome = () => {
    navigate('https://www.google.com');
    setUrl('https://www.google.com');
  };

  return (
    <div className="w-full h-full flex flex-col bg-background">
      {/* Browser toolbar */}
      <div className="flex items-center gap-2 p-2 border-b bg-muted/30">
        <Button
          variant="ghost"
          size="icon"
          onClick={goBack}
          disabled={historyIndex === 0}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goForward}
          disabled={historyIndex === history.length - 1}
          className="h-8 w-8"
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={refresh}
          className="h-8 w-8"
        >
          <RotateCw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={goHome}
          className="h-8 w-8"
        >
          <Home className="h-4 w-4" />
        </Button>
        
        <form onSubmit={handleSubmit} className="flex-1 flex gap-2">
          <Input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL or search..."
            className="flex-1"
          />
          <Button type="submit" size="sm">
            Go
          </Button>
        </form>
      </div>

      {/* Browser content */}
      <div className="w-full h-full flex items-center justify-center bg-muted/10">
        <div className="text-center space-y-4 p-8">
          <Globe className="w-16 h-16 mx-auto text-muted-foreground" />
          <h2 className="text-xl font-semibold">Internet Explorer</h2>
          <p className="text-sm text-muted-foreground max-w-md">
            Enter a URL or search term above and press Go.<br />
            Websites will open in a new tab due to modern security restrictions.
          </p>
        </div>
      </div>
    </div>
  );
};

