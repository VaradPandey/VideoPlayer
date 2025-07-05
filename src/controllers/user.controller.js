import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js";
import {User} from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken=async(userId)=>{
    try{
        const user=await User.findById(userId);
        const accessToken=user.generateAccessToken();
        const refreshToken=user.generateRefreshToken();

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
//Reads request,does work (DB,checks),sends response
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
        fullName, //When key name=variable name use directly
        avatar: avatar.url,//If we want to assign something custom,or use a nested value,or rename it
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
    if(!username && !email){
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

    const options={ //enables cookie manage by server only
        httpOnly: true,
        secure: false,
    }

    //6) Generate Response
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

const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined,
            }
        },
        {
            new: true,
        }
    )

    const options={ //enables cookie manage by server only
        httpOnly: true,
        secure: false,
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User Loggoed Out"));
});

const refreshAccessToken=asyncHandler(async(req,res)=>{
    const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"unauthorized request");
    }

    try{
        const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET);
    
        const user=await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token");
        }
    
        if(incomingRefreshToken!==user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used");       
        }
    
        const options={
            httpOnly: true,
            secure: true
        };
    
        const {accessToken,newRefreshToken}=await generateAccessAndRefereshToken(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken,refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        );
    }catch(error){
        throw new ApiError(401,error?.message || "Invalid refresh token");
    }
});

const changeCurretPassword=asyncHandler(async(req,res)=>{
    const {oldPassword,newPassword}=req.body;

    //if user is logged in then we will get req.user because of auth middleware
    const user=await User.findById(req.user?._id);

    const oldPasswordValidation=await user.isPasswordCorrect(oldPassword);

    if(!oldPasswordValidation){
        throw new ApiError(400,"Invalid Old Password");
    }

    user.password=newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Password Changed"));
});

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200,req.user,"Current User Fetched"));
});

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {email,fullName}=req.body;

    if(!fullName && !email){
        throw new ApiError(400,"Atleast One Field Is Required");
    }

    const user=await User.findById(req.user?._id).select("-password -refreshToken");

    if(email && user.email==email){
        throw new ApiError(400,"Please Provide New Email");
    }else if(fullName && user.fullName==fullName){
        throw new ApiError(400,"Please Provide New Full Name");
    }

    if(email){
        const existingUser=await User.findOne({email});
        if(existingUser){
            throw new ApiError(400,"Email already in use by another user");
        }
        user.email=email;
    }

    if(fullName) user.fullName=fullName;

    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account Details Updated"));

});

const updateUserAvatar=asyncHandler(async(req,res)=>{
    const avatarLocalPath=req.file?.path;

    if(!avatarLocalPath){
        return new ApiError(400,"Please Provide Avatar To Update");
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath);

    if(!avatar){
        return new ApiError(400,"Error Uploading Avatar");
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url,
            }
        },
        {
            new: true, //with this updated user will be returned
        }
    ).select("-password");


    return res
    .status(200)
    .json(new ApiResponse(200,user,"Avatar File Updated"));
});

const updateUserCoverImage=asyncHandler(async(req,res)=>{
    const coverImageLocalPath=req.file?.path;

    if(!coverImageLocalPath){
        return new ApiError(400,"Please Provide Cover Image To Update");
    }

    const coverImage=await uploadOnCloudinary(avatarLocalPath);

    if(!coverImage){
        return new ApiError(400,"Error Uploading Cover Image");
    }

    const user=await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url,
            }
        },
        {
            new: true, //with this updated user will be returned
        }
    ).select("-password");


    return res
    .status(200)
    .json(new ApiResponse(200,user,"Cover Image File Updated"));
});

const getUserChannelProfile=asyncHandler(async(req,res)=>{
    const {username}=req.params; //username comes from the URL like /api/user/channel/:username

    if(!username?.trim()){
        throw new ApiError(400,"Username Is Missing");
    }

    //MongoDB Aggregation
    const channel=await User.aggregate([
        {
            $match:{ //Searches the users collection for a user with that username 
                username: username?.toLowerCase()
            }
        },
        {
            $lookup:{ //Get list of subscribers
                from: "subscriptions", // collection you want to JOIN
                localField: "_id",     // field from current document (User)
                foreignField: "channel", // field in subscriptions collection to match
                as: "subscribers"
            }
            // subscribers: [
            //     { subscriber: "userId1", channel: "thisChannelId" },
            //     { subscriber: "userId2", channel: "thisChannelId" },
            // ]
        },
        {
            $lookup:{ //Get channels they have subscribed to
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo",
            }
        },
        {
            $addFields: { //Add calculated fields that dont exist in database model
                subscribersCount: {
                    $size: "$subscribers", // $ used for fields
                },
                channelsSubscribedToCount: {
                    $size: "$subscribedTo",
                },
                isSubscribed:{
                    $cond:{
                        if:{
                            $in : [req.user?._id,"$subscribers.subscriber"],
                        },
                        then: true,
                        else: false,
                    }
                }
            }
        },
        {
            $project: { //Pick only needed fields
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
            }
        }
    ]);

    if(!channel?.length){
        throw new ApiError(404,"Channel Not Found");
    }

    return res
    .status(200)
    .json(new ApiResponse(200,channel[0],"User Channel Fetched Successfully"));

});

export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurretPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
};