import { Router } from "express";
import { logOutUser, loginUser, registerUser ,refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields(
        [
            {
               name : "avatar",
               maxCount : 1
            },
            {
                name : "coverImage",
                maxCount : 1
            }
        ]
    ),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJWT, logOutUser)

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT,changeCurrentPassword)

router.route("/current-user").post(verifyJWT,getCurrentUser)

router.route("/update-account").post(verifyJWT,updateAccountDetails)

router.route("/avatar").patch(verifyJWT,upload.single("avatar"), updateUserAvatar)

router.route("/coverImage").patch(verifyJWT,upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:userName").get(verifyJWT,getUserChannelProfile)

router.route("/history").get(verifyJWT,getWatchHistory)



export default router