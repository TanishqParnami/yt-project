import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // This folder must exist: src/public/temp
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        // You can customize the name, but keeping original name is usually fine for temp storage
        cb(null, file.originalname);
    }
});

export const upload = multer({ 
    storage, 
});