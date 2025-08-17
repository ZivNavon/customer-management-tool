'use client';

import { useTranslation } from 'react-i18next';
import { LanguageToggle } from './LanguageToggle';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from './ThemeProvider';
import { 
  ChartBarIcon, 
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
      name: 'Dashboard',
      href: '/dashboard',
      icon: ChartBarIcon,
      current: pathname === '/dashboard'
    },
    {
      name: 'Customers',
      href: '/',
      icon: UsersIcon,
      current: pathname === '/' || pathname.startsWith('/customers')
    }
  ];

  return (
    <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-8">
            <Link href="/" className="text-xl font-semibold text-gray-900 dark:text-gray-100 hover:text-blue-600 dark:hover:text-blue-400">
              {t('app.title')}
            </Link>
            
            <nav className="flex space-x-4">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      item.current
                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="h-4 w-4 mr-2" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <MoonIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              ) : (
                <SunIcon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              )}
            </button>
            
            <LanguageToggle />
            
            <div className="relative">
              <button
                type="button"
                className="flex items-center text-sm text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                <span className="sr-only">Open user menu</span>
                <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">U</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
