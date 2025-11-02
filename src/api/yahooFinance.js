// 🌐 Financial Modeling Prep API Integration
// Reliable API with CORS enabled - no proxy needed!

const FMP_BASE_URL = 'https://financialmodelingprep.com/api/v3';

// Cache configuration
const CACHE_KEY = 'fmp_stock_cache';
const API_KEY_STORAGE = 'fmp_api_key';
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

/**
 * Get API key from localStorage or prompt user
 * @returns {string|null} API key or null if user cancels
 */
function getApiKey() {
  // Try to get from localStorage first
  let apiKey = localStorage.getItem(API_KEY_STORAGE);

  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    // Prompt user for API key
    apiKey = prompt(
      '🔑 Please enter your Financial Modeling Prep API key:\n\n' +
      '• Get it FREE at: https://site.financialmodelingprep.com/developer/docs/\n' +
      '• 250 requests/day included\n' +
      '• Your key will be saved locally (not shared)\n\n' +
      'Enter your API key:'
    );

    if (apiKey && apiKey.trim().length > 0) {
      localStorage.setItem(API_KEY_STORAGE, apiKey.trim());
      console.log('✅ API key saved successfully!');
    } else {
      console.error('❌ No API key provided');
      return null;
    }
  }

  return apiKey;
}

/**
 * Clear saved API key (useful if key is invalid)
 */
export function clearApiKey() {
  localStorage.removeItem(API_KEY_STORAGE);
  console.log('🗑️ API key cleared. You will be prompted on next request.');
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
 * Fetch stock quote data from Financial Modeling Prep API
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

  // Get API key
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API Key required. Please provide your Financial Modeling Prep API key.');
  }

  const symbols = tickers.join(',');
  const url = `${FMP_BASE_URL}/quote/${symbols}?apikey=${apiKey}`;

  try {
    console.log(`🔄 Fetching ${tickers.length} stocks from FMP API...`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Invalid API key - clear it so user can enter new one
        clearApiKey();
        throw new Error('Invalid API key. Please enter a valid key on next page load.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!Array.isArray(data)) {
      throw new Error('Invalid response format from Financial Modeling Prep');
    }

    console.log(`✅ Successfully fetched ${data.length} stocks`);

    // Map FMP data to our format
    const mappedData = data.map(stock => ({
      ticker: stock.symbol || '',
      name: stock.name || stock.symbol || '',
      price: stock.price || 0,
      currency: 'USD', // FMP uses USD by default
      dividend: stock.annualDividend || 0,
      dividendYield: stock.annualDividend && stock.price ? stock.annualDividend / stock.price : 0,
      sector: stock.sector || 'Unknown',
      industry: stock.industry || 'Unknown',
      marketCap: stock.marketCap || 0,
      exDividendDate: stock.exDividendDate ? new Date(stock.exDividendDate) : null,
      dividendDate: null, // Not available in basic quote
      change: stock.change || 0,
      changePercent: stock.changesPercentage ? stock.changesPercentage / 100 : 0
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
 * Fetch historical dividend data from Financial Modeling Prep API
 * @param {string} ticker - Stock ticker
 * @returns {Promise<Object[]>} Array of dividend history
 */
export async function fetchDividendHistory(ticker) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('❌ API Key not configured!');
    return [];
  }

  const url = `${FMP_BASE_URL}/historical-price-full/stock_dividend/${ticker}?apikey=${apiKey}`;

  try {
    console.log(`🔄 Fetching dividend history for ${ticker}...`);

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.historical || !Array.isArray(data.historical)) {
      console.warn(`No dividend history found for ${ticker}`);
      return [];
    }

    console.log(`✅ Found ${data.historical.length} dividend payments for ${ticker}`);

    return data.historical.map(div => ({
      date: new Date(div.date),
      amount: div.dividend || div.adjustedDividend || 0
    })).sort((a, b) => b.date - a.date);

  } catch (error) {
    console.error(`❌ Failed to fetch dividend history for ${ticker}:`, error.message);
    return [];
  }
}

/**
 * Batch fetch with retry logic and caching
 * Note: FMP free tier allows comma-separated symbols in a single request
 * @param {string[]} tickers - Array of stock tickers
 * @param {number} batchSize - Size of each batch (FMP supports multiple symbols)
 * @param {number} retries - Number of retries on failure
 * @param {boolean} forceRefresh - Force refresh even if cache is valid
 * @returns {Promise<Object[]>} Combined stock data
 */
export async function fetchStocksBatched(tickers, batchSize = 10, retries = 3, forceRefresh = false) {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached) {
      return cached.data;
    }
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.error('❌ API Key not configured!');
    return [];
  }

  const batches = [];

  // Split tickers into smaller batches to avoid URL length limits
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

        // Small delay between batches to respect rate limits
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
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
