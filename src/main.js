// 🚀 Main Application Entry Point

import { portfolio } from '../config.js';
import {
  fetchStocksBatched,
  calculatePortfolioStats,
  formatCurrency,
  formatPercent
} from './api/yahooFinance.js';

// Global state
let stocksData = [];
let sortColumn = 'yield';
let sortDirection = 'desc';
let currentTheme = portfolio.settings.defaultTheme;
let isUpdating = false;

// Cache configuration
const CACHE_KEY = 'dividend_dashboard_cache';
const CACHE_TIMESTAMP_KEY = 'dividend_dashboard_timestamp';
const CACHE_EXPIRY = 1000 * 60 * 60; // 1 hour

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeTheme();
  setupEventListeners();
  loadPortfolioData();
});

/**
 * Initialize theme
 */
function initializeTheme() {
  document.documentElement.setAttribute('data-theme', currentTheme);
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
  // Theme toggle
  document.getElementById('theme-toggle').addEventListener('click', toggleTheme);

  // Refresh button
  document.getElementById('refresh-btn').addEventListener('click', () => {
    if (!isUpdating) {
      fetchFreshData(false);
    }
  });

  // Retry button
  document.getElementById('retry-btn')?.addEventListener('click', () => {
    hideError();
    loadPortfolioData();
  });

  // Search
  document.getElementById('search-input').addEventListener('input', (e) => {
    filterTable(e.target.value);
  });

  // Table sorting
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const column = th.getAttribute('data-sort');
      handleSort(column);
    });
  });

  // Auto-refresh (background updates only)
  if (portfolio.settings.refreshInterval > 0) {
    setInterval(() => {
      if (!isUpdating) {
        fetchFreshData(true); // Silent background update
      }
    }, portfolio.settings.refreshInterval);
  }
}

/**
 * Toggle theme
 */
function toggleTheme() {
  currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', currentTheme);
}

/**
 * Load portfolio data with smart caching
 */
async function loadPortfolioData() {
  // Try to load from cache first
  const cachedData = loadFromCache();

  if (cachedData) {
    // Show cached data immediately
    stocksData = cachedData;
    updateDashboard();
    updateTable();
    updateCharts();
    updateLastUpdated(true); // Mark as cached
    showMainContent();

    // Update in background if cache is older than 5 minutes
    const cacheAge = Date.now() - getCacheTimestamp();
    if (cacheAge > 5 * 60 * 1000) {
      fetchFreshData(true); // Silent background update
    }
  } else {
    // No cache - show loading and fetch
    showLoading();
    await fetchFreshData(false);
  }
}

/**
 * Fetch fresh data from API
 */
async function fetchFreshData(silent = false) {
  if (!silent) {
    showLoading();
  } else {
    showUpdatingIndicator();
  }

  hideError();
  isUpdating = true;

  try {
    const data = await fetchStocksBatched(portfolio.tickers);

    if (data.length === 0) {
      throw new Error('No data received from Yahoo Finance');
    }

    stocksData = data;

    // Save to cache
    saveToCache(data);

    // Update UI
    updateDashboard();
    updateTable();
    updateCharts();
    updateLastUpdated(false);

    if (!silent) {
      showMainContent();
    } else {
      hideUpdatingIndicator();
    }
  } catch (error) {
    console.error('Error loading portfolio:', error);

    if (!silent) {
      showError('Failed to load portfolio data. Please check your internet connection and try again.');
    } else {
      // Silent failure - keep showing cached data
      console.warn('Background update failed, keeping cached data');
      hideUpdatingIndicator();
    }
  } finally {
    isUpdating = false;
  }
}

/**
 * Save data to localStorage cache
 */
function saveToCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to save to cache:', error);
  }
}

/**
 * Load data from localStorage cache
 */
function loadFromCache() {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);

    if (!cached || !timestamp) {
      return null;
    }

    const age = Date.now() - parseInt(timestamp);

    // Cache expired after 1 hour
    if (age > CACHE_EXPIRY) {
      return null;
    }

    return JSON.parse(cached);
  } catch (error) {
    console.warn('Failed to load from cache:', error);
    return null;
  }
}

/**
 * Get cache timestamp
 */
function getCacheTimestamp() {
  try {
    const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
    return timestamp ? parseInt(timestamp) : 0;
  } catch {
    return 0;
  }
}

/**
 * Show updating indicator
 */
function showUpdatingIndicator() {
  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.classList.add('updating');
  refreshBtn.style.animation = 'spin 1s linear infinite';
}

/**
 * Hide updating indicator
 */
function hideUpdatingIndicator() {
  const refreshBtn = document.getElementById('refresh-btn');
  refreshBtn.classList.remove('updating');
  refreshBtn.style.animation = '';
}

/**
 * Update dashboard summary cards
 */
function updateDashboard() {
  const stats = calculatePortfolioStats(stocksData);

  // Average Yield
  document.getElementById('avg-yield').textContent = formatPercent(stats.avgYield);

  // Total Stocks
  document.getElementById('total-stocks').textContent = stats.totalStocks;

  // Annual Income (per $10k invested)
  const annualIncome = stats.avgYield * portfolio.settings.projectionAmount;
  document.getElementById('annual-income').textContent = formatCurrency(annualIncome);

  // Top Yielder
  if (stats.topYielder) {
    document.getElementById('top-yielder').textContent =
      `${stats.topYielder.ticker} (${formatPercent(stats.topYielder.dividendYield)})`;
  }
}

/**
 * Update stocks table
 */
function updateTable() {
  const tbody = document.getElementById('stocks-tbody');
  tbody.innerHTML = '';

  const sortedStocks = [...stocksData].sort((a, b) => {
    let aVal, bVal;

    switch (sortColumn) {
      case 'name':
        aVal = a.name;
        bVal = b.name;
        break;
      case 'ticker':
        aVal = a.ticker;
        bVal = b.ticker;
        break;
      case 'price':
        aVal = a.price;
        bVal = b.price;
        break;
      case 'yield':
        aVal = a.dividendYield || 0;
        bVal = b.dividendYield || 0;
        break;
      case 'dividend':
        aVal = a.dividend || 0;
        bVal = b.dividend || 0;
        break;
      case 'sector':
        aVal = a.sector;
        bVal = b.sector;
        break;
      default:
        aVal = a.dividendYield || 0;
        bVal = b.dividendYield || 0;
    }

    if (typeof aVal === 'string') {
      return sortDirection === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }

    return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
  });

  sortedStocks.forEach(stock => {
    const row = document.createElement('tr');

    const yieldClass = getYieldClass(stock.dividendYield || 0);

    row.innerHTML = `
      <td><span class="stock-name">${stock.name}</span></td>
      <td><span class="ticker-symbol">${stock.ticker}</span></td>
      <td><span class="price-value">${formatCurrency(stock.price, stock.currency)}</span></td>
      <td><span class="yield-value ${yieldClass}">${formatPercent(stock.dividendYield || 0)}</span></td>
      <td>${formatCurrency(stock.dividend || 0, stock.currency)}</td>
      <td><span class="sector-tag">${stock.sector}</span></td>
    `;

    tbody.appendChild(row);
  });

  updateSortIndicators();
}

/**
 * Get yield CSS class based on value
 */
function getYieldClass(yield_) {
  if (yield_ >= 0.05) return 'yield-high';
  if (yield_ >= 0.03) return 'yield-medium';
  return 'yield-low';
}

/**
 * Handle table sorting
 */
function handleSort(column) {
  if (sortColumn === column) {
    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    sortColumn = column;
    sortDirection = 'desc';
  }

  updateTable();
}

/**
 * Update sort indicators
 */
function updateSortIndicators() {
  document.querySelectorAll('th[data-sort]').forEach(th => {
    th.classList.remove('sorted');
    const icon = th.querySelector('.sort-icon');
    icon.textContent = '⇅';
  });

  const activeTh = document.querySelector(`th[data-sort="${sortColumn}"]`);
  if (activeTh) {
    activeTh.classList.add('sorted');
    const icon = activeTh.querySelector('.sort-icon');
    icon.textContent = sortDirection === 'asc' ? '↑' : '↓';
  }
}

/**
 * Filter table by search term
 */
function filterTable(searchTerm) {
  const rows = document.querySelectorAll('#stocks-tbody tr');
  const term = searchTerm.toLowerCase();

  rows.forEach(row => {
    const text = row.textContent.toLowerCase();
    row.style.display = text.includes(term) ? '' : 'none';
  });
}

/**
 * Update charts
 */
function updateCharts() {
  updateSectorChart();
  updateYieldChart();
}

/**
 * Update sector distribution chart
 */
function updateSectorChart() {
  const stats = calculatePortfolioStats(stocksData);
  const ctx = document.getElementById('sector-chart').getContext('2d');

  // Destroy existing chart if it exists
  if (window.sectorChart) {
    window.sectorChart.destroy();
  }

  const labels = Object.keys(stats.sectorDistribution);
  const data = Object.values(stats.sectorDistribution);

  window.sectorChart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: labels,
      datasets: [{
        data: data,
        backgroundColor: portfolio.settings.chartColors,
        borderWidth: 2,
        borderColor: currentTheme === 'dark' ? '#1e1e1e' : '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            color: currentTheme === 'dark' ? '#ffffff' : '#1e1e1e',
            padding: 15,
            font: { size: 12 }
          }
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((context.parsed / total) * 100).toFixed(1);
              return `${context.label}: ${context.parsed} stocks (${percentage}%)`;
            }
          }
        }
      }
    }
  });
}

/**
 * Update top yielders chart
 */
function updateYieldChart() {
  const ctx = document.getElementById('yield-chart').getContext('2d');

  // Destroy existing chart if it exists
  if (window.yieldChart) {
    window.yieldChart.destroy();
  }

  // Get top 10 by yield
  const topYielders = [...stocksData]
    .sort((a, b) => (b.dividendYield || 0) - (a.dividendYield || 0))
    .slice(0, 10);

  const labels = topYielders.map(s => s.ticker);
  const data = topYielders.map(s => (s.dividendYield || 0) * 100);

  window.yieldChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Dividend Yield (%)',
        data: data,
        backgroundColor: portfolio.settings.chartColors[0],
        borderColor: portfolio.settings.chartColors[1],
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context) => `Yield: ${context.parsed.y.toFixed(2)}%`
          }
        }
      },
      scales: {
        x: {
          ticks: {
            color: currentTheme === 'dark' ? '#b0b0b0' : '#4a4a4a'
          },
          grid: {
            color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          beginAtZero: true,
          ticks: {
            color: currentTheme === 'dark' ? '#b0b0b0' : '#4a4a4a',
            callback: (value) => value + '%'
          },
          grid: {
            color: currentTheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  });
}

/**
 * Update last updated timestamp
 */
function updateLastUpdated(fromCache = false) {
  const timestamp = fromCache ? getCacheTimestamp() : Date.now();
  const date = new Date(timestamp);
  const formatted = date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const cacheIndicator = fromCache ? ' (cached)' : '';
  document.getElementById('last-update').textContent = formatted + cacheIndicator;
}

/**
 * Show loading state
 */
function showLoading() {
  document.getElementById('loading').style.display = 'flex';
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('error').style.display = 'none';
}

/**
 * Show main content
 */
function showMainContent() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('main-content').style.display = 'block';
  document.getElementById('error').style.display = 'none';
}

/**
 * Show error state
 */
function showError(message) {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('main-content').style.display = 'none';
  document.getElementById('error').style.display = 'flex';
  document.getElementById('error-message').textContent = message;
}

/**
 * Hide error state
 */
function hideError() {
  document.getElementById('error').style.display = 'none';
}
