// 📊 DCA Calculator - Dividend Reinvestment Simulator
// Simulates portfolio growth with DCA, dividend reinvestment, and market scenarios

/**
 * Calculate DCA portfolio growth with dividend reinvestment
 * @param {Object} params - Simulation parameters
 * @returns {Object} Simulation results
 */
export function calculateDCAScenario(params) {
  const {
    initialInvestment = 0,
    monthlyDCA = 0,
    years = 10,
    currentPrice = 100,
    currentDividendYield = 0.03, // 3%
    cagr = 0.08, // 8% annual growth
    dividendGrowth = 0.05, // 5% annual dividend growth
    reinvestThreshold = 50, // Reinvest when dividends accumulate to €50
    marketCrashes = [] // Array of {year, drop, recoveryMonths}
  } = params;

  const results = {
    yearlyData: [],
    totalInvested: 0,
    totalShares: 0,
    finalValue: 0,
    totalDividendsReceived: 0,
    totalDividendsReinvested: 0,
    finalPrice: 0,
    finalAnnualDividend: 0
  };

  let shares = 0;
  let cashBuffer = 0; // Accumulated dividends waiting for reinvestment
  let totalInvested = 0;
  let totalDividendsReceived = 0;
  let totalDividendsReinvested = 0;

  // Initial investment
  if (initialInvestment > 0) {
    shares = initialInvestment / currentPrice;
    totalInvested += initialInvestment;
  }

  // Simulate month by month
  for (let year = 1; year <= years; year++) {
    let yearStartShares = shares;
    let yearInvested = 0;
    let yearDividends = 0;

    for (let month = 1; month <= 12; month++) {
      const monthIndex = (year - 1) * 12 + month;

      // Calculate current price with CAGR (price increases over time)
      let currentMonthPrice = currentPrice * Math.pow(1 + cagr, (monthIndex - 1) / 12);

      // Apply market crash if applicable
      const crash = marketCrashes.find(c => {
        const crashStartMonth = (c.year - 1) * 12 + 1;
        const crashEndMonth = crashStartMonth + (c.recoveryMonths || 12);
        return monthIndex >= crashStartMonth && monthIndex < crashEndMonth;
      });

      if (crash) {
        const monthsSinceCrash = monthIndex - ((crash.year - 1) * 12 + 1);
        const recoveryMonths = crash.recoveryMonths || 12;

        if (monthsSinceCrash === 0) {
          // Initial crash
          currentMonthPrice *= (1 - crash.drop);
        } else if (monthsSinceCrash < recoveryMonths) {
          // Recovery phase - gradual recovery
          const recoveryProgress = monthsSinceCrash / recoveryMonths;
          const crashPrice = currentMonthPrice * (1 - crash.drop);
          currentMonthPrice = crashPrice + (currentMonthPrice - crashPrice) * recoveryProgress;
        }
      }

      // Monthly DCA investment
      if (monthlyDCA > 0) {
        const sharesBought = monthlyDCA / currentMonthPrice;
        shares += sharesBought;
        totalInvested += monthlyDCA;
        yearInvested += monthlyDCA;
      }

      // Calculate dividend for this month (paid quarterly, simplified as monthly)
      // Annual dividend per share grows each year
      const annualDividendPerShare = currentMonthPrice * currentDividendYield * Math.pow(1 + dividendGrowth, year - 1);
      const monthlyDividend = (shares * annualDividendPerShare) / 12;

      cashBuffer += monthlyDividend;
      totalDividendsReceived += monthlyDividend;
      yearDividends += monthlyDividend;

      // Reinvest dividends if threshold reached
      if (cashBuffer >= reinvestThreshold) {
        const sharesBoughtWithDividends = cashBuffer / currentMonthPrice;
        shares += sharesBoughtWithDividends;
        totalDividendsReinvested += cashBuffer;
        cashBuffer = 0;
      }
    }

    // End of year snapshot
    const yearEndPrice = currentPrice * Math.pow(1 + cagr, year);
    const portfolioValue = shares * yearEndPrice;
    const annualDividendPerShare = yearEndPrice * currentDividendYield * Math.pow(1 + dividendGrowth, year);
    const annualDividendIncome = shares * annualDividendPerShare;

    results.yearlyData.push({
      year,
      shares: shares.toFixed(4),
      price: yearEndPrice.toFixed(2),
      portfolioValue: portfolioValue.toFixed(2),
      invested: totalInvested.toFixed(2),
      dividendsReceived: yearDividends.toFixed(2),
      annualDividendIncome: annualDividendIncome.toFixed(2),
      dividendYield: ((annualDividendIncome / portfolioValue) * 100).toFixed(2),
      cashBuffer: cashBuffer.toFixed(2)
    });
  }

  // Final results
  const finalPrice = currentPrice * Math.pow(1 + cagr, years);
  const finalValue = shares * finalPrice;
  const finalAnnualDividendPerShare = finalPrice * currentDividendYield * Math.pow(1 + dividendGrowth, years);

  results.totalInvested = totalInvested.toFixed(2);
  results.totalShares = shares.toFixed(4);
  results.finalPrice = finalPrice.toFixed(2);
  results.finalValue = finalValue.toFixed(2);
  results.totalDividendsReceived = totalDividendsReceived.toFixed(2);
  results.totalDividendsReinvested = totalDividendsReinvested.toFixed(2);
  results.finalAnnualDividend = (shares * finalAnnualDividendPerShare).toFixed(2);
  results.finalMonthlyDividend = (shares * finalAnnualDividendPerShare / 12).toFixed(2);

  return results;
}

/**
 * Render DCA calculator interface
 */
export function renderDCACalculator() {
  const container = document.getElementById('calculator-inputs');

  const html = `
    <div class="calculator-form">
      <div class="form-section">
        <h3>Investment Parameters</h3>
        <div class="form-grid">
          <div class="form-field">
            <label>Initial Investment (€)</label>
            <input type="number" id="initial-investment" value="1000" min="0" step="100">
          </div>
          <div class="form-field">
            <label>Monthly DCA (€)</label>
            <input type="number" id="monthly-dca" value="500" min="0" step="50">
          </div>
          <div class="form-field">
            <label>Years</label>
            <input type="number" id="years" value="10" min="1" max="50">
          </div>
          <div class="form-field">
            <label>Current Price (€)</label>
            <input type="number" id="current-price" value="100" min="1" step="0.01">
          </div>
          <div class="form-field">
            <label>Current Dividend Yield (%)</label>
            <input type="number" id="current-yield" value="3.5" min="0" max="20" step="0.1">
          </div>
          <div class="form-field">
            <label>Reinvest Threshold (€)</label>
            <input type="number" id="reinvest-threshold" value="50" min="10" step="10">
          </div>
        </div>
      </div>

      <div class="form-section">
        <h3>Market Crash Simulation (Optional)</h3>
        <div class="form-grid">
          <div class="form-field">
            <label>Crash Year</label>
            <input type="number" id="crash-year" value="5" min="1" max="50">
          </div>
          <div class="form-field">
            <label>Market Drop (%)</label>
            <input type="number" id="crash-drop" value="30" min="0" max="90" step="5">
          </div>
          <div class="form-field">
            <label>Recovery (months)</label>
            <input type="number" id="crash-recovery" value="12" min="1" max="60">
          </div>
        </div>
        <label class="checkbox-field">
          <input type="checkbox" id="enable-crash">
          <span>Enable market crash simulation</span>
        </label>
      </div>

      <div class="scenario-tabs">
        <button class="scenario-tab active" data-scenario="pessimistic">
          <span class="material-symbols-outlined">trending_down</span>
          Pessimistic
        </button>
        <button class="scenario-tab" data-scenario="realistic">
          <span class="material-symbols-outlined">trending_flat</span>
          Realistic
        </button>
        <button class="scenario-tab" data-scenario="optimistic">
          <span class="material-symbols-outlined">trending_up</span>
          Optimistic
        </button>
      </div>

      <div class="scenario-params">
        <div class="scenario-param-set active" data-scenario="pessimistic">
          <div class="form-grid">
            <div class="form-field">
              <label>CAGR (%)</label>
              <input type="number" class="cagr-input" data-scenario="pessimistic" value="4" min="-20" max="30" step="0.5">
            </div>
            <div class="form-field">
              <label>Dividend Growth (%)</label>
              <input type="number" class="div-growth-input" data-scenario="pessimistic" value="2" min="-10" max="20" step="0.5">
            </div>
          </div>
        </div>

        <div class="scenario-param-set" data-scenario="realistic">
          <div class="form-grid">
            <div class="form-field">
              <label>CAGR (%)</label>
              <input type="number" class="cagr-input" data-scenario="realistic" value="8" min="-20" max="30" step="0.5">
            </div>
            <div class="form-field">
              <label>Dividend Growth (%)</label>
              <input type="number" class="div-growth-input" data-scenario="realistic" value="5" min="-10" max="20" step="0.5">
            </div>
          </div>
        </div>

        <div class="scenario-param-set" data-scenario="optimistic">
          <div class="form-grid">
            <div class="form-field">
              <label>CAGR (%)</label>
              <input type="number" class="cagr-input" data-scenario="optimistic" value="12" min="-20" max="30" step="0.5">
            </div>
            <div class="form-field">
              <label>Dividend Growth (%)</label>
              <input type="number" class="div-growth-input" data-scenario="optimistic" value="8" min="-10" max="20" step="0.5">
            </div>
          </div>
        </div>
      </div>

      <button class="btn-primary calculate-btn" id="calculate-btn">
        <span class="material-symbols-outlined">calculate</span>
        Calculate Scenarios
      </button>
    </div>
  `;

  container.innerHTML = html;

  // Setup event listeners
  setupCalculatorEvents();
}

/**
 * Setup calculator event listeners
 */
function setupCalculatorEvents() {
  // Scenario tabs
  document.querySelectorAll('.scenario-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const scenario = tab.getAttribute('data-scenario');

      // Update active tab
      document.querySelectorAll('.scenario-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Show corresponding params
      document.querySelectorAll('.scenario-param-set').forEach(set => {
        set.classList.remove('active');
      });
      document.querySelector(`[data-scenario="${scenario}"].scenario-param-set`).classList.add('active');
    });
  });

  // Calculate button
  document.getElementById('calculate-btn').addEventListener('click', runCalculations);
}

/**
 * Run DCA calculations for all scenarios
 */
function runCalculations() {
  // Get common parameters
  const initialInvestment = parseFloat(document.getElementById('initial-investment').value) || 0;
  const monthlyDCA = parseFloat(document.getElementById('monthly-dca').value) || 0;
  const years = parseInt(document.getElementById('years').value) || 10;
  const currentPrice = parseFloat(document.getElementById('current-price').value) || 100;
  const currentYield = (parseFloat(document.getElementById('current-yield').value) || 3.5) / 100;
  const reinvestThreshold = parseFloat(document.getElementById('reinvest-threshold').value) || 50;

  // Market crash parameters
  const enableCrash = document.getElementById('enable-crash').checked;
  const marketCrashes = enableCrash ? [{
    year: parseInt(document.getElementById('crash-year').value) || 5,
    drop: (parseFloat(document.getElementById('crash-drop').value) || 30) / 100,
    recoveryMonths: parseInt(document.getElementById('crash-recovery').value) || 12
  }] : [];

  const baseParams = {
    initialInvestment,
    monthlyDCA,
    years,
    currentPrice,
    currentDividendYield: currentYield,
    reinvestThreshold,
    marketCrashes
  };

  // Calculate each scenario
  const scenarios = ['pessimistic', 'realistic', 'optimistic'];
  const scenarioResults = {};

  scenarios.forEach(scenario => {
    const cagr = (parseFloat(document.querySelector(`.cagr-input[data-scenario="${scenario}"]`).value) || 0) / 100;
    const divGrowth = (parseFloat(document.querySelector(`.div-growth-input[data-scenario="${scenario}"]`).value) || 0) / 100;

    scenarioResults[scenario] = calculateDCAScenario({
      ...baseParams,
      cagr,
      dividendGrowth: divGrowth
    });
  });

  // Render results
  renderScenarioResults(scenarioResults);
}

/**
 * Render scenario comparison results
 */
function renderScenarioResults(results) {
  const container = document.getElementById('scenarios-results');

  const scenarios = [
    { key: 'pessimistic', name: 'Pessimistic', icon: 'trending_down', color: '#ef4444' },
    { key: 'realistic', name: 'Realistic', icon: 'trending_flat', color: '#3b82f6' },
    { key: 'optimistic', name: 'Optimistic', icon: 'trending_up', color: '#10b981' }
  ];

  const html = `
    <div class="scenarios-grid">
      ${scenarios.map(scenario => {
        const data = results[scenario.key];
        const roi = ((parseFloat(data.finalValue) / parseFloat(data.totalInvested) - 1) * 100).toFixed(2);

        return `
          <div class="scenario-card" style="border-color: ${scenario.color}">
            <div class="scenario-header" style="background: ${scenario.color}20; border-bottom-color: ${scenario.color}">
              <span class="material-symbols-outlined">${scenario.icon}</span>
              <h3>${scenario.name}</h3>
            </div>

            <div class="scenario-metrics">
              <div class="metric-row">
                <span class="metric-label">Total Invested</span>
                <span class="metric-value">€${parseFloat(data.totalInvested).toLocaleString()}</span>
              </div>
              <div class="metric-row highlight">
                <span class="metric-label">Final Value</span>
                <span class="metric-value big">€${parseFloat(data.finalValue).toLocaleString()}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">ROI</span>
                <span class="metric-value ${roi >= 0 ? 'positive' : 'negative'}">${roi}%</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Total Shares</span>
                <span class="metric-value">${data.totalShares}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Final Price/Share</span>
                <span class="metric-value">€${parseFloat(data.finalPrice).toLocaleString()}</span>
              </div>
              <div class="metric-row highlight">
                <span class="metric-label">Monthly Dividend Income</span>
                <span class="metric-value big">€${parseFloat(data.finalMonthlyDividend).toLocaleString()}/mo</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Annual Dividend Income</span>
                <span class="metric-value">€${parseFloat(data.finalAnnualDividend).toLocaleString()}/yr</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Dividends Received</span>
                <span class="metric-value">€${parseFloat(data.totalDividendsReceived).toLocaleString()}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Dividends Reinvested</span>
                <span class="metric-value">€${parseFloat(data.totalDividendsReinvested).toLocaleString()}</span>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  container.innerHTML = html;
}

/**
 * Initialize DCA calculator
 */
export function initDCACalculator() {
  renderDCACalculator();
}
