// admin/pages/AnalyticsPage.jsx
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, DollarSign, ShoppingCart, Calendar, Loader2, Download } from 'lucide-react';
import { fetchAllData, getAllPurchases, formatCurrency } from '../../utitle/api';

const AnalyticsPage = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [timeRange, setTimeRange] = useState('month');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    growth: '+12.5%'
  });

  useEffect(() => {
    loadData();
  }, [timeRange]);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchAllData();
    if (result) {
      setData(result.data);
      setStats(result.stats);
    }
    setLoading(false);
  };

  const getRevenueData = () => {
    const purchases = getAllPurchases(data);
    const monthlyData = {};
    
    purchases.forEach(purchase => {
      const date = new Date(purchase.createdAt);
      const monthYear = `${date.getMonth() + 1}/${date.getFullYear()}`;
      
      if (!monthlyData[monthYear]) {
        monthlyData[monthYear] = 0;
      }
      monthlyData[monthYear] += purchase.amount || 0;
    });
    
    return Object.entries(monthlyData)
      .map(([month, revenue]) => ({ month, revenue }))
      .sort((a, b) => {
        const [aMonth, aYear] = a.month.split('/');
        const [bMonth, bYear] = b.month.split('/');
        return new Date(aYear, aMonth - 1) - new Date(bYear, bMonth - 1);
      })
      .slice(-6); // Last 6 months
  };

  const getTopCourses = () => {
    const courseMap = new Map();
    
    data.forEach(item => {
      const courseId = item.course?._id;
      const courseTitle = item.course?.title || 'Unknown Course';
      const purchases = item.purchases?.length || 0;
      const revenue = item.purchases?.reduce((sum, purchase) => sum + (purchase.amount || 0), 0) || 0;
      
      if (courseId) {
        courseMap.set(courseId, {
          title: courseTitle,
          purchases,
          revenue,
          students: new Set(item.purchases?.map(p => p.userId)).size
        });
      }
    });
    
    return Array.from(courseMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const getTopEducators = () => {
    const educatorMap = new Map();
    
    data.forEach(item => {
      const educator = item.educator;
      if (educator?._id) {
        if (!educatorMap.has(educator._id)) {
          educatorMap.set(educator._id, {
            name: educator.name,
            courses: 0,
            revenue: 0,
            students: 0
          });
        }
        
        const current = educatorMap.get(educator._id);
        current.courses += 1;
        current.revenue += item.purchases?.reduce((sum, purchase) => sum + (purchase.amount || 0), 0) || 0;
        current.students += new Set(item.purchases?.map(p => p.userId)).size;
      }
    });
    
    return Array.from(educatorMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  };

  const revenueData = getRevenueData();
  const topCourses = getTopCourses();
  const topEducators = getTopEducators();

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
          <p className="text-gray-600">Platform performance and insights</p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          >
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
            <option value="quarter">Last 3 Months</option>
            <option value="year">Last Year</option>
          </select>
          <button 
            onClick={loadData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                {stats.growth}
              </p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Purchases</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalPurchases}</p>
              <p className="text-sm text-gray-600 mt-1">Completed transactions</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <ShoppingCart className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Students</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              <p className="text-sm text-green-600 mt-1">Platform users</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">8.2%</p>
              <p className="text-sm text-yellow-600 mt-1">Visitor to purchase</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <BarChart3 className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts and Top Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
            <p className="text-sm text-gray-600">Monthly revenue overview</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : revenueData.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No revenue data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {revenueData.map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.month}</span>
                      <span className="font-medium text-gray-900">
                        {formatCurrency(item.revenue)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full"
                        style={{ 
                          width: `${Math.min(100, (item.revenue / Math.max(...revenueData.map(r => r.revenue))) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Courses */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Courses</h3>
            <p className="text-sm text-gray-600">By revenue generated</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : topCourses.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No course data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topCourses.map((course, index) => (
                  <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">{index + 1}</span>
                      </div>
                      <div className="max-w-[200px]">
                        <p className="font-medium text-gray-900 truncate">
                          {course.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {course.students} students
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(course.revenue)}</p>
                      <p className="text-xs text-gray-600">{course.purchases} sales</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Educators */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Educators</h3>
            <p className="text-sm text-gray-600">By revenue contribution</p>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : topEducators.length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No educator data available</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Educator</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Revenue/Course</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {topEducators.map((educator, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{educator.name}</div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                            {educator.courses} courses
                          </span>
                        </td>
                        <td className="px-6 py-4">{educator.students}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">
                          {formatCurrency(educator.revenue)}
                        </td>
                        <td className="px-6 py-4">
                          {formatCurrency(educator.revenue / educator.courses)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;