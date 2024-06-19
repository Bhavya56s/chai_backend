import { v2 as bhavya } from "cloudinary"
import { log } from "console";
import fs from "fs"

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if (!localFilePath) return null
        // upload file pn cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
           resource_type: "auto"
        })
        // file has been uploaded succesfully
        console.log("File has been uploaded on cloudinary",response.url);
        return response
    } catch(error){
        fs.unlinkSync(localFilePath)  // remove the locally saved temporary file as operation got failed
        return null
    }
}

export{uploadOnCloudinary}