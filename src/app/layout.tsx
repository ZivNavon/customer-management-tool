'use client';

import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ThemeProvider } from '@/components/ThemeProvider';
import '../lib/i18n';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [queryClient] = useState(() => new QueryClient());
  const { i18n } = useTranslation();
  const [direction, setDirection] = useState('ltr');

  useEffect(() => {
    const savedLang = localStorage.getItem('language') || 'en';
    i18n.changeLanguage(savedLang);
    setDirection(savedLang === 'he' ? 'rtl' : 'ltr');
  }, [i18n]);

  useEffect(() => {
    setDirection(i18n.language === 'he' ? 'rtl' : 'ltr');
  }, [i18n.language]);

  return (
    <html lang={i18n.language} dir={direction}>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased transition-colors duration-200`}
      >
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
              {children}
            </div>
          </QueryClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
