// multer.middleware.js
import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const fileFilter = (req, file, cb) => {
    // Allow PDFs and images
    if (file.mimetype === "application/pdf" || file.mimetype.startsWith("image/") || file.mimetype.startsWith("video/")) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file type. Only PDFs and images are allowed."), false);
    }
};

export const upload = multer({ storage, fileFilter });