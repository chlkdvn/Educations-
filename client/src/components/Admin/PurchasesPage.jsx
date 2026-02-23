// admin/pages/PurchasesPage.jsx
import React, { useState, useEffect } from 'react';
import { Search, Receipt, Eye, Download, Filter, Loader2, Calendar, User, BookOpen } from 'lucide-react';
import { fetchAllData, getAllPurchases, formatCurrency, formatDate } from '../../utitle/api';

const PurchasesPage = () => {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState({ totalPurchases: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const result = await fetchAllData();
    if (result) {
      const purchasesList = getAllPurchases(result.data);
      setPurchases(purchasesList);
      setStats(result.stats);
    }
    setLoading(false);
  };

  const filteredPurchases = purchases.filter(purchase => {
    const matchesSearch = 
      purchase._id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.course?.title?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'completed') return matchesSearch && purchase.status === 'completed';
    if (filter === 'pending') return matchesSearch && purchase.status === 'pending';
    if (filter === 'failed') return matchesSearch && purchase.status === 'failed';
    return matchesSearch;
  });

  const exportToCSV = () => {
    const headers = ['Purchase ID', 'User', 'Course', 'Amount', 'Status', 'Date'];
    const csvData = filteredPurchases.map(purchase => [
      purchase._id,
      purchase.user?.name || 'Unknown',
      purchase.course?.title || 'Unknown Course',
      formatCurrency(purchase.amount),
      purchase.status,
      formatDate(purchase.createdAt)
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `purchases-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Purchases History</h2>
            <p className="text-gray-600 mt-1">All platform purchases ({stats.totalPurchases} total)</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search purchases..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none w-full md:w-64"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button 
              onClick={exportToCSV}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
            <button 
              onClick={loadData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Loading purchases...</p>
          </div>
        </div>
      ) : purchases.length === 0 ? (
        <div className="text-center py-12">
          <Receipt className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No purchases found</h3>
          <p className="text-gray-600">Purchases will appear here when users buy courses</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purchase ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPurchases.map(purchase => (
                  <tr key={purchase._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-gray-900">
                        #{purchase._id.substring(0, 8)}...
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {purchase.user?.imageUrl ? (
                          <img
                            src={purchase.user.imageUrl}
                            alt={purchase.user.name}
                            className="w-8 h-8 rounded-full object-cover mr-2"
                          />
                        ) : (
                          <User className="w-8 h-8 rounded-full bg-gray-100 p-1 mr-2" />
                        )}
                        <div>
                          <div className="font-medium text-gray-900">
                            {purchase.user?.name || 'Unknown User'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {purchase.user?.email || 'No email'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {purchase.course?.thumbnail ? (
                          <img
                            src={purchase.course.thumbnail}
                            alt={purchase.course.title}
                            className="w-10 h-10 rounded object-cover mr-2"
                          />
                        ) : (
                          <BookOpen className="w-10 h-10 text-gray-300 mr-2" />
                        )}
                        <span className="text-sm text-gray-900 line-clamp-2">
                          {purchase.course?.title || 'Unknown Course'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-gray-900">
                        {formatCurrency(purchase.amount)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        purchase.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : purchase.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {purchase.status || 'unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="w-4 h-4 mr-2" />
                        {formatDate(purchase.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <button className="p-1 text-gray-400 hover:text-blue-600">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-sm text-gray-600">
                Showing {filteredPurchases.length} of {purchases.length} purchases
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default PurchasesPage;