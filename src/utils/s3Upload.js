const AWS = require('aws-sdk');
const path = require('path');
const mime = require('mime-types');





const s3 = new AWS.S3({
  accessKeyId: "",
  secretAccessKey: "",
  region: ""
});

/**
 * Uploads a file stream to S3
 * @param {stream.Readable} fileStream - The file stream
 * @param {string} fileName - The file name (with extension)
 * @param {string} folder - The S3 folder/path
 * @returns {Promise<string>} - The S3 file URL
 */
async function uploadToS3(fileStream, fileName) {
  // Ensure fileName is a string
  const fileNameStr = typeof fileName === 'string' ? fileName : (fileName?.filename || fileName?.name || 'unknown_file');
  
  // Get file extension from fileName
  const fileExtension = path.extname(fileNameStr);
  // Create unique filename with timestamp and preserve extension
  const baseFileName = path.basename(fileNameStr, fileExtension);
  const s3Key = `${Date.now()}_${baseFileName}${fileExtension}`;
  
  // Get MIME type for proper content type
  const contentType = mime.lookup(fileNameStr) || 'application/octet-stream';
  
  const params = {
    Bucket: "easyadv/img",
    Key: s3Key,
    Body: fileStream,
    ACL: 'public-read',
    ContentType: contentType,
  };
  
  const result = await s3.upload(params).promise();
  return result; // Returns the full S3 upload result
}

/**
 * Uploads a file with specific content type and metadata
 * @param {stream.Readable} fileStream - The file stream
 * @param {string} fileName - The file name (with extension)
 * @param {string} folder - The S3 folder/path
 * @param {Object} metadata - Additional metadata for the file
 * @returns {Promise<string>} - The S3 file URL
 */
async function uploadToS3WithMetadata(fileStream, fileName, folder = '', metadata = {}) {
  // Get file extension from fileName
  const fileExtension = path.extname(fileName);
  // Create unique filename with timestamp and preserve extension
  const baseFileName = path.basename(fileName, fileExtension);
  const s3Key = folder ? `${folder}/${Date.now()}_${baseFileName}${fileExtension}` : `${Date.now()}_${baseFileName}${fileExtension}`;
  
  // Get MIME type for proper content type
  const contentType = mime.lookup(fileName) || 'application/octet-stream';
  
  const params = {
    Bucket: "easyadv/img",
    Key: s3Key,
    Body: fileStream,
    ACL: 'public-read',
    ContentType: contentType,
    Metadata: metadata
  };
  
  const result = await s3.upload(params).promise();
  return {
    url: result.Location,
    key: s3Key,
    bucket: "easyadv/img"
  };
}

module.exports = { uploadToS3, uploadToS3WithMetadata }; 