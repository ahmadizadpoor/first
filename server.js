import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Crawler state
let crawlerProcess = null;
let crawlerStatus = {
  running: false,
  progress: 0,
  totalListings: 0,
  scrapedListings: 0,
  matches: 0,
  logs: [],
  startTime: null,
  config: null
};

// API Endpoints

// Get current status
app.get('/api/status', (req, res) => {
  res.json(crawlerStatus);
});

// Start crawler
app.post('/api/start', (req, res) => {
  if (crawlerStatus.running) {
    return res.status(400).json({ error: 'Crawler is already running' });
  }

  const config = req.body.config || {};

  // Update config file
  try {
    const configPath = path.join(__dirname, 'src', 'config.ts');
    let configContent = fs.readFileSync(configPath, 'utf-8');

    if (config.scrapingMethod) {
      configContent = configContent.replace(
        /scrapingMethod:\s*'[^']*'/,
        `scrapingMethod: '${config.scrapingMethod}'`
      );
    }
    if (config.maxConcurrency) {
      configContent = configContent.replace(
        /maxConcurrency:\s*\d+/,
        `maxConcurrency: ${config.maxConcurrency}`
      );
    }

    fs.writeFileSync(configPath, configContent);
  } catch (error) {
    console.error('Error updating config:', error);
  }

  // Start the crawler
  crawlerStatus = {
    running: true,
    progress: 0,
    totalListings: 0,
    scrapedListings: 0,
    matches: 0,
    logs: [],
    startTime: new Date(),
    config: config
  };

  io.emit('status', crawlerStatus);

  crawlerProcess = spawn('npm', ['run', 'start'], {
    cwd: __dirname,
    shell: true
  });

  crawlerProcess.stdout.on('data', (data) => {
    const log = data.toString();
    console.log(log);
    crawlerStatus.logs.push({ type: 'info', message: log, timestamp: new Date() });

    // Parse progress from logs
    if (log.includes('listings found') || log.includes('Scraped')) {
      const match = log.match(/(\d+)/);
      if (match) {
        crawlerStatus.scrapedListings = parseInt(match[1]);
      }
    }
    if (log.includes('matches found') || log.includes('Potential match')) {
      crawlerStatus.matches++;
    }

    io.emit('log', { type: 'info', message: log, timestamp: new Date() });
    io.emit('status', crawlerStatus);
  });

  crawlerProcess.stderr.on('data', (data) => {
    const log = data.toString();
    console.error(log);
    crawlerStatus.logs.push({ type: 'error', message: log, timestamp: new Date() });
    io.emit('log', { type: 'error', message: log, timestamp: new Date() });
  });

  crawlerProcess.on('close', (code) => {
    crawlerStatus.running = false;
    crawlerStatus.logs.push({
      type: code === 0 ? 'success' : 'error',
      message: `Crawler finished with code ${code}`,
      timestamp: new Date()
    });
    io.emit('status', crawlerStatus);
    io.emit('log', {
      type: code === 0 ? 'success' : 'error',
      message: `Crawler finished with code ${code}`,
      timestamp: new Date()
    });
    crawlerProcess = null;
  });

  res.json({ success: true, message: 'Crawler started' });
});

// Stop crawler
app.post('/api/stop', (req, res) => {
  if (!crawlerStatus.running || !crawlerProcess) {
    return res.status(400).json({ error: 'Crawler is not running' });
  }

  crawlerProcess.kill();
  crawlerStatus.running = false;
  crawlerStatus.logs.push({
    type: 'warning',
    message: 'Crawler stopped by user',
    timestamp: new Date()
  });
  io.emit('status', crawlerStatus);

  res.json({ success: true, message: 'Crawler stopped' });
});

// Get results
app.get('/api/results', (req, res) => {
  const resultsPath = path.join(__dirname, 'output', 'comparison-results.json');

  if (!fs.existsSync(resultsPath)) {
    return res.status(404).json({ error: 'No results found. Run the crawler first.' });
  }

  try {
    const results = JSON.parse(fs.readFileSync(resultsPath, 'utf-8'));
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Failed to read results', details: error.message });
  }
});

// Get comparison table
app.get('/api/table/:format', (req, res) => {
  const format = req.params.format;
  let filename, contentType;

  switch (format) {
    case 'full':
      filename = 'comparison-table.txt';
      contentType = 'text/plain';
      break;
    case 'compact':
      filename = 'comparison-table-compact.txt';
      contentType = 'text/plain';
      break;
    case 'csv':
      filename = 'comparison-table.csv';
      contentType = 'text/csv';
      break;
    default:
      return res.status(400).json({ error: 'Invalid format' });
  }

  const filePath = path.join(__dirname, 'output', filename);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Table not found. Generate it first.' });
  }

  res.setHeader('Content-Type', contentType);
  res.sendFile(filePath);
});

// Generate tables from results
app.post('/api/generate-tables', (req, res) => {
  const generateProcess = spawn('node', ['create-comparison-table.js'], {
    cwd: __dirname,
    shell: true
  });

  let output = '';
  generateProcess.stdout.on('data', (data) => {
    output += data.toString();
  });

  generateProcess.on('close', (code) => {
    if (code === 0) {
      res.json({ success: true, message: 'Tables generated successfully' });
    } else {
      res.status(500).json({ error: 'Failed to generate tables', output });
    }
  });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log('Client connected');
  socket.emit('status', crawlerStatus);

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Crawler UI Server running on http://localhost:${PORT}`);
  console.log(`📊 Open your browser to view the dashboard`);
});
