import mongoose from "mongoose";
import express from "express";
import { DB_NAME } from "../constants.js";

const app=express();
const port=process.env.PORT;

const connectDB = async()=>{
    try{
        const connectionInstance=await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        
        console.log(`\n MONGODB CONNECTED AT HOST: ${connectionInstance.connection.host}`);

    }catch (error){
        console.log("ERROR: ",error);
        process.exit(1);
    }
}


export default connectDB;