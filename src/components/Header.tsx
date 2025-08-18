'use client';

import { useTranslation } from 'react-i18next';
import { LanguageToggle } from './LanguageToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { 
  UsersIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';

export function Header() {
  const { t } = useTranslation();
  const pathname = usePathname();
  
  // Safely get theme context
  let theme = 'light';
  let toggleTheme = () => {};
  
  try {
    const themeContext = useTheme();
    theme = themeContext.theme;
    toggleTheme = themeContext.toggleTheme;
  } catch (error) {
    // Theme provider not available, use defaults
  }

  const navigation = [
    {
      name: 'Customers & Dashboard',
      href: '/',
      icon: UsersIcon,
      current: pathname === '/' || pathname.startsWith('/customers')
    }
  ];

  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent hover:from-blue-700 hover:to-purple-700 transition-all duration-200">
              {t('app.title')}
            </Link>
            
            <nav className="flex space-x-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                      item.current
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/25'
                        : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-100/70 dark:hover:bg-gray-800/70'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-gray-100/70 hover:bg-gray-200/70 dark:bg-gray-800/70 dark:hover:bg-gray-700/70 transition-all duration-200 hover:scale-105 group"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
              ) : (
                <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300 group-hover:text-yellow-500 transition-colors" />
              )}
            </button>
            
            <LanguageToggle />
            
            <div className="relative">
              <button
                type="button"
                className="flex items-center text-sm transition-all duration-200 hover:scale-105"
              >
                <span className="sr-only">Open user menu</span>
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-200">
                  <span className="text-sm font-bold text-white">U</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
