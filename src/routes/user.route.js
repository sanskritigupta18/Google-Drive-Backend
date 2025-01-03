import express from "express";

const router = express.Router();
import {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
} from "../controllers/user.controller.js";

import {verifyJWT} from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js";

router.post("/register",upload.single("avatar"),registerUser);
router.post("/login",loginUser);
router.post("/logout",verifyJWT,logoutUser);
router.get("/refreshToken",verifyJWT,refreshAccessToken);
router.patch("/changePassword",verifyJWT,changeCurrentPassword);
router.get("/getCurrentUser",verifyJWT,getCurrentUser);
router.patch("/updateAccountDetails",verifyJWT,updateAccountDetails);
router.patch("/updateUserAvatar",verifyJWT,upload.single("avatar"),updateUserAvatar);

export default router;