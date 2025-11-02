# 🔑 API Setup Instructions

## Financial Modeling Prep API Configuration

This project uses **Financial Modeling Prep API** for reliable stock data with no CORS issues!

### Step 1: Get Your Free API Key

1. Visit: https://site.financialmodelingprep.com/developer/docs/
2. Click on **"Get Your Free API Key"**
3. Register with your email (it's completely free!)
4. Copy your API key from the dashboard

**Free Tier Limits:**
- ✅ 250 API requests per day
- ✅ Real-time stock quotes
- ✅ Dividend history
- ✅ Company profiles
- ✅ No CORS restrictions!

### Step 2: Open Your Dashboard

**You DON'T need to edit any code!**

When you first open `index.html`, you'll see a prompt asking for your API key:

1. Paste your API key into the prompt
2. Click OK
3. Your key will be saved locally in your browser (localStorage)

**That's it!** Your API key is stored securely in your browser and never exposed publicly.

### Step 3: Test Locally

1. Open `index.html` in your browser
2. Open the browser console (F12)
3. You should see: `✅ Successfully fetched X stocks`

If you see errors, double-check your API key!

### Step 4: Deploy to GitHub

Once everything works locally:

```bash
git add .
git commit -m "Configure FMP API for production deployment"
git push origin main
```

GitHub Pages will automatically deploy your changes!

---

## 🚨 Security Note

**IMPORTANT:** For production apps, never expose API keys in frontend code!

For this personal dividend dashboard, it's acceptable since:
- Free tier with limited requests
- Public stock data only
- No sensitive information

For enterprise applications, consider using a backend proxy to hide the API key.

---

## 📊 API Endpoints Used

1. **Stock Quotes**: `/v3/quote/{symbols}`
   - Real-time prices, dividends, market data

2. **Dividend History**: `/v3/historical-price-full/stock_dividend/{ticker}`
   - Historical dividend payments
   - Ex-dividend dates

---

## 🆘 Troubleshooting

### Error: "API Key required"
- Make sure you replaced `YOUR_API_KEY_HERE` with your actual key
- Check for typos in the API key

### Error: "Invalid API key" (401)
- Verify your API key is correct
- Check if you copied the full key

### Error: "Too many requests"
- You've exceeded the 250 requests/day limit
- Wait 24 hours or upgrade to a paid plan

### No data showing
- Open browser console (F12) to see detailed errors
- Check your internet connection
- Verify the API key is configured

---

## 🎯 Need Help?

Visit the official docs: https://site.financialmodelingprep.com/developer/docs/

Happy dividend tracking! 📈💰
