import { MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { NotificationsDropdown } from './NotificationsDropdown';

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 bg-primary shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Title */}
          <div 
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
              <MapPin className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div>
              <h1 className="text-base font-bold text-primary-foreground leading-tight">
                Badbaado Aid Track
              </h1>
            </div>
          </div>

          {/* Notification Bell */}
          {user && (
            <div className="text-primary-foreground">
              <NotificationsDropdown />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
