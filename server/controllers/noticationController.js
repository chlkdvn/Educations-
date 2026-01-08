import Course from "../models/Course.js";
import Follow from "../models/Follower.js";
import User from "../models/User.js";
import mongoose from "mongoose";



export const getNewCourseNotifications = async (req, res) => {
    try {
        const userId = req.user._id;

        console.log("Fetching notifications for user:", userId);

        /* 1️⃣ Get followed educators */
        const follows = await Follow.find({ followerId: userId })
            .select("educatorId");

        if (!follows.length) {
            return res.json({
                success: true,
                count: 0,
                courses: []
            });
        }

        const educatorIds = follows.map(f => f.educatorId);

        /* 2️⃣ 7-day window */
        const now = new Date();
        const sevenDaysAgo = new Date(
            now.getTime() - 7 * 24 * 60 * 60 * 1000
        );

        /* 3️⃣ AGGREGATION: Course → User */
        const courses = await Course.aggregate([
            {
                $match: {
                    educator: { $in: educatorIds },
                    isPublished: "approved",
                    createdAt: {
                        $gte: sevenDaysAgo,
                        $lte: now
                    }
                }
            },
            {
                $lookup: {
                    from: "users", // User collection
                    localField: "educator",
                    foreignField: "_id",
                    as: "educatorInfo"
                }
            },
            {
                $unwind: "$educatorInfo"
            },
            {
                $project: {
                    courseTitle: 1,
                    courseThumbnail: 1,
                    createdAt: 1,
                    "educatorInfo.name": 1,
                    "educatorInfo.imageUrl": 1
                }
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);

        console.log("Courses fetched for notifications:", courses);

        return res.json({
            success: true,
            count: courses.length,
            courses
        });

    } catch (error) {
        console.error("Notification error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to fetch new course notifications"
        });
    }
};
