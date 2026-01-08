// components/Admin/UsersPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Eye, 
  Edit, 
  Users, 
  Loader2, 
  Mail, 
  Calendar, 
  BookOpen,
  DollarSign,
  Award,
  Clock,
  X,
  Download,
  Share2,
  MessageCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { formatDate, formatCurrency, fetchAllData, getAllPurchases } from '../../utitle/api';
import axios from 'axios';

const API_BASE = 'https://educations.onrender.com/api/admin';

const UsersPage = () => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalUsers: 0, activeUsers: 0 });
  const [selectedUser, setSelectedUser] = useState(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userPurchases, setUserPurchases] = useState([]);
  const [userCourses, setUserCourses] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  useEffect(() => {
    loadUsersData();
  }, []);

  const loadUsersData = async () => {
    setLoading(true);
    try {
      // Fetch users from getallusers endpoint
      const usersResponse = await axios.get(`${API_BASE}/getallusers`, {
        withCredentials: true
      });

      if (usersResponse.data.success) {
        const usersData = usersResponse.data.data || [];
        setUsers(usersData);
        setStats({
          totalUsers: usersData.length,
          activeUsers: usersData.filter(user => user.enrolledCourses?.length > 0).length
        });
      }

      // Fetch purchases data for the profile modal
      const purchasesData = await fetchAllData();
      if (purchasesData) {
        const allPurchases = getAllPurchases(purchasesData.data);
        setUserPurchases(allPurchases);
      }
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users data');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const searchLower = searchTerm.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user._id?.toLowerCase().includes(searchLower)
    );
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const viewUserProfile = async (user) => {
    setSelectedUser(user);
    
    // Get user's purchases
    const userPurchasesList = userPurchases.filter(purchase => 
      purchase.userId === user._id
    );
    
    // Get user's enrolled courses with details
    const enrolledCourses = user.enrolledCourses || [];
    const coursesWithDetails = [];
    
    // Fetch course details if needed
    if (userPurchasesList.length > 0) {
      userPurchasesList.forEach(purchase => {
        if (purchase.course) {
          coursesWithDetails.push({
            ...purchase.course,
            purchaseDate: purchase.createdAt,
            amount: purchase.amount,
            purchaseId: purchase._id
          });
        }
      });
    }
    
    setUserCourses(coursesWithDetails);
    setShowProfileModal(true);
  };

  const calculateUserStats = () => {
    if (!selectedUser) return { totalSpent: 0, totalPurchases: 0, avgPurchase: 0 };
    
    const userPurchaseList = userPurchases.filter(p => p.userId === selectedUser._id);
    const totalSpent = userPurchaseList.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPurchases = userPurchaseList.length;
    const avgPurchase = totalPurchases > 0 ? totalSpent / totalPurchases : 0;
    
    return { totalSpent, totalPurchases, avgPurchase };
  };

  const getUserActivity = (user) => {
    const userPurchaseList = userPurchases.filter(p => p.userId === user._id);
    const lastPurchase = userPurchaseList[0];
    
    return {
      lastActivity: lastPurchase ? formatDate(lastPurchase.createdAt) : 'No activity',
      purchaseCount: userPurchaseList.length,
      totalSpent: userPurchaseList.reduce((sum, p) => sum + (p.amount || 0), 0)
    };
  };

  const getCourseDetails = (courseId) => {
    const purchase = userPurchases.find(p => p.courseId === courseId);
    return purchase?.course || { title: 'Unknown Course', price: 0 };
  };

  const exportUserData = (user) => {
    const data = {
      userInfo: {
        name: user.name,
        email: user.email,
        userId: user._id,
        joinedDate: formatDate(user.createdAt),
        enrolledCourses: user.enrolledCourses?.length || 0
      },
      purchases: userPurchases.filter(p => p.userId === user._id).map(p => ({
        date: formatDate(p.createdAt),
        course: p.course?.title || 'Unknown',
        amount: p.amount,
        status: p.status
      })),
      stats: calculateUserStats()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `user-${user.name}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Users Management</h2>
            <p className="text-gray-600 mt-1">
              {stats.totalUsers} total users • {stats.activeUsers} active students
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full md:w-64"
              />
            </div>
            <button 
              onClick={loadUsersData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              Refresh
            </button>
          </div>
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-700 font-medium">Total Users</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-700 font-medium">Active Students</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeUsers}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <BookOpen className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-700 font-medium">Total Courses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {users.reduce((total, user) => total + (user.enrolledCourses?.length || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-orange-50 p-4 rounded-lg">
            <div className="flex items-center">
              <Award className="w-8 h-8 text-orange-600 mr-3" />
              <div>
                <p className="text-sm text-orange-700 font-medium">Avg. Courses/User</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.totalUsers > 0 
                    ? (users.reduce((total, user) => total + (user.enrolledCourses?.length || 0), 0) / stats.totalUsers).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading users...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
            <p className="text-gray-600">Users will appear here when they register on the platform</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('name')}
                    >
                      <div className="flex items-center">
                        User
                        {sortConfig.key === 'name' && (
                          sortConfig.direction === 'asc' ? 
                            <ChevronUp className="w-4 h-4 ml-1" /> : 
                            <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('enrolledCourses')}
                    >
                      <div className="flex items-center">
                        Courses
                        {sortConfig.key === 'enrolledCourses' && (
                          sortConfig.direction === 'asc' ? 
                            <ChevronUp className="w-4 h-4 ml-1" /> : 
                            <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('createdAt')}
                    >
                      <div className="flex items-center">
                        Joined Date
                        {sortConfig.key === 'createdAt' && (
                          sortConfig.direction === 'asc' ? 
                            <ChevronUp className="w-4 h-4 ml-1" /> : 
                            <ChevronDown className="w-4 h-4 ml-1" />
                        )}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sortedUsers.map(user => {
                    const activity = getUserActivity(user);
                    return (
                      <tr key={user._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <img
                              src={user.imageUrl}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=random`;
                              }}
                            />
                            <div className="ml-4">
                              <div className="font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">
                                Last activity: {activity.lastActivity}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-gray-600">
                            <Mail className="w-4 h-4 mr-2" />
                            <span className="truncate max-w-[180px]">{user.email}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full w-fit">
                              {user.enrolledCourses?.length || 0} courses
                            </span>
                            {activity.totalSpent > 0 && (
                              <span className="text-xs text-gray-500 mt-1">
                                Spent: {formatCurrency(activity.totalSpent)}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-gray-600">
                            <Calendar className="w-4 h-4 mr-2" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1">
                            <span className={`px-2 py-1 text-xs rounded-full w-fit ${
                              user.enrolledCourses?.length > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {user.enrolledCourses?.length > 0 ? 'Active Student' : 'Registered'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {activity.purchaseCount} purchases
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => viewUserProfile(user)}
                              className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                              title="Edit User"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => exportUserData(user)}
                              className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg"
                              title="Export Data"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <div className="p-6 border-t border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {sortedUsers.length} of {users.length} users
                </div>
                <div className="flex items-center space-x-4">
                  <button 
                    className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear Search
                  </button>
                  <div className="text-sm text-gray-500">
                    Sorted by: {sortConfig.key} ({sortConfig.direction})
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* User Profile Modal */}
      {showProfileModal && selectedUser && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Overlay */}
            <div 
              className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75"
              onClick={() => setShowProfileModal(false)}
            />
            
            <div className="inline-block w-full max-w-6xl my-8 text-left align-middle bg-white rounded-xl shadow-xl transform transition-all">
              {/* Modal Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <img
                      src={selectedUser.imageUrl}
                      alt={selectedUser.name}
                      className="w-14 h-14 rounded-full object-cover border-4 border-white shadow-lg"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedUser.name)}&background=random&size=56`;
                      }}
                    />
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{selectedUser.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <span className="text-sm text-gray-600">{selectedUser.email}</span>
                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          User ID: {selectedUser._id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => exportUserData(selectedUser)}
                      className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Export
                    </button>
                    <button
                      onClick={() => setShowProfileModal(false)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Modal Content */}
              <div className="px-6 py-4">
                <div className="flex border-b border-gray-200">
                  <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'overview'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActiveTab('courses')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'courses'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Enrolled Courses ({selectedUser.enrolledCourses?.length || 0})
                  </button>
                  <button
                    onClick={() => setActiveTab('purchases')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'purchases'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Purchase History
                  </button>
                  <button
                    onClick={() => setActiveTab('details')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'details'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Account Details
                  </button>
                </div>
                
                {activeTab === 'overview' && (
                  <div className="mt-6 space-y-6">
                    {/* User Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 p-6 rounded-xl">
                        <div className="flex items-center">
                          <BookOpen className="w-10 h-10 text-blue-600 mr-4" />
                          <div>
                            <p className="text-sm text-blue-700 font-medium">Enrolled Courses</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {selectedUser.enrolledCourses?.length || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 p-6 rounded-xl">
                        <div className="flex items-center">
                          <DollarSign className="w-10 h-10 text-green-600 mr-4" />
                          <div>
                            <p className="text-sm text-green-700 font-medium">Total Spent</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {formatCurrency(calculateUserStats().totalSpent)}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 p-6 rounded-xl">
                        <div className="flex items-center">
                          <Award className="w-10 h-10 text-purple-600 mr-4" />
                          <div>
                            <p className="text-sm text-purple-700 font-medium">Member Since</p>
                            <p className="text-3xl font-bold text-gray-900">
                              {formatDate(selectedUser.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-600">Account Status</p>
                        <p className="font-medium text-gray-900 mt-1">Active</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-600">Total Purchases</p>
                        <p className="font-medium text-gray-900 mt-1">{calculateUserStats().totalPurchases}</p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-600">Avg. Purchase</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {formatCurrency(calculateUserStats().avgPurchase)}
                        </p>
                      </div>
                      <div className="p-4 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-600">Last Updated</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {formatDate(selectedUser.updatedAt)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Recent Purchases */}
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-4">Recent Purchases</h4>
                      {userPurchases.filter(p => p.userId === selectedUser._id).slice(0, 5).length === 0 ? (
                        <p className="text-gray-500 text-center py-4">No recent purchases</p>
                      ) : (
                        <div className="space-y-3">
                          {userPurchases
                            .filter(p => p.userId === selectedUser._id)
                            .slice(0, 5)
                            .map((purchase, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                                    <DollarSign className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">
                                      {purchase.course?.title || 'Course Purchase'}
                                    </p>
                                    <div className="flex items-center space-x-3 text-sm text-gray-600">
                                      <span>{formatDate(purchase.createdAt)}</span>
                                      <span>•</span>
                                      <span>Status: {purchase.status || 'completed'}</span>
                                    </div>
                                  </div>
                                </div>
                                <div className="font-bold text-gray-900">
                                  {formatCurrency(purchase.amount)}
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {activeTab === 'courses' && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Enrolled Courses</h4>
                    {userCourses.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No courses enrolled yet</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {userCourses.map((course, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-start space-x-4">
                              <img
                                src={course.thumbnail || course.courseThumbnail}
                                alt={course.title}
                                className="w-16 h-16 rounded-lg object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = 'https://via.placeholder.com/64';
                                }}
                              />
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900">{course.title || course.courseTitle}</h5>
                                <div className="flex items-center justify-between mt-2">
                                  <div className="text-sm text-gray-600">
                                    Enrolled: {formatDate(course.purchaseDate)}
                                  </div>
                                  <div className="font-bold text-blue-600">
                                    {formatCurrency(course.amount || course.price || course.coursePrice || 0)}
                                  </div>
                                </div>
                                <div className="mt-3 flex items-center space-x-2">
                                  <button className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200">
                                    View Course
                                  </button>
                                  <button className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
                                    Download Certificate
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                
                {activeTab === 'purchases' && (
                  <div className="mt-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h4 className="font-medium text-gray-900">Purchase History</h4>
                        <p className="text-sm text-gray-600">
                          Total spending: {formatCurrency(calculateUserStats().totalSpent)}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => exportUserData(selectedUser)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Export Purchase History"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                          <Share2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {userPurchases.filter(p => p.userId === selectedUser._id).length === 0 ? (
                      <div className="text-center py-8">
                        <DollarSign className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600">No purchase history found</p>
                      </div>
                    ) : (
                      <>
                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Educator</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {userPurchases
                                .filter(p => p.userId === selectedUser._id)
                                .map((purchase, index) => (
                                  <tr key={index} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="text-sm text-gray-900">
                                        {formatDate(purchase.createdAt)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm font-medium text-gray-900">
                                        {purchase.course?.title || purchase.course?.courseTitle || 'Unknown Course'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3">
                                      <div className="text-sm text-gray-600">
                                        {purchase.educator?.name || 'Unknown Educator'}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <div className="font-bold text-gray-900">
                                        {formatCurrency(purchase.amount)}
                                      </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
                                        {purchase.status || 'completed'}
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                      <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline">
                                        View Invoice
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                            </tbody>
                          </table>
                        </div>
                        
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-4 bg-blue-50 rounded-lg">
                            <p className="text-sm text-blue-700 font-medium">Total Purchases</p>
                            <p className="text-2xl font-bold text-gray-900">{calculateUserStats().totalPurchases}</p>
                          </div>
                          <div className="p-4 bg-green-50 rounded-lg">
                            <p className="text-sm text-green-700 font-medium">Total Amount</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(calculateUserStats().totalSpent)}
                            </p>
                          </div>
                          <div className="p-4 bg-purple-50 rounded-lg">
                            <p className="text-sm text-purple-700 font-medium">Average Purchase</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {formatCurrency(calculateUserStats().avgPurchase)}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {activeTab === 'details' && (
                  <div className="mt-6">
                    <h4 className="font-medium text-gray-900 mb-6">Account Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Personal Information</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-600">Full Name:</span>
                              <span className="font-medium">{selectedUser.name}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-600">Email Address:</span>
                              <span className="font-medium">{selectedUser.email}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-600">User ID:</span>
                              <span className="font-mono text-sm">{selectedUser._id}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-600">Account Status:</span>
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                Active
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Account Activity</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-600">Account Created:</span>
                              <span className="font-medium">{formatDate(selectedUser.createdAt)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-600">Last Updated:</span>
                              <span className="font-medium">{formatDate(selectedUser.updatedAt)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-600">Profile Version:</span>
                              <span className="font-medium">v{selectedUser.__v || '1.0'}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-gray-600">Last Login:</span>
                              <span className="font-medium">Recently</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Learning Statistics</h5>
                          <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                              <span className="text-blue-700">Total Courses Enrolled:</span>
                              <span className="font-bold text-blue-900">{selectedUser.enrolledCourses?.length || 0}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                              <span className="text-green-700">Total Amount Spent:</span>
                              <span className="font-bold text-green-900">
                                {formatCurrency(calculateUserStats().totalSpent)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                              <span className="text-purple-700">Completed Courses:</span>
                              <span className="font-bold text-purple-900">0</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                              <span className="text-orange-700">Course Completion Rate:</span>
                              <span className="font-bold text-orange-900">0%</span>
                            </div>
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-gray-900 mb-3">Account Actions</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center">
                              <MessageCircle className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                              <span className="text-sm">Send Message</span>
                            </button>
                            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 text-center">
                              <Edit className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                              <span className="text-sm">Edit Profile</span>
                            </button>
                            <button className="p-3 border border-gray-300 rounded-lg hover:bg-blue-50 text-center">
                              <Download className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                              <span className="text-sm text-blue-600">Export Data</span>
                            </button>
                            <button className="p-3 border border-red-200 rounded-lg hover:bg-red-50 text-center">
                              <AlertCircle className="w-5 h-5 text-red-600 mx-auto mb-1" />
                              <span className="text-sm text-red-600">Deactivate</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-sm text-gray-600">
                    User since {formatDate(selectedUser.createdAt)} • 
                    Last updated {formatDate(selectedUser.updatedAt)}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => setShowProfileModal(false)}
                      className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                      Edit User Profile
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersPage;