import React, { useRef } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const ThemeToggle: React.FC = () => {
  const { theme, setTheme, effectiveTheme } = useTheme();
  const toggleButtonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  const themes = [
    { 
      value: 'light' as const, 
      label: 'Light theme', 
      icon: Sun,
      description: 'Light mode'
    },
    { 
      value: 'dark' as const, 
      label: 'Dark theme', 
      icon: Moon,
      description: 'Dark mode'
    },
    { 
      value: 'system' as const, 
      label: 'System theme', 
      icon: Monitor,
      description: 'System preference'
    },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[2];
  const CurrentIcon = currentTheme.icon;

  const closeDropdown = () => {
    if (dropdownRef.current && toggleButtonRef.current && overlayRef.current) {
      dropdownRef.current.style.display = 'none';
      overlayRef.current.style.display = 'none';
      toggleButtonRef.current.setAttribute('aria-expanded', 'false');
    }
  };

  const openDropdown = () => {
    if (dropdownRef.current && toggleButtonRef.current && overlayRef.current) {
      dropdownRef.current.style.display = 'block';
      overlayRef.current.style.display = 'block';
      toggleButtonRef.current.setAttribute('aria-expanded', 'true');
    }
  };

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (dropdownRef.current) {
      const isVisible = dropdownRef.current.style.display === 'block';
      if (isVisible) {
        closeDropdown();
      } else {
        openDropdown();
      }
    }
  };

  const handleToggleBlur = () => {
    // Close dropdown if focus leaves the toggle button and dropdown
    setTimeout(() => {
      if (dropdownRef.current) {
        const activeElement = document.activeElement;
        if (!dropdownRef.current.contains(activeElement) && activeElement !== toggleButtonRef.current) {
          closeDropdown();
        }
      }
    }, 150);
  };

  const handleThemeSelect = (themeValue: typeof theme) => {
    setTheme(themeValue);
    closeDropdown();
    toggleButtonRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent, buttons: HTMLButtonElement[], currentIndex: number) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % buttons.length;
        buttons[nextIndex].focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + buttons.length) % buttons.length;
        buttons[prevIndex].focus();
        break;
      case 'Escape':
        e.preventDefault();
        closeDropdown();
        toggleButtonRef.current?.focus();
        break;
    }
  };

  return (
    <div className="relative">
      <button
        ref={toggleButtonRef}
        type="button"
        className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
        aria-label={`Current theme: ${currentTheme.description}. Click to change theme.`}
        aria-expanded="false"
        aria-haspopup="true"
        onClick={handleToggleClick}
        onBlur={handleToggleBlur}
      >
        <CurrentIcon className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">{currentTheme.description}</span>
      </button>

      {/* Dropdown menu */}
      <div
        ref={dropdownRef}
        className="fixed sm:absolute left-1/2 -translate-x-1/2 top-16 sm:top-auto sm:right-0 sm:left-auto sm:translate-x-0 sm:mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-600 py-2 z-50 transition-all duration-200"
        style={{ display: 'none' }}
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="theme-menu-button"
      >
        <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            Choose theme
          </h3>
        </div>
        
        {themes.map((themeOption) => {
          const IconComponent = themeOption.icon;
          const isSelected = theme === themeOption.value;
          const isEffectiveTheme = effectiveTheme === themeOption.value || 
            (themeOption.value === 'system' && theme === 'system');
          
          return (
            <button
              key={themeOption.value}
              type="button"
              className={`w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:ring-inset ${
                isSelected 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                  : 'text-gray-700 dark:text-gray-200'
              }`}
              role="menuitem"
              aria-label={`Switch to ${themeOption.description}`}
              onClick={() => handleThemeSelect(themeOption.value)}
              onKeyDown={(e) => {
                if (dropdownRef.current) {
                  const buttons = Array.from(
                    dropdownRef.current.querySelectorAll('button[role="menuitem"]')
                  ) as HTMLButtonElement[];
                  const currentIndex = buttons.indexOf(e.currentTarget as HTMLButtonElement);
                  handleKeyDown(e, buttons, currentIndex);
                }
              }}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className="h-4 w-4" aria-hidden="true" />
                <span>{themeOption.description}</span>
              </div>
              {isSelected && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full" aria-hidden="true"></div>
                  <span className="sr-only">Currently selected</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Click outside to close */}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-40"
        style={{ display: 'none' }}
        onClick={closeDropdown}
      />
    </div>
  );
};

export default ThemeToggle;