const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');

const router = express.Router();

// Configure AWS S3 Client (v3)
const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "",
    secretAccessKey: ""
  }
});

// Configure Multer with S3
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: 'easyadv',
    acl: 'public-read',
    metadata: function (req, file, cb) {
      cb(null, { fieldName: file.fieldname });
    },
    key: function (req, file, cb) {
      const folder = req.query.folder || 'img';
      const fileName = `${Date.now()}_${file.originalname}`;
      const s3Key = `${folder}/${fileName}`;
      cb(null, s3Key);
    }
  }),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});




// POST /upload - file upload to S3  2025-07-17
router.post('/', upload.single('file'), (req, res) => {
  console.log(req.file);
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        serverfile: req.file.key,
        url: `https://easyadv.s3.ap-south-1.amazonaws.com/${req.file.key}`,
        size: req.file.size,
        type: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size is too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  return res.status(500).json({
    success: false,
    message: error.message
  });
});

module.exports = router; 