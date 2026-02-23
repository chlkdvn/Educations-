import mongoose from "mongoose";

// Connect to the MongoDB dataBase

 const  connectDB = async ()=>{
    mongoose.connection.on('connected', ()=>console.log('database connected'))

    await mongoose.connect(`mongodb+srv://chlkdvn:Divinexi@cluster0.vpw36.mongodb.net/Study?retryWrites=true&w=majority`)
 }

export default  connectDB 