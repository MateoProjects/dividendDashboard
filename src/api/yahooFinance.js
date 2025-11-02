// 🌐 Google Sheets CSV Integration
// Fetches data directly from public Google Sheets CSV export
// No API keys, no CORS issues, 100% free!

// Google Sheets CSV export URL
const CSV_URL = 'https://docs.google.com/spreadsheets/d/1CbvYPrHJnY73xLZU-ZNsnU5QNY_cy9kCKL1Cy3smA1k/export?format=csv&gid=988489794';

// Cache configuration
const CACHE_KEY = 'stocks_csv_cache';
const CACHE_DURATION = 4 * 60 * 60 * 1000; // 4 hours in milliseconds

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
 * Parse a CSV line respecting quoted fields
 * @param {string} line - CSV line
 * @returns {string[]} Parsed values
 */
function parseCSVLine(line) {
  const values = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      values.push(currentValue.trim());
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  // Add the last value
  values.push(currentValue.trim());

  return values;
}

/**
 * Parse CSV text to array of objects
 * @param {string} csv - CSV text
 * @returns {Object[]} Parsed data
 */
function parseCSV(csv) {
  const lines = csv.trim().split('\n');

  // Find the header row by looking for "Name" or "Ticker" column
  let headerIndex = -1;
  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i];
    if (line.includes('Name') || line.includes('Ticker')) {
      headerIndex = i;
      console.log(`✅ Found header row at line ${i + 1}`);
      break;
    }
  }

  if (headerIndex === -1) {
    throw new Error('Could not find CSV header row');
  }

  const headers = parseCSVLine(lines[headerIndex]);
  console.log('📋 CSV Headers:', headers);

  const data = [];
  for (let i = headerIndex + 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);

    // Skip empty rows (rows with no meaningful data)
    if (values.filter(v => v).length === 0) continue;

    // Skip rows that are just commas
    if (values.every(v => !v)) continue;

    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] || '';
    });

    data.push(obj);
  }

  console.log(`📊 Parsed ${data.length} total rows from CSV`);
  return data;
}

/**
 * Fetch and parse CSV from Google Sheets
 * @param {boolean} forceRefresh - Force refresh even if cache is valid
 * @returns {Promise<Object[]>} Array of stock data
 */
export async function fetchStocksBatched(tickers = [], batchSize = 50, retries = 3, forceRefresh = false) {
  // Check cache first (unless force refresh)
  if (!forceRefresh) {
    const cached = getCachedData();
    if (cached) {
      return cached.data;
    }
  }

  try {
    console.log('🔄 Fetching data from Google Sheets CSV...');

    const response = await fetch(CSV_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`);
    }

    const csvText = await response.text();
    const parsedData = parseCSV(csvText);

    console.log(`✅ Successfully fetched ${parsedData.length} stocks from CSV`);
    console.log('📋 First row sample:', parsedData[0]); // Debug: see what we got

    // Map CSV data to our format
    // CSV columns: Name,Ticker,Price,Dividend Payment,Dividend Yield,Sector
    const mappedData = parsedData.map(row => ({
      ticker: row.Ticker || '',
      name: row.Name || row.Ticker || '',
      price: parseFloat(row.Price || 0),
      currency: 'USD',
      dividend: parseFloat(row['Dividend Payment'] || 0),
      dividendYield: parseFloat(row['Dividend Yield'] || 0) / 100, // Convert percentage to decimal
      sector: row.Sector || 'Unknown',
      industry: row.Sector || 'Unknown', // Use Sector as Industry since CSV doesn't have Industry
      marketCap: 0, // Not available in CSV
      exDividendDate: null, // Not available in CSV
      dividendDate: null,
      change: 0, // Not available in CSV
      changePercent: 0 // Not available in CSV
    }));

    // Filter out invalid entries (must have ticker and price)
    // Skip rows where Ticker is empty (sector summary rows at end)
    const validData = mappedData.filter(stock =>
      stock.ticker &&
      stock.ticker.length > 0 &&
      stock.price > 0
    );

    console.log(`✅ Mapped to ${validData.length} valid stocks`);
    console.log('📊 Sample mapped data:', validData[0]); // Debug: see mapped result

    // Cache the results
    setCachedData(validData);

    return validData;

  } catch (error) {
    console.error('❌ Failed to fetch CSV data:', error.message);
    throw error;
  }
}

/**
 * Fetch stock quotes (alias for fetchStocksBatched for compatibility)
 */
export async function fetchStockQuotes(tickers, forceRefresh = false) {
  return fetchStocksBatched(tickers, 50, 3, forceRefresh);
}

/**
 * Fetch historical dividend data
 * Note: Not available from CSV, returns empty array
 */
export async function fetchDividendHistory(ticker) {
  console.warn('Dividend history not available from CSV data');
  return [];
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
