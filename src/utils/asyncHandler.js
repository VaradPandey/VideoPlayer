const asyncHandler=(requestHandler)=>{
    return (req,res,next)=>{
        Promise.resolve(requestHandler(req,res,next)).catch((err)=>next(err));
    }
}

export {asyncHandler}

//A wrapper is a function (or class) that takes another function or value
//adds extra behavior, and then returns a new version of that function/value.

//Code line does three things:

//1) Calls the requestHandler (say getUser) with the request arguments.

//2) Wraps it in Promise.resolve() to catch any rejections (async errors).

//3) If any error happens, it automatically passes it to next(err),
//which Express uses to invoke your error-handling middleware.

//So, asyncHandler is a wrapper because It returns new function with added behavior (error handling)