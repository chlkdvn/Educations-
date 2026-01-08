import mongoose from "mongoose";

// Connect to the MongoDB dataBase

 const  connectDB = async ()=>{
    mongoose.connection.on('connected', ()=>console.log('database connected'))

    await mongoose.connect(`${process.env.MONGO_URI}`)
 }

export default  connectDB 