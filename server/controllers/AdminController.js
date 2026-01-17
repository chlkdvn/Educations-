// controllers/adminAuth.js
import Admin from '../models/Admin.js';
import mongoose from 'mongoose';
import Course from '../models/Course.js';
import { Purchase } from '../models/Purchase.js';
import User from '../models/User.js';
import Educator from "../models/EducatorVerification.js"
import { clerkClient } from '@clerk/clerk-sdk-node'; // Make sure this is imported correctly
import { Wallet } from "../models/wallet.js"
// Admin Signup
export const adminSignup = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    // Check required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, and name are required'
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email'
      });
    }

    // Create new admin
    const admin = new Admin({
      email,
      password,
      name
    });

    await admin.save();

    // Generate token
    const token = admin.generateToken();

    // Set HTTP-only cookie for development
res.cookie('admin_token', token, {
  httpOnly: true,
  secure: true,          // MUST be true in production (HTTPS)
  sameSite: 'none',      // REQUIRED for cross-domain cookies
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
});


    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name,
        createdAt: admin.createdAt
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin Login
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin
    const admin = await Admin.findOne({ email });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check password
    const isPasswordValid = await admin.checkPassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = admin.generateToken();

    // Set HTTP-only cookie for development
res.cookie('admin_token', token, {
  httpOnly: true,
  secure: true,          // MUST be true in production (HTTPS)
  sameSite: 'none',      // REQUIRED for cross-domain cookies
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
});


    res.json({
      success: true,
      message: 'Login successful',
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Admin Logout
export const adminLogout = (req, res) => {
  // Clear the cookie
  res.cookie('admin_token', '', {
    httpOnly: true,
    expires: new Date(0), // Set to past date to delete cookie
    secure: false,
    sameSite: 'lax',
    path: '/'
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
};



export const getallusers = async (req, res) => {
  try {

    const users = await User.find({});
    if (users.lengtth == 0) {
      res.json({
        message: "available user yet",
        success: true,
        error: false
      })
    }

    res.json({
      message: "success full ",
      data: users,
      success: true,
      error: false
    })

  } catch (error) {
    return error
  }
}



export const findallCourseandeducator = async (req, res) => {
  try {
    // 1. Find all courses
    const findcourse = await Course.find({})
      .populate("educator")            // get educator details
      .populate("enrolledStudents");   // get enrolled students details

    // 2. Total courses
    const totalCourses = await Course.countDocuments();

    // 3. Get all educators (distinct)
    const educatorIds = await Course.distinct("educator");
    const totalEducators = educatorIds.length;

    // 4. Count users that are enrolled in at least 1 course
    const totalUsersWithCourses = await User.countDocuments({
      enrolledCourses: { $exists: true, $not: { $size: 0 } }
    });

    return res.status(200).json({
      success: true,
      totalCourses,
      totalEducators,
      totalUsersWithCourses,
      courses: findcourse
    });

  } catch (error) {
    console.log(error)
    return res.status(500).json({ message: "Server error", error });
  }
};


export const findAllEducators = async (req, res) => {
  try {
    // 1. Get all unique educator IDs
    const educatorIds = await Course.distinct("educator");

    // 2. Get full educator profiles
    const educators = await User.find(
      { _id: { $in: educatorIds } },
      "_id name email imageUrl"
    );

    // 3. Attach the courses each educator created
    const result = await Promise.all(
      educators.map(async (edu) => {
        const courses = await Course.find(
          { educator: edu._id },
          "courseTitle courseThumbnail coursePrice"
        );

        return {
          educator: edu,
          totalCourses: courses.length,
          courses
        };
      })
    );

    return res.status(200).json({
      success: true,
      totalEducators: educators.length,
      educators: result
    });

  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, error });
  }
};





export const findAllPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({});

    const formatted = await Promise.all(
      purchases.map(async (purchase) => {
        const user = await User.findById(purchase.userId);    // Find user manually
        const course = await Course.findById(purchase.courseId); // Find course manually

        return {
          ...purchase.toObject(),
          user: user ? {
            _id: user._id,
            name: user.name,
            email: user.email,
            imageUrl: user.imageUrl
          } : null,
          course: course ? {
            _id: course._id,
            title: course.courseTitle,
            price: course.coursePrice,
            thumbnail: course.courseThumbnail
          } : null
        };
      })
    );

    return res.status(200).json({
      success: true,
      totalPurchases: formatted.length,
      purchases: formatted
    });

  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};




export const fineEducatorandcourse = async (req, res) => {
  try {
    const courses = await Course.find({});

    const data = await Promise.all(
      courses.map(async (course) => {
        // find the user that created the course
        const educator = await User.findById(course.educator);

        // find all purchases for this course
        const purchases = await Purchase.find({ courseId: course._id });

        return {
          course: {
            _id: course._id,
            title: course.courseTitle,
            price: course.coursePrice,
            thumbnail: course.courseThumbnail
          },
          educator: educator ? {
            _id: educator._id,
            name: educator.name,
            email: educator.email,
            imageUrl: educator.imageUrl
          } : null,
          purchases: purchases.map(p => ({
            _id: p._id,
            userId: p.userId,
            amount: p.amount,
            status: p.status
          }))
        };
      })
    );

    return res.status(200).json({
      success: true,
      totalCourses: data.length,
      data
    });

  } catch (error) {
    return res.status(500).json({ success: false, error });
  }
};



export const approveEducator = async (req, res) => {
  try {
    const { educatorId } = req.body;

    const educator = await Educator.findByIdAndUpdate(
      educatorId,
      { isApproved: true },
      { new: true }
    );

    if (!educator) return res.json({ success: false, message: "Not found" });

    // NOW make them educator in Clerk
    await clerkClient.users.updateUserMetadata(educator.userId, {
      publicMetadata: {
        role: "educator",
        educatorId: educator._id,
      },
    });

    res.json({ success: true, message: "Educator approved!" });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
};


export const getAllEducatorApplications = async (req, res) => {
  try {
    const applications = await Educator.find({ isApproved: false });
    res.json({ success: true, applications });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
}





// Get all courses for verification


export const getCoursesForVerification = async (req, res, filters = {}) => {
  try {
    const { status, search, page = 1, limit = 20 } = filters;

    const query = {};

    // Updated status query based on new enum values
    if (status && status !== 'all') {
      if (status === 'pending') {
        query.isPublished = 'pending';
      } else if (status === 'approved') {
        query.isPublished = 'approved';
      } else if (status === 'rejected') {
        query.isPublished = 'rejected';
      }
    }

    if (search) {
      query.$or = [
        { courseTitle: { $regex: search, $options: 'i' } },
        { 'educatorInfo.name': { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const courses = await Course.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Course.countDocuments(query);

    // Fetch all unique educator IDs first (much faster than one-by-one)
    const educatorIds = [...new Set(courses.map(c => c.educator))];

    let educatorMap = {};

    // Only try to fetch from Clerk if we have educator IDs
    if (educatorIds.length > 0) {
      try {
        // Batch fetch all educators from Clerk
        const clerkUsers = await clerkClient.users.getUserList({
          userId: educatorIds,
        });

        clerkUsers.forEach(user => {
          educatorMap[user.id] = {
            id: user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown',
            email: user.emailAddresses[0]?.emailAddress || 'No email',
            profileImage: user.imageUrl,
            verified: true,
          };
        });
      } catch (clerkError) {
        console.error('Clerk batch fetch failed:', clerkError);
        // If Clerk fails, we'll fall back to stored data
      }
    }

    const enrichedCourses = courses.map(course => {
      const educator = educatorMap[course.educator] || {
        id: course.educator,
        name: course.educatorInfo?.name || 'Unknown Educator',
        email: course.educatorInfo?.email || 'No email',
        profileImage: course.educatorInfo?.profileImage,
        verified: true,
      };

      return {
        ...course,
        educatorDetails: educator,
        // Add status as a string for easier frontend use
        status: course.isPublished,
      };
    });

    return res.json({
      success: true,
      courses: enrichedCourses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching courses for verification:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch courses',
    });
  }
};


































// Get course verification stats
export const getVerificationStats = async (req, res) => {
  try {
    const pendingCount = await Course.countDocuments({
      isPublished: false,
      rejectionReason: { $exists: false }
    });

    const approvedCount = await Course.countDocuments({
      isPublished: true
    });

    const rejectedCount = await Course.countDocuments({
      isPublished: false,
      rejectionReason: { $exists: true }
    });

    const totalCount = await Course.countDocuments();

    return res.json({
      success: true,
      stats: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: totalCount
      }
    })
  } catch (error) {
    console.error('Error fetching verification stats:', error);
    return res.json({
      success: false,
      message: 'Failed to fetch stats'
    });
  }
};





// Approve course
export const approveCourse = async (req, res) => {
  const { courseId, notes = '' } = req.body; // or from params/body as needed
  const adminUserId = req.user?.id;

  try {
    // Validate required fields
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is already approved
    if (course.isPublished === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Course already approved'
      });
    }

    // Use the instance method to approve the course
    await course.approveCourse(adminUserId);

    // Optionally add approval notes if you have that field
    if (notes.trim() !== '') {
      // You might want to add an approvalNotes field to your schema
      // For now, we can store it in a notes field or handle differently
      course.notes = notes.trim();
      await course.save();
    }

    return res.json({
      success: true,
      message: 'Course approved successfully',
      course: {
        id: course._id,
        title: course.courseTitle,
        status: course.isPublished,
        reviewedAt: course.reviewedAt,
        reviewedBy: course.reviewedBy,
        educator: course.educator
      },
    });
  } catch (error) {
    console.error('Error approving course:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to approve course',
    });
  }
};

// Reject course
export const rejectCourse = async (req, res) => {
  const { courseId, reason, notes = '' } = req.body;
  const adminUserId = req.user?.id; // assuming you have auth middleware

  try {
    // Validate required fields
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required'
      });
    }

    if (!reason || reason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    // Find course
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Check if course is already rejected
    if (course.isPublished === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Course already rejected'
      });
    }

    // Check if course is already approved (optional)
    if (course.isPublished === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Approved course cannot be rejected. You may need to unpublish it first.'
      });
    }

    // Use the instance method to reject the course
    await course.rejectCourse(adminUserId, reason.trim());

    // Optionally add rejection notes if you need separate from reason
    if (notes.trim() !== '') {
      // You might want to add a rejectionNotes field to your schema
      // For now, we can handle it if you add it
      // course.rejectionNotes = notes.trim();
      // await course.save();
    }

    return res.json({
      success: true,
      message: 'Course rejected successfully',
      course: {
        id: course._id,
        title: course.courseTitle,
        status: course.isPublished,
        rejectionReason: course.rejectionReason,
        reviewedAt: course.reviewedAt,
        reviewedBy: course.reviewedBy,
        educator: course.educator
      }
    });
  } catch (error) {
    console.error('Error rejecting course:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to reject course'
    });
  }
};
// Get single course details for verification

export const getCourseDetailsForVerification = async (req, res) => {
  try {
    // === SAFELY GET courseId FROM ANYWHERE ===
    const courseId = req.params.courseId

    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: 'Course ID is required',
      });
    }

    console.log('courseId:', courseId);

    // Validate MongoDB ObjectId format (optional but recommended)


    // === FETCH COURSE ===
    const course = await Course.findById(courseId).lean();

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    // === EDUCATOR DETAILS (from Clerk first) ===
    let educatorDetails = {
      id: course.educator,
      name: 'Unknown Educator',
      email: 'No email',
      profileImage: null,
      verified: true,
    };

    try {
      const clerkUser = await clerkClient.users.getUser(course.educator);
      educatorDetails = {
        id: clerkUser.id,
        name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown Educator',
        email: clerkUser.emailAddresses[0]?.emailAddress || 'No email',
        profileImage: clerkUser.imageUrl || clerkUser.profileImageUrl || null,
        verified: true
      };
    } catch (err) {
      console.warn(`Clerk failed for educator ${course.educator}, using fallback`);
      // Fallback to DB User model
      const dbUser = await User.findById(course.educator).lean();
      if (dbUser) {
        educatorDetails = {
          id: dbUser._id,
          name: dbUser.name || 'Unknown Educator',
          email: dbUser.email || 'No email',
          profileImage: dbUser.imageUrl || null,
          verified: false,
        };
      }
    }

    // === ENROLLED STUDENTS ===
    const enrolledStudentsDetails = await Promise.all(
      (course.enrolledStudents || []).map(async (studentId) => {
        let info = { id: studentId, name: 'Unknown Student', email: 'No email', profileImage: null };

        try {
          const clerkUser = await clerkClient.users.getUser(studentId);
          info = {
            id: clerkUser.id,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown Student',
            email: clerkUser.emailAddresses[0]?.emailAddress || 'No email',
            profileImage: clerkUser.imageUrl || null,
          };
        } catch (e) {
          const dbUser = await User.findById(studentId).lean();
          if (dbUser) {
            info = {
              id: dbUser._id,
              name: dbUser.name || 'Unknown Student',
              email: dbUser.email || 'No email',
              profileImage: dbUser.imageUrl || null,
            };
          }
        }
        return info;
      })
    );

    // === REVIEWERS ===
    const reviewersDetails = await Promise.all(
      (course.courseRatings || []).map(async (rating) => {
        let info = {
          userId: rating.userId,
          name: 'Unknown Reviewer',
          email: 'No email',
          profileImage: null,
          rating: rating.rating,
          ratingId: rating._id,
        };

        try {
          const clerkUser = await clerkClient.users.getUser(rating.userId);
          info = {
            ...info,
            name: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim() || 'Unknown Reviewer',
            email: clerkUser.emailAddresses[0]?.emailAddress || 'No email',
            profileImage: clerkUser.imageUrl || null,
          };
        } catch (e) {
          const dbUser = await User.findById(rating.userId).lean();
          if (dbUser) {
            info.name = dbUser.name || 'Unknown Reviewer';
            info.email = dbUser.email || 'No email';
            info.profileImage = dbUser.imageUrl || null;
          }
        }
        return info;
      })
    );

    // === METRICS ===
    const metrics = {
      totalStudents: course.enrolledStudents?.length || 0,
      totalReviews: course.courseRatings?.length || 0,
      averageRating: course.averageRating || 0,
      totalChapters: course.courseContent?.length || 0,
      totalLectures: course.totalLectures || 0,
      totalDuration: course.totalDuration || 0,
    };

    // === FINAL RESPONSE ===
    return res.json({
      success: true,
      course: {
        ...course,
        educatorDetails,
        enrolledStudentsDetails,
        reviewersDetails,
        metrics,
        formattedPrice: {
          original: course.coursePrice,
          discount: course.discount || 0,
          final: course.discount > 0
            ? Math.round(course.coursePrice * (1 - course.discount / 100))
            : course.coursePrice,
        },
      },
    });

  } catch (error) {
    console.error('getCourseDetailsForVerification error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};



// Get pending course count (for sidebar badge)
export const getPendingCourseCount = async (req, res) => {
  try {
    const count = await Course.countDocuments({
      isPublished: false,
      rejectionReason: { $exists: false }
    });

    return res.json({ count });
  } catch (error) {
    console.error('Error getting pending course count:', error);
    return res.json({ count: 0 });
  }
};


export const getAdminWallet = async (req,res) => {
  try {
    // Assuming single admin
    const admin = await Admin.findOne();
    if (!admin) throw new Error("Admin not found");

    // Check if wallet exists
    let adminWallet = await Wallet.findOne({ userId: admin._id.toString() });

    if (!adminWallet) {
      // Create wallet if not exists
      adminWallet = await Wallet.create({
        userId: admin._id.toString(),
        balance: 0,
        transactions: [],
      });
      console.log("Created new admin wallet:", adminWallet);
    } else {
      console.log("Admin wallet found:", adminWallet);
    }

    return res.json({ success: true, adminWallet });
  } catch (error) {
    console.error("getAdminWallet error:", error.message);
    throw error;
  }
};




export const adminWithdraw = async (req, res) => {
  try {
    const { amount, accountNumber, bankCode } = req.body;

    // ---------------- VALIDATION ----------------
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount",
      });
    }

    if (!accountNumber || !bankCode) {
      return res.status(400).json({
        success: false,
        message: "Bank details required",
      });
    }

    // ---------------- GET ADMIN ----------------
    const admin = await Admin.findOne();
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    // ---------------- GET ADMIN WALLET ----------------
    const adminWallet = await Wallet.findOne({
      userId: admin._id.toString(),
    });

    if (!adminWallet || adminWallet.balance < amount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient admin wallet balance",
      });
    }

    // Prevent multiple pending withdrawals
    const pending = adminWallet.transactions.find(
      (t) => t.type === "debit" && t.status === "pending"
    );
    if (pending) {
      return res.status(400).json({
        success: false,
        message: "Admin already has a pending transfer",
      });
    }

    // ---------------- PAYSTACK REQUEST (BUILT-IN) ----------------
    const paystackRequest = async (url, method, data = {}) => {
      const response = await fetch(`https://api.paystack.co${url}`, {
        method,
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          "Content-Type": "application/json",
        },
        body: method === "POST" ? JSON.stringify(data) : undefined,
      });

      return response.json();
    };

    // ---------------- CREATE TEMP RECIPIENT ----------------
    const recipientRes = await paystackRequest("/transferrecipient", "POST", {
      type: "nuban",
      name: "Admin Withdrawal",
      account_number: accountNumber,
      bank_code: bankCode,
      currency: "NGN",
    });

    if (!recipientRes.status) {
      return res.status(400).json({
        success: false,
        message: recipientRes.message || "Invalid bank details",
      });
    }

    const recipientCode = recipientRes.data.recipient_code;

    // ---------------- INITIATE TRANSFER ----------------
    const amountInKobo = Math.round(amount * 100);

    const transfer = await paystackRequest("/transfer", "POST", {
      source: "balance",
      amount: amountInKobo,
      recipient: recipientCode,
      reason: "Admin wallet withdrawal",
    });

    if (!transfer.status) {
      return res.status(400).json({
        success: false,
        message: transfer.message || "Transfer failed",
      });
    }

    // ---------------- UPDATE ADMIN WALLET ----------------
    adminWallet.balance -= amount;
    adminWallet.transactions.push({
      type: "debit",
      amount,
      reference: transfer.data.reference,
      description: "Admin wallet withdrawal",
      status: "pending",
    });

    await adminWallet.save();

    return res.json({
      success: true,
      message: "Admin transfer initiated successfully",
    });

  } catch (error) {
    console.error("Admin withdraw error:", error);
    return res.status(500).json({
      success: false,
      message: "Admin withdrawal failed",
    });
  }
};
