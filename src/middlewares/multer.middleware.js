import multer from "multer"; //Node.js middleware that helps you upload files to your server
//multer → temporary → cloudinary → permanent

//Setting up where and how to store uploaded files
const storage=multer.diskStorage({
    destination: function (req,file,cb) {
      cb(null,"./public/temp")
    },
    filename: function (req,file,cb) {
      
      cb(null,file.originalname)
    }
  })
  
export const upload=multer({  //Ready to use object to handle uploads in routes
    storage,
})