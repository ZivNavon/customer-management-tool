'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the main page since dashboard is now integrated
    router.replace('/');
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Redirecting to Customer Dashboard...
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          The dashboard has been integrated with the customers view.
        </p>
      </div>
    </div>
  );
}
