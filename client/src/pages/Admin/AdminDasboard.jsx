// components/Admin/AdminApp.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../../components/Admin/Sidebar';
import Header from '../../components/Admin/Header';
import DashboardPage from "../../components/Admin/AdminDasboard";
import UsersPage from '../../components/Admin/UsersPage';
import CoursesPage from '../../components/Admin/CoursesPage';
import PurchasesPage from '../../components/Admin/PurchasesPage';
import EducatorsPage from '../../components/Admin/EducatorsPage';
import AnalyticsPage from '../../components/Admin/AnalyticsPage';
import SettingsPage from '../../components/Admin/SettingsPage';
import EducatorVerificationDashboard from '../../components/Admin/EducatorVerificationDashboard';
import CourseVerificationPage from '../../components/Admin/CourseVerificationPage';
import FinancialPage from '../../components/Admin/FinancialPage';



const AdminApp = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [adminData, setAdminData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        setIsLoading(true);
        const response = await fetch('https://educations.onrender.com/api/admin/check-auth', {
          method: 'GET',
          credentials: 'include', // Important for sending cookies
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const data = await response.json();

        if (data.success && data.admin) {
          setIsAuthenticated(true);
          setAdminData(data.admin);
        } else {
          setIsAuthenticated(false);
          // Redirect to admin login if not authenticated
          navigate('/admin/login');
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        setIsAuthenticated(false);
        navigate('/admin/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminAuth();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await fetch('https://educations.onrender.com/api/admin/logout', {
        method: 'POST',
        credentials: 'include',
      });
      setIsAuthenticated(false);
      setAdminData(null);
      navigate('/admin/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };



  const renderContent = () => {
    if (!isAuthenticated || !adminData) {
      return null;
    }

    switch (activeTab) {
      case 'dashboard':
        return <DashboardPage adminData={adminData} />;
      case 'users':
        return <UsersPage adminData={adminData} />;
      case 'courses':
        return <CoursesPage adminData={adminData} />;
      case 'course-verification':
        return <CourseVerificationPage adminData={adminData} />;
      case 'purchases':
        return <PurchasesPage adminData={adminData} />;
      case 'educators':
        return <EducatorsPage adminData={adminData} />;
      case 'educator-verification':
        return <EducatorVerificationDashboard adminData={adminData} />;
      case 'analytics':
        return <AnalyticsPage adminData={adminData} />;
      case 'financial': // Add this case
        return <FinancialPage adminData={adminData} />;
      case 'settings':
        return <SettingsPage adminData={adminData} />;
      default:
        return <DashboardPage adminData={adminData} />;
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verifying admin credentials...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        adminData={adminData}
        onLogout={handleLogout}
      />

      <div className="lg:pl-64">
        <Header
          activeTab={activeTab}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          adminData={adminData}
          onLogout={handleLogout}
        />

        <main className="p-4 sm:p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminApp;