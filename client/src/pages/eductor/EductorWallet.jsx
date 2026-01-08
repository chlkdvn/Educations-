import React, { useContext, useEffect, useState } from 'react';
import { AppContext } from '../../context/AppContext';
import Loading from '../../components/Loading';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
    Wallet,
    ArrowDownLeft,
    Banknote,
    History,
    AlertCircle,
    DollarSign,
    Clock,
    Info
} from 'lucide-react';

const EducatorFinancial = () => {
    const { currency, getToken, isEducactor, backendUrl } = useContext(AppContext);

    const [walletData, setWalletData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    // Withdrawal form state
    const [withdrawAmount, setWithdrawAmount] = useState('');
    const [bankDetails, setBankDetails] = useState({
        bankName: '',
        bankCode: '',        // Required for Paystack
        accountNumber: '',
        accountName: ''
    });

    const fetchWalletData = async () => {
        try {
            const token = await getToken();
            const { data } = await axios.get(`${backendUrl}/api/educator/getWallet`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (data) {
                setWalletData({
                    totalEarnings: data.balance || 0,
                    availableBalance: data.balance || 0,
                    pendingBalance: 0,
                    transactions: data.transactions?.map(tx => ({
                        type: tx.amount > 0 ? 'earning' : 'withdrawal',
                        amount: Math.abs(tx.amount),
                        date: tx.date || new Date().toISOString(),
                        description: tx.description || (tx.amount > 0 ? 'Course sale' : 'Withdrawal'),
                        status: tx.status || 'completed'
                    })) || []
                });
            }
        } catch (error) {
            console.error('Error fetching wallet:', error);
            toast.error('Failed to load wallet data');
        }
    };

    useEffect(() => {
        if (isEducactor) {
            fetchWalletData();
        }
    }, [isEducactor]);

    const handleWithdraw = async () => {
        const amount = parseFloat(withdrawAmount);

        // Validation
        if (!amount || amount <= 0) {
            return toast.error('Please enter a valid amount greater than 0');
        }

        if (amount > walletData.availableBalance) {
            return toast.error(`Insufficient balance. Available: ${currency}${walletData.availableBalance.toLocaleString()}`);
        }

        if (!bankDetails.bankName || !bankDetails.bankCode || !bankDetails.accountNumber || !bankDetails.accountName) {
            return toast.error('Please fill in all bank details (including bank code)');
        }

        setIsLoading(true);

        try {
            const token = await getToken();

            const response = await axios.post(
                `${backendUrl}/api/educator/withdrawFromWallet`,
                {
                    amount,
                    accountNumber: bankDetails.accountNumber,
                    bankCode: bankDetails.bankCode,
                },
                {
                    headers: { Authorization: `Bearer ${token}` }
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

                // Refresh wallet balance
                await fetchWalletData();
            } else {
                toast.error(response.data.message || 'Withdrawal failed');
            }
        } catch (error) {
            console.error('Withdrawal error:', error);
            const msg = error.response?.data?.message || 'Withdrawal failed. Please try again.';
            toast.error(msg);
        } finally {
            setIsLoading(false);
        }
    };

    if (!isEducactor) return null;
    if (!walletData) return <Loading />;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">My Earnings</h1>
                    <p className="text-gray-600 mt-1">View your balance and withdraw earnings</p>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <DollarSign className="w-8 h-8 text-gray-600" />
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Total Earnings</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            {currency}{walletData.totalEarnings.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <Wallet className="w-8 h-8 text-gray-600" />
                            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">Ready</span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Available Balance</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            {currency}{walletData.availableBalance.toLocaleString()}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
                        <div className="flex items-center justify-between mb-3">
                            <Clock className="w-8 h-8 text-gray-600" />
                            <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded-full">30 days</span>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">Pending Release</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                            {currency}{walletData.pendingBalance.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Withdrawal Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-3">
                        <Banknote className="w-6 h-6 text-gray-700" />
                        Withdraw to Bank Account
                    </h2>

                    <div className="max-w-md">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Amount (Max: {currency}{walletData.availableBalance.toLocaleString()})
                        </label>
                        <input
                            type="number"
                            placeholder="e.g. 10000"
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
                                placeholder="Bank Code (e.g. 058 for GTBank, 044 for Access)"
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
                            onClick={handleWithdraw}
                            disabled={isLoading || !withdrawAmount}
                            className="w-full py-4 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Processing...' : 'Request Withdrawal'}
                        </button>

                        <div className="mt-5 p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-700">
                            <p className="font-medium flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-gray-600" />
                                Important Notes:
                            </p>
                            <ul className="list-disc list-inside mt-2 space-y-1 text-xs">
                                <li>You can withdraw any amount from your available balance</li>
                                <li>Processed within 2-5 business days</li>
                                <li>Earnings are held for 30 days to cover refunds</li>
                                <li>Ensure bank code is correct (ask your bank or check Paystack list)</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Earnings History */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                            <History className="w-6 h-6 text-gray-700" />
                            Earnings History
                        </h2>

                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Info className="w-4 h-4" />
                            <span>You keep 70% of each sale. We take 30% to keep the platform running smoothly.</span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {walletData.transactions
                            .filter(tx => tx.type === 'earning')
                            .length > 0 ? (
                            walletData.transactions
                                .filter(tx => tx.type === 'earning')
                                .map((tx, index) => (
                                    <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                <ArrowDownLeft className="w-5 h-5 text-green-600" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{tx.description}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(tx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-bold text-green-600">
                                                +{currency}{tx.amount.toLocaleString()}
                                            </p>
                                            <span className={`text-xs px-2 py-1 rounded mt-1 inline-block ${tx.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {tx.status === 'pending' ? 'Pending' : 'Completed'}
                                            </span>
                                        </div>
                                    </div>
                                ))
                        ) : (
                            <div className="text-center py-10">
                                <Wallet className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                <p className="text-gray-500">No earnings yet. Start selling courses!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EducatorFinancial;