# Cloudflare R2 Helper (S3-compatible object storage)
# Requires: npm install @aws-sdk/client-s3
# Configure via admin Settings page → OSS tab

const { getDb } = require('../db/schema');
const fs = require('fs');

// Lazy-load S3 client to avoid crash if package not installed
let S3Client, PutObjectCommand, DeleteObjectCommand;
let s3Available = false;
try {
  const s3 = require('@aws-sdk/client-s3');
  S3Client = s3.S3Client;
  PutObjectCommand = s3.PutObjectCommand;
  DeleteObjectCommand = s3.DeleteObjectCommand;
  s3Available = true;
  console.log('R2/S3 SDK loaded successfully');
} catch(e) {
  console.warn('@aws-sdk/client-s3 not available, R2 uploads disabled. Run: npm install @aws-sdk/client-s3');
}

let r2Client = null;
let r2Config = null;

function getR2Config() {
  const db = getDb();
  const s = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!s || !s.oss_enabled) return null;
  return {
    enabled: !!s.oss_enabled,
    endpoint: s.oss_region,
    bucket: s.oss_bucket,
    accessKeyId: s.oss_access_key_id,
    accessKeySecret: s.oss_access_key_secret,
    publicUrl: s.oss_cdn_domain,
    prefix: s.brand_name || 'lightcirle',
  };
}

function getClient() {
  if (!s3Available) return null;
  const config = getR2Config();
  if (!config || !config.enabled) return null;

  if (!r2Client || JSON.stringify(config) !== JSON.stringify(r2Config)) {
    r2Config = config;
    r2Client = new S3Client({
      region: 'auto',
      endpoint: config.endpoint,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.accessKeySecret,
      },
      forcePathStyle: true,
    });
  }
  return r2Client;
}

async function uploadToOss(localPath, filename, folder = 'site') {
  const config = getR2Config();
  if (!config) throw new Error('R2 not configured');
  if (!s3Available) throw new Error('@aws-sdk/client-s3 not installed');

  const client = getClient();
  const key = config.prefix + '/' + folder + '/' + filename;
  const fileContent = fs.readFileSync(localPath);

  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: fileContent,
  }));

  const url = config.publicUrl
    ? config.publicUrl.replace(/\/$/, '') + '/' + key
    : config.endpoint.replace(/\/$/, '') + '/' + config.bucket + '/' + key;

  return { url, ossPath: key, filename };
}

async function deleteFromOss(ossPath) {
  if (!s3Available) return;
  const config = getR2Config();
  if (!config) return;
  const client = getClient();
  await client.send(new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: ossPath,
  }));
}

function isOssEnabled() {
  if (!s3Available) return false;
  const config = getR2Config();
  return config && config.enabled;
}

module.exports = { uploadToOss, deleteFromOss, isOssEnabled, getR2Config };
