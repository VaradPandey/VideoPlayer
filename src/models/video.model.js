import mongoose,{Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";
//Aggregate-paginate helps to make MongoDB data easier to display page-by-page,
//especially when using advanced filters (aggregation).

const videoSchema=new Schema({
    id:{
        type: Number,
        required: true,
        unique: true,
    },
    videoFile:{
        type: String, //cloudinary url
        required: true,
    },
    thumbnail:{
        type: String, //cloudinary url
        required: true,
    },
    title:{
        type: String,
        required: true,
    },
    description:{
        type: String,
        required: true,
    },
    duration:{
        type: Number,
        required: true,
    },
    views:{
        type: Number,
        default: 0,
    },
    isPublished:{
        type: Boolean,
        default: true,
    },
    owner:{
        type: Schema.Types.ObjectId,
        ref: "User",
    },
},{timestamps: true});

videoSchema.plugin(mongooseAggregatePaginate);

export const Video=mongoose.model("Video",videoSchema);