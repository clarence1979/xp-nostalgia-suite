import { useState } from 'react';

export const Notepad = () => {
  const [content, setContent] = useState('');

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
      <textarea
        className="flex-1 p-2 text-sm font-mono resize-none outline-none xp-scrollbar"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Type here..."
      />
    </div>
  );
};
