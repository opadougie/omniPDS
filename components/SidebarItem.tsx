
import React from 'react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ icon, label, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 group
        ${active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
          : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-100'
        }`}
    >
      <div className={`${active ? 'text-white' : 'text-gray-400 group-hover:text-blue-400'}`}>
        {/* Fix: Cast icon to React.ReactElement with size prop to resolve TypeScript error */}
        {React.cloneElement(icon as React.ReactElement<{ size?: number }>, { size: 20 })}
      </div>
      <span className="hidden md:block font-medium">{label}</span>
    </button>
  );
};

export default SidebarItem;
