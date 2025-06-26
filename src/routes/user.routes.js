import { Router } from "express";
import { registerUser,loginUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"

//A route is a path + method that the user can call to talk with backend.
//Eg: when someone comes to this path, run this controller function
const router=Router();

//When someone sends a POST request to /register, run the registerUser controller function.
router.route('/register').post(upload.fields([
    {
        name: "avatar",
        maxCount: 1
    },
    {
        name: "coverImage",
        maxCount: 1
    }
]),registerUser);


router.route('/login').post(loginUser);


export default router;