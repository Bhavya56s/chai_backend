// require('dotenv').config()

import dotenv from "dotenv"

// import mongoose from "mongoose";
// import { DB_NAME } from "./constants";
import connectDB from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
    path: './env'
})



connectDB()

.then(()=>{
    app.listen(process.env.PORT || 8000,() => {
        console.log(`Server is running ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Db connection Failed",err);
})
// import express from express
// const app = express()













// ;( async() => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//         app.on( "error",(error)=>{
//             console.log("ERRRR :", error);
//             throw error
//         })
//         app.listen( process.env.PORT , ()=>{
//             console.log(`App is listing on ${process.env.PORT}`);
//         }

//         )
        
//     } catch (error) {
//         console.error("Error" ,error)
//         throw err;
//     }
// })()