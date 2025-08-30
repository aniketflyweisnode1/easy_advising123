const express = require('express');
const busboy = require('connect-busboy');
const { uploadToS3 } = require('../../utils/s3Upload');

const router = express.Router();

// Middleware for busboy
router.use(busboy());

// POST /upload - file upload to S3  2025-07-17
router.post('/', (req, res) => {
  req.pipe(req.busboy);
  req.busboy.on('file', async (fieldname, file, filename) => {
    try {
      const folder = req.query.folder || '';
      const fileUrl = await uploadToS3(file, filename, folder);
      res.status(200).json({ success: true, url: fileUrl });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  });
});

module.exports = router; 