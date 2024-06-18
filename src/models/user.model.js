import mongoose,{Schema} from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new Schema(
    {
       userName :{
         type : String,
         required : true,
         unique : true,
         lowercase : true,
         trim : true,
         index : true
       },
       email :{
        type : String,
        required : true,
        unique : true,
        lowercase : true,
        trim : true
      },
      fullName :{
        type : String,
        required : true,
        trim : true,
        index : true
      },
      avatar :{
        type : String,
        // cloulainary url
        required : true
      },
      coverImage :{
        type : String
      },
      watchHistory : [
        {
        type : mongoose.Schema.Types.ObjectId,
        reg : "Video"
      }
    ],
      password :{
        type : String,
        required : [true,"Password is required"]
      },
      refreshToken : {
        type : String
      }
    },
    {timestamps : true}


)

userSchema.pre("save" ,async function(next) {
    if(!this.isModified("password")) return next();


    this.password=bcrypt.hash(this.password,10)
    next()
})

userSchema.methods.isPasswordCorrect = async function 
( password){
   return await bcrypt.compare(password, this.password)
}

userSchema.methods.genrateAccessToken = function(){
    jwt.sign(
        {
          _id: this._id,
          email: this.email,
          userName : this.userName,
          fullName : this.fullName
      },
      process.env.ACCESS_TOKEN_SECRET,
      {
        experiesIn : process.env.ACCESS_TOKEN_EXPIRY
      }
 )
}
userSchema.methods.genrateRefreshToken = function(){
    jwt.sign(
        {
          _id: this._id,
        
      },
      process.env.REFRESH_TOKEN_SECRET,
      {
        experiesIn : process.env.REFRESH_TOKEN_EXPIRY
      }
 )
}

export const User = mongoose.model("User",userSchema)