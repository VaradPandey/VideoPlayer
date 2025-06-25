import mongoose,{Schema} from "mongoose";
import bcrypt from "bcrypt"; //hash passowrds
import jwt from "jsonwebtoken"; //A way to create secret tokens so users can stay logged in securely.

const userSchema=new Schema({
    username:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
        index: true, //For Better Searching ini Database
    },
    email:{
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
    },
    fullName:{
        type: String,
        required: true,
        trim: true,
        index: true,
    },
    avatar:{
        type: String, //cloudinary url
        required: true,
    },
    coverImage:{
        type: String, //cloudinary url
    },
    watchHistory:[
        {
            type: Schema.Types.ObjectId,
            ref: "Video",
        } 
    ],
    password:{
        type: String,
        required: [true, "Password is Required"],

    },
    refreshToken:{
        type: String,
    },
},{timestamps: true});

//Hook: when something happen automatically
userSchema.pre("save",async function(next){ //no arrow function because they dont provide this,context
    //hook runs only if password change else exit immediately
    if(!this.isModified("password")) return next();

    this.password=await bcrypt.hash(this.password,10);
    next();
});

//method: custom action or property given to data
userSchema.methods.isPasswordCorrect=async function(password){
    return await bcrypt.compare(password,this.password);
}
userSchema.methods.generateAccessToken=function(){ //Creates a short-term token
    //jwt.sign(payload(information to store in token), secretKey, options)
    jwt.sign( //Stores user info securely inside the token
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName,
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )   
};
userSchema.methods.generateRefreshToken=function(){ //Creates a long-term token
        jwt.sign( //Helps user stay logged in after access token expires
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )  
};

export const User=mongoose.model("User",userSchema);