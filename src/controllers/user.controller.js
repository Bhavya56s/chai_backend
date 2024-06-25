import { asyncHandler } from "../utils/asynchandler.js";
import {apiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/clouinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt  from "jsonwebtoken";
import mongoose from "mongoose";


const generateAcessAndRefreshToken = async(userId) =>{
   try {
       const user = await User.findById(userId)
       const accessToken = await user.genrateAccessToken()
       const refreshToken = await user.genrateRefreshToken()
// console.log(accessToken,refreshToken);
       user.refreshToken = refreshToken
       await user.save({validateBeforeSave : false})
       return ({accessToken,refreshToken})
   } catch (error) {
      throw new apiError(500,"Something went wrong while generating access and refresh tokens")
   }
}


const registerUser = asyncHandler( async (req,res) => {
    // return res.status(200).json({
    //     message: "Bhavya first app"
    // })

    const {userName,fullName,email,password} = req.body
      // console.log("email", email);
    // if(fullName === ""){
    //     throw new apiError(400,"Full name required")
    // }

    if(
        [fullName,userName,email,password].some((field) => field?.trim()=== "")
    ){
        throw new apiError(400,"All are compulsary")
    }
    const existedUser = await User.findOne({
        $or: [{ userName },{ email }]
    })

    if (existedUser){
        throw new apiError(409,"user already exists")

    }
     console.log(req.files);
     const avatarLocalPath = req.files?.avatar[0]?.path;
   //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
      coverImageLocalPath = req.files.coverImage[0].path
   }

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
        userName : userName.toLowerCase()
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


const loginUser = asyncHandler( async (req,res) => {

  const{email,userName,password} = req.body

//   console.log(email);
  if (!userName && !email) {
      throw new apiError(400,"Email or password is required")
  }
   const user = await User.findOne({
   $or:[{userName},{email}]
  })

  if(!user){
   throw new apiError(404,"User doesnot exist")
  }
  const  isPasswordValid = await user.isPasswordCorrect(password)
  if(!isPasswordValid){
   throw new apiError(401,"Invalid user credentials")
  }

    const {accessToken, refreshToken} = await generateAcessAndRefreshToken(user._id)
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options  = {
      httpOnly :true,
      secure : true
    }
   //  console.log(accessToken);
   //  console.log(refreshToken);
    return res
    .status(200)
    .cookie("accessToken", accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
         200,
         {
            user: loggedInUser,accessToken : accessToken,refreshToken : refreshToken
         },
         "User logged  in succesfully"
      )
    )
})


const logOutUser = asyncHandler( async(req,res) => {
    await User.findByIdAndUpdate(
      req.user._id,
      {
         $set: {
            refreshToken:undefined
         }
      },

      {
         new : true
      }
     )
   //   console.log(req.user._id,123);
     const options  = {
      httpOnly :true,
      secure : true
    }
    return res
    .status(200)
    .clearCookie("refreshToken",options)
    .clearCookie("accessToken",options)
    .json(new ApiResponse(200, {}, "User logged out"))

})


const refreshAccessToken = asyncHandler( async(req,res) =>{
  const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken

  if(!incomingRefreshToken){
   throw new apiError(401,"Unauthourized request")
  }
 try {
   const decodedToken = jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
  
   const user = await User.findById(decodedToken?._id)
  
   if(!user){
     throw new apiError(401,"Invalid Refresh Token")
   }
   if(incomingRefreshToken !== user?.refreshToken){
     throw new apiError(401,"Refresh Token is expired or used")
   }
   
   const options = {
     httpOnly : true,
     secure : true
   }
    const{accessToken,newRefreshToken}= await generateAcessAndRefreshToken(user._id)
     
    return res
    .status(200)
    .cookies("accessToken",accessToken,options)
    .cookies("refreshToken",newRefreshToken,options)
    .json(
     new ApiResponse(
        200,
        {accessToken,refreshToken : newRefreshToken},
        "Access Token refreshed"
     )
    )
  
 } catch (error) {
   throw new apiError(401, error?.message || "Invalid refresh token")
 }
})


const changeCurrentPassword = asyncHandler( async(req,res) => {
   const{oldPassword,newPassword} = req.body

  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)
  if(!isPasswordCorrect){
   throw new apiError(400,"Invalid Old password")
  }
  user.password = newPassword
  await user.save({validateBeforeSave : false})

  return res
  .status(200)
  .json(new ApiResponse(200 , {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler( async(req,res) => {

   return res 
   .status(200)
   .json(new ApiResponse(
      200,
      req.user,
      "current user fetched successfully"
   ))
})

const updateAccountDetails = asyncHandler( async(req,res) => {
   const{email,fullName} = req.body

   if(!email || !fullName){
      throw new apiError(400,"All fields are required")
   }
   const user =  await User.findByIdAndUpdate
   (req.user?._id,{
         $set: {
            fullName : fullName,
            email: email
         }
   },
   {new : true}
).select("-password")
    return res
    .status(200)
    .json(
      new ApiResponse(200,"User details are updated succesfully")
    )
})

const updateUserAvatar = asyncHandler( async(req,res) => {

   const avatarLocalPath = req.file?.path

   if(!avatarLocalPath){
      throw new apiError(400, "Avatar file is missing")
   }
   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if(!avatar.url){
      throw new apiError(400, "Error while uploading on Avatar")
   }
   const user = await User.findByIdAndUpdate
   (req.user?._id,{
         $set: {
             avatar : avatar.url
         }
   },
   {new : true}
).select("-password")
    return res
    .status(200)
    .json(
      new ApiResponse(200," Avatar Image  updated succesfully")
    )
})


const updateUserCoverImage = asyncHandler( async(req,res) => {

   const coverImageLocalPath = req.file?.path

   if(!coverImageLocalPath){
      throw new apiError(400, "CoverImage file is missing")
   }
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)

   if(!coverImage.url){
      throw new apiError(400, "Error while uploading on cover image")
   }
   const user = await User.findByIdAndUpdate
   (req.user?._id,{
         $set: {
             coverImage : coverImage.url
         }
   },
   {new : true}
).select("-password")
    return res
    .status(200)
    .json(
      new ApiResponse(200," Cover Image  updated succesfully")
    )
})

const getUserChannelProfile = asyncHandler( async(req,res) =>{

   const {userName} = req.params

   if(!userName?.trim()){
      throw new apiError(400,"Username is missing")
   }

   const channel = await User.aggregate([
      {
         $match: {
            userName : userName?.toLowerCase()
         }
      },
      {
         $lookup : {
            from: "subscriptions",
            localField: "_id",
            foreignField: "channel",
            as : "subscribers"
         }
      },
      {
         $lookup : {
            from: "subscriptions",
            localField: "_id",
            foreignField: "subscriber",
            as : "subscribedTo"
         }
      },
      {
         $addFields :{
            subscribersCount: {
               $size: "$subscribers"
            },
            channelSubscribedToCount :{
               $size: "$subscribedTo"
            },
            isSubscribed: {
               $cond: {
                  if: {$in : [req.user?._id,"$subscribers.subscriber"]},
                  then:true,
                  else:false
               }
            }
         }
      },
      {
         $project:{
            fullName:1,
            userName:1,
            email:1,
            subscribersCount:1,
            channelSubscribedToCount:1,
            isSubscribed:1,
            avatar:1,
            coverImage:1,
            
         }
      }
   ])
   if(!channel?.length){
      throw new apiError(404,"Channel doesnot exist")
   }
   return res
   .status(200)
   .json
   ( new ApiResponse(200,channel[0],"User channel created succesfully"))
})

const getWatchHistory = asyncHandler(async(req,res) => {
   const user = await User.aggregate([
      {
         $match: {
            _id: new mongoose.Types.ObjectId(req.user._id)
         }
      },
      {
         $lookup: {
            from:"videos",
            localField: "watchHistory",
            foreignField:"_id",
            as:"watchHistory",
            pipeline : [
               {
                 $lookup: {
                  from:"users",
                  localField: "owner",
                  foreignField:"_id",
                  as:"owner",
                  pipeline: [
                     {
                       $project:{
                           fullName:1,
                           userName: 1,
                           avatar:1
                        } 
                     }
                  ]
                 }
               },
               {
                 $addFields:{
                  owner:{
                     $first: "owner"
                  }
                 }
               }
            ]
         }
      }
   ])

  return res
  .status(200)
  .json(
   new ApiResponse(
      200,
      user[0].watchHistory
   )
  )

})



export {
   registerUser,
   loginUser ,
   logOutUser ,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar,
   updateUserCoverImage,
   getUserChannelProfile,
   getWatchHistory
}

