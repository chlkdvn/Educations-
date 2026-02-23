import React, { useState, useEffect } from 'react'
import { assets } from '../../assets/assets'
import { UserButton, useUser } from '@clerk/clerk-react'
import { Link } from 'react-router-dom'

const Navbar = () => {
  const { user } = useUser()
  const [scrolled, setScrolled] = useState(false)
  const [notificationCount] = useState(3)

  // Handle scroll effect for navbar
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Toggle mobile sidebar
  const toggleSidebar = () => {
    window.dispatchEvent(new CustomEvent('toggleSidebar'))
  }

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 h-14 bg-white z-50 transition-all duration-300 
        ${scrolled ? 'shadow-sm border-b border-gray-200' : 'border-b border-gray-200'}`}>
        <div className='h-full px-4 md:px-6 flex items-center justify-between'>

          {/* Left side - Logo and Menu Button */}
          <div className='flex items-center gap-3'>
            {/* Mobile Menu Button */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-1.5 rounded-md hover:bg-gray-100 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Logo - Aligned with sidebar */}
            <Link to="/" className="flex items-center gap-2">
              <div className="w-7 h-7 bg-gradient-to-br from-blue-600 to-blue-700 rounded-md flex items-center justify-center">
                <img src={assets.logo} alt='logo' className='w-4 h-4 invert' />
              </div>
              <div className="hidden md:block">
                <h1 className="text-sm font-bold text-gray-800">EduPlatform</h1>
                <p className='text-xs text-gray-500'>Educator</p>
              </div>
            </Link>

            {/* Desktop collapse button */}
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('toggleSidebarCollapse'))}
              className="hidden lg:flex items-center justify-center w-8 h-8 rounded-md 
                       hover:bg-gray-100 transition-colors ml-2"
              aria-label="Toggle sidebar"
            >
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                  d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Right side - User actions */}
          <div className='flex items-center gap-2 md:gap-3'>

            {/* Quick Actions - More compact */}
            <div className='hidden md:flex items-center gap-2'>
              {/* Add Course Button */}
              <Link
                to="/educator/add-course"
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-sm transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                Add Course
              </Link>

              {/* Analytics Button */}
              <button className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-md font-medium text-sm transition-colors hover:bg-gray-50">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Analytics
              </button>
            </div>

            {/* Mobile Add Button */}
            <Link
              to="/educator/add-course"
              className="md:hidden flex items-center justify-center w-8 h-8 bg-blue-600 text-white rounded-md"
              aria-label="Add Course"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </Link>

            {/* Notifications - Compact */}
            <div className='relative group'>
              <button
                className='p-1.5 rounded-md hover:bg-gray-100 transition-colors relative'
                aria-label="Notifications"
              >
                <svg className="w-4.5 h-4.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {notificationCount > 0 && (
                  <span className='absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full'></span>
                )}
              </button>

              {/* Notification Dropdown */}
              <div className='absolute right-0 mt-1 w-64 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50'>
                <div className='p-3'>
                  <div className='flex items-center justify-between mb-2'>
                    <h3 className='text-sm font-semibold text-gray-900'>Notifications</h3>
                    <span className='text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded'>
                      {notificationCount} new
                    </span>
                  </div>
                  <div className='space-y-2 max-h-60 overflow-y-auto'>
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className='p-2 rounded hover:bg-gray-50 cursor-pointer transition-colors'>
                        <div className='flex gap-2'>
                          <div className='w-6 h-6 rounded bg-blue-100 flex items-center justify-center flex-shrink-0'>
                            <svg className="w-3 h-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div className='flex-1 min-w-0'>
                            <p className='text-xs font-medium text-gray-900'>New enrollment</p>
                            <p className='text-xs text-gray-600 mt-0.5 truncate'>John Doe in "React Masterclass"</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className='w-full mt-2 text-center text-xs text-blue-600 hover:text-blue-800 font-medium py-1'>
                    View all
                  </button>
                </div>
              </div>
            </div>

            {/* User Profile - Compact */}
            <div className='relative group'>
              <div className='flex items-center gap-1 cursor-pointer p-0.5 rounded-md hover:bg-gray-100 transition-colors'>
                {user ? (
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: "w-8 h-8 border border-gray-300 rounded-md"
                      }
                    }}
                  />
                ) : (
                  <div className='w-8 h-8 rounded-md bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold text-sm'>
                    {user?.firstName?.charAt(0) || 'E'}
                  </div>
                )}
              </div>

              {/* User Dropdown Menu */}
              <div className='absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 z-50'>
                <div className='p-2'>
                  {/* User Info */}
                  <div className='px-2 py-2 border-b border-gray-100'>
                    <p className='text-sm font-semibold text-gray-900'>
                      {user ? user.firstName || "Educator" : "Educator"}
                    </p>
                    <p className='text-xs text-gray-600 mt-0.5 truncate'>
                      {user?.primaryEmailAddress?.emailAddress || "educator@example.com"}
                    </p>
                  </div>

                  {/* Logout Button */}
                  <div className='py-1'>
                    <button
                      onClick={() => {
                        // Handle logout
                        window.location.href = '/logout'
                      }}
                      className='flex items-center justify-center gap-2 w-full px-2 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded transition-colors'
                    >
                      <div className='p-1 rounded bg-red-100'>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3 3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </div>
                      <span className='font-medium'>Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Spacer for fixed navbar */}
      <div className='h-14'></div>
    </>
  )
}

export default Navbar