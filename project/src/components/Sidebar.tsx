import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onOpen?: () => void;
  title: string;
  children: React.ReactNode;
  position: 'left' | 'right';
}

export default function Sidebar({ isOpen, onClose, onOpen, title, children, position }: SidebarProps) {
  useEffect(() => {
    if (isOpen && onOpen) {
      onOpen();
    }
  }, [isOpen, onOpen]);

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:relative inset-y-0 z-50 w-80 bg-white border-gray-200 transform transition-transform duration-300 ease-in-out
          ${position === 'left' ? 'left-0 border-r' : 'right-0 border-l'}
          ${isOpen ? 'translate-x-0' : position === 'left' ? '-translate-x-full' : 'translate-x-full'}
          lg:${isOpen ? 'block' : 'hidden'}
        `}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto h-full pb-20">
          {children}
        </div>
      </div>
    </>
  );
}