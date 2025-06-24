import {asyncHandler} from "../utils/asyncHandler.js";

//A controller is just a function that handles what should happen when someone makes a request to backend.

//A function that handles the logic for a route
//Reads request, does work (DB, checks), sends response
const registerUser=asyncHandler(async (req,res)=>{
    res.status(200).json({
        message: "ok",
    });
});

export {registerUser}