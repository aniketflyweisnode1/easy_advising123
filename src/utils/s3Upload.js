const AWS = require('aws-sdk');
const path = require('path');

// Configure AWS SDK (ensure your credentials are set in env or config)
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

/**
 * Uploads a file stream to S3
 * @param {stream.Readable} fileStream - The file stream
 * @param {string} fileName - The file name (with extension)
 * @param {string} folder - The S3 folder/path
 * @returns {Promise<string>} - The S3 file URL
 */
async function uploadToS3(fileStream, fileName, folder = '') {
  const s3Key = folder ? `${folder}/${Date.now()}_${fileName}` : `${Date.now()}_${fileName}`;
  const params = {
    Bucket: process.env.AWS_S3_BUCKET,
    Key: s3Key,
    Body: fileStream,
    ACL: 'public-read'
  };
  await s3.upload(params).promise();
  return `https://${params.Bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3Key}`;
}

module.exports = { uploadToS3 }; 