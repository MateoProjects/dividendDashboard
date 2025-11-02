// 📝 PORTFOLIO CONFIGURATION
// Edit this file to manage your dividend stocks

export const portfolio = {
  // 🎯 YOUR STOCKS - Add or remove tickers here
  tickers: [
    'AAPL', 'O', 'JNJ', 'CNQ', 'PEP', 'PG', 'LTC', 'MCD',
    'JPM', 'KO', 'MA', 'IBM', 'CAH', 'GD', 'RY', 'BMO',
    'MSFT', 'BNS', 'CB', 'LOW', 'SYY', 'ITW', 'WMT', 'KMB',
    'BLK', 'MAIN', 'ADP', 'SBUX', 'ECL', 'CVX', 'SLB', 'DUK',
    'AGNC', 'STAG', 'AFL', 'PPG', 'PNR', 'NUE', 'EMR', 'C',
    'TROW', 'RGLD', 'TD', 'CSCO', 'BMY', 'GOOD', 'GWW', 'ADC',
    'ROP', 'SHW'
  ],

  // ⚙️ DASHBOARD SETTINGS
  settings: {
    // Auto-refresh interval (milliseconds)
    refreshInterval: 300000, // 5 minutes

    // Currency display
    currency: 'USD',

    // Default theme ('dark' or 'light')
    defaultTheme: 'dark',

    // Chart colors (Power BI style)
    chartColors: [
      '#00B4D8', '#0077B6', '#03045E', '#90E0EF', '#CAF0F8',
      '#48CAE4', '#023E8A', '#ADE8F4', '#00B4D8', '#0096C7',
      '#0077B6', '#023E8A', '#03045E', '#90E0EF', '#00B4D8'
    ],

    // Investment amount for projections
    projectionAmount: 10000,

    // Show sector in table
    showSector: true,

    // Decimal places for yield
    yieldDecimals: 2
  }
};

// 📌 HOW TO USE:
// 1. Edit the 'tickers' array above to add/remove stocks
// 2. Save this file
// 3. Commit and push to GitHub
// 4. GitHub Pages will auto-update your dashboard!
//
// Example: To add NVDA, just add 'NVDA' to the array
// tickers: ['AAPL', 'NVDA', 'O', ...]
