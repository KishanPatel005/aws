import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Generate breadcrumbs based on current path
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = ['Dashboard'];
    
    if (pathSegments.length > 0) {
      const pageName = pathSegments[0].charAt(0).toUpperCase() + pathSegments[0].slice(1);
      breadcrumbs.push(pageName);
    }
    
    return breadcrumbs;
  };

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Fixed left */}
      <Sidebar isOpen={sidebarOpen} onClose={handleSidebarClose} />
      
      {/* Main content area - Topbar + Content stacked */}
      <div className="flex-1 flex flex-col">
        {/* Topbar - Sticky at top */}
        <Topbar 
          onMenuClick={handleSidebarToggle} 
          breadcrumbs={getBreadcrumbs()} 
        />
        
        {/* Content area */}
        <main className="flex-1 py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
