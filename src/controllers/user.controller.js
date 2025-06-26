import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken=async(userId)=>{
    try{
        const user=await User.findById(userId);
        const accessToken=generateAccessToken();
        const refreshToken=generateRefreshToken();

        user.refreshToken=refreshToken;
        await user.save({
            validateBeforeSave: false,
        });

        return {accessToken,refreshToken};
    }
    catch(error){
        throw new ApiError(500,"Unable to generate access token");
    }
}

//A controller is just a function that handles what should happen when someone makes a request to backend.

//A function that handles the logic for a route
//Reads request, does work (DB, checks), sends response
const registerUser=asyncHandler(async (req,res)=>{
    //1) Get user details from front end
    const {fullName,email,username,password}=req.body;
    console.log("Email: ",email);

    //2) Validation not empty
    if([fullName,email,username,password].some((field)=>field?.trim()==="")){
        throw new ApiError(400,"All fields are necessary");
    }

    //3) Check if user already exists
    //store the first user object that matches either the username or the email
    const existedUser=await User.findOne({
        //$ sign gives possible operators
        $or: [{username},{email}],
    });

    if(existedUser){
        if(existedUser.username===username){
            throw new ApiError(409,"User with that username already exists");
        }
        else if(existedUser.email===email){
            throw new ApiError(409,"User with that email already exists");
        }
    }

    //4) check for avatar(compulsary) and images
    //.files given by multer
    const avatarLocalPath=req.files?.avatar[0]?.path; //avatar[0] because first entry is the object
    
    //prevent error from empty coverImage
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar image is required");
    }

    //5) Upload to cloudinary
    const avatar=await uploadOnCloudinary(avatarLocalPath);
    const coverImage=await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(400,"Avatar image is required");
    }

    //6) Create User object in db
    const user=await User.create({
        fullName,  //When key name = variable name use directly
        avatar: avatar.url, //If we want to assign something custom, or use a nested value, or rename it
        coverImage: coverImage?.url||"",
        email,
        password,
        username: username.toLowerCase()
    });

    //7) Check for user creation
    //id automatically given by mongodb
    const createdUser=await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(500,"Error while registering user");
    }

    //8) Return response
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User Registered")
    );

});

const loginUser=asyncHandler(async(req,res)=>{
    //1) get user data
    const {email,username,password}=req.body;

    //2) check if values are given
    if(!username || !email){
        throw new ApiError(400,"Either username or email is required");
    }

    //3) Check if user exists and store it
    const user=await User.findOne({
        $or: [{username,email}]
    });
    if(!user){
        throw new ApiError(404,"User does not exist");
    }

    //4) Check Password
    const isPasswordValid=await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(401,"Password Incorrect");
    }

    //5) Generate Tokens
    const {accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id);

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken"); 

    const options={
        httpOnly: true,
        secure: true,
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(200,
            {
                user: loggedInUser,accessToken,refreshToken
            },
            "User Logged In Successfully"
        )
    );
});

export {registerUser,loginUser}