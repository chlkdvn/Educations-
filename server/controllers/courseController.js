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
  const { id } = req.params
  try {
    const courseData = await Course.findById(id).populate({ path: 'educator' })

    // Remove  LectureUrl if is PreviewFree is false
    courseData.courseContent.forEach(chapter => {
      chapter.chapterContent.forEach(lecture => {
        if (!lecture.isPreviewFree) {
          lecture.lectureUrl = "";
        }
      })
    })

    const FindEductor = await User.findById(courseData.educator).select(['-enrolledCourses'])
    res.json({ success: true, courseData, FindEductor })

  } catch (error) {
    res.json({ success: false, message: error.message })
  }
}




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
          _id: "$educator", // educatorId
          averageRating: { $avg: "$averageRating" },
          totalReviews: { $sum: "$totalReviews" },
          totalCourses: { $sum: 1 }
        }
      },

      // Sort by rating first, then reviews
      {
        $sort: {
          averageRating: -1,
          totalReviews: -1
        }
      },

      // Get educator details from users collection
      {
        $lookup: {
          from: "users",        // collection name
          localField: "_id",    // educatorId
          foreignField: "_id",  // user _id
          as: "educatorInfo"
        }
      },

      // Convert educatorInfo array → object
      {
        $unwind: "$educatorInfo"
      },

      // Shape final response
      {
        $project: {
          _id: 0,
          educatorId: "$educatorInfo._id",
          name: "$educatorInfo.name",
          email: "$educatorInfo.email",
          imageUrl: "$educatorInfo.imageUrl",
          averageRating: 1,
          totalReviews: 1,
          totalCourses: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: topEducators
    });
  } catch (error) {
    next(error);
  }
};







export const getAllMentors = async (req, res, next) => {
  try {
    // 1️⃣ Get all approved courses
    const courses = await Course.find({ isPublished: "approved" }).lean();

    // 2️⃣ Group courses by educator
    const educatorMap = {};

    for (const course of courses) {
      const educatorId = course.educator;

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

    // 3️⃣ Convert to array + calculate average
    let mentors = Object.values(educatorMap).map(m => ({
      ...m,
      averageRating:
        m.totalCourses > 0
          ? Number((m.ratingSum / m.totalCourses).toFixed(2))
          : 0
    }));

    // 4️⃣ Sort from most stars → least
    mentors.sort((a, b) => {
      if (b.averageRating === a.averageRating) {
        return b.totalReviews - a.totalReviews;
      }
      return b.averageRating - a.averageRating;
    });

    // 5️⃣ Fetch user info for each educator
    const finalMentors = [];

    for (const mentor of mentors) {
      const user = await User.findOne({ _id: mentor.educatorId }).lean();

      if (!user) continue;

      finalMentors.push({
        educatorId: user._id,
        name: user.name,
        email: user.email,
        imageUrl: user.imageUrl,
        averageRating: mentor.averageRating,
        totalReviews: mentor.totalReviews,
        totalCourses: mentor.totalCourses
      });
    }

    res.status(200).json({
      success: true,
      data: finalMentors
    });
  } catch (error) {
    next(error);
  }
};




export const getEducatorOverview = async (req, res, next) => {
  try {
    const { educatorId } = req.params;

    /* 1️⃣ Find educator */
    const educator = await User.findById(educatorId).lean();
    if (!educator) {
      return res.status(404).json({
        success: false,
        message: "Educator not found"
      });
    }

    /* 2️⃣ Find educator courses */
    const courses = await Course.find({
      educator: educatorId,
      isPublished: "approved"
    }).lean();

    const totalCourses = courses.length;

    /* 3️⃣ Aggregate students + ratings */
    let totalEnrolledStudents = 0;
    const allRatings = [];
    const enrolledUserIds = new Set();

    for (const course of courses) {
      // Enrolled students
      if (course.enrolledStudents?.length) {
        totalEnrolledStudents += course.enrolledStudents.length;
        course.enrolledStudents.forEach(id => enrolledUserIds.add(id));
      }

      // Ratings
      if (course.courseRatings?.length) {
        course.courseRatings.forEach(rating => {
          allRatings.push({
            courseId: course._id,
            rating: rating.rating,
            userId: rating.userId
          });
        });
      }
    }

    /* 4️⃣ Find users who rated */
    const ratingUserIds = [...new Set(allRatings.map(r => r.userId))];
    const ratingUsers = await User.find({
      _id: { $in: ratingUserIds }
    }).lean();

    const ratingUserMap = {};
    ratingUsers.forEach(u => {
      ratingUserMap[u._id] = {
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

    /* 5️⃣ Find enrolled users */
    const enrolledUsers = await User.find({
      _id: { $in: [...enrolledUserIds] }
    }).lean();

    const enrolledStudents = enrolledUsers.map(u => ({
      id: u._id,
      name: u.name,
      imageUrl: u.imageUrl
    }));

    /* 6️⃣ Final response */
    res.status(200).json({
      success: true,
      data: {
        educator: {
          id: educator._id,
          name: educator.name,
          email: educator.email,
          imageUrl: educator.imageUrl
        },
        stats: {
          totalCourses,
          totalEnrolledStudents,
          totalRatings: ratingsWithUsers.length
        },
        courses,
        ratings: ratingsWithUsers,
        enrolledStudents
      }
    });
  } catch (error) {
    next(error);
  }
};
