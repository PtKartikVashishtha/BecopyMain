const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const path = require('path');
require('dotenv').config();

// Configure cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_KEY,
  api_secret: process.env.CLOUDINARY_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);
    let folderPath = 'uploads/other'; // Default folder if type is unknown or unexpected

    if (fileExtension === 'pdf') {
      folderPath = 'uploads/resume';
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      folderPath = 'uploads/code';
    }

    const filename = path.parse(file.originalname).name;
    const safeFilename = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const publicId = `${safeFilename}-${Date.now()}`;

    return {
      folder: folderPath,
      resource_type: 'raw',
      format: fileExtension || 'raw' || 'pdf', // Use determined extension as format
      public_id: publicId,
    };
  },
});

// Define allowed file types
const fileFilter = (req, file, cb) => {
  const allowedExtensions = /^(xlsx|xls|pdf)$/i; // Match only allowed extensions
  const fileExtension = path.extname(file.originalname).toLowerCase().substring(1);

  if (allowedExtensions.test(fileExtension)) {
    return cb(null, true);
  }
  cb(new Error('File type not allowed. Only Excel (.xlsx, .xls) and PDF (.pdf) files are accepted.'), false);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 1024 * 1024 * 10 } // Optional: Limit file size (e.g., 10MB)
});

module.exports = upload;