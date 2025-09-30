const express = require('express');
const busboy = require('connect-busboy');
const { uploadToS3 } = require('../../utils/s3Upload');

const router = express.Router();

// Middleware for busboy
router.use(busboy());

// POST /upload - file upload to S3  2025-07-17
router.post('/', (req, res) => {
  req.pipe(req.busboy);
  req.busboy.on('file', async (fieldname, file, filename, encoding, mimetype) => {
    try {
      // console.log('Upload details:', { fieldname, filename, encoding, mimetype });
      // Ensure we have a valid filename
      const validFilename = filename || `${fieldname}_${Date.now()}`;
      
      const fileUrl = await uploadToS3(file, validFilename);
      res.status(200).json({ 
        success: true, 
        url: fileUrl.Location,
        serverFileName : fileUrl.key,
        filename: validFilename,
        mimetype: mimetype
      });
    } catch (err) {
      // console.error('Upload error:', err);
      res.status(500).json({ success: false, message: err.message });
    }
  });
  
  // Handle errors
  req.busboy.on('error', (err) => {
    console.error('Busboy error:', err);
    res.status(500).json({ success: false, message: 'File upload error' });
  });
});

module.exports = router; 