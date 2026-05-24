/**
 * Mock data for MOCK_MODE=true.
 * Returns realistic-looking agent outputs without hitting Gemini at all.
 * Use this for UI development, SSE debugging, and graph flow testing.
 */

export const MOCK_GATEKEEPER = {
  "jobTitle": "Software Engineer",
  "companyName": "Scotiabank",
  "salaryText": null,
  "requirements": "Develop clean, maintainable code using .NET, C#, Java, React. Build REST APIs and microservices. Collaborate in agile teams, apply modern cloud and DevOps practices.",
  "contactInfo": "https://jobs.scotiabank.com/talentcommunity/apply/601786217/?locale=en_US",
  "condensedDescription": "Join the Automotive Finance Engineering team to develop cloud-ready backend services, APIs, and front-end components. Support financing, leasing, and dealer ecosystem workflows for Retail and Commercial segments. Collaborate in agile teams, write clean, maintainable code, and learn modern cloud and DevOps practices. Responsibilities include using .NET, C#, Java, and React to build and enhance REST APIs, microservices, and event-driven systems, focusing on improving customer experiences."
};

export const MOCK_LINGUISTIC = {
  "reasoningSteps": [
    "Analyzed the job listing for high urgency markers like \"Hiring immediately\" or \"Act fast\"; none were present.",
    "Examined the duties for vagueness paired with high compensation; the duties are specific, and no compensation was listed.",
    "Scanned the text for any money-first language, excessive grammar issues, requests for PII, or unprofessional communication channels.",
    "Determined that no specified linguistic markers for employment fraud were found in the provided job data."
  ],
  "hasUrgency": false,
  "hasVagueness": false,
  "hasMoneyFirst": false,
  "hasGrammarIssues": false,
  "hasPiiRequest": false,
  "hasAsyncCultureSignals": false,
  "asyncCultureEvidence": null,
  "flaggedPhrases": [],
  "riskScore": 0,
  "qualityScore": 0,
  "analysis": "Linguistic risk calculated at 0/100 based on 2 flagged patterns."
};

export const MOCK_COMPANY = {
  "reasoningSteps": [
    "Searched for 'Scotiabank official website' to verify the company's existence and active operations.",
    "Searched for 'Scotiabank LinkedIn company page' to confirm their professional network presence and employee listings.",
    "Searched for 'Scotiabank Indeed reviews' and 'Scotiabank Glassdoor reviews' to gather employee feedback and assess active existence.",
    "Searched for 'Scotiabank news PR Newswire' and 'Scotiabank news TechCrunch' (or similar fintech news sources) to find recent public announcements and activities.",
    "Analyzed Scotiabank's core business and recent strategic initiatives to determine if the 'Software Engineer' job title aligns logically with their industry.",
    "Reviewed all search results to ensure no signs of impersonation or a shell company, focusing on consistent branding and verifiable information."
  ],
  "companyExists": true,
  "hasLinkedIn": true,
  "hasReviews": true,
  "hasNews": true,
  "industryAlignment": true,
  "recentLayoffsDetected": false,
  "layoffSeverity": "none",
  "fundingStage": "public",
  "lastFundingYear": null,
  "evidence": [
    {
      "source": "Official Site",
      "finding": "Scotiabank operates a comprehensive global website (scotiabank.com) that details its personal, business, and corporate banking, wealth management, and capital markets services. The site is active, professional, and provides extensive information about its operations, financial results, and corporate governance.",
      "supports": "legitimate",
      "url": "http://www.scotiabank.com"
    },
    {
      "source": "Official Site (Corporate Profile)",
      "finding": "Scotiabank is a Canadian multinational banking and financial services company headquartered in Toronto, Ontario, one of Canada's Big Five banks. It serves over 25 million customers globally with assets of approximately $1.5 trillion as of January 31, 2026, and trades on the Toronto and New York stock exchanges under the symbol BNS.",
      "supports": "legitimate",
      "url": "https://www.scotiabank.com/content/dam/scotiabank/corporate/documents/corporate-profile.pdf"
    },
    {
      "source": "LinkedIn",
      "finding": "Scotiabank, as a major global financial institution, has a verifiable company page on LinkedIn with a significant number of listed employees. (A general search for 'Scotiabank LinkedIn' confirms this, though a direct company page URL was not explicitly extracted from the provided snippets, a company of this size invariably maintains such a presence. The 'Analyst Coverage' snippet also mentions Scotiabank analysts, implying a professional network presence.)",
      "supports": "legitimate",
      "url": "https://www.linkedin.com/company/scotiabank"
    },
    {
      "source": "Indeed.com (Employee Reviews)",
      "finding": "Indeed.com features thousands of employee reviews for Scotiabank, with detailed ratings on work-life balance (3.7/5), pay and benefits (3.6/5), and culture (3.7/5). Recent reviews are from May 2026.",
      "supports": "legitimate",
      "url": "https://www.indeed.com/cmp/Scotiabank/reviews"
    },
    {
      "source": "PR Newswire",
      "finding": "Scotiabank regularly publishes news and press releases on PR Newswire, including announcements about financial results (e.g., Q2 2026 results scheduled for May 27, 2026), acquisitions, and corporate initiatives.",
      "supports": "legitimate",
      "url": "https://www.prnewswire.com/news-releases/scotiabank-news-and-press-releases-filter/?topics=scotiabank"
    },
    {
      "source": "AI News / Investment Executive / Fintech.ca",
      "finding": "Recent news from April 2026 highlights Scotiabank's launch of 'Scotia Intelligence,' a unified enterprise AI platform designed to empower employees with secure AI capabilities, including 'AI-powered coding assistance' for technical teams. This demonstrates significant investment in technology and digital transformation.",
      "supports": "legitimate",
      "url": "https://ainews.com/2026/04/14/canadas-scotiabank-preps-for-its-ai-future/"
    },
    {
      "source": "Scotiabank Canada (Artificial Intelligence and Machine Learning Page)",
      "finding": "Scotiabank's website has a dedicated section for Artificial Intelligence and Machine Learning, discussing their commitment to data ethics, partnerships, and careers in customer insights, data & analytics. This directly supports the need for roles like 'Software Engineer' within their digital strategy.",
      "supports": "legitimate",
      "url": "https://www.scotiabank.com/ca/en/personal/advice-centre/artificial-intelligence-machine-learning.html"
    },
    {
      "source": "Job Data (Provided Contact Info)",
      "finding": "The provided job application link (https://jobs.scotiabank.com/talentcommunity/apply/601786217/?locale=en_US) itself points to a legitimate Scotiabank careers portal, reinforcing the company's active recruitment for relevant roles.",
      "supports": "legitimate",
      "url": "https://jobs.scotiabank.com/talentcommunity/apply/601786217/?locale=en_US"
    }
  ],
  "riskScore": 0,
  "qualityScore": 100,
  "analysis": "Company verified. Quality score 100/100 based on external presence.",
  "citations": [
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFzA7DzPw5bJmmVFRm4ONGGUTQ_QmJakIxMrbIamB8KkKKp6RFr-CgvzytX4LlXJs6UkO3q8aFwb6Ugr-CXxa2PAIbLAMDVPc0imqzzICKiy4X-LR7GON4Hyd0CHaXT-5g2WO0=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFMTY8E56q4cCc9LowFirkh5kCNE0fkkKq20Yukj6O-mkzrrSpxEUNjHkkfGXn6baJ1xt1twIDgb_DDxviEZjW0C-6e-tBKVUf0nPKEKUk48lYRz6yMhHWz9a48pQXEUaBvczqTbkOqCWH0mIwc6fmtNjXOSL9QLXLRqr4NTxBp_3C5o2Y=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG5_FrQlMLkjq4_ezetqXbk6FEiT6zttYhxtYGcyMq8VQ56VuOX917FoUfHN5Od5mwhwAfcPP1TKYrc-IJ3iTtYKQgwGChehP_bgtttlVQrCxo5ti6slWYXlGX2semr26XY9U-2lq2g",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEbVux-SQmsED83ecVbUq2Wq6YmLSV7qFpmkwB5nbuVYrXS_74-yF4Aspu_yio76ZUkE5f2TgvBCSVc6WSbPtwOSyQAfrBuFW7RKDMjtd3vPdJEwY_lxTnBo5NPSTA_gA2kEp_-eD563REF4t_Bl9qKEzq1J6-Z1BVjEwrrsLGnvBy2",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFna0ZkPLSgdWI_pPOLWMeihQVzKucoIn0HG77870gIguDXFm4bYuOFQpXCyQjOHwfoSCIgASpW_SMr8AOWiUws7wsPgGo8nGCGIgmDOOujJTNlyEIouMZRnj_TZsuvC3COOz0mkiQnvA==",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQE_15h6yRwmfsPEHzuOAshPBd8scZffSFuwW77Z_-IiKx0GDoxsfi6oOUd3lsb_J0PiIvgt20A_e4CZsm0A6HkGgZ-3FntCOawMDuUtqWggQQ511kCvolS5gAjEdInOvK073Qx9YXixx0DdvI1FEADuVHDUEr6ohzRIxdIYojSJe5FZOb1yz_0F",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGmH0Id1hgJtCjvsfYztb6ejcGGTOr1o2KHCfKJs39ajqTQHi_oy3XVC16soHVmxGtwUamzpil-1hm9rfwk60XsvW4X5yDsESidG9X24odRKYPCZItfdH6yLhy-nvNxneEl-AZZE7oxSwSD1MLyy3XWEhns-RamGacdprLn79VRmnTw6nykmZE=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHaRnaFAU3bqxzy72pWUAGKq-YGaSocjJMvzEJcPrNTSEeGln5yEiFOtXHCzQGUo5SZOpHGbD1EhNKG1fvsggrM7T1ZLSxX7LllGZop0I4IJeHZBZdppbm30AN71-JfMyBX_OfhnDk=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFgoqW9vULpVIHKYhzFQ51ZgrnxrYz0065DFuLzqe4rTv9a-iKkHt3kUE3dbQP0pvKMdIYp9b34wdUqRzg7V58JQzmH3W38xoHvapStKH65TkSQkjAbFaHQMYBOlb6hP1GH0hvOc6nznws2ByP-3fk4O-H2M1zEJBAl",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGcJ72UlGAU93jCbYvaAmpOXDrOJtDcFUi6HTIQ3u1UPj0l8vKnP_i2zn37l3wm6Wgi81kNQ5Ixhg_WQqHa6VZawGrG8ke23hPDBfA-6IqLwMWgdHXVGn9GjQXzgzBYc8XRgXlaB0v4za_vTfHa",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFb10SvWXs9bQr4RofK2MqkqE2qwUJR9SMT6oA9IgOmsQsxSRVB-nEghi6KMCs5AIXhqrGUd1PmTyike6IBdCQLZamWvzQojitXSbOB-enq-6lN8C4FaG_X19kQ22IuhRmHhFv0Wgk0_2TV-OBSPIcLNW4llPghX-0cEF2mXwByukB7ihMab6iRs9aeG-EJ1WsHW6GHWMEZQrZbW7qUwFNcsjZkF6Gb5A==",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHQ-ZIheV2zPLddt_xFhpdq3fko_pa9ltbO-u3ARoXtL5hHBdXfZr_zi64X0R_lBPv9AUu13HCXMM2NjyhR24tiajksnWPAXce1jiM4PnTVk7rT9_z5hRQrHfScKLw8U3r1JGrYL0Gl597Ym-Hzv_FDUqXSNw==",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG_tbeFzaujjT6C7TgLRQulbrH-jEXc5OGaKQJJBeWBCr2d9JUo_TDDglr9RoEUtsNA9iIhr24nALwJV7g79_GmM4MdoosGcHrYsWq-03old0M5t_piNuwwzxUs7rOeIKxvMN8QJJmICWLWd4G3eu2lkWY-Iios_wn8L3AeJ52To_IlnS4_AewHxvkWDFmqJkS0",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQE4q71ccxdmkIvAp75OwYShbWYLhZgx_9V3RaQRibt-ckn6dkAqBYUcqvceu8ZSziGblD6ZAr_sasNPoktPUlQFKSiyIz6_PSUi_hVwMh-hvyfmpZvq6WKy0I7gSMG8oHkcNKueA7yWVckKfxAfY7hhFRJTggMlW0oNc4yYvEcww3F7QpV51JBrQJc9HAYtMIQ1jX1bFRkcP_8uCo8sxjHTlqJCiWMFCCDWEBFIM5JgWYpDbJm_tJ0LPYgm9BiMiDqMkCWe7VQ9dKKV7xGTVsAuoYXQ1qsJHMmrtJ9p",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHZ81bKFYuss2QEoN9mm2G0UfDcNeDQmK5CZwlvq5jr--F37J3g-nUYpgzx4AA2-PnMRuDWu9B_Mg1MnrEPAakCHQHRKjxlvtB9_xCHmqUiK6hP4mRy9ywnaWqXSyaKclfgoIVbYNeoyk_-q8h1YhVW-ci7gpKfMYG6j3BQjF_Y7J5rRnYR6abHpqwz47VclbpuP-FtBp5jPrxwyBPfsdwVH6dul0uMiM50vVrAW21U-dnp1FOAXXQR2rqXHjzIGCbc3R7fuZ-AL7cIa8kALKTr",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEmRh49us6_8chkp0ctklW9vZMxh323nAOob5BtDQoBoNxPLAQkcL9bj9GDh6DbkQgbQZ9o-pW_RO9xZJ5MPcbegIqzLgWL5venrv1t481p9d7e_kBW3vi9LH0K0hWIyac2vbXaGU2cdk3Dfammjg==",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQF8jM77eaxtJA_jCFIQ_fWHtZUfydmayeLY94EqKgAPryGABht0Cf9XHPHNNhfRsY7-RTro4ztNFV_mmzPedRvkW03KPiNPcAmHKhIAXNNsubsxDJZLxu6KdegJmAzQWeZXzWeGm0YTFn9UxgDnGWh-zp_RrIC3I_wQjzReQNVxChrT",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQG7F70rCddGEHe8Ou6aj_P5obpikhzoJoLqemUIWG19snLb__98SBT6C5ijLmbIKX81uSVv5U7E04szI2kPeg8B6GeZu9r5g-0BMId9V6hc7MdDj79PGtjxR6x3AJ-QacsyaHPn8m48TaJf8puMeZPKdNbyeqcivNxFYxfN8rEgtY3j0XODP4nIEHfbycV5ReAR-lsqRPf31uz_EKbkBrg5zM_f958yjGmMg5uiJBe4aA==",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFWf0HtyjBvxD32zeT0AUJofRs1HWFLjZx4Ewd02kFJ4dsVED4JhQ92OOwx4Pooo5o5tckyjltrNSv7_pHQhHkipVmokzuOmwvLIjQk8YMFP7fO0Ov7-6bFJV8efFjlZN4gU23etRTUXJG8kfQ0AQ3FlEtyQdUezxWqX5YFWDiy2yw7bltnUVNcJsQFzrDOyBHxj1TLlUCAaH7OY6-nSfSLKMAMRwXsmvz1WCsm",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFNJbiGycGYzWlDo9rUiUxgSgjTi8edCmTN8ovaZ2HmyOe6drRSrFQaSYXFayw7An3WM8ky3MDdHIKCe7WHrEwUj9dWsgpOBkyQITjSr6RoxO8qVhgpMJwB-LjTddUCzOa2twQNqUEbD0I_uxDWnl0TzgfQfUaWN9toWMQssbajYt07LiAo8QQVrm0q8Qnoh_6BDqNWztIS",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHzPh7MhyeTfwcmjgn8LweUu2BwL3P9VJ52DarbasY6aHnLXpiF5IlWWDs3giQrasoZnaYQaU58kdJF2q6a5ch_aBImJwPi-3AG-hmH-O04BoszZ2gM-GU4hD5AW9EhsZ9GaGM8PIsI7Y5cfric-A9zS3hw_Ck_uKjKyt930sSTVXYzKgd-NudlQ8IXY6hjzsKKG3GMnBg=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHjDci0pHopwThwvcWoksPXtETkLeODYA0vq-eIWUxsrqp3yh7A0J72UnBZ7hcsBpixblGkeDZ_6f88O8NwBhXZn5GUUgJdyannhP8TlGh2lyUnR1o_UmbibXqe5CPEEKASS8SibL3LDsWdPpFllAI-eUk-b2od0hkCybfO4SNRJA9_yXNz3yUFhEn1pFzyDwjd-4kO8Jqi_1mkPY-EMLiaKaQQ10Hv4g==",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFvYcmRT2kq4Jb1Af9Nr_7ypW6bXaQXs--l7_JXV2UuqbE2_tvmedRdhaokUdmtv5G8eAcAKAb4qdcVPYatwzzAORfrrJak7j2hpkkEsmvprirFYF2FHRzs4TjDRyUQNZZOkeXXeEuyJvdtDyw44fM0VJFshw8eDvstxQwFBACYilyRc8biv814l2sefe6qXDzrOl7McWSd2IMyFK-EhwleD4a3aV263GrQh-iI1i-7dzAgH--VGWd1DTwkZgluiyMAj_9FL0qvb-MInKblfWtg9weCx1Y=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQFwueaKQJdTXdIkTVFwROy6NzoIwXDWbljHM4-McGM5buapbZujAPPVUqHggFFcxPtur8f6aQBcknMaszgHVnM4kHNnRDT2TsqUAor8TmnOTmxoCJPAxl5NQHSnDkATmWnfrDIaKepVYR2jPZHGJngLq_A6wk4Swk031c85nX6RGHqhZFzGvcA7yye2mNrI3tGBsBPh36e_RGp45LPCKbcs9FwI-quyL2Gu"
  ]
};

export const MOCK_OPPORTUNITY = {
  "reasoningSteps": [
    "Analyzed the 'Salary Text' which is null, indicating no compensation is provided in the job description.",
    "Without explicit compensation, it's impossible to determine if the pay is above median, too good to be true, or a low stipend gig.",
    "Reviewed the 'Title', 'Requirements', and 'Description' for keywords related to remote work status, geographical restrictions, or in-office requirements.",
    "No explicit mention of '100% remote', 'remote anywhere', or similar language was found.",
    "No geographical restrictions (e.g., 'US only', 'PST timezone') were mentioned.",
    "No in-office or travel requirements were found in the provided text."
  ],
  "isAboveMedian": false,
  "isTooGoodToBeTrue": false,
  "isLowStipendGig": false,
  "is100PercentRemote": false,
  "hasGeoRestriction": false,
  "hasInOfficeRequirement": false,
  "compensationParityWithRemoteMarket": "unknown",
  "evidence": [
    {
      "source": "Compensation",
      "finding": "Salary Text is null; no compensation information provided.",
      "supports": "neutral"
    },
    {
      "source": "Remote Status",
      "finding": "The job description does not explicitly state '100% remote' or 'remote anywhere'.",
      "supports": "neutral"
    },
    {
      "source": "Location Requirement",
      "finding": "No geographical restrictions (e.g., country, timezone) are mentioned in the job description.",
      "supports": "neutral"
    },
    {
      "source": "In-Office/Travel Requirement",
      "finding": "No hidden in-office or travel requirements are mentioned in the job description.",
      "supports": "neutral"
    }
  ],
  "isGenuineRemote": false,
  "riskScore": 0,
  "qualityScore": 50,
  "analysis": "Fair compensation."
};

export const MOCK_FOOTPRINT = {
  "reasoningSteps": [
    "Checked the 'Contact Info Provided' field. It contains a URL (https://jobs.scotiabank.com/talentcommunity/apply/601786217/?locale=en_US) rather than a direct email address. The domain of the URL (jobs.scotiabank.com) is a subdomain of the 'Target Domain Checked' (scotiabank.com), which matches the 'Company Claimed'. No free email was detected.",
    "Evaluated the 'Domain Age (Days)'. The domain is 11001 days old.",
    "Checked the 'WHOIS Privacy Enabled' status, which is reported as 'false'."
  ],
  "isFreeEmail": false,
  "isPrivacyProtected": false,
  "evidence": [
    {
      "source": "Contact Info",
      "finding": "Contact is provided as a URL (https://jobs.scotiabank.com/talentcommunity/apply/601786217/?locale=en_US) on a subdomain matching the claimed company, not a direct email. No free email provider was used.",
      "supports": "legitimate",
      "url": "https://jobs.scotiabank.com/talentcommunity/apply/601786217/?locale=en_US"
    },
    {
      "source": "Domain Age",
      "finding": "Domain is 11001 days old, significantly older than the 3-year threshold (1095 days) for legitimacy.",
      "supports": "legitimate"
    },
    {
      "source": "WHOIS",
      "finding": "WHOIS privacy is not enabled.",
      "supports": "legitimate"
    }
  ],
  "domainAgeDays": 11001,
  "riskScore": 0,
  "analysis": "Domain age evaluated (11001 days)."
};

export const MOCK_PATTERN = {
  "reasoningSteps": [
    "Evaluated the job title, requirements, and description, which clearly define a professional Software Engineer role with specific technical skills.",
    "Compared the job listing details against the characteristics of known scam templates.",
    "Found no indicators for reshipping, advance fee, data entry pyramid, identity theft, or MLM scams.",
    "Confirmed the application URL leads to a legitimate career portal for a well-known financial institution (Scotiabank).",
    "Concluded that the job listing aligns with a standard, legitimate corporate position."
  ],
  "scamTypeMatched": "none",
  "confidence": "high",
  "evidence": [
    {
      "source": "Job Title",
      "finding": "Software Engineer",
      "supports": "legitimate"
    },
    {
      "source": "Job Description",
      "finding": "Develop clean, maintainable code using .NET, C#, Java, React. Build REST APIs and microservices. Collaborate in agile teams, apply modern cloud and DevOps practices.",
      "supports": "legitimate"
    },
    {
      "source": "Contact Info",
      "finding": "https://jobs.scotiabank.com/talentcommunity/apply/601786217/?locale=en_US",
      "supports": "legitimate",
      "url": "https://jobs.scotiabank.com/talentcommunity/apply/601786217/?locale=en_US"
    }
  ],
  "riskScore": 0,
  "analysis": "No known scam patterns matched."
};

export const MOCK_ADVERSARIAL = {
  "reasoningSteps": [
    "First, I searched Google for 'Scotiabank software engineer scam' and 'Scotiabank job fraud' to identify any known fraudulent activities related to job listings at the company.",
    "Next, I looked for official Scotiabank warnings or statements regarding recruitment scams to understand their stance and the red flags they advise job seekers to watch out for.",
    "Finally, I reviewed community discussions and reports of specific Scotiabank job scams to gather concrete examples and corroborate the findings from official sources."
  ],
  "challengeDirection": "arguing_suspicious",
  "arguments": [
    {
      "claim": "Scotiabank is a frequent target for job recruitment scams, including those for IT and 'Software Engineer' roles.",
      "evidence": "Scotiabank explicitly warns job seekers about fraudsters impersonating their recruiters, often targeting individuals with offers for IT positions. There have been specific reports of fake IT job offers at 'Scotiabank Eglinton East Campus' circulated by multiple recruiting agencies that were confirmed to be non-existent upon in-person inquiry.",
      "strength": "strong"
    },
    {
      "claim": "The methods often used in Scotiabank job scams, such as unsolicited contact via social media/text and deviation from standard recruitment processes, are significant red flags.",
      "evidence": "Scotiabank's own advisories highlight red flags like unsolicited messages through WhatsApp, text, or social media, recruiter emails from free accounts, incorrect grammar, interviews conducted on WhatsApp, and requests for sensitive personal information or money before hiring. They state that legitimate communications do not occur outside their internal telephone, e-mail, and video-conferencing systems.",
      "strength": "strong"
    },
    {
      "claim": "Fake Scotiabank job offers often promise unusually high pay for minimal effort or involve payment in cryptocurrency, which are common scam indicators.",
      "evidence": "Scotiabank and the Canadian Anti-Fraud Centre warn that fake job offers are 'always extremely high paying for minimal effort' and are often work-from-home. They also note the use of cryptocurrency in some scams, where targets are asked to convert funds into untraceable digital currency.",
      "strength": "moderate"
    }
  ],
  "challengeSucceeded": true,
  "confidenceAdjustment": -15,
  "analysis": "Significant evidence suggests a high risk of fraudulent Scotiabank 'Software Engineer' job listings.",
  "citations": [
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEddgwNuU8u9mgOXrDjtVQxqGcepSOMy1D6ga3N-jGVkb9AgrhImD5q-3kYqtpJI7VkB124eq80U-LI9tBHlTzpAZYeOBsyn76Hb22Aa-qVFNYApKQypF_Nvk6Y6YfiAd1xJXg5K7rc0qtA4rJNkF5-XGTnVNYuJ3SsW2MUch7vjPii9X51Vov9DPc5x-QdCX8STF9zaYorTXM_cLx1fmaHpGL-Sp_XNGaoiD8=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQER6FN7VZ4NuKtJYGQ8Xj-aUuoUkT2_t-BVEetTVj2hvheljc4VSeL0wnKIw5DirToFo-Stc4wd4BeZZWyGJZYT6Ruz_Ou6Yt4J8q4u6VIvL0pg32_mDbT59jfM4N-nSTa7S3vAOMBw4qF8nJ7g16xycLXZto6rt59BjnCv9Tw4ztP_SFMtmZ-gWXwxjUXrtysmNj0=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQHU2MGJ_DfEWSSsEyIV5G8CLfmTXb0nlQtCyjnGvRzMvBB0ZY8VnVlIp7-3qrF8wRPQFOt59edrO5QevN_I3I_cF-BAa59JSr9wv4LZZm_U0E70_Ne-rAV46RJPQ9CnyR-xqgadd27eubFAZGjIt1klZvnwiIs_8xcefx5j5JWIIihNPjhvBsZvVTcGV_9zQqLoSuPRGNK3cZ2WSxlpc5q6ip1fikdFr5Y5A5ogs8y30alUocpo",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQH4XyTXz4gVyuLz6ZnhuHHaImF6M2qb4MvnRW_csVdSzINJ6V63tTwg2yIA-etiARsiP4QOzzvnYBNuMwaWQc4UiPG9y5CjH-QK0djbzYIfVGJuR_rCbpeIf3wuBRjD-sijYB7L5KfHLidmGTLLhznMzDHXkX1BK-BkfA==",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQGljGnek-OWvUtzcQ7sWC_Gc3XRgdKVQLp9C6HzKFfUz8kbQQ3qGL8613-wCbRNGsIyntTW8-cihmEG0NiJEwftOdrPb0tmQZCD02By5pq-P4vfPUi-jwvOIlHIUa9gCCY8FDI48ZRZctPOhisLE7SCJy4wRbQvtptXzg3ZascEY40Tn1gpgZlu8f88DGjn-H37lAw=",
    "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEEDQaTdT63HvO8m5WuwdRfhV_RFYcxitchcioDB8cWnVNeWyb9kND2IIDk-mcOdfiH9V_Dik_e8745yZVSRJnpAxoW-CbZLJlw9iMLm0LodI7_7KXb3UvZS0ahQcSR8azRtZ90N1o1vmvJI32hJ-VsK0pBdrANzJWFrTOgAcHC"
  ]
};

export const MOCK_ACTIVITY = {
  "reasoningSteps": [
    "Checked the job description and contact information for any mention of a specific recruiter or hiring manager. No specific name was found.",
    "Analyzed the provided application link to determine the type of Applicant Tracking System (ATS) used. The URL is 'https://jobs.scotiabank.com/talentcommunity/apply/601786217/?locale=en_US', which points to Scotiabank's official career portal, functioning as a standard corporate ATS.",
    "Concluded that routing through a corporate ATS implies active monitoring by the recruiting team."
  ],
  "hasNamedRecruiter": false,
  "usesStandardATS": true,
  "isActivelyMonitored": true,
  "applicationChannelIsProfessional": true,
  "interviewProcessDescribed": false,
  "numberOfStages": null,
  "jobPosterIdentified": false,
  "posterAppearsCredible": false,
  "applicantDemandSignal": "unknown",
  "evidence": [
    {
      "source": "Description",
      "finding": "No specific recruiter or hiring manager is named in the job description.",
      "supports": "neutral"
    },
    {
      "source": "Contact Info",
      "finding": "The application link (https://jobs.scotiabank.com/talentcommunity/apply/601786217/?locale=en_US) routes to Scotiabank's official career portal, which is a standard corporate Applicant Tracking System.",
      "supports": "legitimate",
      "url": "https://jobs.scotiabank.com/talentcommunity/apply/601786217/?locale=en_US"
    },
    {
      "source": "ATS Link",
      "finding": "The use of a corporate ATS (Scotiabank's job portal) indicates that applications are likely actively reviewed and monitored by the company's recruiting department.",
      "supports": "legitimate",
      "url": "https://jobs.scotiabank.com/talentcommunity/apply/601786217/?locale=en_US"
    }
  ],
  "qualityScore": 70,
  "analysis": "Activity score 70/100 based on recruiter presence and ATS infrastructure."
};
