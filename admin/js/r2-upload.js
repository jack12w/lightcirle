// R2 直传 + 服务器兜底上传（共享给 products / articles / media 三个后台页）
// 优先走浏览器直传 R2（文件不经过我们的服务器）；两种情况下回退到 /api/upload 服务器中转：
//   ① R2 未启用（presign 返回 501）；② 浏览器直传 R2 失败（CORS 拦预检 / 网络 / 凭证错误）。
//
// 用法： const url = await directUpload(file, 'products');  // folder: products|articles|site|company
//
// 依赖：window.__API_BASE / window.__AUTH_TOKEN（products/articles 页已设置），
//       否则回退到同页全局 const API / let token。

async function directUpload(file, folder) {
  const API = window.__API_BASE || (typeof API !== 'undefined' ? API : '/api');
  const token = window.__AUTH_TOKEN || (typeof token !== 'undefined' ? token : (localStorage.getItem('token') || ''));

  // 1) 请求 R2 预签名直传 URL
  let presign = null;
  try {
    const r = await fetch(API + '/upload/presign', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
      body: JSON.stringify({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        folder: folder,
      }),
    });
    if (r.ok) presign = await r.json();
  } catch (e) {
    presign = null;
  }

  if (presign && presign.uploadUrl) {
    try {
      // 浏览器直传 R2（不经过服务器）
      const putRes = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
        body: file,
      });
      if (!putRes.ok) {
        let detail = '';
        try { detail = await putRes.text(); } catch (e) {}
        throw new Error('R2 直传失败（' + putRes.status + '）：' + detail.slice(0, 200));
      }
      // 直传成功后登记到媒体库（与旧服务器上传逻辑保持一致，便于媒体库展示）
      try {
        await fetch(API + '/media/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
          body: JSON.stringify({
            key: presign.key,
            filename: (presign.key || '').split('/').pop(),
            originalName: file.name,
            contentType: file.type || 'application/octet-stream',
            size: file.size,
            folder: folder,
            publicUrl: presign.publicUrl,
          }),
        });
      } catch (e) {
        // 登记失败不影响已上传文件，仅媒体库少一条记录
      }
      return presign.publicUrl;
    } catch (err) {
      // 直传失败（CORS 拦了预检 / 网络中断 / 凭证错误等）→ 回退服务器中转上传，
      // 由服务器侧直接写 R2，绕过浏览器 CORS 限制，保证上传不丢。
      console.warn('[r2-upload] 浏览器直传 R2 失败，回退服务器上传：', err && err.message);
    }
  }

  // 2) R2 未启用（presign 返回 501）→ 回退服务器中转上传
  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const r = await fetch(API + '/upload', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + token },
    body: fd,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || !data.url) throw new Error(data.detail || data.title || ('HTTP ' + r.status));
  return data.url;
}
