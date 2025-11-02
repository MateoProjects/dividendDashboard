# 📊 Dividend Dashboard

A modern, real-time dividend portfolio tracker powered by Yahoo Finance API. Beautiful Power BI-inspired design with automatic data updates.

![Dashboard Preview](https://img.shields.io/badge/Status-Live-success)
![License](https://img.shields.io/badge/License-MIT-blue)
![Yahoo Finance](https://img.shields.io/badge/Data-Yahoo%20Finance-purple)

## ✨ Features

- 🔄 **Real-time Data** - Live stock prices and dividend yields from Yahoo Finance
- 📈 **Interactive Charts** - Sector distribution and top yielders visualization
- 💰 **Portfolio Analytics** - Average yield, projected income, and top performers
- 🎨 **Modern Design** - Power BI-inspired glassmorphism interface
- 🌓 **Dark/Light Mode** - Toggle between themes
- 📱 **Responsive** - Works on desktop, tablet, and mobile
- 🔍 **Search & Sort** - Filter and organize your holdings
- 🆓 **100% Free** - No API keys, no subscriptions, no limits

## 🚀 Quick Start

### View Live Demo

Visit your GitHub Pages URL: `https://[your-username].github.io/[repo-name]`

### Local Development

**Important**: Due to ES6 modules, you need a local server (not just opening the HTML file).

**Option 1: Python Server (Recommended)**
```bash
# Navigate to project folder
cd "path/to/Project Dividend"

# Start server
python server.py

# Open browser at: http://localhost:8000
```

**Option 2: Python Simple Server**
```bash
python -m http.server 8000
# Then open: http://localhost:8000
```

**Option 3: Node.js (if you have npm)**
```bash
npx serve
```

**Option 4: VS Code Live Server**
- Install "Live Server" extension
- Right-click `index.html` → "Open with Live Server"

## 📝 Managing Your Portfolio

### Adding/Removing Stocks

Edit the `config.js` file:

```javascript
export const portfolio = {
  tickers: [
    'AAPL',  // Add new tickers here
    'MSFT',
    'O',
    // ... your stocks
  ]
};
```

**Steps:**
1. Open `config.js`
2. Edit the `tickers` array
3. Save the file
4. Commit and push to GitHub
5. GitHub Pages updates automatically!

### Configuration Options

```javascript
settings: {
  refreshInterval: 300000,    // Auto-refresh (ms) - 5 minutes
  currency: 'USD',            // Display currency
  defaultTheme: 'dark',       // 'dark' or 'light'
  projectionAmount: 10000,    // Income projection base ($)
  chartColors: [...],         // Custom chart colors
  yieldDecimals: 2           // Decimal places for yield
}
```

## 🎯 Dashboard Components

### Summary Cards
- **Portfolio Yield** - Average dividend yield across all holdings
- **Total Holdings** - Number of stocks in portfolio
- **Annual Income** - Projected yearly dividends per $10k invested
- **Top Yielder** - Highest yielding stock

### Charts
- **Sector Diversification** - Pie chart of holdings by sector
- **Top 10 Yielders** - Bar chart of highest dividend yields

### Holdings Table
- Sortable columns (Name, Ticker, Price, Yield, Dividend, Sector)
- Search/filter functionality
- Color-coded yields:
  - 🟢 High (≥5%)
  - 🟡 Medium (3-5%)
  - 🔵 Low (<3%)

## 🔧 Technical Details

### Tech Stack
- **Frontend**: Vanilla JavaScript (ES6 modules)
- **Charts**: Chart.js 4.4.0
- **Data Source**: Yahoo Finance API
- **Hosting**: GitHub Pages
- **CORS Proxy**: allorigins.win

### Data Updates
- Manual refresh button
- Auto-refresh every 5 minutes (configurable)
- Real-time price and dividend data

### Browser Support
- ✅ Chrome/Edge (90+)
- ✅ Firefox (88+)
- ✅ Safari (14+)
- ✅ Opera (76+)

## 📦 Deployment to GitHub Pages

### First Time Setup

1. **Create GitHub Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/[username]/[repo-name].git
   git push -u origin main
   ```

2. **Enable GitHub Pages**
   - Go to repository Settings
   - Navigate to "Pages" section
   - Source: Deploy from branch `main`
   - Folder: `/ (root)`
   - Save

3. **Access Dashboard**
   - Wait 1-2 minutes for deployment
   - Visit: `https://[username].github.io/[repo-name]`

### Future Updates

```bash
# Edit config.js or other files
git add .
git commit -m "Update portfolio tickers"
git push
```

GitHub Pages updates automatically within 1-2 minutes!

## 🎨 Customization

### Colors

Edit `styles/main.css` CSS variables:

```css
:root {
  --accent-primary: #00b4d8;
  --accent-secondary: #0077b6;
  /* ... more colors */
}
```

### Chart Colors

Edit `config.js`:

```javascript
chartColors: [
  '#00B4D8', '#0077B6', '#03045E',
  // Add your custom colors
]
```

## 🔒 Privacy & Security

- ✅ No login required
- ✅ No user data collected
- ✅ No cookies or tracking
- ✅ All data from public Yahoo Finance API
- ✅ Runs entirely in browser

## ❓ FAQ

### Is Yahoo Finance API free?
Yes! Yahoo Finance provides free access to stock data for personal/educational use.

### How often does data update?
Every 5 minutes by default (configurable in `config.js`).

### Can I use this for my portfolio?
Absolutely! Just edit the tickers in `config.js`.

### Does it work offline?
No, it requires internet to fetch live data from Yahoo Finance.

### Can I track international stocks?
Yes! Use the correct ticker symbol (e.g., `RY.TO` for Royal Bank of Canada on TSX).

### How do I add Canadian/European stocks?
Use the full ticker with exchange suffix:
- Toronto: `RY.TO`
- London: `BP.L`
- Frankfurt: `BMW.DE`

## 🐛 Troubleshooting

### Data not loading?

1. **Check internet connection**
2. **Verify ticker symbols** - Must be valid Yahoo Finance tickers
3. **Clear browser cache** - Hard refresh (Ctrl+Shift+R)
4. **Check browser console** - Look for error messages

### CORS errors?

The app uses a CORS proxy. If it fails:
1. Wait a few minutes and retry
2. Check if `allorigins.win` is operational
3. Consider alternative proxy in `src/api/yahooFinance.js`

### Charts not displaying?

1. Ensure Chart.js CDN is accessible
2. Check browser console for errors
3. Try hard refresh

## 📜 License

MIT License - Feel free to use for personal or commercial projects!

## 🙏 Credits

- Data powered by [Yahoo Finance](https://finance.yahoo.com)
- Charts by [Chart.js](https://www.chartjs.org)
- CORS proxy by [allOrigins](https://allorigins.win)
- Design inspired by Microsoft Power BI

## 🤝 Contributing

Found a bug or have a feature request? Open an issue or submit a pull request!

## 📧 Support

For issues or questions:
1. Check the FAQ above
2. Open a GitHub issue
3. Review browser console errors

---

**⭐ If you find this useful, please star the repository!**

Made with ❤️ for dividend investors
