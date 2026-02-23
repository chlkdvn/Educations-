// components/Admin/FinancialPage.jsx
import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Wallet,
  Clock,
  History,
  Info,
  Banknote,
  AlertCircle
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = 'https://educations.onrender.com/api/admin';

const FinancialPage = ({ adminData }) => {
  const [walletData, setWalletData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Withdrawal form state
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [bankDetails, setBankDetails] = useState({
    bankName: '',
    bankCode: '',
    accountNumber: '',
    accountName: ''
  });

  useEffect(() => {
    const fetchAdminWallet = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/getAdminWallet`, {
          withCredentials: true
        });

        if (response.data?.success && response.data.adminWallet) {
          setWalletData(response.data.adminWallet);
        } else {
          toast.error(response.data?.message || 'Failed to load wallet data');
        }
      } catch (error) {
        console.error('Error fetching admin wallet:', error);
        toast.error('Failed to load financial data');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminWallet();
  }, []);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount || 0);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleAdminWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      return toast.error('Please enter a valid amount');
    }

    if (amount > (walletData.balance || 0)) {
      return toast.error(`Insufficient balance. Available: ${formatCurrency(walletData.balance)}`);
    }

    if (!bankDetails.bankName || !bankDetails.bankCode || !bankDetails.accountNumber || !bankDetails.accountName) {
      return toast.error('Please fill in all bank details (including bank code)');
    }

    setWithdrawLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE}/adminWithdraw`,
        {
          amount,
          bankName: bankDetails.bankName,
          bankCode: bankDetails.bankCode,
          accountNumber: bankDetails.accountNumber,
          accountName: bankDetails.accountName
        },
        {
          withCredentials: true
        }
      );

      if (response.data.success) {
        toast.success(response.data.message || 'Withdrawal request submitted successfully!');

        // Reset form
        setWithdrawAmount('');
        setBankDetails({
          bankName: '',
          bankCode: '',
          accountNumber: '',
          accountName: ''
        });

        // Refresh wallet data
        const refreshRes = await axios.get(`${API_BASE}/getAdminWallet`, { withCredentials: true });
        if (refreshRes.data?.success) {
          setWalletData(refreshRes.data.adminWallet);
        }
      } else {
        toast.error(response.data.message || 'Withdrawal failed');
      }
    } catch (error) {
      console.error('Admin withdrawal error:', error);
      const msg = error.response?.data?.message || 'Withdrawal failed. Please try again.';
      toast.error(msg);
    } finally {
      setWithdrawLoading(false);
    }
  };

  // Calculate educator share
  const educatorShare = Math.round((walletData?.balance || 0) * 70 / 30);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading financial data...</p>
        </div>
      </div>
    );
  }

  if (!walletData) {
    return (
      <div className="text-center py-12">
        <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-600">No financial data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900">Platform Financial Overview</h2>
        <p className="text-gray-600 mt-1">Your platform earnings from course sales</p>
      </div>

      {/* Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <DollarSign className="w-8 h-8 text-gray-600" />
          </div>
          <p className="text-sm text-gray-600 font-medium">Total Platform Earnings</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(walletData.balance)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Your 30% commission</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <Wallet className="w-8 h-8 text-gray-600" />
            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Ready</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Available Balance</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(walletData.balance)}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-8 h-8 text-gray-600" />
            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">30 days</span>
          </div>
          <p className="text-sm text-gray-600 font-medium">Educator Share</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {formatCurrency(educatorShare)}
          </p>
          <p className="text-xs text-gray-500 mt-2">Released to educators</p>
        </div>
      </div>

      {/* Revenue Share Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-4">
        <Info className="w-8 h-8 text-blue-600 flex-shrink-0 mt-1" />
        <div>
          <p className="font-semibold text-blue-900">How Revenue Works</p>
          <p className="text-sm text-blue-800 mt-1">
            For every course sold, <strong>educators receive 70%</strong> of the earnings after a 30-day hold period.
            The platform keeps 30% to support operations and growth.
          </p>
        </div>
      </div>

      {/* NEW: Admin Withdrawal Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
          <Banknote className="w-6 h-6 text-gray-700" />
          Withdraw Platform Earnings
        </h3>

        <div className="max-w-md">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount (Max: {formatCurrency(walletData.balance)})
          </label>
          <input
            type="number"
            placeholder="e.g. 50000"
            value={withdrawAmount}
            onChange={(e) => setWithdrawAmount(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:border-gray-500 focus:ring-2 focus:ring-gray-200 outline-none mb-5 text-lg"
          />

          <div className="space-y-4 mb-6">
            <input
              placeholder="Bank Name (e.g. GTBank)"
              value={bankDetails.bankName}
              onChange={(e) => setBankDetails({ ...bankDetails, bankName: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-gray-500 outline-none"
            />
            <input
              placeholder="Bank Code (e.g. 058 for GTBank)"
              value={bankDetails.bankCode}
              onChange={(e) => setBankDetails({ ...bankDetails, bankCode: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-gray-500 outline-none"
            />
            <input
              placeholder="Account Number"
              value={bankDetails.accountNumber}
              onChange={(e) => setBankDetails({ ...bankDetails, accountNumber: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-gray-500 outline-none"
            />
            <input
              placeholder="Account Holder Name"
              value={bankDetails.accountName}
              onChange={(e) => setBankDetails({ ...bankDetails, accountName: e.target.value })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:border-gray-500 outline-none"
            />
          </div>

          <button
            onClick={handleAdminWithdraw}
            disabled={withdrawLoading || !withdrawAmount}
            className="w-full py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {withdrawLoading ? 'Processing...' : 'Request Withdrawal'}
          </button>

          <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
            <p className="font-medium flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-gray-600" />
              Notes:
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
              <li>You can withdraw any amount from your platform balance</li>
              <li>Processed within 2-5 business days via Paystack</li>
              <li>Ensure bank details and code are correct</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Earnings History */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
          <History className="w-6 h-6 text-gray-700" />
          Platform Earnings History
        </h3>

        <div className="space-y-3">
          {walletData.transactions && walletData.transactions.length > 0 ? (
            walletData.transactions.map((tx, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {tx.description || 'Platform commission'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-green-600">
                    +{formatCurrency(tx.amount)}
                  </p>
                  <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded mt-1 inline-block">
                    {tx.status === 'completed' ? 'Completed' : tx.status}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10">
              <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No earnings recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinancialPage;