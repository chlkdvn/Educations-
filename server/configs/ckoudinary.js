import  {v2 as  cloudinary} from  'cloudinary'


const connectCloudinary = async()=>{
    cloudinary.config({
        cloud_name:"dhqe7gm5e",
        api_key:"941327527949927",
        api_secret:"S0Zp-1gaar71FmZQcmDxMDP8JR4"
    })
}

export  default connectCloudinary

