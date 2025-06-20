const asyncHandler=(requestHandler)=>{
    (req,res,err)=>{
        Promise.resolve(requestHandler(req,res,err)).catch((err)=>next(err));
    }
}

export {asyncHandler}