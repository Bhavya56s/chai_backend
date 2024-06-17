import mongoose, { mongo } from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        console.log(`MongoDb connected !! DB Host : ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MongoDb connection error",error)
        process.exit(1)
    }
}

export default connectDB