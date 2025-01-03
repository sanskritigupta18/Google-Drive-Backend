import mongoose from "mongoose";

// const file = new mongoose.Schema({
//     name: {
//         type: String,
//         index: true,
//     },
//     url: {
//         type: String,
//     },
//     cloudinary_public_id: {
//         type: String,
//     },
//     type: {
//         type: String,
//     },
//     size: {
//         type: String,
//     },
//     uploadedOn: {
//         type: Date,
//         default: Date.now(),
//     },
// });

// const fileModel = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: "User",
//     },
//     fileDetails: file,
// });

// export const File = mongoose.model("File", fileModel);
const fileModel = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    fileDetails: {  // Change this to a plain object
        name: {
            type: String,
            index: true,
        },
        url: {
            type: String,
        },
        cloudinary_public_id: {
            type: String,
        },
        type: {
            type: String,
        },
        size: {
            type: String,
        },
        uploadedOn: {
            type: Date,
            default: Date.now,
        },
    },
});
export const File = mongoose.model("File", fileModel);