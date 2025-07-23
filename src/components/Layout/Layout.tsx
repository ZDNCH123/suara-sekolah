import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useTheme } from '../../contexts/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'dark bg-gray-900' : 'bg-gray-50'} transition-colors duration-300`}>
      <div className="flex">
        <Sidebar />
        <div className="flex-1 flex flex-col lg:ml-64">
          <TopBar />
          <main className="flex-1 p-4 lg:p-6 pt-20 lg:pt-6">
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default Layout;