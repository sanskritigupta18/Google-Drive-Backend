import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/apiError.js";
import { uploadOnCloudinary } from "../utils/uploadToCloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { v4 as uuidv4 } from "uuid";
import JWT from "jsonwebtoken";

const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false });

        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
};

// tested
export const registerUser = asyncHandler(async (req, res) => {
    try {
        const { fullName, email, username, password } = req.body;
        // console.log(req.body)
        // Validate input fields
        if (!fullName || !email || !username || !password) {
            throw new ApiError(400, "All fields are required");
        }

        // Check if user already exists
        const existedUser = await User.findOne({ email });

        if (existedUser) {
            throw new ApiError(409, "User already exists");
        }

        // Handle file uploads
        const avatarLocalPath = req?.file?.path;
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar is required");
        }

        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (!avatar) {
            throw new ApiError(400, "Avatar upload failed");
        }

        const uniqueId = uuidv4();

        // Create user
        const user = await User.create({
            username: username.toLowerCase(),
            fullName,
            email,
            uniqueId,
            password, // Make sure to hash the password in the User model
            avatar: avatar.secure_url,
            cloudinary_avatar_public_id: avatar?.public_id,
        });

        const createdUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );
        if (!createdUser) {
            throw new ApiError(500, "User not created");
        }

        return res
            .status(201)
            .json(
                new ApiResponse(200, createdUser, "User created successfully")
            );
    } catch (e) {
        console.error("Error while registering user:", e); // Log the error
        return res
            .status(e.statusCode || 500)
            .json(
                new ApiError(
                    e.statusCode || 500,
                    e.message || "Error while registering user"
                )
            );
    }
});

// tested
export const loginUser = asyncHandler(async (req, res) => {
    try {
        const { email, password } = req.body;
        // console.log("Hello",req.body)
        if (!email || !password) {
            throw new ApiError(400, "Username, email, or password is required");
        }

        const user = await User.findOne({
            email,
        });

        if (!user) {
            throw new ApiError(404, "User does not exist");
        }

        const checkPassword = await user.isPasswordCorrect(password);

        if (!checkPassword) {
            throw new ApiError(401, "Incorrect password");
        }

        const { accessToken, refreshToken } =
            await generateAccessAndRefereshTokens(user._id);
        const loggedinUser = await User.findById(user._id).select(
            "-password -refreshToken"
        );

        const options = {
            httpOnly: true,
            secure: true,
        };

        res.cookie("accessToken", accessToken, options);
        res.cookie("refreshToken", refreshToken, options);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { user: loggedinUser, accessToken, refreshToken },
                    "User logged in successfully"
                )
            );
    } catch (e) {
        return res
            .status(500)
            .json(new ApiError(500, "Error while login", e?.message));
    }
});

// tested
export const logoutUser = asyncHandler(async (req, res) => {
    try {
        const id = req.user._id;
        const user = await User.findByIdAndUpdate(
            id,
            {
                $unset: { refreshToken: 1 },
            },
            {
                new: true,
            }
        );

        const options = {
            httpOnly: true,
            secure: true,
        };

        await res.clearCookie("accessToken", options);
        await res.clearCookie("refreshToken", options);

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "User logged out"));
    } catch (e) {
        return res
            .status(500)
            .json(new ApiError(500, "Error while logout", e?.message));
    }
});

// tested
export const refreshAccessToken = asyncHandler(async (req, res) => {
    try {
        const incomingRefreshToken =
            req.cookies?.refreshToken || req.body?.refreshToken;

        if (!incomingRefreshToken) {
            throw new ApiError(401, "Error while retrieving token");
        }

        const decodedToken = JWT.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );
        const user = await User.findById(decodedToken?._id);
        if (!user) {
            throw new ApiError(401, "User not found");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Invalid refresh token");
        }

        const options = {
            httpOnly: true,
            secure: true,
        };

        const { accessToken, refreshToken } =
            await generateAccessAndRefereshTokens(user._id);

        res.cookie("accessToken", accessToken, options);
        res.cookie("refreshToken", refreshToken, options);

        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken },
                    "Token is updated"
                )
            );
    } catch (e) {
        return res
            .status(500)
            .json(new ApiError(400, e?.message || "Invalid refresh token"));
    }
});

// tested
export const changeCurrentPassword = asyncHandler(async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        const id = req.user._id;

        const user = await User.findById(id);
        const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

        if (!isPasswordCorrect) {
            throw new ApiError(400, "Invalid password");
        }

        user.password = newPassword;
        await user.save({ validateBeforeSave: false });

        return res
            .status(200)
            .json(new ApiResponse(200, {}, "Password changed successfully"));
    } catch (e) {
        return res
            .status(500)
            .json(new ApiError(500, e?.message || "Internal server error"));
    }
});

// tested
export const getCurrentUser = asyncHandler(async (req, res) => {
    try {
        return res
            .status(200)
            .json(
                new ApiResponse(
                    200,
                    req.user,
                    "User details fetched successfully"
                )
            );
    } catch (e) {
        return res
            .status(500)
            .json(
                new ApiError(
                    500,
                    e?.message || "Error while retrieving the user"
                )
            );
    }
});

// tested
export const updateAccountDetails = asyncHandler(async (req, res) => {
    try {
        const { fullName, email } = req.body;

        if (!fullName || !email) {
            throw new ApiError(400, "Fields are required");
        }

        const id = req.user._id;
        const user = await User.findByIdAndUpdate(
            id,
            { fullName, email },
            { new: true }
        ).select("-password -refreshToken");

        return res
            .status(200)
            .json(new ApiResponse(200, user, "User updated successfully"));
    } catch (e) {
        return res
            .status(500)
            .json(new ApiError(500, e?.message || "Internal server error"));
    }
});

export const updateUserAvatar = asyncHandler(async (req, res) => {
    try {
        // accept file
        // validate file
        // update user
        // return user
        const avatarLocalPath = req.file?.path;
        if (!avatarLocalPath) {
            throw new ApiError(400, "Avatar is required");
        }

        // upload to cloudinary
        const avatar = await uploadOnCloudinary(avatarLocalPath);
        if (!avatar.secure_url) {
            throw new ApiError(400, "Error while uploading avatar");
        }
        // console.log("User:", req.user);
        const user = await User.findByIdAndUpdate(
            req.user?._id,
            {
                $set: {
                    avatar: avatar?.secure_url,
                    cloudinary_avatar_public_id: avatar?.public_id,
                },
            },
            { new: true }
        ).select("-password");

        return res
            .status(200)
            .json(new ApiResponse(200, user, "Avatar is successfully updated"));
    } catch (e) {
        throw new ApiError(400, "Error while updating avatar");
    }
});
