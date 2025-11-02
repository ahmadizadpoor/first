# 🚀 Deployment Guide

Deploy your Jabama vs Jajiga Crawler to various online platforms.

## Quick Deploy Options

### 🟣 Option 1: Replit (Easiest - Recommended)

**Perfect for: Quick demos, testing, instant deployment**

1. **Go to [Replit](https://replit.com)**

2. **Import from GitHub:**
   - Click "Create Repl"
   - Choose "Import from GitHub"
   - Paste your repository URL
   - Click "Import from GitHub"

3. **Configure:**
   - Replit will auto-detect Node.js
   - The `.replit` file is already configured
   - Just click "Run" button

4. **Access:**
   - Click the generated URL (usually `https://yourproject.yourname.repl.co`)
   - The UI will open automatically

**Features:**
- ✅ Free tier available
- ✅ Instant deployment
- ✅ WebSocket support
- ✅ Auto-restarts
- ✅ Built-in IDE
- ✅ Easy sharing

**Limitations:**
- Always-on requires paid plan
- Limited resources on free tier

---

### 🚂 Option 2: Railway

**Perfect for: Production apps, better performance**

1. **Go to [Railway.app](https://railway.app)**

2. **Deploy from GitHub:**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select this repository
   - Click "Deploy Now"

3. **Configure:**
   - Railway auto-detects the configuration
   - `railway.json` is pre-configured
   - Builds automatically

4. **Get URL:**
   - Go to "Settings" → "Domains"
   - Click "Generate Domain"
   - Copy your public URL

5. **Access:**
   - Open the generated URL
   - Your crawler UI is live!

**Features:**
- ✅ $5 free credit/month
- ✅ Excellent performance
- ✅ Auto-scaling
- ✅ WebSocket support
- ✅ Custom domains
- ✅ GitHub auto-deploy

**Cost:** Free tier → $5/month credit

---

### 🎨 Option 3: Render

**Perfect for: Free hosting, good performance**

1. **Go to [Render.com](https://render.com)**

2. **Create Web Service:**
   - Click "New +"
   - Select "Web Service"
   - Connect GitHub
   - Select this repository

3. **Configure:**
   - Name: `jabama-crawler`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run ui`
   - Instance Type: `Free`

4. **Deploy:**
   - Click "Create Web Service"
   - Wait for build (5-10 minutes)
   - Copy your `.onrender.com` URL

5. **Access:**
   - Open the generated URL
   - Dashboard is ready!

**Features:**
- ✅ Free tier (with limitations)
- ✅ Auto-deploy from GitHub
- ✅ SSL certificates
- ✅ Custom domains
- ✅ WebSocket support

**Limitations:**
- Free tier spins down after inactivity
- Cold start delay (30-60 seconds)

---

### ⚡ Option 4: Glitch

**Perfect for: Quick prototypes, easy sharing**

1. **Go to [Glitch.com](https://glitch.com)**

2. **Create Project:**
   - Click "New Project"
   - Select "Import from GitHub"
   - Paste repository URL

3. **Configure:**
   - Glitch auto-installs dependencies
   - Update `package.json` start script if needed

4. **Access:**
   - Click "Show" → "In a New Window"
   - Your app is live at `https://yourproject.glitch.me`

**Features:**
- ✅ Completely free
- ✅ Instant deployment
- ✅ Easy remixing
- ✅ Live editing

**Limitations:**
- Limited resources
- Sleeps after 5 minutes inactivity

---

## 📋 Pre-Deployment Checklist

Before deploying, ensure:

- [x] `server.js` listens on `0.0.0.0` (already configured)
- [x] `PORT` uses `process.env.PORT` (already configured)
- [x] Health check endpoint exists at `/health` (already added)
- [x] Dependencies in `package.json` (already set)
- [x] Build script configured (already set)
- [x] Configuration files created:
  - `.replit` for Replit
  - `Procfile` for Railway/Heroku
  - `render.yaml` for Render
  - `railway.json` for Railway

✅ **All set! Ready to deploy!**

---

## 🔧 Manual Deployment (VPS/Cloud)

For DigitalOcean, AWS, GCP, Azure, etc:

### 1. Prerequisites

```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 (process manager)
sudo npm install -g pm2
```

### 2. Clone & Setup

```bash
# Clone repository
git clone <your-repo-url>
cd first

# Install dependencies
npm install

# Build TypeScript
npm run build

# Create output directory
mkdir -p output manual-html
```

### 3. Configure Environment

```bash
# Create .env file (optional)
cat > .env << EOF
PORT=3000
NODE_ENV=production
PUPPETEER_SKIP_DOWNLOAD=true
EOF
```

### 4. Start with PM2

```bash
# Start server
pm2 start server.js --name crawler-ui

# View logs
pm2 logs crawler-ui

# Monitor
pm2 monit

# Auto-start on reboot
pm2 startup
pm2 save
```

### 5. Setup Nginx (Optional)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 6. SSL with Let's Encrypt

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

---

## 🌐 Platform Comparison

| Platform | Free Tier | Performance | WebSocket | Auto-Deploy | Best For |
|----------|-----------|-------------|-----------|-------------|----------|
| **Replit** | ✅ (Limited) | ⭐⭐⭐ | ✅ | ✅ | Demos, Testing |
| **Railway** | $5 credit | ⭐⭐⭐⭐⭐ | ✅ | ✅ | Production |
| **Render** | ✅ (Sleeps) | ⭐⭐⭐⭐ | ✅ | ✅ | Side Projects |
| **Glitch** | ✅ | ⭐⭐ | ✅ | ✅ | Prototypes |
| **VPS** | ❌ ($5-10/mo) | ⭐⭐⭐⭐⭐ | ✅ | Manual | Full Control |

---

## 🎯 Recommended: Replit Quick Deploy

For the fastest deployment, use Replit:

### One-Click Deploy to Replit

1. **Click this button:** [![Run on Replit](https://replit.com/badge/github/your-username/your-repo)](https://replit.com/github/your-username/your-repo)

2. **Or manually:**
   ```
   1. Go to https://replit.com
   2. Click "Create Repl"
   3. Choose "Import from GitHub"
   4. Paste: https://github.com/ahmadizadpoor/first
   5. Click "Import from GitHub"
   6. Wait for dependencies to install
   7. Click "Run"
   8. Open the webview URL
   ```

3. **Done!** Your crawler is live!

---

## 🔍 Testing Deployment

After deployment, test these endpoints:

```bash
# Health check
curl https://your-app-url.com/health

# API status
curl https://your-app-url.com/api/status

# Access UI
open https://your-app-url.com
```

---

## 🐛 Troubleshooting

### Build Fails

```bash
# Check Node version (should be 18+)
node --version

# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Port Issues

```bash
# Ensure PORT environment variable is set
echo $PORT

# Or set manually
export PORT=3000
```

### WebSocket Not Working

- Ensure platform supports WebSocket
- Check CORS settings
- Verify firewall rules
- Use secure WebSocket (wss://) for HTTPS

### Crawler Not Starting

- Check if TypeScript is compiled: `npm run build`
- Verify output directory exists: `mkdir -p output`
- Check logs for errors
- Ensure enough memory available

---

## 📊 Monitoring

### Railway

```bash
# View logs
railway logs

# Check status
railway status
```

### Render

- Go to Dashboard → Your Service → Logs
- View real-time logs and metrics

### PM2 (VPS)

```bash
# View logs
pm2 logs crawler-ui

# Monitor resources
pm2 monit

# Check status
pm2 status
```

---

## 🔐 Security Notes

For production deployments:

1. **Add Authentication:**
   ```javascript
   // Add to server.js
   app.use((req, res, next) => {
     const token = req.headers['authorization'];
     if (token !== process.env.AUTH_TOKEN) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     next();
   });
   ```

2. **Set Environment Variables:**
   - `NODE_ENV=production`
   - `AUTH_TOKEN=your-secret-token`
   - `ALLOWED_ORIGINS=https://yourdomain.com`

3. **Enable Rate Limiting:**
   ```bash
   npm install express-rate-limit
   ```

4. **Use HTTPS:**
   - Most platforms provide free SSL
   - For VPS, use Let's Encrypt

---

## 🚀 Post-Deployment

After successful deployment:

1. **Test all features:**
   - Start crawler
   - View logs
   - Load results
   - Export CSV

2. **Share your URL:**
   - Copy the deployment URL
   - Share with team/users

3. **Set up monitoring:**
   - Configure alerts
   - Monitor resource usage
   - Check error logs

4. **Optional: Custom Domain**
   - Most platforms support custom domains
   - Update DNS settings
   - Add SSL certificate

---

## 📞 Support

Having issues? Check:

- Platform-specific documentation
- GitHub Issues
- Console logs
- Server logs

---

**Ready to deploy? Choose a platform above and get started! 🎉**
