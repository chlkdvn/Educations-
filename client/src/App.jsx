import React from 'react';
import { Route, Router, Routes, useMatch } from 'react-router-dom';
import Home from './pages/student/Home';
import CourseList from './pages/student/CourseList';
import CourseDetails from './pages/student/CourseDetails';
import MyEnrollments from './pages/student/MyEnrollments';
import Player from './pages/student/Player';
import RequestCertificate from './pages/student/RequestCertificate';
import Loading from './components/Loading';
import Educator from './pages/eductor/Educator';
import Dashboard from './pages/eductor/Dashboard';
import AddCourse from './pages/eductor/AddCourse';
import MyCourses from './pages/eductor/MyCourses';
import StudentEnrolled from './pages/eductor/StudentEnrolled';
import Navbar from './components/student/Navbar';
import "quill/dist/quill.snow.css";
import { ToastContainer } from "react-toastify";
import OnboardingEducator from './components/student/onboardingEducator';
import AdminAuth from './pages/Admin/Signupandlogin';
import AdminDashboard from './pages/Admin/AdminDasboard';
import CourseManagement from './pages/eductor/CourseManagement';
import CertificateRequests from './pages/eductor/allRequestCerticate';
import PaymentStatus from './pages/student/Paycheck';
import EducatorFinancial from './pages/eductor/EductorWallet';

const App = () => {
  const isEducatorRouter = useMatch('/educator/*');
  const isAdminRouter = useMatch('/admin/*'); // ← ADDED

  return (
    <div className='text-default min-h-screen bg-white'>
      <ToastContainer />
      {!isEducatorRouter && !isAdminRouter && <Navbar />} {/* ← UPDATED */}

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/Course-list" element={<CourseList />} />
        <Route path="/Course-list/:input" element={<CourseList />} />
        <Route path="/Course/:id" element={<CourseDetails />} />
        <Route path="/My-enrollments" element={<MyEnrollments />} />
        <Route path="/player/:courseId" element={<Player />} />
        <Route path="/onboardingEducator" element={<OnboardingEducator />} />
        <Route path="/admin/login" element={<AdminAuth />} />
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/request-certificate/:courseId" element={<RequestCertificate />} />
        <Route path="/payment-status" element={<PaymentStatus />} />
        <Route path="/loading/:path" element={<Loading />} />

        {/* === EDUCATOR ROUTES (Nested) === */}
        <Route path="/educator" element={<Educator />}>
          <Route index element={<Dashboard />} /> {/* /educator → Dashboard */}
          <Route path="add-course" element={<AddCourse />} />
          <Route path="my-courses" element={<MyCourses />} />
          <Route path="student-enrolled" element={<StudentEnrolled />} />
          <Route path='manage-courses' element={<CourseManagement />} />
          <Route path='/educator/certificate-requests' element={<CertificateRequests />} />
          <Route path="/educator/financial" element={<EducatorFinancial />} />
        </Route>
      </Routes>
    </div>
  );
};

export default App;
