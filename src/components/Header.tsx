import { Menu, Bell, User, MapPin, LogOut, Settings, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface HeaderProps {
  onMenuClick?: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, profile, isAdmin, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 humanitarian-header shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-primary-foreground hover:bg-primary-foreground/10 lg:hidden"
              onClick={onMenuClick}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div 
              className="flex items-center gap-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <MapPin className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Badbaado Aid Track</h1>
                <p className="text-xs text-primary-foreground/70 hidden sm:block">Humanitarian Coordination</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          {user && (
            <nav className="hidden md:flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className={`text-primary-foreground hover:bg-primary-foreground/10 ${
                  location.pathname === '/' ? 'bg-primary-foreground/10' : ''
                }`}
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-1.5" />
                Dashboard
              </Button>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-primary-foreground hover:bg-primary-foreground/10 ${
                    location.pathname === '/admin' ? 'bg-primary-foreground/10' : ''
                  }`}
                  onClick={() => navigate('/admin')}
                >
                  <Settings className="w-4 h-4 mr-1.5" />
                  Admin
                </Button>
              )}
            </nav>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            {user && (
              <>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/10 relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-2 right-2 w-2 h-2 bg-status-unaided rounded-full" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-primary-foreground hover:bg-primary-foreground/10"
                    >
                      <User className="w-5 h-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span>{profile?.fullName || 'User'}</span>
                        <span className="text-xs text-muted-foreground font-normal">{user.email}</span>
                        {profile?.organizationName && (
                          <span className="text-xs text-muted-foreground font-normal">
                            {profile.organizationName}
                          </span>
                        )}
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/')}>
                      <Home className="w-4 h-4 mr-2" />
                      Dashboard
                    </DropdownMenuItem>
                    {isAdmin && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Admin Panel
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            )}
            
            {!user && (
              <Button
                variant="ghost"
                size="sm"
                className="text-primary-foreground hover:bg-primary-foreground/10"
                onClick={() => navigate('/auth')}
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
