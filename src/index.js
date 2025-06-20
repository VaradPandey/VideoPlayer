import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config({
    path: './env'
});
const port=process.env.PORT || 8000;

connectDB()
.then(()=>{ 
    app.listen(port,()=>{
        console.log(`listening at port: ${port}`);
    });
})
.catch((error)=>{
    console.log("Error: ",error);
});