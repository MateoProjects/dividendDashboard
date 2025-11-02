// 🌐 Yahoo Finance API Integration

const YAHOO_FINANCE_BASE = 'https://query1.finance.yahoo.com';

// Multiple CORS proxies with fallback
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
];

let currentProxyIndex = 0;

/**
 * Get current CORS proxy URL
 */
function getProxyUrl() {
  return CORS_PROXIES[currentProxyIndex];
}

/**
 * Try next CORS proxy
 */
function tryNextProxy() {
  currentProxyIndex = (currentProxyIndex + 1) % CORS_PROXIES.length;
  console.log(`Switching to proxy ${currentProxyIndex + 1}/${CORS_PROXIES.length}`);
}

/**
 * Fetch stock quote data from Yahoo Finance with proxy fallback
 * @param {string[]} tickers - Array of stock tickers
 * @returns {Promise<Object[]>} Array of stock data
 */
export async function fetchStockQuotes(tickers) {
  const symbols = tickers.join(',');
  const url = `${YAHOO_FINANCE_BASE}/v7/finance/quote?symbols=${symbols}`;

  // Try all proxies
  for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
    try {
      const proxy = getProxyUrl();
      const proxiedUrl = proxy + encodeURIComponent(url);

      console.log(`Fetching data via proxy ${currentProxyIndex + 1}...`);

      const response = await fetch(proxiedUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.quoteResponse || !data.quoteResponse.result) {
        throw new Error('Invalid response format from Yahoo Finance');
      }

      // Success! Return the data
      console.log(`✓ Successfully fetched ${data.quoteResponse.result.length} stocks`);

      return data.quoteResponse.result.map(stock => ({
        ticker: stock.symbol || '',
        name: stock.longName || stock.shortName || stock.symbol || '',
        price: stock.regularMarketPrice || 0,
        currency: stock.currency || 'USD',
        dividend: stock.trailingAnnualDividendRate || 0,
        dividendYield: stock.trailingAnnualDividendYield || 0,
        sector: stock.sector || 'Unknown',
        industry: stock.industry || 'Unknown',
        marketCap: stock.marketCap || 0,
        exDividendDate: stock.exDividendDate ? new Date(stock.exDividendDate * 1000) : null,
        dividendDate: stock.dividendDate ? new Date(stock.dividendDate * 1000) : null,
        change: stock.regularMarketChange || 0,
        changePercent: stock.regularMarketChangePercent || 0
      }));

    } catch (error) {
      console.warn(`Proxy ${currentProxyIndex + 1} failed:`, error.message);

      // Try next proxy if available
      if (attempt < CORS_PROXIES.length - 1) {
        tryNextProxy();
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
      } else {
        // All proxies failed
        throw new Error(`All ${CORS_PROXIES.length} CORS proxies failed. Please try again later.`);
      }
    }
  }
}

/**
 * Fetch historical dividend data
 * @param {string} ticker - Stock ticker
 * @returns {Promise<Object[]>} Array of dividend history
 */
export async function fetchDividendHistory(ticker) {
  const endDate = Math.floor(Date.now() / 1000);
  const startDate = endDate - (365 * 24 * 60 * 60 * 5); // 5 years ago

  const url = `${YAHOO_FINANCE_BASE}/v8/finance/chart/${ticker}?period1=${startDate}&period2=${endDate}&interval=1d&events=div`;

  // Try all proxies
  for (let attempt = 0; attempt < CORS_PROXIES.length; attempt++) {
    try {
      const proxy = getProxyUrl();
      const proxiedUrl = proxy + encodeURIComponent(url);

      const response = await fetch(proxiedUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.chart || !data.chart.result || !data.chart.result[0]) {
        return [];
      }

      const result = data.chart.result[0];
      const dividends = result.events?.dividends || {};

      return Object.values(dividends).map(div => ({
        date: new Date(div.date * 1000),
        amount: div.amount
      })).sort((a, b) => b.date - a.date);

    } catch (error) {
      console.warn(`Proxy ${currentProxyIndex + 1} failed for ${ticker}:`, error.message);

      if (attempt < CORS_PROXIES.length - 1) {
        tryNextProxy();
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.error(`All proxies failed for dividend history: ${ticker}`);
        return [];
      }
    }
  }
}

/**
 * Batch fetch with retry logic
 * @param {string[]} tickers - Array of stock tickers
 * @param {number} batchSize - Size of each batch
 * @param {number} retries - Number of retries on failure
 * @returns {Promise<Object[]>} Combined stock data
 */
export async function fetchStocksBatched(tickers, batchSize = 50, retries = 3) {
  const batches = [];

  // Split tickers into batches
  for (let i = 0; i < tickers.length; i += batchSize) {
    batches.push(tickers.slice(i, i + batchSize));
  }

  const results = [];

  for (const batch of batches) {
    let attempts = 0;
    let success = false;

    while (attempts < retries && !success) {
      try {
        const data = await fetchStockQuotes(batch);
        results.push(...data);
        success = true;
      } catch (error) {
        attempts++;
        if (attempts < retries) {
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        } else {
          console.error(`Failed to fetch batch after ${retries} attempts:`, batch);
        }
      }
    }
  }

  return results;
}

/**
 * Calculate portfolio statistics
 * @param {Object[]} stocks - Array of stock data
 * @returns {Object} Portfolio statistics
 */
export function calculatePortfolioStats(stocks) {
  const validStocks = stocks.filter(s => s.price > 0);

  if (validStocks.length === 0) {
    return {
      totalStocks: 0,
      avgYield: 0,
      avgPrice: 0,
      totalDividend: 0,
      topYielder: null,
      sectorDistribution: {}
    };
  }

  // Calculate averages
  const totalYield = validStocks.reduce((sum, s) => sum + (s.dividendYield || 0), 0);
  const avgYield = totalYield / validStocks.length;

  const totalPrice = validStocks.reduce((sum, s) => sum + s.price, 0);
  const avgPrice = totalPrice / validStocks.length;

  const totalDividend = validStocks.reduce((sum, s) => sum + (s.dividend || 0), 0);

  // Find top yielder
  const topYielder = validStocks.reduce((top, stock) => {
    return (stock.dividendYield || 0) > (top?.dividendYield || 0) ? stock : top;
  }, null);

  // Calculate sector distribution
  const sectorDistribution = validStocks.reduce((acc, stock) => {
    const sector = stock.sector || 'Unknown';
    acc[sector] = (acc[sector] || 0) + 1;
    return acc;
  }, {});

  return {
    totalStocks: validStocks.length,
    avgYield,
    avgPrice,
    totalDividend,
    topYielder,
    sectorDistribution
  };
}

/**
 * Format currency value
 * @param {number} value - Numeric value
 * @param {string} currency - Currency code
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

/**
 * Format percentage value
 * @param {number} value - Numeric value (0.05 = 5%)
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted percentage string
 */
export function formatPercent(value, decimals = 2) {
  return (value * 100).toFixed(decimals) + '%';
}
