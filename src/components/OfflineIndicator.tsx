import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl border border-[#d4af37]/50 bg-[#14120c]/95 px-3.5 py-2 font-mono text-xs font-medium text-[#fde68a] shadow-lg backdrop-blur-sm">
      <WifiOff className="h-3.5 w-3.5 text-[#d4af37]" />
      <span>Offline Mode — Using cached data</span>
    </div>
  );
}
