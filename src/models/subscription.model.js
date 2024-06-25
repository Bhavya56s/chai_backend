import mongoose,{Schema} from "mongoose";

const subscriptionSchema = new Schema({
    subscriber :{
       type : Schema.Types.ObjectId,// who is subscribing the channel
       ref:"User"
    },
    channel :{
        type : Schema.Types.ObjectId,// chanel
        ref:"User"
     }
},{timestamps : true})

export const Subscription = mongoose.model("Subscription",subscriptionSchema)