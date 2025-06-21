import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
});
const port=process.env.PORT || 8000;


connectDB() //You call connectDB() which returns a promise.
.then(()=>{  
    app.listen(port,()=>{ //If the DB connects successfully, you start the server using app.listen(port).
        console.log(`listening at port: ${port}`);
    });
})
.catch((error)=>{ //If DB connection fails, the .catch() block logs the error and the server doesn’t start.
    console.log("Error: ",error);
});