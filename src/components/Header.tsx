import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { NotificationsDropdown } from './NotificationsDropdown';

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 shadow-sm" style={{ backgroundColor: '#dbeafe' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Title */}
          <div 
            className="cursor-pointer"
            onClick={() => navigate('/')}
          >
            <h1 className="text-lg font-bold leading-tight" style={{ color: '#2563EB' }}>
              Badbaado Aid Track
            </h1>
          </div>

          {/* Notification Bell */}
          {user && (
            <div style={{ color: '#2563EB' }}>
              <NotificationsDropdown />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
