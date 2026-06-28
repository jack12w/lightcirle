// Cloudflare R2 Helper (S3-compatible object storage)
// Requires: npm install @aws-sdk/client-s3
// Configure via admin Settings page → OSS tab

const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { getDb } = require('../db/schema');
const fs = require('fs');

let r2Client = null;
let r2Config = null;

function getR2Config() {
  const db = getDb();
  const s = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!s || !s.oss_enabled) return null;
  return {
    enabled: !!s.oss_enabled,
    endpoint: s.oss_region,         // R2 endpoint URL, e.g. https://<accountid>.r2.cloudflarestorage.com
    bucket: s.oss_bucket,           // R2 bucket name
    accessKeyId: s.oss_access_key_id,
    accessKeySecret: s.oss_access_key_secret,
    publicUrl: s.oss_cdn_domain,    // R2 public URL, e.g. https://media.lightcirle.com
    prefix: s.brand_name || 'lightcirle',
    urlPrefix: s.oss_prefix || '',    // R2 public access prefix, e.g. 'lightcirle-media'
  };
}

function getClient() {
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
      forcePathStyle: true,  // Required for R2
    });
  }
  return r2Client;
}

// Upload file to R2
// folder: 'products', 'articles', 'site', 'company'
async function uploadToOss(localPath, filename, folder = 'site') {
  const config = getR2Config();
  if (!config) throw new Error('R2 not configured');

  const client = getClient();
  const key = config.prefix + '/' + folder + '/' + filename;
  console.log('[OSS] prefix=' + config.prefix + ' folder=' + folder + ' key=' + key);
  const fileContent = fs.readFileSync(localPath);

  await client.send(new PutObjectCommand({
    Bucket: config.bucket,
    Key: key,
    Body: fileContent,
  }));

  const url = config.publicUrl
    ? config.publicUrl.replace(/\/$/, '') + (config.urlPrefix ? '/' + config.urlPrefix : '') + '/' + key
    : config.endpoint.replace(/\/$/, '') + '/' + config.bucket + '/' + key;

  console.log('[OSS] publicUrl=' + config.publicUrl + ' finalURL=' + url);
  return { url, ossPath: key, filename };
}

// Delete file from R2
async function deleteFromOss(ossPath) {
  const config = getR2Config();
  if (!config) return;
  const client = getClient();
  await client.send(new DeleteObjectCommand({
    Bucket: config.bucket,
    Key: ossPath,
  }));
}

// Check if R2 is enabled
function isOssEnabled() {
  const config = getR2Config();
  return config && config.enabled;
}

module.exports = { uploadToOss, deleteFromOss, isOssEnabled, getR2Config };
