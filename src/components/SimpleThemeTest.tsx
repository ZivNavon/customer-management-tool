'use client';

import { useState, useEffect } from 'react';

export function SimpleThemeTest() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Apply dark class directly to test
    if (isDark) {
      document.documentElement.classList.add('dark');
      console.log('Added dark class to html element');
    } else {
      document.documentElement.classList.remove('dark');
      console.log('Removed dark class from html element');
    }
    
    console.log('Current html classes:', document.documentElement.className);
  }, [isDark]);

  return (
    <div className="fixed top-4 right-4 z-50 p-4 bg-white dark:bg-gray-800 border dark:border-gray-600 rounded-lg shadow-lg">
      <h3 className="text-lg font-bold mb-2 text-gray-900 dark:text-white">Theme Test</h3>
      <p className="mb-2 text-gray-600 dark:text-gray-300">
        Current mode: {isDark ? 'Dark' : 'Light'}
      </p>
      <button
        onClick={() => setIsDark(!isDark)}
        className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded dark:bg-blue-600 dark:hover:bg-blue-700"
      >
        Toggle Theme
      </button>
      <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded">
        <p className="text-sm text-gray-700 dark:text-gray-200">
          This should change color in dark mode
        </p>
      </div>
    </div>
  );
}
