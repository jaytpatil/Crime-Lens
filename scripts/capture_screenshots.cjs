const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

// Potential Chrome / Edge browser paths on Windows
const BROWSER_PATHS = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
];

const executablePath = BROWSER_PATHS.find(p => fs.existsSync(p));
if (!executablePath) {
  console.error("Could not find Chrome or Edge executable.");
  process.exit(1);
}

console.log(`Using browser executable: ${executablePath}`);

const OUTPUT_DIR = path.resolve(__dirname, '..', 'docs', 'screenshots');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Artifact directory
const ARTIFACT_DIR = 'C:\\Users\\Hitashri Patil\\.gemini\\antigravity\\brain\\4f5e92c5-9021-4235-b664-d8931eea9b29\\screenshots';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

const TABS = [
  { id: 'overview', file: '01_overview_dashboard.png', name: 'Overview Dashboard' },
  { id: 'analytics', file: '02_crime_analytics.png', name: 'Crime Analytics' },
  { id: 'hotspots', file: '03_hotspot_explorer.png', name: 'Hotspot Explorer' },
  { id: 'prediction', file: '04_risk_prediction.png', name: 'Risk Prediction' },
  { id: 'evaluation', file: '05_model_evaluation.png', name: 'Model Evaluation' },
  { id: 'pipeline', file: '06_data_pipeline.png', name: 'Data Pipeline' },
  { id: 'viva', file: '07_viva_architecture.png', name: 'Viva and Architecture' }
];

async function captureAll() {
  console.log("Launching headless browser...");
  const browser = await puppeteer.launch({
    executablePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });

  for (const tab of TABS) {
    const url = `http://localhost:5173/#${tab.id}`;
    console.log(`Navigating to ${url} (${tab.name})...`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    // Allow re-rendering, Leaflet tiles, and Recharts animations to settle
    await new Promise(r => setTimeout(r, 2500));

    const outPath = path.join(OUTPUT_DIR, tab.file);
    const artifactPath = path.join(ARTIFACT_DIR, tab.file);

    await page.screenshot({ path: outPath, fullPage: false });
    fs.copyFileSync(outPath, artifactPath);
    console.log(`Saved screenshot: ${tab.file} (${fs.statSync(outPath).size} bytes)`);
  }

  await browser.close();
  console.log("All snapshots captured successfully!");
}

captureAll().catch(err => {
  console.error("Capture error:", err);
  process.exit(1);
});
