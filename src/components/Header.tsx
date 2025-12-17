import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { NotificationsDropdown } from './NotificationsDropdown';
import logo from '@/assets/logo-new.png';

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50 shadow-sm" style={{ backgroundColor: '#d5f2e3' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo and Title */}
          <div 
            className="flex items-center gap-1 cursor-pointer"
            onClick={() => navigate('/')}
          >
            <img src={logo} alt="Badbaado Aid Track" className="w-14 h-14 object-contain" />
            <h1 className="text-lg font-bold leading-tight" style={{ color: '#2E8B57' }}>
              Badbaado Aid Track
            </h1>
          </div>

          {/* Notification Bell */}
          {user && (
            <div style={{ color: '#2E8B57' }}>
              <NotificationsDropdown />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
