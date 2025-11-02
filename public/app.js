// WebSocket connection
const socket = io();

// DOM Elements
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const scrapingMethodSelect = document.getElementById('scraping-method');
const concurrencyInput = document.getElementById('concurrency');
const statusRunning = document.getElementById('status-running');
const statusScraped = document.getElementById('status-scraped');
const statusMatches = document.getElementById('status-matches');
const statusRuntime = document.getElementById('status-runtime');
const progressBar = document.getElementById('progress-bar');
const logsContainer = document.getElementById('logs-container');
const clearLogsBtn = document.getElementById('clear-logs-btn');
const loadResultsBtn = document.getElementById('load-results-btn');
const generateTablesBtn = document.getElementById('generate-tables-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const resultsContainer = document.getElementById('results-container');

// State
let startTime = null;
let runtimeInterval = null;

// Event Listeners
startBtn.addEventListener('click', startCrawler);
stopBtn.addEventListener('click', stopCrawler);
clearLogsBtn.addEventListener('click', clearLogs);
loadResultsBtn.addEventListener('click', loadResults);
generateTablesBtn.addEventListener('click', generateTables);
exportCsvBtn.addEventListener('click', exportCSV);

// WebSocket Events
socket.on('status', (status) => {
    updateStatus(status);
});

socket.on('log', (log) => {
    addLog(log);
});

// Functions
async function startCrawler() {
    const config = {
        scrapingMethod: scrapingMethodSelect.value,
        maxConcurrency: parseInt(concurrencyInput.value)
    };

    try {
        const response = await fetch('/api/start', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ config })
        });

        const result = await response.json();

        if (response.ok) {
            addLog({
                type: 'success',
                message: '✅ Crawler started successfully',
                timestamp: new Date()
            });
            startBtn.disabled = true;
            stopBtn.disabled = false;
            startRuntime();
        } else {
            addLog({
                type: 'error',
                message: `❌ Failed to start: ${result.error}`,
                timestamp: new Date()
            });
        }
    } catch (error) {
        addLog({
            type: 'error',
            message: `❌ Error: ${error.message}`,
            timestamp: new Date()
        });
    }
}

async function stopCrawler() {
    try {
        const response = await fetch('/api/stop', {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok) {
            addLog({
                type: 'warning',
                message: '⚠️ Crawler stopped by user',
                timestamp: new Date()
            });
            startBtn.disabled = false;
            stopBtn.disabled = true;
            stopRuntime();
        } else {
            addLog({
                type: 'error',
                message: `❌ Failed to stop: ${result.error}`,
                timestamp: new Date()
            });
        }
    } catch (error) {
        addLog({
            type: 'error',
            message: `❌ Error: ${error.message}`,
            timestamp: new Date()
        });
    }
}

function updateStatus(status) {
    // Update running status
    if (status.running) {
        statusRunning.innerHTML = '<span class="badge badge-running">Running</span>';
        startBtn.disabled = true;
        stopBtn.disabled = false;
        if (!startTime) {
            startRuntime();
        }
    } else {
        statusRunning.innerHTML = '<span class="badge badge-idle">Idle</span>';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        stopRuntime();
    }

    // Update stats
    statusScraped.textContent = status.scrapedListings || 0;
    statusMatches.textContent = status.matches || 0;

    // Update progress bar (estimate)
    const progress = Math.min((status.scrapedListings || 0) * 10, 100);
    progressBar.style.width = `${progress}%`;
}

function addLog(log) {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${log.type}`;

    const timestamp = new Date(log.timestamp);
    const timeStr = timestamp.toLocaleTimeString();

    logEntry.innerHTML = `
        <span class="log-time">[${timeStr}]</span>
        <span class="log-message">${escapeHtml(log.message)}</span>
    `;

    logsContainer.appendChild(logEntry);
    logsContainer.scrollTop = logsContainer.scrollHeight;

    // Keep max 100 logs
    while (logsContainer.children.length > 100) {
        logsContainer.removeChild(logsContainer.firstChild);
    }
}

function clearLogs() {
    logsContainer.innerHTML = '';
    addLog({
        type: 'info',
        message: 'Logs cleared',
        timestamp: new Date()
    });
}

function startRuntime() {
    startTime = Date.now();
    if (runtimeInterval) {
        clearInterval(runtimeInterval);
    }
    runtimeInterval = setInterval(updateRuntime, 1000);
}

function stopRuntime() {
    if (runtimeInterval) {
        clearInterval(runtimeInterval);
        runtimeInterval = null;
    }
    startTime = null;
}

function updateRuntime() {
    if (!startTime) return;

    const elapsed = Date.now() - startTime;
    const hours = Math.floor(elapsed / 3600000);
    const minutes = Math.floor((elapsed % 3600000) / 60000);
    const seconds = Math.floor((elapsed % 60000) / 1000);

    statusRuntime.textContent =
        `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

async function loadResults() {
    try {
        addLog({
            type: 'info',
            message: '🔄 Loading results...',
            timestamp: new Date()
        });

        const response = await fetch('/api/results');

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error);
        }

        const results = await response.json();
        displayResults(results);

        addLog({
            type: 'success',
            message: `✅ Loaded ${results.length} comparison result(s)`,
            timestamp: new Date()
        });
    } catch (error) {
        addLog({
            type: 'error',
            message: `❌ Failed to load results: ${error.message}`,
            timestamp: new Date()
        });
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <p>❌ ${error.message}</p>
            </div>
        `;
    }
}

function displayResults(results) {
    if (!results || results.length === 0) {
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <p>No matches found in the comparison.</p>
            </div>
        `;
        return;
    }

    let html = '';

    results.forEach((match, index) => {
        const scoreClass = match.matchScore >= 0.7 ? 'score-high' :
                          match.matchScore >= 0.5 ? 'score-medium' : 'score-low';

        const jabamaPrice = match.jabamaListing.price || 0;
        const jajigaPrice = match.jajigaListing.price || 0;
        const priceDiff = Math.abs(jabamaPrice - jajigaPrice);
        const percentDiff = jabamaPrice > 0 ? ((priceDiff / jabamaPrice) * 100).toFixed(1) : 0;

        html += `
            <div class="match-card">
                <div class="match-header">
                    <div class="match-title">Match #${index + 1}</div>
                    <div class="match-score ${scoreClass}">
                        ${(match.matchScore * 100).toFixed(1)}% Match
                    </div>
                </div>

                <div class="match-details">
                    <div class="detail-section">
                        <h4>🏠 Jabama Listing</h4>
                        <div class="detail-item">
                            <span class="detail-label">Title:</span>
                            <span class="detail-value">${escapeHtml(match.jabamaListing.title)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Location:</span>
                            <span class="detail-value">${escapeHtml(match.jabamaListing.location || 'N/A')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Capacity:</span>
                            <span class="detail-value">${match.jabamaListing.capacity || 'N/A'} guests</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Bedrooms:</span>
                            <span class="detail-value">${match.jabamaListing.bedrooms || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <a href="${match.jabamaListing.url}" target="_blank" class="detail-value">View Listing →</a>
                        </div>
                    </div>

                    <div class="detail-section">
                        <h4>🏡 Jajiga Listing</h4>
                        <div class="detail-item">
                            <span class="detail-label">Title:</span>
                            <span class="detail-value">${escapeHtml(match.jajigaListing.title)}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Location:</span>
                            <span class="detail-value">${escapeHtml(match.jajigaListing.location || 'N/A')}</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Capacity:</span>
                            <span class="detail-value">${match.jajigaListing.capacity || 'N/A'} guests</span>
                        </div>
                        <div class="detail-item">
                            <span class="detail-label">Bedrooms:</span>
                            <span class="detail-value">${match.jajigaListing.bedrooms || 'N/A'}</span>
                        </div>
                        <div class="detail-item">
                            <a href="${match.jajigaListing.url}" target="_blank" class="detail-value">View Listing →</a>
                        </div>
                    </div>
                </div>

                ${jabamaPrice > 0 || jajigaPrice > 0 ? `
                    <div class="price-comparison">
                        <div class="price-item">
                            <div class="price-label">Jabama Price</div>
                            <div class="price-value ${jabamaPrice > jajigaPrice ? 'price-expensive' : 'price-cheaper'}">
                                ${formatPrice(jabamaPrice)} تومان
                            </div>
                        </div>
                        <div class="price-item">
                            <div class="price-label">Jajiga Price</div>
                            <div class="price-value ${jajigaPrice > jabamaPrice ? 'price-expensive' : 'price-cheaper'}">
                                ${formatPrice(jajigaPrice)} تومان
                            </div>
                        </div>
                    </div>
                    ${priceDiff > 0 ? `
                        <div class="price-difference">
                            💰 Price Difference: ${formatPrice(priceDiff)} تومان (${percentDiff}%)
                            ${jabamaPrice < jajigaPrice ? '✅ Cheaper on Jabama' : '✅ Cheaper on Jajiga'}
                        </div>
                    ` : ''}
                ` : ''}

                ${match.differences && match.differences.length > 0 ? `
                    <div style="margin-top: 15px; padding: 15px; background: var(--background); border-radius: 8px;">
                        <strong>Key Differences:</strong>
                        <ul style="margin-top: 10px; padding-left: 20px;">
                            ${match.differences.map(d => `<li>${escapeHtml(d)}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    });

    resultsContainer.innerHTML = html;
}

async function generateTables() {
    try {
        addLog({
            type: 'info',
            message: '📊 Generating comparison tables...',
            timestamp: new Date()
        });

        const response = await fetch('/api/generate-tables', {
            method: 'POST'
        });

        const result = await response.json();

        if (response.ok) {
            addLog({
                type: 'success',
                message: '✅ Tables generated successfully (full, compact, CSV)',
                timestamp: new Date()
            });
        } else {
            throw new Error(result.error);
        }
    } catch (error) {
        addLog({
            type: 'error',
            message: `❌ Failed to generate tables: ${error.message}`,
            timestamp: new Date()
        });
    }
}

async function exportCSV() {
    try {
        window.open('/api/table/csv', '_blank');
        addLog({
            type: 'success',
            message: '✅ CSV export opened in new tab',
            timestamp: new Date()
        });
    } catch (error) {
        addLog({
            type: 'error',
            message: `❌ Failed to export CSV: ${error.message}`,
            timestamp: new Date()
        });
    }
}

// Utility functions
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatPrice(price) {
    if (!price) return '0';
    return price.toLocaleString('en-US');
}

// Initialize
addLog({
    type: 'info',
    message: '🚀 Dashboard ready. Configure settings and start the crawler.',
    timestamp: new Date()
});

// Auto-load results if available
setTimeout(() => {
    fetch('/api/results')
        .then(response => {
            if (response.ok) {
                return response.json();
            }
        })
        .then(results => {
            if (results && results.length > 0) {
                displayResults(results);
                addLog({
                    type: 'info',
                    message: `📊 Auto-loaded ${results.length} previous result(s)`,
                    timestamp: new Date()
                });
            }
        })
        .catch(() => {
            // Silently fail - no previous results
        });
}, 500);
