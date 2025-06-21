class ApiResponse{
    constructor(statusCode,data,message="Success"){
        this.statusCode=statusCode
        this.data=data
        this.message=message
        this.success=statusCode<400
    }
}

export {ApiResponse}

//ApiResponse is a custom response structure that your backend can use to send
//clean, consistent, and structured success responses to the frontend.

//It acts like a template for all your successful API responses.

//Some endpoints might return plain JSON,Others return nested or raw DB responses
//This inconsistency confuses the frontend and causes bugs

//So,we use a standard format that:

//1) Always includes a statusCode
//2) A success flag
//3) The data returned
//4) An optional message

