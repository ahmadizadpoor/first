# 🚀 Deploy to Replit - Quick Guide

## Instant Deployment (3 Steps)

### Step 1: Open Replit
Go to: **https://replit.com/github/ahmadizadpoor/first**

This will automatically:
- Import the project from GitHub
- Install all dependencies
- Configure the environment

### Step 2: Click "Run"
Just click the big green "Run" button!

The server will start automatically.

### Step 3: Open the Web View
- Click on the "Webview" tab
- Or open the URL shown in console (format: `https://your-project.username.repl.co`)

## That's it! 🎉

Your crawler UI is now live on the internet!

---

## Alternative: Manual Import

If the direct link doesn't work:

1. Go to **https://replit.com**
2. Click **"Create Repl"**
3. Select **"Import from GitHub"**
4. Enter: `https://github.com/ahmadizadpoor/first`
5. Click **"Import from GitHub"**
6. Wait for installation
7. Click **"Run"**

---

## What Happens Next?

Once deployed:
- ✅ Server starts on port 3000 (or Replit's assigned port)
- ✅ Web UI opens automatically
- ✅ You get a public URL to share
- ✅ Auto-restarts on crashes
- ✅ Changes auto-deploy when you push to GitHub

---

## Features You Get

- 🌐 **Public URL**: Share with anyone
- 🔄 **Always-On**: Option to keep it running 24/7 (paid)
- 📊 **Monitoring**: Built-in logs and metrics
- 🛠️ **IDE**: Edit code directly in browser
- 🔐 **Secrets**: Add environment variables securely

---

## Using the Deployed App

Once it's running:

1. **Configure Scraping Method:**
   - Manual mode (default) - uses sample data
   - HTTP mode - makes direct requests
   - Browser mode - requires Chrome (not available on Replit free tier)

2. **Start Crawler:**
   - Click "Start Crawler" button
   - Watch real-time logs

3. **View Results:**
   - Click "Load Results" after crawler completes
   - See beautiful comparison cards

4. **Export Data:**
   - Generate tables
   - Download CSV

---

## Tips

**For Best Performance:**
- Use Manual mode for demos
- Use HTTP mode for real scraping (may get 403 errors)
- Set concurrency to 2-3 max

**Sharing Your App:**
- Copy the Replit URL
- Share with anyone - no login required to use
- They can view the UI and run crawlers

**Keeping It Running:**
- Free tier: Sleeps after inactivity
- Always-On: Upgrade to Hacker plan ($7/month)

---

## Troubleshooting

**Repl not starting?**
```bash
# Check the console for errors
# Usually means dependencies didn't install
# Solution: Click "Shell" and run:
npm install
npm run build
npm run ui
```

**Can't access the URL?**
- Make sure the Repl is running (green play button)
- Check if it's showing the correct port
- Try refreshing the webview

**Crawler not working?**
- Check logs in the UI
- Verify the build completed: `npm run build`
- Ensure output directory exists

---

## Cost

- **Free Tier**:
  - ✅ Unlimited public repls
  - ✅ Basic resources
  - ⏰ Sleeps after inactivity

- **Hacker Plan ($7/mo)**:
  - ✅ Always-On
  - ✅ 2x resources
  - ✅ Custom domains
  - ✅ Private repls

For this project, **free tier is sufficient** for demos and testing!

---

## Next Steps

After deployment:

1. **Test the UI**: Make sure all features work
2. **Share the URL**: Send to your team
3. **Monitor**: Check Replit logs for issues
4. **Update**: Push to GitHub and Repl auto-updates

---

**Happy Crawling! 🎉**

Need help? Check the main DEPLOYMENT.md for other platform options.
