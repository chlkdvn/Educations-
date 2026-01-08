import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/Loading';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  FiUsers,
  FiBookOpen,
  FiDollarSign,
  FiCalendar
} from 'react-icons/fi';

const Dashboard = () => {
  const { currency, getToken, isEducactor, backendUrl } = useContext(AppContext);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchDashboardData = async () => {
    try {
      const token = await getToken();
      const { data } = await axios.get(`${backendUrl}/api/educator/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setDashboardData(data.dashboardData);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error('Failed to load dashboard data');
    }
  };

  useEffect(() => {
    if (isEducactor) {
      fetchDashboardData();
    }
  }, [isEducactor]);

  if (!dashboardData) return <Loading />;

  // Real stats from API data
  const stats = [
    {
      title: 'Total Students',
      value: dashboardData.enrolledStudentsData?.length || 0,
      icon: <FiUsers className="w-5 h-5" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Courses',
      value: dashboardData.totalCourses || 0,
      icon: <FiBookOpen className="w-5 h-5" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Total Earnings',
      value: `${currency}${dashboardData.totalEarnings?.toLocaleString() || '0'}`,
      icon: <FiDollarSign className="w-5 h-5" />,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome back! Here's your overview</p>
        </div>

        {/* Stats Grid - 3 columns */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 font-medium">{stat.title}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor} ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Enrollments - Now full width since Course Performance is removed */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">Recent Enrollments</h2>
            <FiCalendar className="w-4 h-4 text-gray-400" />
          </div>
          <div className="divide-y divide-gray-100">
            {dashboardData.enrolledStudentsData?.slice(0, 5).map((item, index) => (
              <div key={index} className="px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <img
                      src={item.student?.imageUrl}
                      alt={item.student?.name || 'Student'}
                      className="w-8 h-8 rounded-full"
                      onError={(e) => {
                        e.target.src = `https://ui-avatars.com/api/?name=${item.student?.name || item.studentName || 'Student'}&background=random`;
                      }}
                    />
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.student?.name || item.studentName || 'Unknown Student'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {item.courseTitle || 'Unknown Course'}
                    </p>
                  </div>
                  <span className="text-xs text-gray-500 whitespace-nowrap">
                    {item.purchaseDate ? 
                      new Date(item.purchaseDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      }) : 
                      'Invalid Date'
                    }
                  </span>
                </div>
              </div>
            ))}
            {dashboardData.enrolledStudentsData?.length === 0 && (
              <div className="px-4 py-8 text-center">
                <FiUsers className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No enrollments yet</p>
              </div>
            )}
          </div>
          {dashboardData.enrolledStudentsData?.length > 5 && (
            <div className="px-4 py-3 border-t border-gray-200">
              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium w-full text-center">
                View all enrollments →
              </button>
            </div>
          )}
        </div>

        {/* Quick Stats Row - 2 cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-blue-700">Active Learners</p>
                <p className="text-lg font-bold text-blue-900 mt-1">
                  {dashboardData.enrolledStudentsData?.filter(s => s.isActive).length || 0}
                </p>
              </div>
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-green-700">Total Courses</p>
                <p className="text-lg font-bold text-green-900 mt-1">
                  {dashboardData.totalCourses || 0}
                </p>
              </div>
              <FiBookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;