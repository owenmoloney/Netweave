import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from './ui/Button';

interface DisconnectedStateProps {
  message?: string;
  onRetry?: () => void;
}

export function DisconnectedState({ message, onRetry }: DisconnectedStateProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-background/95 p-8 text-center">
      <p className="text-lg font-semibold text-text-primary">
        {isOnline ? 'Unable to reach server' : 'You appear to be offline'}
      </p>
      <p className="mt-2 max-w-md text-sm text-text-muted">
        {message ??
          (isOnline
            ? 'The server may be down or unreachable. Check that the API is running.'
            : 'Reconnect to the internet and try again.')}
      </p>
      {onRetry && (
        <Button className="mt-6" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-6xl font-bold text-accent">404</p>
      <h1 className="mt-4 text-xl font-semibold text-text-primary">Page not found</h1>
      <p className="mt-2 text-sm text-text-muted">That route doesn&apos;t exist in Netweave.</p>
      <Link to="/" className="mt-6">
        <Button>Back to graph</Button>
      </Link>
    </div>
  );
}
