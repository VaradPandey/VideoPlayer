import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app=express();

//app.use() for configuration and setting up middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

//json data input with limit 
app.use(express.json({
    limit: "16kb"
}));

//url data input
app.use(express.urlencoded({
    limit: "16kb",
    extended: true, //nested object allowed
}));

//for assests liek image, fevicon etc
app.use(express.static("public"));  //public is folder name for assests

//setting up cookieparser
app.use(cookieParser());

export {app};