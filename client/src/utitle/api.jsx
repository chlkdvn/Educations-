// admin/utils/api.js
import axios from 'axios';
import { toast } from 'react-toastify';

const API_BASE = 'https://educations.onrender.com/api/admin';

// Course Verification API functions
export const getCoursesForVerification = async (filters = {}) => {
  try {
    const queryParams = new URLSearchParams();

    if (filters.status) queryParams.append('status', filters.status);
    if (filters.search) queryParams.append('search', filters.search);
    if (filters.page) queryParams.append('page', filters.page);
    if (filters.limit) queryParams.append('limit', filters.limit);

    const response = await axios.get(
      `${API_BASE}/getCoursesForVerification?${queryParams.toString()}`,
      { withCredentials: true }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching courses for verification:', error);
    toast.error('Failed to load courses');
    return { success: false, courses: [], pagination: {} };
  }
};

export const getVerificationStats = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/getVerificationStats`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    return { success: false, stats: {} };
  }
};

export const approveCourse = async (courseId, notes = '') => {
  try {
    const response = await axios.post(
      `${API_BASE}/approveCourse`,
      { courseId, notes },
      { withCredentials: true }
    );

    if (response.data.success) {
      toast.success('Course approved successfully');
    } else {
      toast.error(response.data.message || 'Failed to approve course');
    }

    return response.data;
  } catch (error) {
    console.error('Error approving course:', error);
    toast.error('Failed to approve course');
    return { success: false, message: 'Failed to approve course' };
  }
};

export const rejectCourse = async (courseId, reason, notes = '') => {
  try {
    const response = await axios.post(
      `${API_BASE}/rejectCourse`,
      { courseId, reason, notes },
      { withCredentials: true }
    );

    if (response.data.success) {
      toast.success('Course rejected successfully');
    } else {
      toast.error(response.data.message || 'Failed to reject course');
    }

    return response.data;
  } catch (error) {
    console.error('Error rejecting course:', error);
    toast.error('Failed to reject course');
    return { success: false, message: 'Failed to reject course' };
  }
};

export const getCourseDetailsForVerification = async (courseId) => {
  try {
    const response = await axios.get(
      `${API_BASE}/getCourseDetailsForVerification/${courseId}`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching course details:', error);
    toast.error('Failed to load course details');
    return { success: false, course: null };
  }
};



export const getPendingCourseCount = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/getPendingCourseCount`,
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting pending count:', error);
    return { success: false, count: 0 };
  }
};

// Play video function
export const playVideo = (videoUrl) => {
  // This would open the video in a new tab or modal
  window.open(videoUrl, '_blank');
};

// Download resource function
export const downloadResource = (resourceUrl, fileName) => {
  const link = document.createElement('a');
  link.href = resourceUrl;
  link.download = fileName || 'resource';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Open social media link
export const openSocialLink = (platform, url) => {
  if (!url) {
    toast.error(`No ${platform} link available`);
    return;
  }
  window.open(url, '_blank');
};

// Original functions remain the same...
export const fetchAllData = async () => {
  try {
    const response = await axios.get(
      `${API_BASE}/findAllEducators`,
      { withCredentials: true }
    );

    if (response.data.success) {
      const data = response.data.data || [];

      // Calculate statistics
      const uniqueUsers = new Set();
      const uniqueEducators = new Set();
      let totalPurchases = 0;
      let totalRevenue = 0;

      data.forEach(item => {
        if (item.educator?._id) {
          uniqueEducators.add(item.educator._id);
        }

        item.purchases?.forEach(purchase => {
          if (purchase.userId) {
            uniqueUsers.add(purchase.userId);
          }
          totalPurchases++;
          totalRevenue += purchase.amount || 0;
        });
      });

      return {
        data,
        stats: {
          totalUsers: uniqueUsers.size,
          totalCourses: response.data.totalCourses || 0,
          totalPurchases,
          totalEducators: uniqueEducators.size,
          totalRevenue,
        }
      };
    } else {
      toast.error('Failed to fetch data');
      return null;
    }
  } catch (error) {
    console.error('Error fetching data:', error);
    toast.error('Failed to load dashboard data');
    return null;
  }
};

export const getAllPurchases = (data) => {
  const purchases = [];
  data.forEach(item => {
    item.purchases?.forEach(purchase => {
      purchases.push({
        ...purchase,
        course: item.course,
        educator: item.educator
      });
    });
  });
  return purchases.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
};

export const getAllCourses = (data) => {
  return data.map(item => ({
    ...item.course,
    educator: item.educator,
    purchases: item.purchases,
    totalRevenue: item.purchases.reduce((sum, purchase) => sum + (purchase.amount || 0), 0),
    enrolledStudents: item.purchases.length
  }));
};

export const getAllUsers = (data) => {
  const usersMap = new Map();

  data.forEach(item => {
    item.purchases?.forEach(purchase => {
      if (purchase.userId && !usersMap.has(purchase.userId)) {
        usersMap.set(purchase.userId, {
          _id: purchase.userId,
          name: purchase.userId.substring(0, 8) + '...',
          email: 'user@example.com',
          imageUrl: 'https://via.placeholder.com/40',
          enrolledCourses: data
            .filter(d => d.purchases.some(p => p.userId === purchase.userId))
            .map(d => d.course._id),
        });
      }
    });
  });

  return Array.from(usersMap.values());
};

export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const formatDuration = (minutes) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

export const getUniqueEducators = (data) => {
  const uniqueEducators = new Map();

  data.forEach(item => {
    const educator = item.educator;
    if (educator?._id && !uniqueEducators.has(educator._id)) {
      const educatorCourses = data.filter(d => d.educator?._id === educator._id);

      // Calculate total purchases and revenue
      let totalPurchases = 0;
      let totalRevenue = 0;

      educatorCourses.forEach(course => {
        totalPurchases += course.purchases?.length || 0;
        totalRevenue += course.purchases?.reduce((sum, purchase) =>
          sum + (purchase.amount || 0), 0) || 0;
      });

      uniqueEducators.set(educator._id, {
        _id: educator._id,
        name: educator.name || 'Unknown Educator',
        email: educator.email || 'No email',
        imageUrl: educator.imageUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(educator.name || 'E')}&background=random`,
        courses: educatorCourses,
        totalPurchases,
        totalRevenue,
        totalStudents: new Set(
          educatorCourses.flatMap(course =>
            course.purchases?.map(p => p.userId).filter(Boolean) || []
          )
        ).size
      });
    }
  });

  return Array.from(uniqueEducators.values());
};