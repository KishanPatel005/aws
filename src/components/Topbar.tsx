import { Menu, Search, Bell, ChevronDown, LogOut, User, Settings } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface TopbarProps {
  onMenuClick: () => void;
  breadcrumbs: string[];
}

const Topbar = ({ onMenuClick, breadcrumbs }: TopbarProps) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { user, logout, device } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getUserTypeDisplay = (userType: string) => {
    const typeMap: Record<string, string> = {
      'SYSTEM_ADMIN': 'System Admin',
      'MANAGEMENT': 'Management',
      'MANAGER': 'Manager',
      'EMPLOYEE': 'Employee'
    };
    return typeMap[userType] || userType;
  };

  return (
    <header className="sticky top-0 z-40 bg-card border-b border-border shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side - Mobile menu button and breadcrumbs */}
        <div className="flex items-center space-x-4">
          <button
            type="button"
            className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md lg:hidden transition-colors"
            onClick={onMenuClick}
          >
            <Menu className="h-5 w-5" />
          </button>
          
          {/* Breadcrumbs */}
          <div className="hidden sm:flex items-center space-x-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <div key={index} className="flex items-center space-x-2">
                {index > 0 && <span className="text-muted-foreground">/</span>}
                <span className={index === breadcrumbs.length - 1 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                  {crumb}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right side - Search and user menu */}
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="hidden md:block">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="w-64 pl-10 pr-4 py-2 text-sm border border-input bg-background rounded-lg focus:ring-2 focus:ring-ring focus:border-ring"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors">
            <Bell className="h-5 w-5" />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-accent transition-colors"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold text-primary-foreground">
                  {user ? getUserInitials(user.name) : 'U'}
                </span>
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium text-foreground">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user ? getUserTypeDisplay(user.user_type) : 'Unknown'}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* User Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-popover border border-border rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <div className="px-4 py-2 border-b border-border">
                    <p className="text-sm font-medium text-foreground">
                      {user?.name || 'User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {user?.email || 'user@example.com'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Device: {device}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // Navigate to profile settings
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <User className="h-4 w-4 mr-2" />
                    Profile Settings
                  </button>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      // Navigate to account settings
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Account Settings
                  </button>
                  <div className="border-t border-border my-1"></div>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
