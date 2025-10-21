interface DesktopIconProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  position?: { x: number; y: number };
  description?: string;
}

export const DesktopIcon = ({ icon, label, onClick, position, description }: DesktopIconProps) => {
  return (
    <div
      className="desktop-icon absolute group"
      style={position ? { left: position.x, top: position.y } : undefined}
      onDoubleClick={onClick}
      title={description}
    >
      <div className="text-4xl">{icon}</div>
      <span className="text-white text-xs text-center">{label}</span>
      {description && (
        <div className="absolute hidden group-hover:block bg-yellow-100 border border-gray-800 text-black text-xs p-2 rounded shadow-lg z-50 w-64 left-1/2 transform -translate-x-1/2 top-full mt-1">
          {description}
        </div>
      )}
    </div>
  );
};
