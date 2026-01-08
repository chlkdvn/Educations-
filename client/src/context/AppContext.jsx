import { createContext, useEffect, useState } from 'react';
import { dummyCourses } from '../assets/assets';
import { useNavigate } from 'react-router-dom'; // Fixed: Removed unused 'data' import
import humanizeDuration from "humanize-duration";
import { useAuth, useUser } from "@clerk/clerk-react";
import axios from "axios";
import { toast } from 'react-toastify';

export const AppContext = createContext();

export const AppContextProvider = ({ children }) => {
  const backendUrl = "https://educations.onrender.com";
  const currency = "₦";
  const navigate = useNavigate();

  const { getToken } = useAuth();
  const { user } = useUser();

  const [allCourses, setallCourses] = useState([]);
  const [isEducactor, setIsEducactor] = useState(false); // Kept isEducactor typo as requested
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [userData, setUserdata] = useState(null);

  console.log('AppContext State:', {
    allCourses,
    isEducactor,
    enrolledCourses,
    userData,
    user: user ? user.id : null,
  });

  const fetchAllCourses = async () => {
    try {
      console.log('Starting fetchAllCourses...');
      const { data } = await axios.get(`${backendUrl}/api/course/all`); // Fixed: Destructured response
      console.log('fetchAllCourses Response:', data);
      if (data.success) {
        console.log('Setting allCourses:', data.courses);
        setallCourses(data.courses); // Fixed: Moved to try block
      } else {
        console.log('fetchAllCourses API Error:', data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error('fetchAllCourses Error:', error.message, error);
      toast.error(error.message);
    }
  };

  // FetchUser data
  const fetchUserdata = async () => {
    console.log('Starting fetchUserdata...');
    if (user && user.publicMetadata.role === 'educator') {
      console.log('Setting isEducactor to true');
      setIsEducactor(true);
    }
    try {
      const token = await getToken();
      console.log('fetchUserdata Token:', token);
      console.log('Making API request to:', `${backendUrl}/api/user/data`);
      const { data } = await axios.get(`${backendUrl}/api/user/data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('fetchUserdata Response:', data);
      if (data.success) {
        console.log('Setting userData:', data.user);
        setUserdata(data.user);
      } else {
        console.log('fetchUserdata API Error:', data.message); // Fixed: Changed data.user to data.message
        toast.error(data.message); // Fixed: Changed data.user to data.message
      }
    } catch (error) {
      console.error('fetchUserdata Error:', error.message, error);
      toast.error(error.message);
    }
  };

  // Function to calculate average rating of course
  const calculateRating = (course) => {
    console.log('calculateRating for course:', course?.courseTitle);
    if (!course?.courseRatings || course.courseRatings.length === 0) {
      return 0; // Fixed: Added null check
    }
    let totalRating = 0;
    course.courseRatings.forEach((rating) => {
      totalRating += rating.rating;
    });
    const avgRating = Math.floor(totalRating / course.courseRatings.length);
    console.log('Calculated rating:', avgRating);
    return avgRating;
  };

  // Function to calculate course chapter time
  const CalculateChapterTime = (Chapter) => {
    console.log('CalculateChapterTime for chapter:', Chapter);
    if (!Chapter?.chapterContent) return "0h 0m"; // Fixed: Added null check
    let time = 0;
    Chapter.chapterContent.map((lecture) => (time += lecture.lectureDuration));
    const duration = humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    console.log('Calculated chapter time:', duration);
    return duration;
  };

  // Function to calculate course duration
  const CalculateCourseDuration = (course) => {
    console.log('CalculateCourseDuration for course:', course?.courseTitle);
    if (!course?.courseContent) return "0h 0m"; // Fixed: Added null check
    let time = 0;
    course.courseContent.map((chapter) =>
      chapter.chapterContent.map((lecture) => (time += lecture.lectureDuration))
    );
    const duration = humanizeDuration(time * 60 * 1000, { units: ["h", "m"] });
    console.log('Calculated course duration:', duration);
    return duration;
  };

  // Function to calculate number of lectures in the course
  const calculateNoOfLectures = (course) => {
    console.log('calculateNoOfLectures for course:', course?.courseTitle);
    if (!course?.courseContent) return 0; // Fixed: Added null check
    let totalLectures = 0;
    course.courseContent.forEach((chapter) => {
      if (Array.isArray(chapter.chapterContent)) {
        totalLectures += chapter.chapterContent.length;
      }
    });
    console.log('Calculated number of lectures:', totalLectures);
    return totalLectures;
  };

  // Fetch user enrolled courses
  const fetchUserEnrolledCourses = async () => {
    try {
      console.log('Starting fetchUserEnrolledCourses...');
      const token = await getToken();
      console.log('fetchUserEnrolledCourses Token:', token);
      console.log('Making API request to:', `${backendUrl}/api/user/enrolled-courses`);
      const { data } = await axios.get(`${backendUrl}/api/user/enrolled-courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('fetchUserEnrolledCourses Response:', data);
      if (data.success) {
        console.log('Setting enrolledCourses:', data.enrolledCourses.reverse());
        setEnrolledCourses(data.enrolledCourses.reverse());
      } else {
        console.log('fetchUserEnrolledCourses API Error:', data.message);
        toast.error(data.message);
      }
    } catch (error) {
      console.error('fetchUserEnrolledCourses Error:', error.message, error);
      toast.error(error.message);
    }
  };

  useEffect(() => {
    console.log('useEffect for fetchAllCourses triggered');
    fetchAllCourses();
  }, []);

  const logToken = async () => {
    const token = await getToken();
    console.log("user token:", token);
  };

  useEffect(() => {
    console.log('useEffect for user triggered, user:', user ? user.id : null);
    if (user) {
      logToken();
      fetchUserdata();
      fetchUserEnrolledCourses();
    }
  }, [user]);

  const value = {
    currency,
    allCourses,
    navigate,
    calculateRating,
    isEducactor,
    setIsEducactor,
    calculateNoOfLectures,
    CalculateCourseDuration,
    CalculateChapterTime,
    enrolledCourses,
    fetchUserEnrolledCourses,
    backendUrl,
    userData,
    setUserdata,
    getToken,
    fetchAllCourses,
  };

  console.log('Providing context value:', value);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};