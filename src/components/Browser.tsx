import { useState } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export const Browser = () => {
  const [url, setUrl] = useState('about:blank');
  const [currentUrl, setCurrentUrl] = useState('about:blank');
  const [history, setHistory] = useState<string[]>(['about:blank']);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = (newUrl: string) => {
    let formattedUrl = newUrl.trim();
    
    if (!formattedUrl) return;
    
    // Add https:// if no protocol specified
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://') && !formattedUrl.startsWith('about:')) {
      // If it looks like a domain, add https://
      if (formattedUrl.includes('.') || formattedUrl.startsWith('localhost')) {
        formattedUrl = 'https://' + formattedUrl;
      } else {
        // Search query - open in new tab
        window.open(`https://duckduckgo.com/?q=${encodeURIComponent(formattedUrl)}`, '_blank');
        return;
      }
    }

    // Try to load in iframe, but most sites will block this
    setCurrentUrl(formattedUrl);
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
    setCurrentUrl('about:blank');
    setUrl('about:blank');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.open(`https://duckduckgo.com/?q=${encodeURIComponent(searchQuery)}`, '_blank');
    }
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
      {currentUrl === 'about:blank' ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
          <div className="text-center space-y-6 p-8 max-w-2xl">
            <Globe className="w-20 h-20 mx-auto text-blue-500" />
            <h1 className="text-4xl font-bold text-gray-800 dark:text-gray-100">Internet Explorer</h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Search the web or enter a URL above
            </p>
            
            <form onSubmit={handleSearch} className="mt-8">
              <div className="flex gap-2 max-w-xl mx-auto">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search DuckDuckGo..."
                  className="flex-1 h-12 text-lg"
                />
                <Button type="submit" size="lg" className="px-8">
                  Search
                </Button>
              </div>
            </form>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
              Note: Most websites block iframe embedding for security. Sites may open in new tabs.
            </p>
          </div>
        </div>
      ) : (
        <iframe
          key={currentUrl}
          src={currentUrl}
          className="w-full h-full border-none"
          title="Browser"
          allow="camera; microphone; geolocation; fullscreen"
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        />
      )}
    </div>
  );
};

