# 🚀 Vercel Deployment Guide

Deploy your Dividend Dashboard API to Vercel in 5 minutes (100% FREE)

## Why Vercel?

- ✅ **100% FREE** (Hobby plan: 100 GB bandwidth/month)
- ✅ **yahoo-finance2 library** (handles Yahoo authentication automatically)
- ✅ **No CORS issues** (your own API)
- ✅ **Works perfectly** (tested and proven)
- ✅ **5-minute setup**

---

## 📋 Step 1: Install Vercel CLI (Optional but recommended)

```bash
npm install -g vercel
```

Or skip this and use GitHub integration (easier)

---

## 🚀 Step 2: Deploy via GitHub (Recommended)

### 2.1 Push to GitHub

```bash
git add .
git commit -m "Add Vercel serverless API for Yahoo Finance"
git push origin main
```

### 2.2 Connect to Vercel

1. Go to: https://vercel.com/signup
2. Sign up with GitHub (free)
3. Click **"Add New Project"**
4. **Import** your `dividendDashboard` repository
5. Click **"Deploy"**

That's it! Vercel will:
- Install dependencies (`yahoo-finance2`)
- Deploy the `/api/stocks.js` function
- Give you a URL like: `https://dividend-dashboard.vercel.app`

---

## 🔧 Step 3: Update Frontend

Once deployed, update `src/api/yahooFinance.js` line 10:

```javascript
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api/stocks'
  : 'https://YOUR-PROJECT-NAME.vercel.app/api/stocks'; // Replace with your Vercel URL
```

Replace `YOUR-PROJECT-NAME` with your actual Vercel project name.

---

## ✅ Step 4: Test

### Test the API directly:

Visit in your browser:
```
https://YOUR-PROJECT.vercel.app/api/stocks?symbols=AAPL,MSFT,GOOGL
```

You should see JSON data with stock quotes!

### Test the Dashboard:

1. Update the `API_URL` in `yahooFinance.js`
2. Commit and push:
   ```bash
   git add .
   git commit -m "Update API URL with Vercel endpoint"
   git push origin main
   ```
3. Visit: `https://YOUR-USERNAME.github.io/dividendDashboard`

---

## 🔍 Troubleshooting

### Error: "Module not found: yahoo-finance2"

**Solution:** Vercel should install dependencies automatically. If not:
1. Make sure `package.json` is in the root directory
2. Redeploy from Vercel dashboard

### Error: "API not configured"

**Solution:** Update the `API_URL` in `src/api/yahooFinance.js` with your Vercel URL.

### Error: "Failed to fetch stock data"

**Solution:**
1. Check Vercel logs: Dashboard → Your Project → Functions → Logs
2. Verify the API works: `https://YOUR-PROJECT.vercel.app/api/stocks?symbols=AAPL`

### CORS errors

**Solution:** The API already has CORS headers. If you still see errors:
1. Make sure you're using the correct URL (https, not http)
2. Check browser console for the exact error

---

## 📊 Monitoring

**Check API usage:**
1. Go to Vercel dashboard
2. Your Project → Analytics
3. See:
   - Request count
   - Bandwidth usage
   - Function duration

**Free tier limits:**
- Bandwidth: 100 GB/month
- Function executions: Unlimited
- Function duration: 10s max per request

---

## 💰 Cost

**FREE forever** on Hobby plan:
- ✅ Unlimited API requests
- ✅ 100 GB bandwidth (more than enough)
- ✅ Automatic HTTPS
- ✅ Global CDN

---

## 🎯 Next Steps

1. ✅ Deploy to Vercel
2. ✅ Update `API_URL` in frontend
3. ✅ Push changes to GitHub
4. ✅ Test on GitHub Pages
5. ✅ Enjoy your working dividend dashboard! 📈💰

---

## 📞 Support

- Vercel Docs: https://vercel.com/docs
- yahoo-finance2 Docs: https://github.com/gadicc/node-yahoo-finance2

**Stuck?** Check the Vercel logs for detailed error messages.
