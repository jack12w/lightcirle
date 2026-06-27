# lightcirle 部署指南 — 3层冗余架构

## 架构概览

```
用户 → lightcirle.com
            ↓
       Cloudflare DNS (CDN + SSL)
            ↓
   ┌─── 主力: Fly.io (Node.js + SQLite + R2) ───┐
   │   https://lightcirle.fly.dev                │
   ├─── 备用: Railway (同样代码，冷备) ──────────┤
   │   https://lightcirle.up.railway.app         │
   └─── CDN: Cloudflare Pages (仅静态文件) ──────┘
            ↓
       Cloudflare R2 (统一图片存储，免费10GB)
```

---

## 第一步：Cloudflare R2 图片存储（所有平台共享）

所有部署平台共用一个 R2 存储桶，图片上传到 R2 后，三个平台都从同一个 URL 读取。

### 1.1 注册 Cloudflare

1. 打开 https://dash.cloudflare.com/sign-up → 注册账号（免费）
2. 添加你的域名 `lightcirle.com` → 按提示修改 Nameserver（域名注册商那边改）
3. 等待 DNS 生效（通常 5-30 分钟）

### 1.2 创建 R2 存储桶

```
Cloudflare Dashboard → R2 → Create Bucket
  名称: lightcirle-media
  位置: Automatic
  创建后 → Settings → Public URL → Connected Domains → 添加
  → media.lightcirle.com
```

### 1.3 创建 R2 API 密钥

```
R2 → Overview → Manage R2 API Tokens → Create API Token
  权限: Admin Read & Write
  保存 Access Key ID 和 Secret Access Key
```

### 1.4 在后台配置

部署完成后，登录后台 `/admin/settings.html`：

```
OSS设置 → 启用 OSS
  Region: https://<你的ACCOUNT_ID>.r2.cloudflarestorage.com
  Bucket: lightcirle-media
  Access Key: (刚才保存的Key)
  Secret Key: (刚才保存的Secret)
  CDN Domain: https://media.lightcirle.com
```

---

## 第二步：部署主力到 Fly.io

### 2.1 安装 flyctl

**Mac:**
```bash
brew install flyctl
```

**Windows:**
```powershell
powershell -Command "iwr https://fly.io/install.ps1 -useb | iex"
```

### 2.2 登录并部署

```bash
cd yoga-b2b

# 登录
fly auth login

# 创建应用（第一次）
fly launch --no-deploy

# 创建持久化卷（数据不丢）
fly volumes create data --size 1 --region hkg    # 香港节点
fly volumes create uploads --size 1 --region hkg

# 设置环境变量
fly secrets set NODE_ENV=production
fly secrets set PORT=3000

# 部署
fly deploy

# 分配自定义域名
fly certs create lightcirle.com
```

### 2.3 验证

```bash
fly open
# 应该能看到首页

fly logs
# 查看运行日志
```

### 2.4 Fly.io 更新方式

```bash
git push
# 或者手动：
fly deploy
```

---

## 第三步：部署冷备到 Railway

### 3.1 注册 Railway

1. 打开 https://railway.app/login → GitHub 登录
2. 点击 `New Project` → `Deploy from GitHub repo`
3. 选择仓库 `jack12w/lightcirle`
4. Railway 会自动检测到 `Dockerfile`，一键部署

### 3.2 配置 Railway

```
Settings → Domains → Generate Domain
  → 复制域名，例如 lightcirle.up.railway.app
```

### 3.3 设置环境变量

```
Variables:
  PORT = 3000
  NODE_ENV = production
```

### 3.4 部署验证

Railway 会自动构建并部署。部署完成后打开分配的域名检查。

> **注意**: Railway 免费版有心跳保活策略，长时间无请求会休眠。可以用 https://uptimerobot.com 免费监控，每5分钟请求一次保持唤醒。

---

## 第四步：Cloudflare DNS 接入

### 4.1 添加 DNS 记录

在 Cloudflare Dashboard → DNS → Records：

```
类型    名称          内容                         代理状态
CNAME   @            lightcirle.fly.dev            ☑️ 开启 (橙色云)
CNAME   www          lightcirle.fly.dev            ☑️ 开启
CNAME   media        lightcirle-media.r2.dev       ☑️ 开启
```

### 4.2 开启 SSL

```
SSL/TLS → Full (Strict)
  确保 Fly.io 已配置证书（上一步已完成）
```

### 4.3 开启 CDN 缓存（可选）

```
Speed → Optimization
  开启 Auto Minify (HTML/JS/CSS)
  开启 Brotli 压缩
```

---

## 第五步：补充部署（可选）

### 5.1 Uptime 监控

注册 https://uptimerobot.com → 免费监控 50 个站点：

```
Monitor 1: https://lightcirle.com (主站)
Monitor 2: https://lightcirle.up.railway.app (备站)
```

### 5.2 故障切换流程

如果 Fly.io 挂了：

```
1. 登录 Cloudflare Dashboard
2. DNS → 将 @ 的 CNAME 从 lightcirle.fly.dev 改为 lightcirle.up.railway.app
3. 等待 2-5 分钟生效
4. 修复 Fly.io 后切回
```

### 5.3 部署 Cloudflare Pages（静态CDN加速）

如果想进一步加速静态资源：

```
Cloudflare Dashboard → Pages → Create a project
  连接 GitHub → 选择 lightcirle 仓库
  构建命令: 留空（纯静态）
  输出目录: /
  项目名: lightcirle-static → 部署

Pages → Custom Domain → lightcirle.com
```

> 注意：Pages 只能服务静态文件，API 和管理后台需要通过 Fly.io 访问。
> 所以域名 DNS 配置可能需要更复杂的前后端分离。

---

## 环境变量参考

| 变量 | 说明 | 示例 |
|------|------|------|
| `PORT` | 端口 | 3000 |
| `NODE_ENV` | 环境 | production |

## OSS/R2 配置

在后台 Settings 页面配置：

| 字段 | 说明 | 从哪里获取 |
|------|------|-----------|
| Region | R2端点URL | Cloudflare R2 → 存储桶 → S3 API |
| Bucket | 存储桶名 | 你创建的R2桶名 |
| Access Key | 密钥ID | R2 API Token |
| Secret Key | 密钥 | R2 API Token |
| CDN Domain | 公开访问域名 | 你绑定的 media.lightcirle.com |

---

## 常见问题

**Q: SQLite 数据库文件在哪里？**
A: Fly.io 上持久化在 `/app/data/` Volume 中。Railway 上在容器的 `/app/data/` 目录中，重启会丢失（所以推荐 R2）。

**Q: 图片上传到本地还是 R2？**
A: 后台开启 OSS 后自动上传到 R2，文件 URL 持久有效。不开启的话存在本地 `uploads/`，Fly.io 的 Volume 会持久化保存，Railway 会丢失。

**Q: 如何备份数据库？**
A: 
```bash
# Fly.io
fly ssh console -C "cat /app/data/lightcirle.db" > backup-$(date +%F).db

# 或者后台 Products/Articles 数据以 JSON 格式导出
```
