import { User } from "../models/user.model.js";
import { File } from "../models/file.model.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { ApiError } from "../utils/apiError.js";
import { deleteFromCloudinary, uploadOnCloudinary } from "../utils/uploadToCloudinary.js";

const uploadNewFile = asyncHandler(async (req, res) => {
    /*
        What it does?
        It takes file as an input and saves it

        Steps:
        1. Get user id
        2. Verify User
        3. Get file path
        4. Upload File
        5. Create Entry in Database
    */
    try {
        const id = req?.user?._id;
        console.log(id)
        if (!id) {
            return res.status(400).json(new ApiError(400, "Id is required"));
        }
        const user = await User.findById(id);
        if (!user) {
            return res
                .status(400)
                .json(new ApiError(400, "User profile not available"));
        }

        const localFilePath = req?.file.path;
        if (!localFilePath) {
            return res.status(400).json(new ApiError(400, "File is required"));
        }

        const file = await uploadOnCloudinary(localFilePath);
        const createFile = await File.create({
            user: id,
            fileDetails: 
                {
                    name: file?.original_filename,
                    url: file?.secure_url,
                    cloudinary_public_id: file?.public_id,
                    type: file?.format,
                    size: file?.bytes,
                },
        });

        return res
            .status(200)
            .json(
                new ApiResponse(200, createFile, "File uploaded successfully")
            );
    } catch (e) {
        return res
            .status(500)
            .json(new ApiError(500, "Error while uploading file"));
    }
});

// const editFileName = asyncHandler(async (req, res) => {
//     try {
//         const { public_id, name } = req.body;
//         console.log(req.body)
//         if (!public_id || !name) {
//             return res
//                 .status(400)
//                 .json(new ApiError(400, "All fields are required"));
//         }
//         console.log("hello")

//         const fileExist = await File.findOne({ fileDetails.public_id: public_id });
//         console.log(fileExist)
//         if (!fileExist) {
//             return res
//                 .status(400)
//                 .json(new ApiError(400, "File does not exist"));
//         }
//         console.log("hi")
//         const updatedFile = await File.findByIdAndUpdate(
//             fileExist._id,
//             {
//                 fileDetails: {name},
//             },
//             { new: true }
//         );

//         if (!updatedFile) {
//             return res
//                 .status(400)
//                 .json(new ApiError(400, "Error while updating file"));
//         }

//         return res
//             .status(200)
//             .json(
//                 new ApiResponse(
//                     200,
//                     updatedFile,
//                     "File details updated successfully"
//                 )
//             );
//     } catch (e) {
//         return res
//             .status(500)
//             .json(
//                 new ApiResponse(500, {}, "Error while updating file details")
//             );
//     }
// });

const editFileName = asyncHandler(async (req, res) => {
    try {
        /*
        What it does?
        It take file name and updates its value

        Steps:
        1. Get public_id and name
        2. Verify is file exists
        3. Update file
        4. Validate file
        */
        const { public_id, name } = req.body;
        console.log(req.body);

        // Validate input
        if (!public_id || !name) {
            return res
                .status(400)
                .json(new ApiError(400, "All fields are required"));
        }

        // Check if file exists
        const fileExist = await File.findOne({ "fileDetails.cloudinary_public_id": public_id }); // Corrected query
        console.log(fileExist);

        if (!fileExist) {
            return res
                .status(400)
                .json(new ApiError(400, "File does not exist"));
        }

        // Update file name
        const updatedFile = await File.findByIdAndUpdate(
            fileExist._id,
            {
               $set: {"fileDetails.name": name}, // Updated syntax for updating nested fields
            },
            { new: true }
        );

        if (!updatedFile) {
            return res
                .status(400)
                .json(new ApiError(400, "Error while updating file"));
        }

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    updatedFile,
                    "File details updated successfully"
                )
            );
    } catch (e) {
        console.error(e); // Log the error for debugging
        return res
            .status(500)
            .json(
                new ApiResponse(500, {}, "Error while updating file details")
            );
    }
});

const deleteFile = asyncHandler(async (req,res) => {
    try
    {
        /*
        What it does?
        It takes public id as an input and deletes it

        Steps:
        1. Get public id
        2. Delete image
        */
        const {public_id} = req.body;
        if(!public_id)
        {
            return res.status(400).json(new ApiError(400,"Id is required"));
        }

        const updatedFile = await File.findOneAndDelete({"fileDetails.cloudinary_public_id": public_id});
        const response = await deleteFromCloudinary(public_id);
        if(!response)
        {
            return res.status(500).json(new ApiError(500,"Error while deleting file"));
        }
        return res.status(200).json(new ApiResponse(200,{},"File deleted successfully"));
    }
    catch(e)
    {
        return res.status(500).json(new ApiError(500,"Error while deleting file"));
    }
});

const searchFilesByName = asyncHandler(async (req, res) => {
    try {
        const userId = req?.user?._id; // Assuming user ID is available from middleware
        const { name } = req.query; // Capture the search term from the query string

        if (!userId) {
            return res.status(400).json(new ApiError(400, "User ID is required"));
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json(new ApiError(404, "User not found"));
        }

        // Find files associated with the user and matching the search term
        const files = await File.find({
            user: userId,
            "fileDetails.name": { $regex: name, $options: "i" } // Case-insensitive search
        });

        if (!files || files.length === 0) {
            return res.status(404).json(new ApiError(404, "No files found"));
        }

        return res.status(200).json(new ApiResponse(200, files, "Files retrieved successfully"));
    } catch (e) {
        return res.status(500).json(new ApiError(500, "Error while retrieving files"));
    }
});

const getFileByUser = asyncHandler(async (req,res) => {
    try
    {
        /*
        What it does?
        It returns all the files by the user
        */
        const id = req?.user?._id;
        if(!id)
        {
            return res.status(400).json(new ApiError(400,"All fields are required"));
        }

        const file = await File.find({user: id});
        if(!file)
        {
            return res.status(500).json(new ApiError(500,"Error while fetching data"));
        }

        return res.status(200).json(new ApiResponse(200,file,"Data fetched successfully"));
    }
    catch(e)
    {
        return res.status(500).json(new ApiError(500,"Error while fetching data"));
    }
});

export { uploadNewFile, editFileName, deleteFile, searchFilesByName, getFileByUser };