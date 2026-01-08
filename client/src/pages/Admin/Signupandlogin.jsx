import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  ArrowRight,
  Shield,
  Key,
  CheckCircle,
  Loader2,
  Save
} from 'lucide-react';

const AdminAuth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [animate, setAnimate] = useState(false);
  const [successAnimation, setSuccessAnimation] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });

  // Load saved credentials on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('admin_email');
    const savedPassword = localStorage.getItem('admin_password');

    if (savedEmail && savedPassword) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        password: savedPassword
      }));
      setRememberMe(true);
    }
  }, []);

  const handleToggleMode = () => {
    setAnimate(true);
    setTimeout(() => {
      setIsLogin(!isLogin);
      setFormData({ email: '', password: '', name: '' });
      setAnimate(false);
    }, 300);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    // Basic validation
    if (!formData.email || !formData.password) {
      toast.error('Please fill in all fields');
      return;
    }

    if (!isLogin && !formData.name) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isLogin ? '/login' : '/signup';
      const payload = isLogin
        ? { email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password, name: formData.name };

      const response = await axios.post(
        `https://educations.onrender.com/api/admin${endpoint}`,
        payload,
        { withCredentials: true }
      );

      if (response.data.success) {
        // Save credentials if "Remember Me" is checked
        if (isLogin && rememberMe) {
          localStorage.setItem('admin_email', formData.email);
          localStorage.setItem('admin_password', formData.password);
        } else if (!rememberMe) {
          // Clear saved credentials
          localStorage.removeItem('admin_email');
          localStorage.removeItem('admin_password');
        }

        // Success animation
        setSuccessAnimation(true);

        setTimeout(() => {
          toast.success(`🎉 ${response.data.message}`);
          navigate('/admin/dashboard');
        }, 1500);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error('Auth error:', error);
      toast.error(error.response?.data?.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
      {/* Minimal background pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]" />

      <div className="relative min-h-screen flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          {/* Success animation overlay */}
          {successAnimation && (
            <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 animate-fade-in">
              <div className="text-center">
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-scale">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2 animate-slide-up">
                  {isLogin ? 'Login Successful!' : 'Account Created!'}
                </h2>
                <p className="text-gray-300 animate-slide-up animation-delay-200">
                  {isLogin ? 'Redirecting...' : 'Welcome aboard!'}
                </p>
              </div>
            </div>
          )}

          {/* Compact White Card */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200">
            {/* Header - Compact */}
            <div className="p-6 text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isLogin ? 'Admin Login' : 'Create Admin'}
              </h1>
              <p className="text-sm text-gray-600">
                {isLogin
                  ? 'Access your admin dashboard'
                  : 'Setup admin account'
                }
              </p>
            </div>

            {/* Form - Compact */}
            <div className="px-6 pb-6">
              <form onSubmit={handleSubmit}>
                <div className={`space-y-4 transition-all duration-300 ${animate ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
                  {!isLogin && (
                    <div className="animate-slide-down">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <div className="relative">
                        <div className="absolute left-3 top-2.5">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                        <input
                          type="text"
                          name="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition text-sm"
                          placeholder="John Doe"
                        />
                      </div>
                    </div>
                  )}

                  <div className={!isLogin ? 'animate-slide-down animation-delay-100' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5">
                        <Mail className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition text-sm"
                        placeholder="admin@example.com"
                      />
                    </div>
                  </div>

                  <div className={!isLogin ? 'animate-slide-down animation-delay-200' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5">
                        <Lock className="w-4 h-4 text-gray-400" />
                      </div>
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition text-sm"
                        placeholder="••••••••"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Remember Me - Only show for login */}
                  {isLogin && (
                    <div className="flex items-center justify-between pt-1">
                      <label className="flex items-center space-x-2 cursor-pointer group">
                        <div className={`relative w-4 h-4 rounded border transition-all group-hover:border-cyan-500 ${rememberMe ? 'bg-cyan-500 border-cyan-500' : 'bg-white border-gray-300'}`}>
                          {rememberMe && (
                            <CheckCircle className="absolute w-3 h-3 text-white top-0.5 left-0.5" />
                          )}
                          <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="absolute opacity-0 cursor-pointer w-full h-full"
                          />
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <Save className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-sm text-gray-700">Remember me</span>
                        </div>
                      </label>

                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem('admin_email');
                          localStorage.removeItem('admin_password');
                          toast.info('Saved credentials cleared');
                        }}
                        className="text-xs text-gray-500 hover:text-cyan-600 transition"
                      >
                        Clear saved
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-3 rounded-lg font-medium text-white transition-all ${loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow hover:shadow-md'
                      }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center text-sm">
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {isLogin ? 'Signing in...' : 'Creating account...'}
                      </span>
                    ) : (
                      <span className="flex items-center justify-center text-sm">
                        {isLogin ? 'Login to Dashboard' : 'Create Admin Account'}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </span>
                    )}
                  </button>
                </div>
              </form>

              {/* Toggle between login/signup */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-600">
                  {isLogin ? "Don't have an admin account?" : "Already have an account?"}
                  <button
                    type="button"
                    onClick={handleToggleMode}
                    className="ml-1.5 text-cyan-600 hover:text-cyan-700 font-medium transition"
                  >
                    {isLogin ? 'Create one' : 'Login'}
                  </button>
                </p>
              </div>
            </div>

            {/* Footer - Minimal */}
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
                <Key className="w-3 h-3" />
                <span>Secure Admin Panel</span>
              </div>
            </div>
          </div>

          {/* Demo credentials hint - Compact */}
          {isLogin && rememberMe && (
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-xs text-blue-700 text-center">
                Your credentials are saved locally
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add CSS animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideUp {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        
        @keyframes scale {
          0% { transform: scale(0); }
          70% { transform: scale(1.1); }
          100% { transform: scale(1); }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        
        .animate-slide-down {
          animation: slideDown 0.3s ease-out;
        }
        
        .animate-scale {
          animation: scale 0.3s ease-out;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
      `}</style>
    </div>
  );
};

export default AdminAuth;