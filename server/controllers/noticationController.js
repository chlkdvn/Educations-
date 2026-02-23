import Course from "../models/Course.js";
import Follow from "../models/Follower.js";
import User from "../models/User.js";
import mongoose from "mongoose";



export const getNewCourseNotifications = async (req, res) => {
    try {
        const userId = req.userId;

        console.log("Fetching notifications for user:", userId);

        /* 1️⃣ Get followed educators */
        const follows = await Follow.find({ followerId: userId }).select("educatorId");
        console.log("Follows found:", follows);

        if (!follows.length) {
            return res.json({
                success: true,
                count: 0,
                courses: []
            });
        }

        // Convert educatorIds to strings to match Course.educator field
        const educatorIds = follows.map(f => f.educatorId ? f.educatorId.toString() : null)
            .filter(id => id !== null);

        console.log("Educator IDs:", educatorIds);

        /* 2️⃣ 30-day window */
        const now = new Date();
        const thirtyDaysAgo = new Date(
            now.getTime() - 30 * 24 * 60 * 60 * 1000
        );

        /* 3️⃣ AGGREGATION with proper educator lookup */
        const courses = await Course.aggregate([
            {
                $match: {
                    educator: { $in: educatorIds },
                    isPublished: "approved",
                    createdAt: {
                        $gte: thirtyDaysAgo,
                        $lte: now
                    }
                }
            },
            {
                // Convert string educator to ObjectId for lookup
                $addFields: {
                    educatorObjectId: { $toObjectId: "$educator" }
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "educatorObjectId",
                    foreignField: "_id",
                    as: "educatorInfo"
                }
            },
            {
                $unwind: {
                    path: "$educatorInfo",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    courseTitle: 1,
                    courseThumbnail: 1,
                    createdAt: 1,
                    educator: 1,
                    "educatorInfo.name": 1,
                    "educatorInfo.imageUrl": 1,
                    "educatorInfo._id": 1
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        console.log("Courses with educator info:", courses);

        // Format response to ensure educatorImage is available
        const formattedCourses = courses.map(course => ({
            _id: course._id,
            courseTitle: course.courseTitle,
            courseThumbnail: course.courseThumbnail,
            createdAt: course.createdAt,
            educator: course.educator,
            educatorName: course.educatorInfo?.name || 'Unknown',
            educatorImage: course.educatorInfo?.imageUrl || null,
            educatorId: course.educatorInfo?._id || course.educator
        }));

        return res.json({
            success: true,
            count: formattedCourses.length,
            courses: formattedCourses
        });

    } catch (error) {
        console.error("Notification error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch new course notifications"
        });
    }
};