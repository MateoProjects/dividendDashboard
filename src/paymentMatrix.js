// 📅 Payment Matrix - Monthly Dividend Calendar
// Fetches and displays dividend payment schedule from Google Sheets

const PAYMENT_CSV_URL = 'https://docs.google.com/spreadsheets/d/1CbvYPrHJnY73xLZU-ZNsnU5QNY_cy9kCKL1Cy3smA1k/export?format=csv&gid=1310176428';

/**
 * Parse a CSV line respecting quoted fields
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

  values.push(currentValue.trim());
  return values;
}

/**
 * Fetch and parse payment schedule CSV
 */
export async function fetchPaymentSchedule() {
  try {
    console.log('📅 Fetching payment schedule from Google Sheets...');

    const response = await fetch(PAYMENT_CSV_URL);

    if (!response.ok) {
      throw new Error(`Failed to fetch payment schedule: ${response.status}`);
    }

    const csvText = await response.text();
    const lines = csvText.trim().split('\n');

    // Find header row (contains month names)
    let headerIndex = -1;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i];
      if (line.includes('Jan') || line.includes('Feb') || line.includes('Mar')) {
        headerIndex = i;
        console.log(`✅ Found header row at line ${i + 1}`);
        break;
      }
    }

    if (headerIndex === -1) {
      throw new Error('Could not find payment schedule header row');
    }

    const headers = parseCSVLine(lines[headerIndex]);
    console.log('📋 Payment Schedule Headers:', headers);

    // Parse payment data
    const paymentData = [];

    for (let i = headerIndex + 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);

      // Skip empty rows
      if (values.filter(v => v).length === 0) continue;
      if (values.every(v => !v)) continue;

      const dayNumber = parseInt(values[0]);

      // Skip invalid day numbers
      if (isNaN(dayNumber) || dayNumber < 1 || dayNumber > 31) continue;

      const dayData = {
        day: dayNumber,
        months: {}
      };

      // Map each month's payment (skip first column which is day number)
      headers.slice(1).forEach((month, index) => {
        if (month) {
          const tickers = values[index + 1] || '';
          dayData.months[month] = tickers ? tickers.split(',').map(t => t.trim()).filter(t => t && t !== '-') : [];
        }
      });

      paymentData.push(dayData);
    }

    console.log(`✅ Parsed ${paymentData.length} days of payment data`);
    return paymentData;

  } catch (error) {
    console.error('❌ Failed to fetch payment schedule:', error.message);
    throw error;
  }
}

/**
 * Render payment matrix calendar
 */
export function renderPaymentMatrix(paymentData, stocksData = []) {
  const container = document.getElementById('payment-matrix');

  if (!paymentData || paymentData.length === 0) {
    container.innerHTML = '<p class="error-text">No payment data available</p>';
    return;
  }

  // Create ticker → name mapping
  const tickerMap = {};
  stocksData.forEach(stock => {
    tickerMap[stock.ticker] = stock.name;
  });

  // Get unique months from first day entry
  const months = Object.keys(paymentData[0].months);

  // Calculate total payments per month
  const monthlyTotals = {};
  months.forEach(month => {
    monthlyTotals[month] = 0;
    paymentData.forEach(day => {
      monthlyTotals[month] += day.months[month]?.length || 0;
    });
  });

  // Build HTML
  let html = `
    <div class="payment-summary">
      <div class="payment-header">
        <h3>Monthly Payment Summary</h3>
        <div class="search-box">
          <span class="material-symbols-outlined search-icon">search</span>
          <input type="text" id="payment-search" placeholder="Search by ticker or company...">
        </div>
      </div>
      <div class="monthly-totals">
        ${months.map(month => `
          <div class="month-total">
            <div class="month-name">${month}</div>
            <div class="payment-count">${monthlyTotals[month]} payments</div>
          </div>
        `).join('')}
      </div>
    </div>

    <div class="payment-calendar">
      <div class="calendar-header">
        <div class="day-header">Day</div>
        ${months.map(month => `<div class="month-header">${month}</div>`).join('')}
      </div>

      <div class="calendar-body">
        ${paymentData.map(dayData => `
          <div class="calendar-row" data-day="${dayData.day}">
            <div class="day-cell">${dayData.day}</div>
            ${months.map(month => {
              const payments = dayData.months[month] || [];
              return `
                <div class="payment-cell ${payments.length > 0 ? 'has-payments' : ''}" data-month="${month}">
                  ${payments.length > 0 ? `
                    <div class="payment-badges">
                      ${payments.map(ticker => {
                        const companyName = tickerMap[ticker] || ticker;
                        return `<span class="payment-badge" data-ticker="${ticker}" data-company="${companyName}" title="${companyName} (${ticker})">${ticker}</span>`;
                      }).join('')}
                    </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        `).join('')}
      </div>
    </div>

    <div class="payment-note">
      <span class="material-symbols-outlined">info</span>
      <p><strong>Note:</strong> These are not likely to be the actual dates you get paid! Each year the payment dates vary, however this is a rough estimate of when the companies will pay out. It might be that you get paid multiple dividends on the same day. It's also the case that there are delays between brokers receiving the dividend and paying it to you.</p>
    </div>
  `;

  container.innerHTML = html;

  // Setup search filter
  setupPaymentSearch();
}

/**
 * Setup search functionality for payment matrix
 */
function setupPaymentSearch() {
  const searchInput = document.getElementById('payment-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase().trim();
    const badges = document.querySelectorAll('.payment-badge');
    const rows = document.querySelectorAll('.calendar-row');

    if (!query) {
      // Show all - reset everything
      badges.forEach(badge => {
        badge.style.display = '';
        badge.classList.remove('highlight');
      });
      rows.forEach(row => {
        row.style.display = '';
        row.style.opacity = '1';
      });
      return;
    }

    // Filter: hide/show badges based on search
    let rowsWithMatches = new Set();

    badges.forEach(badge => {
      const ticker = badge.getAttribute('data-ticker').toLowerCase();
      const company = badge.getAttribute('data-company').toLowerCase();
      const matches = ticker.includes(query) || company.includes(query);

      if (matches) {
        badge.style.display = '';
        badge.classList.add('highlight');
        // Track rows that have at least one visible badge
        const row = badge.closest('.calendar-row');
        if (row) rowsWithMatches.add(row);
      } else {
        badge.style.display = 'none';
        badge.classList.remove('highlight');
      }
    });

    // Hide rows that have NO visible badges
    rows.forEach(row => {
      if (rowsWithMatches.has(row)) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    });
  });
}

/**
 * Initialize payment matrix tab
 */
export async function initPaymentMatrix(stocksData = []) {
  try {
    const paymentData = await fetchPaymentSchedule();
    renderPaymentMatrix(paymentData, stocksData);
  } catch (error) {
    const container = document.getElementById('payment-matrix');
    container.innerHTML = `
      <div class="error-container">
        <span class="material-symbols-outlined error-icon">error</span>
        <h3>Failed to load payment schedule</h3>
        <p>${error.message}</p>
      </div>
    `;
  }
}
