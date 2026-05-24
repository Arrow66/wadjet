import { whoisDomain } from 'whoiser';
import pRetry from 'p-retry';

/**
 * Looks up domain WHOIS information and calculates domain age.
 * 
 * @param {string} domainName The domain to check (e.g., 'example.com')
 * @returns {Promise<Object>} Structured domain info
 */
async function getDomainInfo(domainName) {
  const parseWhois = async () => {
    const domainWhois = await whoisDomain(domainName);

    // whoiser returns an object keyed by the whois server that responded.
    let creationDateStr = null;
    let isPrivacyProtected = false;

    for (const server in domainWhois) {
      const data = domainWhois[server];

      if (data['Created Date']) {
        creationDateStr = data['Created Date'];
      } else if (data['Creation Date']) {
        creationDateStr = data['Creation Date'];
      }

      const rawText = JSON.stringify(data).toLowerCase();
      if (
        rawText.includes('privacy') ||
        rawText.includes('redacted') ||
        rawText.includes('protected') ||
        rawText.includes('proxy')
      ) {
        isPrivacyProtected = true;
      }

      if (creationDateStr) break;
    }

    if (!creationDateStr) {
      return {
        domain: domainName,
        ageInDays: null,
        isPrivacyProtected,
        error: 'Creation date not found in WHOIS record',
      };
    }

    const creationDate = new Date(creationDateStr);
    const ageInDays = Math.floor(
      (Date.now() - creationDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      domain: domainName,
      creationDate: creationDate.toISOString(),
      ageInDays,
      isPrivacyProtected,
    };
  };

  try {
    return await pRetry(parseWhois, {
      retries: 2,
      shouldRetry: (error) => {
        const msg = error instanceof Error ? error.message : String(error);
        return !/not supported|invalid tld|TLD for/i.test(msg);
      },
      onFailedAttempt: (error) => {
        console.log(
          `WHOIS lookup attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`,
        );
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn(`[WHOIS] Lookup failed for ${domainName}: ${message}`);
    return {
      domain: domainName,
      ageInDays: null,
      isPrivacyProtected: false,
      error: message,
    };
  }
}

/**
 * Helper to extract base domain from a URL or email address.
 */
function extractDomain(input) {
  try {
    // If it's an email
    if (input.includes('@')) {
      return input.split('@')[1].trim();
    }
    // If it's a URL
    let url = input;
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    const parsed = new URL(url);

    // Strip subdomains to get root domain (simplistic approach for hackathon)
    const parts = parsed.hostname.split('.');
    if (parts.length > 2) {
      return parts.slice(-2).join('.');
    }
    return parsed.hostname;
  } catch (e) {
    return null;
  }
}

export {
  getDomainInfo,
  extractDomain
};
