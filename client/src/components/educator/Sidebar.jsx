import React, { useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AppContext } from '../../context/AppContext';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const { isEducactor, user } = useContext(AppContext);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hoveredItem, setHoveredItem] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  // Menu items configuration - Compact version
  const menuItems = useMemo(() => [
    {
      name: 'Dashboard',
      path: '/educator',
      icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      badge: null,
      exact: true
    },
    {
      name: 'Add Course',
      path: '/educator/add-course',
      icon: 'M12 4v16m8-8H4',
      accent: 'green',
      badge: 'New'
    },
    {
      name: 'Courses',
      path: '/educator/manage-courses',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      accent: 'purple',
      badge: '12'
    },
    {
      name: 'My Courses',
      path: '/educator/my-courses',
      icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
      badge: null
    },
    {
      name: 'Students',
      path: '/educator/student-enrolled',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      accent: 'orange',
      badge: '247'
    },
    {
      name: 'Financial',
      path: '/educator/financial',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      accent: 'green',
      badge: '$4.2K'
    },
    {
      name: 'Certificates',
      path: '/educator/certificate-requests',
      icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      accent: 'blue',
      badge: '2'
    },
  ], []);

  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsMobileOpen(false); // Always closed on desktop, sidebar is always visible
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Toggle sidebar collapse on desktop
  useEffect(() => {
    const handleToggleCollapse = () => {
      setCollapsed(prev => !prev);
    };

    window.addEventListener('toggleSidebarCollapse', handleToggleCollapse);
    return () => window.removeEventListener('toggleSidebarCollapse', handleToggleCollapse);
  }, []);

  // Toggle mobile sidebar
  useEffect(() => {
    const handleToggleSidebar = () => {
      setIsMobileOpen(prev => !prev);
    };

    window.addEventListener('toggleSidebar', handleToggleSidebar);
    return () => window.removeEventListener('toggleSidebar', handleToggleSidebar);
  }, []);

  // Handle click outside sidebar on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobileOpen && isMobile && sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        !event.target.closest('.mobile-menu-toggle')) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobileOpen, isMobile]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isMobileOpen) {
        setIsMobileOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isMobileOpen]);

  // Handle navigation
  const handleNavClick = useCallback((path) => {
    navigate(path);
    if (isMobile) {
      setIsMobileOpen(false);
    }
  }, [isMobile, navigate]);

  // Get accent colors
  const getAccentColor = useCallback((item) => {
    const colors = {
      green: {
        bg: 'bg-emerald-500',
        text: 'text-emerald-600',
        light: 'bg-emerald-50',
        hover: 'hover:bg-emerald-50',
        badge: 'bg-emerald-100 text-emerald-800'
      },
      purple: {
        bg: 'bg-purple-500',
        text: 'text-purple-600',
        light: 'bg-purple-50',
        hover: 'hover:bg-purple-50',
        badge: 'bg-purple-100 text-purple-800'
      },
      orange: {
        bg: 'bg-orange-500',
        text: 'text-orange-600',
        light: 'bg-orange-50',
        hover: 'hover:bg-orange-50',
        badge: 'bg-orange-100 text-orange-800'
      },
      blue: {
        bg: 'bg-blue-500',
        text: 'text-blue-600',
        light: 'bg-blue-50',
        hover: 'hover:bg-blue-50',
        badge: 'bg-blue-100 text-blue-800'
      },
    };
    return colors[item.accent] || colors.blue;
  }, []);

  // Check active state
  const isActive = useCallback((item) => {
    if (item.exact) {
      return location.pathname === item.path;
    }
    return location.pathname.startsWith(item.path);
  }, [location.pathname]);

  if (!isEducactor) return null;

  return (
    <>
      {/* Backdrop Overlay - Only on mobile */}
      {isMobileOpen && isMobile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden animate-fadeIn"
          onClick={() => setIsMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container */}
      <aside
        ref={sidebarRef}
        className={`
          fixed left-0 top-0 h-screen bg-white z-40
          ${collapsed ? 'w-16' : 'w-64'}
          transform transition-all duration-200
          ${isMobile ? (isMobileOpen ? 'translate-x-0' : '-translate-x-full') : 'translate-x-0'}
          flex flex-col
          border-r border-gray-200
          overflow-hidden
          shadow-none
        `}
        style={{
          marginTop: '56px', // Match navbar height
          height: 'calc(100vh - 56px)',
        }}
      >
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2">
          {/* Navigation Menu - Compact */}
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const accentColor = getAccentColor(item);
              const active = isActive(item);

              return (
                <button
                  key={item.name}
                  onClick={() => handleNavClick(item.path)}
                  onMouseEnter={() => setHoveredItem(item.name)}
                  onMouseLeave={() => setHoveredItem(null)}
                  className={`
                    relative w-full flex items-center px-2 py-2 rounded-lg
                    transition-all duration-150
                    ${active
                      ? `${accentColor.light} text-gray-900`
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                    ${collapsed ? 'justify-center' : ''}
                    group
                  `}
                >
                  {/* Icon */}
                  <div className={`
                    relative flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                    transition-all duration-150
                    ${active
                      ? `bg-white shadow-xs ${accentColor.text}`
                      : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                    }
                  `}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={active ? "2.2" : "1.8"}
                        d={item.icon}
                      />
                    </svg>

                    {/* Active indicator */}
                    {active && !collapsed && (
                      <div className={`absolute -right-1 top-1/2 -translate-y-1/2 w-1 h-5 
                                    ${accentColor.bg} rounded-full`} />
                    )}
                  </div>

                  {/* Text (hidden when collapsed) */}
                  {!collapsed && (
                    <div className="ml-3 flex-1 min-w-0 text-left">
                      <span className={`block text-xs font-medium truncate ${active ? 'font-semibold' : ''}`}>
                        {item.name}
                      </span>
                      {item.badge && (
                        <span className={`mt-0.5 inline-block px-1.5 py-0.5 text-[10px] font-medium rounded-full 
                                       ${accentColor.badge}`}>
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Badge for collapsed state */}
                  {collapsed && item.badge && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 
                                  flex items-center justify-center shadow-xs">
                      <span className="text-[9px] font-bold text-white">{item.badge}</span>
                    </div>
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-2 px-2 py-1.5 bg-gray-900 text-white text-xs 
                                  rounded-md shadow-lg opacity-0 group-hover:opacity-100 
                                  transition-opacity duration-150 whitespace-nowrap z-50 pointer-events-none">
                      {item.name}
                      {item.badge && (
                        <span className="ml-1 text-[10px] text-gray-300">({item.badge})</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Divider */}
          <div className="my-4">
            <div className="h-px bg-gray-200" />
          </div>

          {/* Quick Stats (only when expanded) */}
          {!collapsed && (
            <div className="mb-4">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-semibold text-blue-800">Stats</span>
                  <span className="text-xs text-green-600 font-medium">+</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-700">Revenue</span>
                    <span className="text-xs font-semibold text-blue-900">$</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-700">Students</span>
                    <span className="text-xs font-semibold text-blue-900"></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Help Section (only when expanded) */}
          {!collapsed && (
            <div className="mb-4">
              <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                <div className="flex items-start gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-md">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                        d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800">Help?</p>
                    <p className="text-[10px] text-gray-600 mt-0.5">24/7 support</p>
                    <button className="mt-1 text-xs text-blue-600 hover:text-blue-700 font-medium">
                      Contact →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - Compact */}
        <div className="border-t border-gray-100 px-2 py-2 bg-white">
          <div className="flex items-center justify-between">
            {!collapsed ? (
              <>
                <div className="min-w-0">
                  <p className="text-[10px] text-gray-500">v2.1.0</p>
                </div>
                <div className="flex items-center gap-1">
                  <button className="p-1 hover:bg-gray-100 rounded transition-colors">
                    <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </button>
                </div>
              </>
            ) : (
              <div className="w-full flex justify-center">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md 
                              flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white">E</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;