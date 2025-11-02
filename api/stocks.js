// Vercel Serverless Function - Yahoo Finance API
// Uses yahoo-finance2 library which handles Yahoo authentication
// Deploy to Vercel (100% FREE)

import yahooFinance from 'yahoo-finance2';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { symbols } = req.query;

    if (!symbols) {
      return res.status(400).json({ error: 'Missing symbols parameter' });
    }

    // Split symbols by comma
    const tickerArray = symbols.split(',');

    console.log('Fetching quotes for:', tickerArray);

    // Fetch quotes using yahoo-finance2
    const quotes = await yahooFinance.quote(tickerArray);

    // Format response to match our expected structure
    const formattedData = {
      quoteResponse: {
        result: Array.isArray(quotes) ? quotes : [quotes]
      }
    };

    console.log('Successfully fetched', formattedData.quoteResponse.result.length, 'stocks');

    // Cache for 5 minutes
    res.setHeader('Cache-Control', 'public, max-age=300');

    return res.status(200).json(formattedData);

  } catch (error) {
    console.error('Error fetching stocks:', error);
    return res.status(500).json({
      error: 'Failed to fetch stock data',
      message: error.message
    });
  }
}
