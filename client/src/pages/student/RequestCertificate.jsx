import React, { useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { AppContext } from '../../context/AppContext';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import Loading from '../../components/Loading';
import { assets } from '../../assets/assets';

const RequestCertificate = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const {
    enrolledCourses,
    userData,
    backendUrl,
    getToken,
    calculateNoOfLectures
  } = useContext(AppContext);

  const [course, setCourse] = useState(null);
  const [progress, setProgress] = useState(0);
  const [formData, setFormData] = useState({
    phone: '',
    email: ''
  });
  const [loading, setLoading] = useState({
    page: true,
    submit: false
  });

  // Memoize course calculation
  const currentCourse = useMemo(() => 
    enrolledCourses.find(c => c._id === courseId),
    [enrolledCourses, courseId]
  );

  // Fetch progress data
  const fetchProgress = useCallback(async () => {
    if (!currentCourse || !userData) return;

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/get-course-progress`,
        { courseId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (data.success) {
        const completed = data.progressData?.lectureCompleted?.length || 0;
        const total = calculateNoOfLectures(currentCourse);
        const percentage = total > 0 ? (completed / total) * 100 : 0;
        setProgress(percentage);
      }
    } catch (err) {
      console.error('Progress fetch error:', err);
      toast.error("Failed to load progress");
    }
  }, [currentCourse, userData, getToken, backendUrl, courseId, calculateNoOfLectures]);

  // Initialize component
  useEffect(() => {
    const initialize = async () => {
      if (currentCourse && userData) {
        setCourse(currentCourse);
        setFormData(prev => ({ 
          ...prev, 
          email: userData.email || '' 
        }));
        await fetchProgress();
        setLoading(prev => ({ ...prev, page: false }));
      } else if (enrolledCourses.length === 0) {
        // No enrolled courses found
        toast.error("Course not found in your enrollments");
        navigate('/dashboard');
      }
    };

    initialize();
  }, [currentCourse, userData, enrolledCourses, fetchProgress, navigate]);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Validate form
  const validateForm = () => {
    if (!formData.phone.trim() || !formData.email.trim()) {
      toast.error("Please fill in all required fields");
      return false;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return false;
    }

    // Basic phone validation (minimum 10 digits)
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10) {
      toast.error("Please enter a valid phone number");
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (progress < 100) {
      toast.error("Complete the course before requesting a certificate");
      return;
    }

    if (!validateForm()) return;

    setLoading(prev => ({ ...prev, submit: true }));

    try {
      const token = await getToken();
      const { data } = await axios.post(
        `${backendUrl}/api/user/request-certificate`,
        { 
          courseId, 
          phone: formData.phone.trim(), 
          email: formData.email.trim() 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.success) {
        toast.success("Certificate request submitted! You'll receive a test soon.");
        navigate(`/player/${courseId}`, { 
          state: { certificateRequested: true } 
        });
      } else {
        toast.error(data.message || "Request failed. Please try again.");
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          "Request failed. Please check your connection and try again.";
      toast.error(errorMessage);
      console.error('Certificate request error:', err);
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  // Memoized derived values
  const isCompleted = useMemo(() => progress >= 100, [progress]);
  const progressPercentage = useMemo(() => progress.toFixed(0), [progress]);

  if (loading.page || !course) {
    return <Loading fullScreen={true} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-8 px-4 sm:py-12 sm:px-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">
            Request Certificate
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            {course.courseTitle}
          </p>
        </header>

        {/* Course Thumbnail */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8 transform transition-transform hover:scale-[1.01] duration-300">
          <div className="relative h-48 sm:h-64">
            <img
              src={course.courseThumbnail}
              alt={course.courseTitle}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src = assets.course_placeholder || 'https://via.placeholder.com/800x400';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>
        </div>

        {/* Progress Card */}
        <div className={`p-6 rounded-2xl shadow-md mb-8 transition-all duration-300 ${
          isCompleted 
            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200' 
            : 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200'
        }`}>
          <div className="flex flex-col items-center">
            <div className={`inline-flex items-center justify-center p-3 rounded-full mb-4 ${
              isCompleted ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <span className={`text-2xl ${isCompleted ? 'text-green-600' : 'text-red-600'}`}>
                {isCompleted ? '✓' : '!'}
              </span>
            </div>
            <h2 className={`text-2xl font-bold mb-2 ${
              isCompleted ? 'text-green-800' : 'text-red-800'
            }`}>
              {isCompleted ? 'Course Completed!' : 'Course Incomplete'}
            </h2>
            <div className="w-full max-w-xs mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-1">
                <span>Progress</span>
                <span>{progressPercentage}%</span>
              </div>
              <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-500 ${
                    isCompleted ? 'bg-green-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <p className="mt-4 text-gray-600 text-center">
              {isCompleted
                ? "Congratulations! You're eligible for a certificate."
                : `Complete ${100 - progressPercentage}% more to request your certificate.`}
            </p>
          </div>
        </div>

        {/* Warning Notice */}
        <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200 rounded-2xl p-6 mb-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <span className="text-yellow-600 text-lg">⚠️</span>
              </div>
            </div>
            <div>
              <h3 className="font-bold text-xl text-yellow-800 mb-2">
                Important Notice
              </h3>
              <p className="text-yellow-900 leading-relaxed">
                After submitting your request, <strong className="font-semibold">you'll receive a final test</strong> to verify your knowledge. 
                Only students who pass the test will receive the official certificate.
                The test link will be sent to your email within 24 hours.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        {isCompleted ? (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Submit Your Details
            </h3>

            <div className="space-y-6">
              {/* Read-only Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={userData?.name || 'Not available'}
                    disabled
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700"
                  />
                  <div className="absolute right-3 top-3 text-gray-400">
                    👤
                  </div>
                </div>
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                  <span className="ml-2 text-sm text-blue-600 font-normal">
                    (Gmail recommended)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    placeholder="your.email@gmail.com"
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <div className="absolute left-3 top-3 text-gray-400">
                    ✉️
                  </div>
                </div>
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                  <span className="ml-2 text-sm text-blue-600 font-normal">
                    (with country code)
                  </span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    placeholder="+1 234 567 8900"
                    className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                  />
                  <div className="absolute left-3 top-3 text-gray-400">
                    📱
                  </div>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  We'll use this to contact you about your certificate
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading.submit}
              className={`w-full mt-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 ${
                loading.submit ? 'animate-pulse' : ''
              }`}
            >
              {loading.submit ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Processing Request...
                </span>
              ) : (
                'Request Certificate Now'
              )}
            </button>

            <p className="mt-4 text-center text-sm text-gray-500">
              By submitting, you agree to receive a test email within 24 hours
            </p>
          </form>
        ) : (
          /* Incomplete Course State */
          <div className="text-center bg-white rounded-2xl shadow-xl p-8 sm:p-10">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-3xl">📚</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Complete the Course First
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You need to finish all lectures before requesting your certificate. 
              You're almost there!
            </p>
            <button
              onClick={() => navigate(`/player/${courseId}`)}
              className="px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-lg font-bold rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Continue Learning
            </button>
            <p className="mt-6 text-sm text-gray-500">
              Return here after completing all lectures
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestCertificate;