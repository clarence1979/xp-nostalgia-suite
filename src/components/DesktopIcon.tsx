interface DesktopIconProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  position?: { x: number; y: number };
}

export const DesktopIcon = ({ icon, label, onClick, position }: DesktopIconProps) => {
  return (
    <div
      className="desktop-icon absolute"
      style={position ? { left: position.x, top: position.y } : undefined}
      onDoubleClick={onClick}
    >
      <div className="text-4xl">{icon}</div>
      <span className="text-white text-xs text-center">{label}</span>
    </div>
  );
};
