import { apiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asynchandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async(req,res,next)=>{
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
        console.log(token)
        if(!token){
            throw new apiError(401,"Unauthorized access")
        }
    
    
        const decodedToken  = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
    
       const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
       if(!user){
        throw new apiError(401,"Invalid Access Token")
       }
       req.user = user;
       next()
    } catch (error) {
        throw new apiError(401, error?.message || "Invalid Access token")
    }
})
