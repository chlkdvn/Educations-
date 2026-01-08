import express from "express";
import { addUserRating, getMyTransactions, getUserCourseProgress, getUserData, initializeCoursePayment, updateUserCourseProgress, userEnrolledCourse, verifyCoursePayment } from "../controllers/userController.js";
import { checkCertificateRequested, requestCertificate } from "../controllers/requestcertifcate.js";
import { onboardingEducator } from "../controllers/educationController.js";
import upload from "../configs/multer.js";
import { getAllMentors, getEducatorOverview, getTopEducators } from "../controllers/courseController.js";
import { protectUser } from "../middlewares/authMiddleware.js";
import { checkFollowing, followEducator, getEducatorFollowerCount, unfollowEducator } from "../controllers/followerController.js";
import { getNewCourseNotifications } from "../controllers/noticationController.js";
const userRouter = express.Router()

userRouter.get('/data', getUserData)
userRouter.get('/enrolled-courses', userEnrolledCourse)


userRouter.post('/update-course-progress', updateUserCourseProgress)
userRouter.post("/get-course-progress", getUserCourseProgress)
userRouter.post("/add-rating", addUserRating)
userRouter.post("/request-certificate", requestCertificate)
userRouter.post("/check-certificate-requested", checkCertificateRequested)
userRouter.get("/getTopEducators", getTopEducators)
userRouter.get("/getAllMentors", getAllMentors)
userRouter.get("/getEducatorOverview/:educatorId", getEducatorOverview)
userRouter.get("/getMyTransactions", protectUser, getMyTransactions)
userRouter.post("/followEducator/:educatorId", protectUser, followEducator)
userRouter.post("/unfollowEducator/:educatorId", protectUser, unfollowEducator)
userRouter.get("/checkFollowing/:educatorId", protectUser, checkFollowing)
userRouter.get('/getEducatorFollowerCount/:educatorId', getEducatorFollowerCount)
userRouter.get("/getNewCourseNotifications", protectUser, getNewCourseNotifications)
userRouter.post("/initializeCoursePayment", protectUser, initializeCoursePayment)
userRouter.get("/verify-course-payment", verifyCoursePayment)
export default userRouter