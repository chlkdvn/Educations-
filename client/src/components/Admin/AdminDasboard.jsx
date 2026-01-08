// admin/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  BookOpen, 
  ShoppingCart, 
  GraduationCap,
  TrendingUp,
  DollarSign,
  Receipt,
  Loader2
} from 'lucide-react';
import { 
  fetchAllData, 
  formatCurrency, 
  getAllPurchases, 
  getUniqueEducators 
} from '../../utitle/api';

const DashboardPage = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalCourses: 0,
    totalPurchases: 0,
    totalEducators: 0,
    totalRevenue: 0,
    growth: '+12.5%'
  });
  const [data, setData] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchAllData();
    if (result) {
      setData(result.data);
      setStats(result.stats);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              <p className="text-sm text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                {stats.growth}
              </p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalCourses}</p>
              <p className="text-sm text-green-600 mt-1">Active on platform</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <BookOpen className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(stats.totalRevenue)}
              </p>
              <p className="text-sm text-green-600 mt-1">From {stats.totalPurchases} purchases</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Educators</p>
              <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalEducators}</p>
              <p className="text-sm text-yellow-600 mt-1">Active instructors</p>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <GraduationCap className="w-6 h-6 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Purchases */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Recent Purchases</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : getAllPurchases(data).length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No purchases yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getAllPurchases(data).slice(0, 5).map((purchase, index) => (
                  <div key={purchase._id || index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">
                          {purchase.course?.title || 'Unknown Course'}
                        </p>
                        <p className="text-sm text-gray-600">Purchase ID: #{purchase._id?.substring(0, 8) || 'N/A'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">
                        {formatCurrency(purchase.amount)}
                      </p>
                      <p className="text-xs text-gray-600">
                        {purchase.status || 'completed'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top Educators */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Top Educators</h2>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              </div>
            ) : getUniqueEducators(data).length === 0 ? (
              <div className="text-center py-8">
                <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">No educators yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {getUniqueEducators(data)
                  .sort((a, b) => b.totalRevenue - a.totalRevenue)
                  .slice(0, 4)
                  .map(educator => (
                    <div key={educator._id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <img
                          src={educator.imageUrl}
                          alt={educator.name}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://via.placeholder.com/40';
                          }}
                        />
                        <div>
                          <p className="font-medium text-gray-900">{educator.name}</p>
                          <p className="text-sm text-gray-600 truncate max-w-[150px]">
                            {educator.email}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{educator.courses.length} courses</p>
                        <p className="text-sm text-gray-600">{formatCurrency(educator.totalRevenue)}</p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;