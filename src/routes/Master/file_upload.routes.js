const express = require('express');
const busboy = require('connect-busboy');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');

const router = express.Router();
router.use(busboy({ limits: { fileSize: 10 * 1024 * 1024 } }));

// Configure AWS S3 Client (v3)
const s3Client = new S3Client({
  region: "ap-south-1",
  credentials: {
    accessKeyId: "AKIA455B2ZFDHIMVQZ4U",
    secretAccessKey: "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"
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

// POST /upload/busboy - stream upload to S3 using connect-busboy
router.post('/fileupload', (req, res) => {
  if (!req.busboy) {
    return res.status(400).json({
      success: false,
      message: 'Busboy is not initialized'
    });
  }

  const folder = "upload";
  const uploads = [];

  req.pipe(req.busboy);

  req.busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
    const normalizedName = typeof filename === 'object' ? filename.filename : filename;
    const s3Key = `${folder}/${Date.now()}_${normalizedName}`;

    const uploadPromise = new Promise((resolve, reject) => {
      let size = 0;
      file.on('data', (data) => {
        size += data.length;
      });

      const uploader = new Upload({
        client: s3Client,
        params: {
          Bucket: 'easyadv',
          Key: s3Key,
          Body: file,
          ACL: 'public-read',
          ContentType: mimetype
        }
      });

      uploader.done()
        .then(() => resolve({
          fieldname,
          filename: normalizedName,
          key: s3Key,
          url: `https://easyadv.s3.ap-south-1.amazonaws.com/${s3Key}`,
          size,
          type: mimetype
        }))
        .catch(reject);

      file.on('error', reject);
    });

    uploads.push(uploadPromise);
  });

  req.busboy.on('error', (error) => {
    console.error('Busboy error:', error);
    return res.status(500).json({
      success: false,
      message: 'Error parsing upload stream'
    });
  });

  req.busboy.on('finish', async () => {
    try {
      const results = await Promise.all(uploads);
      if (results.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      return res.status(200).json({
        success: true,
        data: results
      });
    } catch (error) {
      console.error('S3 upload error:', error);
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  });
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