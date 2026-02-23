import Stripe from "stripe";
import Course from "../models/Course.js";
import { Purchase } from "../models/Purchase.js";
import User from "../models/User.js"



// Get All courses

export const getAllCourse = async (req, res) => {
  try {

    const courses = await Course.find({ isPublished: "approved" })
      .select(['-courseContent', '-enrolledStudents']).populate({ path: 'educator' })


    res.json({ success: true, courses })
  } catch (error) {

    res.json({
      success: false, message: error.message
    })
  }
}


// Get Course by Id

export const getCourseId = async (req, res) => {
  const { id } = req.params;
  try {
    const courseData = await Course.findById(id).populate({ 
      path: 'educator',
      select: 'name email imageUrl' // Only get necessary fields
    });

    if (!courseData) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Remove LectureUrl if isPreviewFree is false
    courseData.courseContent.forEach(chapter => {
      chapter.chapterContent.forEach(lecture => {
        if (!lecture.isPreviewFree) {
          lecture.lectureUrl = "";
        }
      });
    });

    // Educator already populated, no need for separate query
    res.json({ 
      success: true, 
      courseData
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};





export const getTopEducators = async (req, res, next) => {
  try {
    const topEducators = await Course.aggregate([
      // Only published / approved courses
      {
        $match: {
          isPublished: "approved"
        }
      },

      // Group by educator
      {
        $group: {
          _id: "$educator",
          averageRating: { $avg: "$averageRating" },
          totalReviews: { $sum: "$totalReviews" },
          totalCourses: { $sum: 1 }
        }
      },

      // Sort by rating first (highest first), then by reviews
      {
        $sort: {
          averageRating: -1,
          totalReviews: -1
        }
      },

      // Limit to top 5
      {
        $limit: 5
      },

      // Get educator details from users collection
      // Handle both string and ObjectId types
      {
        $lookup: {
          from: "users",
          let: { educatorIdString: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ["$_id", { $toObjectId: "$$educatorIdString" }] },
                    { $eq: ["$_id", "$$educatorIdString"] }
                  ]
                }
              }
            }
          ],
          as: "educatorInfo"
        }
      },

      // Convert educatorInfo array → object
      {
        $unwind: "$educatorInfo"
      },

      // Only include users with role: 'educator'
      {
        $match: {
          "educatorInfo.role": "educator"
        }
      },

      // Shape final response
      {
        $project: {
          _id: 0,
          educatorId: "$educatorInfo._id",
          name: "$educatorInfo.name",
          email: "$educatorInfo.email",
          imageUrl: "$educatorInfo.imageUrl",
          role: "$educatorInfo.role",
          averageRating: { $round: ["$averageRating", 1] },
          totalReviews: 1,
          totalCourses: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: topEducators.length,
      data: topEducators
    });
  } catch (error) {
    next(error);
  }
};


export const getAllMentors = async (req, res, next) => {
  try {
    // Get all approved courses
    const courses = await Course.find({ isPublished: "approved" }).lean();

    // Group courses by educator
    const educatorMap = {};

    for (const course of courses) {
      const educatorId = course.educator?.toString();
      if (!educatorId) continue;

      if (!educatorMap[educatorId]) {
        educatorMap[educatorId] = {
          educatorId,
          totalCourses: 0,
          totalReviews: 0,
          ratingSum: 0
        };
      }

      educatorMap[educatorId].totalCourses += 1;
      educatorMap[educatorId].totalReviews += course.totalReviews || 0;
      educatorMap[educatorId].ratingSum += course.averageRating || 0;
    }

    // Convert to array + calculate average
    let mentors = Object.values(educatorMap).map(m => ({
      ...m,
      averageRating: m.totalCourses > 0 
        ? Number((m.ratingSum / m.totalCourses).toFixed(2)) 
        : 0
    }));

    // Sort by rating (highest first), then by reviews
    mentors.sort((a, b) => {
      if (b.averageRating !== a.averageRating) {
        return b.averageRating - a.averageRating;
      }
      return b.totalReviews - a.totalReviews;
    });

    // Fetch user info for each educator - ONLY get users with role: 'educator'
    const educatorIds = mentors.map(m => m.educatorId);
    const users = await User.find({ 
      _id: { $in: educatorIds },
      role: 'educator'  // <-- FILTER: only educators
    })
      .select('name email imageUrl role')
      .lean();

    const userMap = {};
    users.forEach(u => {
      userMap[u._id.toString()] = u;
    });

    // Merge user data with mentor stats
    const finalMentors = mentors
      .filter(m => userMap[m.educatorId]) // Only include if user exists AND is educator
      .map(m => ({
        educatorId: m.educatorId,
        name: userMap[m.educatorId].name,
        email: userMap[m.educatorId].email,
        imageUrl: userMap[m.educatorId].imageUrl,
        role: userMap[m.educatorId].role,
        averageRating: m.averageRating,
        totalReviews: m.totalReviews,
        totalCourses: m.totalCourses
      }));

    res.status(200).json({
      success: true,
      count: finalMentors.length,
      data: finalMentors
    });
  } catch (error) {
    next(error);
  }
};

export const getEducatorOverview = async (req, res, next) => {
  try {
    const { educatorId } = req.params;

    // Validate educatorId
    if (!educatorId) {
      return res.status(400).json({
        success: false,
        message: "Educator ID is required"
      });
    }

    // Find educator - MUST have role: 'educator'
    const educator = await User.findOne({
      _id: educatorId,
      role: 'educator'  // <-- FILTER: only educators
    })
      .select('name email imageUrl role')
      .lean();
    
    if (!educator) {
      return res.status(404).json({
        success: false,
        message: "Educator not found"
      });
    }

    // Find educator courses
    const courses = await Course.find({
      educator: educatorId,
      isPublished: "approved"
    })
    .select('-courseContent.lectureUrl')
    .lean();

    const totalCourses = courses.length;

    // Aggregate students + ratings
    let totalEnrolledStudents = 0;
    const allRatings = [];
    const enrolledUserIds = new Set();

    for (const course of courses) {
      // Enrolled students
      if (course.enrolledStudents?.length) {
        totalEnrolledStudents += course.enrolledStudents.length;
        course.enrolledStudents.forEach(id => enrolledUserIds.add(id.toString()));
      }

      // Ratings
      if (course.courseRatings?.length) {
        course.courseRatings.forEach(rating => {
          allRatings.push({
            courseId: course._id,
            rating: rating.rating,
            userId: rating.userId?.toString()
          });
        });
      }
    }

    // Calculate average rating
    const avgRating = allRatings.length > 0
      ? Number((allRatings.reduce((sum, r) => sum + r.rating, 0) / allRatings.length).toFixed(2))
      : 0;

    // Find users who rated (batch query)
    const ratingUserIds = [...new Set(allRatings.map(r => r.userId).filter(Boolean))];
    const ratingUsers = await User.find({
      _id: { $in: ratingUserIds }
    }).select('name imageUrl').lean();

    const ratingUserMap = {};
    ratingUsers.forEach(u => {
      ratingUserMap[u._id.toString()] = {
        id: u._id,
        name: u.name,
        imageUrl: u.imageUrl
      };
    });

    const ratingsWithUsers = allRatings.map(r => ({
      courseId: r.courseId,
      rating: r.rating,
      user: ratingUserMap[r.userId] || null
    }));

    // Find enrolled users (batch query)
    const enrolledUsers = await User.find({
      _id: { $in: [...enrolledUserIds] }
    }).select('name imageUrl').lean();

    const enrolledStudents = enrolledUsers.map(u => ({
      id: u._id,
      name: u.name,
      imageUrl: u.imageUrl
    }));

    // Final response
    res.status(200).json({
      success: true,
      data: {
        educator: {
          id: educator._id,
          name: educator.name,
          email: educator.email,
          imageUrl: educator.imageUrl,
          role: educator.role
        },
        stats: {
          totalCourses,
          totalEnrolledStudents,
          totalRatings: allRatings.length,
          averageRating: avgRating
        },
        courses: courses.map(c => ({
          _id: c._id,
          courseTitle: c.courseTitle,
          courseThumbnail: c.courseThumbnail,
          averageRating: c.averageRating,
          totalReviews: c.totalReviews,
          enrolledStudents: c.enrolledStudents?.length || 0
        })),
        ratings: ratingsWithUsers,
        enrolledStudents
      }
    });
  } catch (error) {
    next(error);
  }
};