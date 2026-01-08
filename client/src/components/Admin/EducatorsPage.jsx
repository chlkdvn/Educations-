// components/Admin/EducatorsPage.jsx - Card View Version
import React, { useState, useEffect } from 'react';
import { 
  Search, 
  GraduationCap, 
  Eye, 
  Edit, 
  Mail, 
  Users,
  DollarSign, 
  BookOpen,
  Loader2,
  TrendingUp
} from 'lucide-react';
import { fetchAllData, getUniqueEducators, formatCurrency } from '../../utitle/api';

const EducatorsPage = () => {
  const [loading, setLoading] = useState(true);
  const [educators, setEducators] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ totalEducators: 0 });
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchAllData();
    if (result) {
      const educatorsList = getUniqueEducators(result.data);
      setEducators(educatorsList);
      setStats(result.stats);
    }
    setLoading(false);
  };

  const filteredEducators = educators.filter(educator => 
    educator.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    educator.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    educator._id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateTotalEarnings = (educator) => {
    return educator.totalRevenue || 0;
  };

  const calculateTotalStudents = (educator) => {
    return educator.totalStudents || educator.totalPurchases || 0;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Educators Management</h2>
            <p className="text-gray-600 mt-1">All platform educators ({stats.totalEducators || 0} total)</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search educators..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full md:w-64"
              />
            </div>
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button 
                onClick={() => setViewMode('grid')}
                className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600'}`}
              >
                Grid
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`px-3 py-2 ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'bg-white text-gray-600'}`}
              >
                List
              </button>
            </div>
            <button 
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-100 rounded-xl p-6">
          <div className="flex items-center">
            <GraduationCap className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-blue-700 font-medium">Total Educators</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalEducators || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100 rounded-xl p-6">
          <div className="flex items-center">
            <BookOpen className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-green-700 font-medium">Total Courses</p>
              <p className="text-2xl font-bold text-gray-900">
                {educators.reduce((total, educator) => total + (educator.courses?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-6">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-600 mr-3" />
            <div>
              <p className="text-sm text-purple-700 font-medium">Total Students</p>
              <p className="text-2xl font-bold text-gray-900">
                {educators.reduce((total, educator) => total + calculateTotalStudents(educator), 0)}
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl p-6">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-orange-700 font-medium">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(educators.reduce((total, educator) => total + calculateTotalEarnings(educator), 0))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Educators Content */}
      {loading ? (
        <div className="flex justify-center items-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading educators...</p>
          </div>
        </div>
      ) : educators.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <GraduationCap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No educators found</h3>
          <p className="text-gray-600">Educators will appear here when they create courses</p>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEducators.map(educator => (
            <div key={educator._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <img
                    src={educator.imageUrl}
                    alt={educator.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(educator.name)}&background=random`;
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{educator.name}</h3>
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="w-4 h-4 mr-1" />
                      <span className="truncate max-w-[150px]">{educator.email}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-1 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded">
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center text-blue-700 mb-1">
                    <BookOpen className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Courses</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {educator.courses?.length || 0}
                  </div>
                </div>
                
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center text-green-700 mb-1">
                    <Users className="w-4 h-4 mr-2" />
                    <span className="text-sm font-medium">Students</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-900">
                    {calculateTotalStudents(educator)}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center text-gray-700 mb-1">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <span className="text-sm font-medium">Total Earnings</span>
                </div>
                <div className="text-xl font-bold text-gray-900">
                  {formatCurrency(calculateTotalEarnings(educator))}
                </div>
              </div>
              
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Courses</h4>
                <div className="space-y-2">
                  {educator.courses?.slice(0, 2).map((course, index) => (
                    <div key={course.course?._id || index} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate flex-1 mr-2">
                        {course.course?.title || course.course?.courseTitle || 'Untitled Course'}
                      </span>
                      <span className="font-medium text-gray-900 whitespace-nowrap">
                        {formatCurrency(course.course?.price || course.course?.coursePrice || 0)}
                      </span>
                    </div>
                  ))}
                  {educator.courses?.length > 2 && (
                    <div className="text-sm text-blue-600">
                      +{educator.courses.length - 2} more courses
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Educator</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Courses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Earnings</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredEducators.map(educator => (
                  <tr key={educator._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={educator.imageUrl}
                          alt={educator.name}
                          className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(educator.name)}&background=random`;
                          }}
                        />
                        <div className="ml-4">
                          <div className="font-medium text-gray-900">{educator.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-gray-600">
                        <Mail className="w-4 h-4 mr-2" />
                        <span className="truncate max-w-[180px]">{educator.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <BookOpen className="w-4 h-4 text-blue-500 mr-2" />
                        <span className="font-medium">{educator.courses?.length || 0}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-green-500 mr-2" />
                        <span className="font-medium">{calculateTotalStudents(educator)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-green-600 mr-2" />
                        <span className="font-bold text-gray-900">
                          {formatCurrency(calculateTotalEarnings(educator))}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                          <Edit className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer */}
      {filteredEducators.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-600">
              Showing {filteredEducators.length} of {educators.length} educators
            </div>
            <div className="flex items-center space-x-4">
              <button 
                className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => setSearchTerm('')}
              >
                Clear Search
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EducatorsPage;