import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CreditCard,
  Calculator,
  Hammer,
  Package,
  BookOpen,
  DollarSign,
  ArrowRightLeft,
  MapPin,
  Home, // New import for resale
  X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation();
  const { user, hasPermission, hasDeviceAccess, device } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      module: 'dashboard',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Users',
      href: '/users',
      icon: Users,
      module: 'employee_master',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Expenses',
      href: '/expenses',
      icon: CreditCard,
      module: 'expense_salary',
      action: 'R',
      deviceAccess: false // Desktop only
    },
    {
      name: 'Salaries',
      href: '/salary-booking',
      icon: Calculator,
      module: 'expense_salary',
      action: 'R',
      deviceAccess: false // Desktop only
    },
    {
      name: 'Builders',
      href: '/builders',
      icon: Hammer,
      module: 'builder',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Projects',
      href: '/projects',
      icon: Building2,
      module: 'project',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Inventory',
      href: '/inventory',
      icon: Package,
      module: 'inventory',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Bookings',
      href: '/bookings',
      icon: BookOpen,
      module: 'booking',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Payment Collection',
      href: '/payments',
      icon: DollarSign,
      module: 'payment_collection',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Brokerage Mapping',
      href: '/brokerage/mapping',
      icon: ArrowRightLeft,
      module: 'brokerage_mapping',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Brokerage Distribution',
      href: '/brokerage/distribution',
      icon: DollarSign,
      module: 'brokerage_distribution',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Lands',
      href: '/lands',
      icon: MapPin,
      module: 'land_management',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Land Bookings',
      href: '/land-bookings',
      icon: BookOpen,
      module: 'land_booking',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Land Payments',
      href: '/land-payments',
      icon: DollarSign,
      module: 'payment_collection',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Resale Properties',
      href: '/resale-properties',
      icon: Home,
      module: 'resale_property',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Resale Bookings',
      href: '/resale-bookings',
      icon: BookOpen,
      module: 'resale_booking',
      action: 'R',
      deviceAccess: true
    },
    {
      name: 'Resale Payments',
      href: '/resale-payments',
      icon: DollarSign,
      module: 'payment_collection',
      action: 'R',
      deviceAccess: true
    },
    // {
    //   name: 'Salary Management',
    //   href: '/salary-management',
    //   icon: Calculator,
    //   module: 'expense_salary',
    //   action: 'R',
    //   deviceAccess: false, // Web-only
    //   requiredDevice: 'desktop'
    // },
  ];

  // Filter navigation based on permissions and device access
  const filteredNavigation = navigation.filter(item => {
    const hasModulePermission = hasPermission(item.module, item.action);
    const hasDevicePermission = item.deviceAccess ? hasDeviceAccess(item.module) : true;
    return hasModulePermission && hasDevicePermission;
  });

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 lg:hidden"
          onClick={onClose}
        >
          <div className="fixed inset-0 bg-black/50"></div>
        </div>
      )}

      {/* Sidebar - Fixed left, full height */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 h-screen bg-card border-r border-border transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo Section */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary rounded-lg">
              <Building2 className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex items-center">
  <img 
    src="../.././dist/logo.png" 
    alt="CRM Logo" 
    className="h-8 w-auto"
  />
</div>

          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2">
          {filteredNavigation.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200
                  ${active
                    ? 'bg-primary/10 text-primary border border-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                  }
                `}
                onClick={onClose}
              >
                <Icon className={`mr-3 h-5 w-5 transition-colors ${
                  active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                }`} />
                <span className="font-medium">{item.name}</span>
                {active && (
                  <div className="ml-auto w-2 h-2 bg-primary rounded-full"></div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-border">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-primary-foreground">
                {user ? user.name.split(' ').map(word => word.charAt(0)).join('').toUpperCase().slice(0, 2) : 'U'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email || 'user@example.com'}
              </p>
              <p className="text-xs text-muted-foreground">
                {device} • {user?.user_type || 'Unknown'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
