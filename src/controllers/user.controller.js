import { asyncHandler } from "../utils/asynchandler.js";
import {apiError} from "../utils/ApiError.js"
import{User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/clouinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler( async (req,res) => {
    // return res.status(200).json({
    //     message: "Bhavya first app"
    // })



    const {userName,fullName,email,password} = req.body
    console.log("email", email);
    // if(fullName === ""){
    //     throw new apiError(400,"Full name required")
    // }

    if(
        [fullName,userName,email,password].some((field) => field?.trim()=== "")
    ){
        throw new apiError(400,"All are compulsary")
    }
    const existedUser = User.findOne({
        $or: [{ userName },{ email }]
    })

    if (existedUser){
        throw new apiError(409,"user already exists")
    }
     const avatarLocalPath = req.files?.avatar[0]?.path;
     const coverImageLocalPath = req.files?.coverImage[0]?.path;

     if(!avatarLocalPath){
        throw new apiError(400,"Avatar file is required")
     }

     const avatar = await uploadOnCloudinary(avatarLocalPath)
     const coverImage = await uploadOnCloudinary(coverImageLocalPath)

     if(!avatar){
        throw new apiError(400,"Avatar file is required")
     }
     const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username : userName.toLowerCase()
     })
     const createdUser   = await User.findById(user._id).select(
        "-password -refreshToken"
     )
     if(!createdUser){
        throw new apiError(500,"Something went wrong while registring of the user")
     }
     return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
     )

})


export {registerUser,}