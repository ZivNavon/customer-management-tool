'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface PriorityDropdownProps {
  currentPriority: 'low' | 'medium' | 'high';
  onPriorityChange: (priority: 'low' | 'medium' | 'high') => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}

const priorityConfig = {
  low: {
    label: 'Low',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
    borderColor: 'border-green-200 dark:border-green-800',
    dotColor: 'bg-green-500'
  },
  medium: {
    label: 'Medium',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    borderColor: 'border-yellow-200 dark:border-yellow-800',
    dotColor: 'bg-yellow-500'
  },
  high: {
    label: 'High',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-900/20',
    borderColor: 'border-red-200 dark:border-red-800',
    dotColor: 'bg-red-500'
  }
};

export default function PriorityDropdown({ 
  currentPriority, 
  onPriorityChange, 
  disabled = false,
  size = 'md'
}: PriorityDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const currentConfig = priorityConfig[currentPriority];
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-sm';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-4 h-4';
  const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && dropdownRef.current && buttonRef.current) {
      const dropdown = dropdownRef.current;
      const button = buttonRef.current;
      const rect = button.getBoundingClientRect();
      const dropdownRect = dropdown.getBoundingClientRect();
      
      // Check if dropdown would go off the right edge
      if (rect.left + dropdownRect.width > window.innerWidth) {
        dropdown.style.right = '0';
        dropdown.style.left = 'auto';
      } else {
        dropdown.style.left = '0';
        dropdown.style.right = 'auto';
      }
      
      // Check if dropdown would go off the bottom edge
      if (rect.bottom + dropdownRect.height > window.innerHeight) {
        dropdown.style.bottom = '100%';
        dropdown.style.top = 'auto';
        dropdown.style.marginBottom = '4px';
      } else {
        dropdown.style.top = '100%';
        dropdown.style.bottom = 'auto';
        dropdown.style.marginTop = '4px';
      }
    }
  }, [isOpen]);

  const handlePrioritySelect = (priority: 'low' | 'medium' | 'high') => {
    onPriorityChange(priority);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        ref={buttonRef}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) {
            setIsOpen(!isOpen);
          }
        }}
        disabled={disabled}
        className={`
          inline-flex items-center gap-1.5 font-medium rounded-md border transition-all duration-200
          ${sizeClasses}
          ${currentConfig.color}
          ${currentConfig.bgColor}
          ${currentConfig.borderColor}
          ${disabled 
            ? 'opacity-50 cursor-not-allowed' 
            : 'hover:shadow-sm hover:scale-105 cursor-pointer active:scale-95'
          }
        `}
        title={disabled ? undefined : 'Click to change priority'}
      >
        <div className={`rounded-full ${dotSize} ${currentConfig.dotColor}`} />
        <span>{currentConfig.label}</span>
        {!disabled && (
          <ChevronDownIcon 
            className={`${iconSize} transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`} 
          />
        )}
      </button>

      {isOpen && !disabled && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div 
            className="absolute z-20 min-w-[120px] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1"
            style={{ position: 'absolute' }}
          >
            {(Object.keys(priorityConfig) as Array<'low' | 'medium' | 'high'>).map((priority) => {
              const config = priorityConfig[priority];
              const isSelected = priority === currentPriority;
              
              return (
                <button
                  key={priority}
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePrioritySelect(priority);
                  }}
                  className={`
                    w-full px-3 py-2 text-left flex items-center gap-2 transition-colors duration-150
                    ${isSelected 
                      ? `${config.bgColor} ${config.color}` 
                      : 'hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <div className={`w-2 h-2 rounded-full ${config.dotColor}`} />
                  <span className="text-sm font-medium">{config.label}</span>
                  {isSelected && (
                    <div className="ml-auto">
                      <div className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
