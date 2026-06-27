// lightcirle — OSS Helper
// Creates and returns an OSS client using settings from the database
const OSS = require('ali-oss');
const { getDb } = require('../db/schema');

let ossClient = null;
let ossConfig = null;

function getOssConfig() {
  const db = getDb();
  const s = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!s || !s.oss_enabled) return null;
  return {
    enabled: !!s.oss_enabled,
    region: s.oss_region,
    bucket: s.oss_bucket,
    accessKeyId: s.oss_access_key_id,
    accessKeySecret: s.oss_access_key_secret,
    cdnDomain: s.oss_cdn_domain,
    prefix: s.brand_name || 'lightcirle',
  };
}

function getClient() {
  const config = getOssConfig();
  if (!config || !config.enabled) return null;

  // Recreate client if config changed
  if (!ossClient || JSON.stringify(config) !== JSON.stringify(ossConfig)) {
    ossConfig = config;
    ossClient = new OSS({
      region: config.region,
      bucket: config.bucket,
      accessKeyId: config.accessKeyId,
      accessKeySecret: config.accessKeySecret,
      secure: true,
    });
  }
  return ossClient;
}

// Upload file to OSS
// folder: 'products', 'articles', 'site'
async function uploadToOss(localPath, filename, folder = 'site') {
  const config = getOssConfig();
  if (!config) throw new Error('OSS not configured');

  const client = getClient();
  const ossPath = config.prefix + '/' + folder + '/' + filename;

  const result = await client.put(ossPath, localPath);
  const url = config.cdnDomain
    ? config.cdnDomain.replace(/\/$/, '') + '/' + ossPath
    : result.url;

  return { url, ossPath, filename };
}

// Delete file from OSS
async function deleteFromOss(ossPath) {
  const client = getClient();
  if (!client) return;
  await client.delete(ossPath);
}

// Check if OSS is enabled
function isOssEnabled() {
  const config = getOssConfig();
  return config && config.enabled;
}

module.exports = { uploadToOss, deleteFromOss, isOssEnabled, getOssConfig };
