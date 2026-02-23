import express from "express";
import { addUserRating, getCurrentUser, getMyTransactions, getUserCourseProgress, getUserData, initializeCoursePayment, login, logout, signUp, updateUserCourseProgress, userEnrolledCourse, verifyCoursePayment } from "../controllers/userController.js";
import { checkCertificateRequested, requestCertificate } from "../controllers/requestcertifcate.js";
import { onboardingEducator } from "../controllers/educationController.js";
import upload from "../configs/multer.js";
import { getAllMentors, getEducatorOverview, getTopEducators  } from "../controllers/courseController.js";
import { AuthUser } from "../middlewares/authMiddleware.js";
import { checkFollowing, followEducator, getEducatorFollowerCount, unfollowEducator } from "../controllers/followerController.js";
import { getNewCourseNotifications } from "../controllers/noticationController.js";
const userRouter = express.Router()

userRouter.get('/data', getUserData)
userRouter.get('/enrolled-courses',   AuthUser, userEnrolledCourse)


userRouter.post('/update-course-progress', AuthUser, updateUserCourseProgress)
userRouter.post("/get-course-progress", AuthUser, getUserCourseProgress)
userRouter.post("/add-rating", AuthUser, addUserRating)
userRouter.post("/request-certificate", AuthUser, requestCertificate)
userRouter.post("/check-certificate-requested", AuthUser, checkCertificateRequested)
userRouter.get("/getTopEducators", getTopEducators)
userRouter.get("/getAllMentors", getAllMentors)
userRouter.get("/getAllMentorsgetEducatorOverview/:educatorId", getEducatorOverview)
userRouter.get("/getMyTransactions",  AuthUser, getMyTransactions)
userRouter.post("/followEducator/:educatorId",  AuthUser, followEducator)
userRouter.post("/unfollowEducator/:educatorId",  AuthUser, unfollowEducator)
userRouter.get("/checkFollowing/:educatorId",  AuthUser, checkFollowing)
userRouter.get('/getEducatorFollowerCount/:educatorId', getEducatorFollowerCount)
userRouter.get("/getNewCourseNotifications",   AuthUser, getNewCourseNotifications)
userRouter.post("/initializeCoursePayment",    AuthUser, initializeCoursePayment)
userRouter.get("/verify-course-payment", verifyCoursePayment)
userRouter.post("/signUp", upload.single('image'), signUp)
userRouter.post("/login",  login)
userRouter.get("/me",  AuthUser, getCurrentUser)
userRouter.get("/logout",  logout)
export default userRouter