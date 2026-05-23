import pRetry from 'p-retry';

/**
 * Scrapes a job listing URL using the Jina Reader API.
 * This converts the webpage to Markdown, automatically handling
 * JavaScript rendering (SPAs) and bypassing basic bot protections.
 * 
 * @param {string} url The job listing URL to scrape
 * @returns {Promise<string>} The markdown content of the page
 */
async function scrapeJobUrl(url) {
  const run = async () => {
    const jinaUrl = `https://r.jina.ai/${url}`;
    
    // We send basic headers to ensure we get markdown back
    const response = await fetch(jinaUrl, {
      headers: {
        'Accept': 'text/plain',
        'X-Return-Format': 'markdown'
      }
    });

    if (!response.ok) {
      throw new Error(`Jina API error: ${response.status} ${response.statusText}`);
    }

    const markdown = await response.text();
    return markdown;
  };

  return pRetry(run, { 
    retries: 2,
    onFailedAttempt: error => {
      console.log(`Scraper attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`);
    }
  });
}

export { 
  scrapeJobUrl
 };
