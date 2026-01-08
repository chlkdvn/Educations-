import mongoose from "mongoose";


 const CourseProgressScheme = new mongoose.Schema({
    userId:{type:String,  required:true},
    courseId:{type:String , required:true},
    completed:{type:String, Boolean, required:false},
    lectureCompleted:[]

 },{minimize:false});

 export const  CourseProgress = mongoose.model('CourseProgress', CourseProgressScheme)

 //Update User Course Progress
 