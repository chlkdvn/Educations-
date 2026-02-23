import React, { useContext, useState, useRef, useEffect } from 'react';
import { assets } from '../../assets/assets';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { AppContext } from '../../context/AppContext';
import axios from 'axios';
import { toast } from 'react-toastify';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const mobileMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Remove isEducactor from context - we'll check user.role directly
  const { backendUrl } = useContext(AppContext);
  const isCourseListPage = location.pathname.includes('/course-list');

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  // Check if user is educator based on role from database
  const isUserEducator = user?.role === 'educator';

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/user/me`, {
        withCredentials: true
      });
      if (response.data.success) {
        setUser(response.data.data);
      }
    } catch (error) {
      setUser(null);
    }
  };

  // Navigate based on educator role from database
  const becomeEducator = () => {
    if (isUserEducator) {
      navigate('/educator');
    } else {
      navigate('/onboardingEducator');
    }
    setShowMobileMenu(false);
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post(
        `${backendUrl}/api/user/login`,
        {
          email: formData.email,
          password: formData.password
        },
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (response.data.success) {
        toast.success('Login successful!');
        setUser(response.data.data.user);
        setTimeout(() => {
          handleCloseAuthModal();
          resetForm();
        }, 1500);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Login failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const signupFormData = new FormData();
      signupFormData.append('name', formData.name);
      signupFormData.append('email', formData.email);
      signupFormData.append('password', formData.password);
      
      if (selectedFile) {
        signupFormData.append('image', selectedFile);
      }

      const response = await axios.post(
        `${backendUrl}/api/user/signUp`,
        signupFormData,
        {
          withCredentials: true,
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      );

      if (response.data.success) {
        toast.success('Account created!');
        setUser(response.data.data.user);
        setTimeout(() => {
          handleCloseAuthModal();
          resetForm();
        }, 1500);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Signup failed';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Clear cookie on logout
  const handleLogout = async () => {
    try {
      await axios.get(`${backendUrl}/api/user/logout`, {
        withCredentials: true
      });
      
      setUser(null);
      setShowMobileMenu(false);
      toast.info('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
      setShowMobileMenu(false);
      navigate('/');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '' });
    setPreviewImage(null);
    setSelectedFile(null);
    setError('');
  };

  const handleOpenAuthModal = () => {
    setShowAuthModal(true);
    setIsLoginMode(true);
  };

  const handleCloseAuthModal = () => {
    setShowAuthModal(false);
    resetForm();
  };

  const handleSwitchToSignup = () => {
    setIsLoginMode(false);
    setError('');
  };

  const handleSwitchToLogin = () => {
    setIsLoginMode(true);
    setError('');
  };

  const toggleMobileMenu = () => {
    setShowMobileMenu(!showMobileMenu);
  };

  return (
    <>
      <div className={`flex items-center justify-between px-4 sm:px-10 md:px-14 lg:px-16 border-b border-gray-500 py-4 ${isCourseListPage ? 'bg-white' : 'bg-cyan-100/70'}`}>
        <img
          onClick={() => navigate('/')}
          src={assets.logo}
          alt="Logo"
          className="w-28 lg:w-32 cursor-pointer"
        />

        {/* DESKTOP MENU */}
        <div className="hidden md:flex items-center gap-5 text-gray-500">
          <div className="flex items-center gap-5">
            {user && (
              <>
                {/* UPDATED: Check user.role from database */}
                <button onClick={becomeEducator}>
                  {isUserEducator ? 'Educator Dashboard' : 'Become Educator'}
                </button>
                <span>|</span>
                <Link to="/my-enrollments">My Enrollments</Link>
              </>
            )}
          </div>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold overflow-hidden cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all">
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-full text-sm transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleOpenAuthModal}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full transition-colors"
            >
              Sign In
            </button>
          )}
        </div>

        {/* MOBILE MENU */}
        <div className="md:hidden flex items-center gap-2 text-gray-500">
          {user ? (
            <div className="relative" ref={mobileMenuRef}>
              <button 
                onClick={toggleMobileMenu}
                className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-blue-700 flex items-center justify-center text-white font-semibold overflow-hidden hover:ring-2 hover:ring-blue-400 transition-all"
              >
                {user.imageUrl ? (
                  <img src={user.imageUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name?.charAt(0).toUpperCase() || 'U'
                )}
              </button>

              {showMobileMenu && (
                <div className="absolute right-0 top-12 bg-white rounded-lg shadow-lg border border-gray-200 py-2 min-w-[180px] z-50">
                  {/* UPDATED: Check user.role from database */}
                  <button
                    onClick={becomeEducator}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {isUserEducator ? 'Educator Dashboard' : 'Become Educator'}
                  </button>
                  
                  <Link 
                    to="/my-enrollments" 
                    onClick={() => setShowMobileMenu(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Enrollments
                  </Link>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={handleOpenAuthModal}>
              <img src={assets.user_icon} alt="User" className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* AUTH MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 relative">
            <button
              onClick={handleCloseAuthModal}
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <img src={assets.logo} alt="Logo" className="h-10 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800">
                {isLoginMode ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-gray-600 mt-2">
                {isLoginMode ? 'Sign in to continue' : 'Join our community'}
              </p>
            </div>

            <div className="flex border-b mb-6">
              <button
                onClick={handleSwitchToLogin}
                className={`flex-1 py-3 font-medium ${isLoginMode ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                Login
              </button>
              <button
                onClick={handleSwitchToSignup}
                className={`flex-1 py-3 font-medium ${!isLoginMode ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}
              >
                Sign Up
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
                {error}
              </div>
            )}

            <form onSubmit={isLoginMode ? handleLogin : handleSignup}>
              {!isLoginMode && (
                <div className="mb-4 flex justify-center">
                  <div className="relative">
                    <div
                      className="w-20 h-20 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center cursor-pointer hover:border-blue-400 transition-colors mb-2 overflow-hidden"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {previewImage ? (
                        <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <img src={assets.user_icon} alt="Upload" className="w-8 h-8 opacity-50" />
                      )}
                    </div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="text-center text-xs text-gray-500">Profile photo (optional)</div>
                  </div>
                </div>
              )}

              {!isLoginMode && (
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter your email"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 mb-2">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                  minLength="6"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-lg font-semibold transition ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
              >
                {loading ? 'Please wait...' : (isLoginMode ? 'Sign In' : 'Create Account')}
              </button>
            </form>

            <div className="text-center mt-6">
              <p className="text-gray-600">
                {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                <button
                  onClick={isLoginMode ? handleSwitchToSignup : handleSwitchToLogin}
                  className="text-blue-600 font-semibold hover:text-blue-800"
                >
                  {isLoginMode ? 'Sign Up' : 'Sign In'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );j
};

export default Navbar;