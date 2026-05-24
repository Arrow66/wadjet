# Wedjet LinkedIn Extension Implementation

We are pivoting the UX to be heavily tailored for **LinkedIn Jobs**. Instead of a generic browser action or top-level banner, we will inject a native-feeling Wedjet icon directly into the LinkedIn job details card.

## Proposed Changes

### 1. Target LinkedIn Exclusively (`manifest.json`)
- Restrict `matches` strictly to `*://*.linkedin.com/jobs/*`.
- Remove the reliance on clicking the browser toolbar icon. Everything will happen directly inside the LinkedIn page.

### 2. Single Page App (SPA) Handling (`content.js`)
LinkedIn loads jobs dynamically without refreshing the page.
- We will implement a `MutationObserver` to watch the DOM for changes.
- Every time you click a new job in the list and the right-hand "Job Details" pane updates, our script will detect the new job title (`.job-details-jobs-unified-top-card__job-title`).
- It will instantly query our backend: `GET /api/v1/jobs/check` to see if we have evaluated this new URL.

### 3. Inline Icon Injection
We will inject a Wedjet Eye icon directly next to the LinkedIn Job Title.
- **State A: Already Evaluated**: If the backend has scores, the icon will glow green/gold. Clicking it will pop open a small, beautiful tooltip right there on the page, showing the Trust Score and Quality Score.
- **State B: Not Evaluated**: The icon will appear neutral/gray, indicating it's ready for deep analysis. Clicking it will:
  1. Extract the raw text of the LinkedIn job pane.
  2. Send it to the backend's `/pre-cache` endpoint.
  3. Open a new tab to our Web App (`localhost:5173/?url=...`) to start the visual investigation.

### 4. Background Messaging (`background.js`)
- Remove the `chrome.action.onClicked` listener (to fix the accidental triggering you experienced).
- Add a new message listener `PRE_CACHE_AND_NAVIGATE`. When the content script sends the extracted DOM text, the background script will `POST` it to our backend and open the new tab.

### 5. Frontend Safety Check
- You mentioned the web app showed "random results". This happens if the backend graph gets confused or if mock data bleeds in. I will ensure that the Web App safely consumes the `?url=` parameter and reliably triggers the *actual* live agents without breaking existing workflows.

## Verification Plan
1. Open a LinkedIn Job search page.
2. Click through various jobs in the left sidebar.
3. Verify the Wedjet icon appears next to the title in the right pane for every job.
4. Click an unevaluated job's Wedjet icon -> verify it redirects to the app and accurately streams the investigation.

## User Review Required
Does this native, inline LinkedIn integration align with your vision? It will feel like Wedjet is built directly into LinkedIn!
