// 🌐 Cloudflare Worker - Yahoo Finance CORS Proxy
// This worker acts as a CORS proxy for Yahoo Finance API
// Deploy this to Cloudflare Workers (100% FREE - 100K requests/day)

export default {
  async fetch(request, env, ctx) {
    // Handle CORS preflight requests
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    try {
      const url = new URL(request.url);

      // Get the target Yahoo Finance URL from query parameter
      const targetUrl = url.searchParams.get('url');

      if (!targetUrl) {
        return jsonResponse({ error: 'Missing url parameter' }, 400);
      }

      // Validate that it's a Yahoo Finance URL
      if (!targetUrl.includes('query1.finance.yahoo.com') &&
          !targetUrl.includes('query2.finance.yahoo.com')) {
        return jsonResponse({ error: 'Only Yahoo Finance URLs are allowed' }, 403);
      }

      console.log('Proxying request to:', targetUrl);

      // First, get a crumb from Yahoo Finance
      const crumbResponse = await fetch('https://query1.finance.yahoo.com/v1/test/getcrumb', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Cache-Control': 'max-age=0'
        }
      });

      // Get cookies from the crumb request
      const cookies = crumbResponse.headers.get('set-cookie') || '';
      const crumb = await crumbResponse.text();

      console.log('Got crumb:', crumb ? 'yes' : 'no');

      // Now fetch from Yahoo Finance with crumb and cookies
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Referer': 'https://finance.yahoo.com/',
          'Origin': 'https://finance.yahoo.com',
          'Connection': 'keep-alive',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-site',
          'Cookie': cookies
        }
      });

      if (!response.ok) {
        console.error('Yahoo Finance error:', response.status);

        // Return detailed error for debugging
        const errorText = await response.text();
        console.error('Error details:', errorText);

        return jsonResponse({
          error: 'Yahoo Finance request failed',
          status: response.status,
          details: errorText.substring(0, 200)
        }, response.status);
      }

      const data = await response.json();

      // Return with CORS headers
      return jsonResponse(data, 200);

    } catch (error) {
      console.error('Worker error:', error);
      return jsonResponse({
        error: 'Internal server error',
        message: error.message,
        stack: error.stack
      }, 500);
    }
  }
};

/**
 * Handle CORS preflight requests
 */
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    }
  });
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status: status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=300', // Cache for 5 minutes
    }
  });
}
