class ApiError extends Error { //you inherit all default error behavior (like message, stack, etc.).
    constructor(
        statusCode, //HTTP status code like 400, 401, 404, 500
        message="Something went wrong", //Error message (default = "Something went wrong")
        errors=[], //Optional array of detailed error info (like validation errors)
        stack="" //Optional manual stack trace (for debugging)
    ){
        super(message) //call super(message) to pass the message to the base Error class.
                       //Without it, this.message wouldn't exist.
        
        //Define a clean, structured object with these properties
        this.statusCode=statusCode  //HTTP status (used in res.status(...))
        this.data=null  //Set to null to indicate no data is returned
        this.message=message //Human-readable error message
        this.success=false; //Set to false to indicate failure
        this.errors=errors  //Array of specific error info (e.g., missing fields)

        if(stack){
            this.stack=stack
        }
        else{
            Error.captureStackTrace(this,this.constructor)
        }

    }
}

export {ApiError}

//ApiError is a custom error class that extends JavaScript’s built-in Error class,
// designed to send clean, structured error responses from your API.

//EXAMPLE
// {
//   "statusCode": 404,
//   "data": null,
//   "message": "Product not found",
//   "success": false,
//   "errors": []
// }
