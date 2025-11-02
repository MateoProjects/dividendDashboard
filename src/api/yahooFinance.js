// 🌐 Yahoo Finance API Integration via Vercel Serverless Function
// Uses yahoo-finance2 library which handles Yahoo authentication
// Deploy to Vercel (100% FREE)

// Vercel API endpoint (will be set after deployment)
// For local development: http://localhost:3000/api/stocks
// For production: https://YOUR-PROJECT.vercel.app/api/stocks
const API_URL = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? 'http://localhost:3000/api/stocks'
  : 'https://dividend-dashboard.vercel.app/api/stocks'; // Update after deploying to Vercel

// Cache configuration
const CACHE_KEY = 'yahoo_stock_cache';
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

/**
 * Check if API is configured
 */
function isApiConfigured() {
  return API_URL && API_URL.length > 0;
}

/**
 * Get cached data if valid
 * @returns {Object|null} Cached data or null if expired/missing
 */
function getCachedData() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // Check if cache is still valid (within 4 hours)
    if (now - timestamp < CACHE_DURATION) {
      const timeLeft = CACHE_DURATION - (now - timestamp);
      console.log(`✅ Using cached data. Next update in ${Math.round(timeLeft / (60 * 1000))} minutes`);
      return { data, timestamp, timeLeft };
    }

    console.log('⏰ Cache expired, fetching fresh data...');
    return null;
  } catch (error) {
    console.warn('⚠️ Error reading cache:', error);
    return null;
  }
}

/**
 * Save data to cache
 * @param {Object[]} data - Stock data to cache
 */
function setCachedData(data) {
  try {
    const cacheObj = {
      data,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheObj));
    console.log(`💾 Data cached successfully. Next update: ${new Date(Date.now() + CACHE_DURATION).toLocaleTimeString()}`);
  } catch (error) {
    console.error('❌ Error saving cache:', error);
  }
}

/**
 * Get time until next cache refresh
 * @returns {Object} Time object with hours, minutes, seconds
 */
export function getTimeUntilNextUpdate() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;

    const { timestamp } = JSON.parse(cached);
    const timeLeft = CACHE_DURATION - (Date.now() - timestamp);

    if (timeLeft <= 0) return null;

    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((timeLeft % (60 * 1000)) / 1000);

    return { hours, minutes, seconds, milliseconds: timeLeft };
  } catch (error) {
    return null;
  }
}

/**
 * Force clear cache to fetch fresh data
 */
export function clearCache() {
  localStorage.removeItem(CACHE_KEY);
  console.log('🗑️ Cache cleared. Next fetch will get fresh data.');
}

/**
 * Fetch data via Vercel API
 * @param {string[]} symbols - Array of stock symbols
 * @returns {Promise<Object>} Response data
 */
async function fetchViaApi(symbols) {
  if (!isApiConfigured()) {
    throw new Error(
      '❌ API not configured!\n\n' +
      'Please deploy to Vercel first (see VERCEL_SETUP.md)'
    );
  }

  const symbolsParam = symbols.join(',');
  const apiUrl = `${API_URL}?symbols=${encodeURIComponent(symbolsParam)}`;

  console.log(`🔄 Fetching via Vercel API...`);

  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`API request failed! status: ${response.status}, ${errorData.message || ''}`);
  }

  return await response.json();
}

/**
 * Fetch stock quote data from Yahoo Finance via Vercel API
 * @param {string[]} tickers - Array of stock tickers
 * @param {boolean} forceRefresh - Force refresh even if cache is valid
 * @returns {Promise<Object[]>} Array of stock data
 */
export async function fetchStockQuotes(tickers, forceRefresh = false) {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached) {
      return cached.data;
    }
  }

  try {
    console.log(`🔄 Fetching ${tickers.length} stocks from Yahoo Finance...`);

    const data = await fetchViaApi(tickers);

    if (!data.quoteResponse || !data.quoteResponse.result) {
      throw new Error('Invalid response format from Yahoo Finance');
    }

    console.log(`✅ Successfully fetched ${data.quoteResponse.result.length} stocks`);

    // Map Yahoo Finance data to our format
    const mappedData = data.quoteResponse.result.map(stock => ({
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

    // Cache the results
    setCachedData(mappedData);

    return mappedData;

  } catch (error) {
    console.error('❌ Failed to fetch stock quotes:', error.message);
    throw error;
  }
}

/**
 * Fetch historical dividend data
 * Note: Not implemented yet for Vercel API
 * @param {string} ticker - Stock ticker
 * @returns {Promise<Object[]>} Array of dividend history
 */
export async function fetchDividendHistory(ticker) {
  console.warn('Dividend history not yet implemented for Vercel API');
  return [];
}

/**
 * Batch fetch with retry logic and caching
 * @param {string[]} tickers - Array of stock tickers
 * @param {number} batchSize - Size of each batch
 * @param {number} retries - Number of retries on failure
 * @param {boolean} forceRefresh - Force refresh even if cache is valid
 * @returns {Promise<Object[]>} Combined stock data
 */
export async function fetchStocksBatched(tickers, batchSize = 50, retries = 3, forceRefresh = false) {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached) {
      return cached.data;
    }
  }

  if (!isApiConfigured()) {
    throw new Error('API not configured. Please deploy to Vercel first.');
  }

  const batches = [];

  // Split tickers into batches
  for (let i = 0; i < tickers.length; i += batchSize) {
    batches.push(tickers.slice(i, i + batchSize));
  }

  console.log(`📦 Processing ${tickers.length} stocks in ${batches.length} batches...`);

  const results = [];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    let attempts = 0;
    let success = false;

    while (attempts < retries && !success) {
      try {
        console.log(`📊 Batch ${i + 1}/${batches.length}: Fetching ${batch.length} stocks...`);
        // Force refresh for internal batches to avoid cache issues
        const data = await fetchStockQuotes(batch, true);
        results.push(...data);
        success = true;

        // Small delay between batches to be nice to Yahoo
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        attempts++;
        if (attempts < retries) {
          console.warn(`⚠️ Batch ${i + 1} attempt ${attempts} failed, retrying...`);
          // Wait before retry (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
        } else {
          console.error(`❌ Failed to fetch batch ${i + 1} after ${retries} attempts:`, batch);
        }
      }
    }
  }

  console.log(`✅ Successfully fetched ${results.length}/${tickers.length} stocks`);

  // Cache the complete results
  if (results.length > 0) {
    setCachedData(results);
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
