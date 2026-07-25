// R2 / S3 Presigned PUT URL generator — zero external dependency (Node crypto only)
// R2 is S3-compatible and uses AWS Signature V4. This produces the exact same
// query-string signed URL that @aws-sdk/s3-request-presigner would, so the browser
// can PUT the object directly to R2 without the file ever touching our server.
const crypto = require('crypto');

function uriEncode(str) {
  return encodeURIComponent(str)
    .replace(/!/g, '%21')
    .replace(/\*/g, '%2A')
    .replace(/'/g, '%27')
    .replace(/\(/g, '%28')
    .replace(/\)/g, '%29');
}

function hmac(key, data) {
  return crypto.createHmac('sha256', key).update(data, 'utf8').digest();
}

function hashHex(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

function encodePath(path) {
  // RFC3986-encode each segment, keep '/' as a literal delimiter
  return path.split('/').map(uriEncode).join('/');
}

// Returns a presigned PUT URL for `key` in `bucket` at `endpoint`.
function signPutUrl({ endpoint, bucket, region, accessKeyId, secretAccessKey, key, expiresIn = 900 }) {
  const url = new URL(endpoint);
  const host = url.host;

  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ymd = now.getUTCFullYear() + pad(now.getUTCMonth() + 1) + pad(now.getUTCDate());
  const hms = pad(now.getUTCHours()) + pad(now.getUTCMinutes()) + pad(now.getUTCSeconds());
  const amzDate = ymd + 'T' + hms + 'Z';
  const datestamp = ymd;

  const service = 's3';
  const credentialScope = datestamp + '/' + region + '/' + service + '/aws4_request';

  const canonicalUri = '/' + encodePath(bucket + '/' + key);

  const qParams = [
    ['X-Amz-Algorithm', 'AWS4-HMAC-SHA256'],
    ['X-Amz-Credential', accessKeyId + '/' + credentialScope],
    ['X-Amz-Date', amzDate],
    ['X-Amz-Expires', String(expiresIn)],
    ['X-Amz-SignedHeaders', 'host'],
  ].sort((a, b) => a[0].localeCompare(b[0]));
  const canonicalQuery = qParams.map(([k, v]) => uriEncode(k) + '=' + uriEncode(v)).join('&');

  const canonicalHeaders = 'host:' + host + '\n';
  const signedHeaders = 'host';
  const payloadHash = 'UNSIGNED-PAYLOAD';

  const canonicalRequest =
    'PUT' + '\n' +
    canonicalUri + '\n' +
    canonicalQuery + '\n' +
    canonicalHeaders + '\n' +
    signedHeaders + '\n' +
    payloadHash;

  const stringToSign =
    'AWS4-HMAC-SHA256' + '\n' +
    amzDate + '\n' +
    credentialScope + '\n' +
    hashHex(canonicalRequest);

  const kDate = hmac('AWS4' + secretAccessKey, datestamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = crypto.createHmac('sha256', kSigning).update(stringToSign, 'utf8').digest('hex');

  const finalQuery = canonicalQuery + '&X-Amz-Signature=' + signature;
  const base = endpoint.replace(/\/$/, '');
  const objectPath = '/' + encodePath(bucket + '/' + key);
  return base + objectPath + '?' + finalQuery;
}

module.exports = { signPutUrl };
