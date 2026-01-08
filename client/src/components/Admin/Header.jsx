// components/Admin/Header.jsx
import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';

const Header = ({ activeTab, sidebarOpen, setSidebarOpen }) => {
  const getPageTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Dashboard';
      case 'users': return 'Users Management';
      case 'courses': return 'Courses Management';
      case 'purchases': return 'Purchases History';
      case 'educators': return 'Educators Management';
      case 'educator-verification': return 'Educator Verification';
      case 'analytics': return 'Analytics Dashboard';
      case 'settings': return 'Platform Settings';
      default: return 'Dashboard';
    }
  };

  const getPageDescription = () => {
    switch (activeTab) {
      case 'dashboard': return 'Overview of your platform';
      case 'users': return 'Manage all platform users';
      case 'courses': return 'Manage all courses and content';
      case 'purchases': return 'View and manage purchase history';
      case 'educators': return 'Manage all educators and instructors';
      case 'educator-verification': return 'Review and approve educator applications';
      case 'analytics': return 'View platform analytics and insights';
      case 'settings': return 'Configure platform settings';
      default: return 'Overview of your platform';
    }
  };

  return (
    <header className="bg-white border-b px-4 sm:px-6 py-4 sticky top-0 z-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 mr-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {getPageTitle()}
            </h2>
            <p className="text-xs sm:text-sm text-gray-600">
              {getPageDescription()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Search for larger screens */}
          <div className="hidden md:block relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-64"
            />
          </div>

          <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg relative">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold cursor-pointer">
            A
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;