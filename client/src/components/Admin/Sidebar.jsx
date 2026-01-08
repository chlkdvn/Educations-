// components/Admin/Sidebar.jsx
import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  ShoppingCart, 
  GraduationCap,
  BarChart3,
  Settings,
  LogOut,
  Lock,
  X,
  ShieldCheck,
  Shield,
  DollarSign // Added DollarSign icon
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen, adminData, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="w-5 h-5" /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen className="w-5 h-5" /> },
    { id: 'course-verification', label: 'Course Verification', icon: <Shield className="w-5 h-5" /> },
    { id: 'purchases', label: 'Purchases', icon: <ShoppingCart className="w-5 h-5" /> },
    { id: 'educators', label: 'Educators', icon: <GraduationCap className="w-5 h-5" /> },
    { id: 'educator-verification', label: 'Educator Verification', icon: <ShieldCheck className="w-5 h-5" /> },
    { id: 'financial', label: 'Financial', icon: <DollarSign className="w-5 h-5" /> }, // Added Financial menu item
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-5 h-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
  ];

  // Optional: Add notification badges for pending items
  const getNotificationCount = (tabId) => {
    // You can implement logic here to show notifications
    // For example, pending verifications, new transactions, etc.
    switch(tabId) {
      case 'course-verification':
        return 3; // Example: 3 pending course verifications
      case 'educator-verification':
        return 2; // Example: 2 pending educator verifications
      case 'financial':
        return 5; // Example: 5 pending transactions
      default:
        return null;
    }
  };

  // Get admin initials for avatar
  const getAdminInitials = () => {
    if (!adminData?.name) return 'A';
    return adminData.name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      {/* Sidebar for desktop */}
      <div className="hidden lg:flex lg:w-64 bg-white border-r flex-col fixed h-full z-30">
        {/* Sidebar header */}
        <div className="p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-sm text-gray-600">Dashboard</p>
            </div>
          </div>
        </div>

        {/* Sidebar menu */}
        <div className="flex-1 p-4 overflow-y-auto">
          <nav className="space-y-1">
            {menuItems.map(item => {
              const notificationCount = getNotificationCount(item.id);
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                      : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`${
                      activeTab === item.id ? 'text-blue-600' : 'text-gray-500'
                    }`}>
                      {item.icon}
                    </div>
                    <span className="font-medium">{item.label}</span>
                  </div>
                  {notificationCount && (
                    <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className="p-4 border-t">
          <div className="w-full flex items-center justify-between p-3 text-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                {getAdminInitials()}
              </div>
              <div className="text-left">
                <p className="font-medium">{adminData?.name || 'Admin User'}</p>
                <p className="text-xs text-gray-600">{adminData?.email || 'admin@example.com'}</p>
                <p className="text-xs text-green-600 font-medium">Administrator</p>
              </div>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={() => setSidebarOpen(false)}
          />
          
          {/* Mobile sidebar */}
          <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg z-50">
            <div className="h-full flex flex-col">
              {/* Mobile sidebar header */}
              <div className="p-6 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                      <Lock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                      <p className="text-sm text-gray-600">Dashboard</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSidebarOpen(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Mobile sidebar menu */}
              <div className="flex-1 p-4 overflow-y-auto">
                <nav className="space-y-1">
                  {menuItems.map(item => {
                    const notificationCount = getNotificationCount(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          setActiveTab(item.id);
                          setSidebarOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                          activeTab === item.id
                            ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                            : 'text-gray-700 hover:bg-gray-100 border-l-4 border-transparent'
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className={`${
                            activeTab === item.id ? 'text-blue-600' : 'text-gray-500'
                          }`}>
                            {item.icon}
                          </div>
                          <span className="font-medium">{item.label}</span>
                        </div>
                        {notificationCount && (
                          <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-red-500 rounded-full">
                            {notificationCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Mobile sidebar footer */}
              <div className="p-4 border-t">
                <div className="w-full flex items-center justify-between p-3 text-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {getAdminInitials()}
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{adminData?.name || 'Admin User'}</p>
                      <p className="text-xs text-gray-600">{adminData?.email || 'admin@example.com'}</p>
                      <p className="text-xs text-green-600 font-medium">Administrator</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      onLogout();
                      setSidebarOpen(false);
                    }}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;