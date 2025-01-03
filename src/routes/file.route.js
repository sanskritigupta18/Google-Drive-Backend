import express from "express";

const router = express.Router();
import {
    uploadNewFile, editFileName, deleteFile, searchFilesByName, getFileByUser
} from "../controllers/file.controller.js";

import {verifyJWT} from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js";

router.post("/uploadFile",verifyJWT,upload.single("file"),uploadNewFile);
router.patch("/editFileName",verifyJWT,editFileName);
router.delete("/deleteFile",verifyJWT,deleteFile);
router.get("/searchFile",verifyJWT,searchFilesByName);
router.get("/getFileByUser",verifyJWT,getFileByUser);

export default router;