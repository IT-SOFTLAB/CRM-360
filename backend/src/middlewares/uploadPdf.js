const multer = require("multer");
const path = require("path");
const fs = require("fs");

const dir = path.join(__dirname, "../uploads/quotations");

if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, dir);
    },

    filename(req, file, cb) {
        cb(
            null,
            Date.now() + "-" + file.originalname
        );
    },
});

module.exports = multer({ storage });