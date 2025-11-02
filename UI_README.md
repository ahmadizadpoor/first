# Web UI for Jabama vs Jajiga Crawler

A beautiful, modern web interface for controlling and monitoring the listing crawler with real-time updates.

## Features

✨ **Real-time Monitoring**
- Live status updates via WebSocket
- Real-time log streaming
- Progress tracking
- Runtime counter

🎛️ **Easy Configuration**
- Select scraping method (Manual, HTTP, Browser)
- Adjust concurrency settings
- Start/Stop controls

📊 **Results Visualization**
- Beautiful comparison cards
- Side-by-side listing details
- Price comparison with highlights
- Match score indicators
- Key differences analysis

💾 **Export Options**
- Generate comparison tables (Full, Compact, CSV)
- Export to CSV for Excel/Google Sheets
- One-click download

## Quick Start

### 1. Start the UI Server

```bash
npm run ui
```

The server will start on `http://localhost:3000`

### 2. Open Your Browser

Navigate to:
```
http://localhost:3000
```

### 3. Configure & Run

1. **Select Scraping Method:**
   - `Manual` - Test mode with sample HTML files (default)
   - `HTTP` - Direct HTTP requests
   - `Browser` - Puppeteer automation (requires Chrome)

2. **Set Concurrency:**
   - Number of parallel requests (1-10)
   - Default: 3

3. **Click "Start Crawler"**
   - Monitor real-time logs
   - Track progress
   - View matches as they're found

4. **View Results:**
   - Click "Load Results" to see comparison data
   - Beautiful cards showing side-by-side comparisons
   - Price differences highlighted
   - Match scores with color coding

## UI Components

### Control Panel
- **Configuration**: Select scraping method and concurrency
- **Start/Stop**: Control crawler execution
- **Status indicators**: Running/Idle state

### Status Dashboard
- **Status**: Current crawler state
- **Scraped Listings**: Number of listings processed
- **Matches Found**: Potential duplicates discovered
- **Runtime**: Elapsed time since start

### Live Logs
- Real-time log streaming
- Color-coded by type:
  - 🔵 Info (cyan)
  - ✅ Success (green)
  - ⚠️ Warning (yellow)
  - ❌ Error (red)
- Auto-scroll to latest
- Clear logs button

### Results Viewer
- **Match Cards**: Each potential match displayed beautifully
- **Match Score**: Percentage similarity (color-coded)
  - 🟢 High (≥70%): Green
  - 🟡 Medium (50-69%): Yellow
  - 🔴 Low (<50%): Red
- **Side-by-Side Comparison**:
  - Jabama listing details
  - Jajiga listing details
- **Price Comparison**:
  - Visual price indicators
  - Price difference calculation
  - Percentage difference
  - Cheaper option highlighted
- **Key Differences**: List of detected differences

### Export Options
- **Load Results**: Fetch latest comparison data
- **Generate Tables**: Create formatted tables (TXT, CSV)
- **Export CSV**: Download CSV for Excel/Sheets

## API Endpoints

The server exposes these REST API endpoints:

### GET `/api/status`
Get current crawler status
```json
{
  "running": false,
  "progress": 0,
  "scrapedListings": 0,
  "matches": 0,
  "logs": [],
  "startTime": null
}
```

### POST `/api/start`
Start the crawler with configuration
```json
{
  "config": {
    "scrapingMethod": "manual",
    "maxConcurrency": 3
  }
}
```

### POST `/api/stop`
Stop the running crawler

### GET `/api/results`
Get comparison results JSON

### GET `/api/table/:format`
Get formatted table (format: `full`, `compact`, `csv`)

### POST `/api/generate-tables`
Generate all table formats from results

## WebSocket Events

Real-time updates via Socket.IO:

### `status`
Emitted when crawler status changes
```javascript
socket.on('status', (status) => {
  // Update UI with new status
});
```

### `log`
Emitted for each log entry
```javascript
socket.on('log', (log) => {
  // Display new log entry
  // log.type: 'info' | 'success' | 'warning' | 'error'
  // log.message: string
  // log.timestamp: Date
});
```

## Architecture

```
┌─────────────┐
│   Browser   │
│  (Frontend) │
└─────┬───────┘
      │ HTTP/WebSocket
      │
┌─────▼───────┐
│   Express   │
│   Server    │
│  server.js  │
└─────┬───────┘
      │ spawn
      │
┌─────▼───────┐
│   Crawler   │
│  (Node.js)  │
│ dist/index  │
└─────────────┘
```

### Components

1. **Frontend** (`public/`)
   - `index.html` - UI structure
   - `styles.css` - Modern, responsive styling
   - `app.js` - WebSocket client, API calls, UI logic

2. **Backend** (`server.js`)
   - Express server
   - Socket.IO for real-time updates
   - REST API endpoints
   - Crawler process management

3. **Crawler** (`src/`)
   - TypeScript implementation
   - Multiple scraping methods
   - Comparison engine

## Usage Examples

### Manual Mode (Test)
```bash
# 1. Start UI
npm run ui

# 2. Open browser to http://localhost:3000

# 3. Select "Manual" mode

# 4. Click "Start Crawler"

# 5. Watch real-time logs

# 6. Click "Load Results" when done

# 7. See beautiful comparison cards
```

### Browser Mode (Production)
```bash
# 1. Install Chrome (if not already)
npx puppeteer browsers install chrome

# 2. Start UI
npm run ui

# 3. Select "Browser" mode

# 4. Set concurrency to 2-3

# 5. Click "Start Crawler"

# 6. Monitor progress in real-time
```

### Export Workflow
```bash
# 1. Run crawler and get results

# 2. Click "Generate Tables"
#    Creates:
#    - output/comparison-table.txt (detailed)
#    - output/comparison-table-compact.txt
#    - output/comparison-table.csv

# 3. Click "Export CSV"
#    Opens CSV in new tab for download

# 4. Import CSV to Excel/Google Sheets
```

## Customization

### Change Port

Edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

Or set environment variable:
```bash
PORT=8080 npm run ui
```

### Modify Colors

Edit `public/styles.css`:
```css
:root {
    --primary-color: #3b82f6;  /* Blue */
    --success-color: #10b981;  /* Green */
    --danger-color: #ef4444;   /* Red */
    /* ... more colors */
}
```

### Add Custom Metrics

1. Update crawler to emit new metrics
2. Add status field in `server.js`
3. Display in `public/app.js`
4. Style in `public/styles.css`

## Troubleshooting

### Server won't start
```bash
# Check if port is in use
lsof -i :3000

# Kill existing process
kill -9 <PID>

# Or use different port
PORT=8080 npm run ui
```

### Can't connect to WebSocket
- Check browser console for errors
- Ensure server is running
- Try different browser
- Check firewall settings

### Crawler not starting
- Check logs in UI
- Verify configuration
- Ensure TypeScript is compiled: `npm run build`
- Check crawler works standalone: `npm start`

### No results loading
- Verify crawler completed successfully
- Check `output/comparison-results.json` exists
- Look for errors in server logs
- Try clicking "Load Results" again

## Tech Stack

- **Backend**: Node.js, Express, Socket.IO
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Real-time**: WebSocket (Socket.IO)
- **Crawler**: TypeScript, Puppeteer, Cheerio
- **Styling**: Custom CSS with CSS Variables

## Browser Support

- ✅ Chrome/Edge (Latest)
- ✅ Firefox (Latest)
- ✅ Safari (Latest)
- ✅ Mobile browsers

## Performance

- Real-time updates via WebSocket (low latency)
- Efficient log management (max 100 entries)
- Auto-scroll for logs
- Responsive design
- Smooth animations

## Security Notes

⚠️ **Development Server**: This is intended for local development use.

For production deployment:
- Add authentication
- Use HTTPS
- Add rate limiting
- Sanitize all inputs
- Add CORS restrictions
- Use environment variables for secrets

## Next Steps

Want to enhance the UI? Consider:

1. **Authentication**: Add login system
2. **Database**: Store results in DB
3. **Scheduling**: Add cron job support
4. **Analytics**: Add charts and graphs
5. **Notifications**: Email/SMS alerts on completion
6. **Multi-user**: Support multiple concurrent users
7. **History**: View past crawl results
8. **Filters**: Filter/search results
9. **Dark Mode**: Toggle theme

## License

MIT

---

**Happy Crawling! 🚀**

For issues or questions, check the main README.md or create an issue.
