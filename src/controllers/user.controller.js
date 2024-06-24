import { asyncHandler } from "../utils/asynchandler.js";
import {apiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/clouinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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
export {registerUser, loginUser , logOutUser}

