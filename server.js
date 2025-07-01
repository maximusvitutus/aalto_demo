const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');
const { promisify } = require('util');

const app = express();
const PORT = 3000;

// Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.static('public'));

// Store active jobs and their SSE connections
const jobs = new Map();
const sseConnections = new Map();

// Serve the main form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submission
app.post('/api/submit', (req, res) => {
  const { readers, interests } = req.body;
  
  console.log('='.repeat(50));
  console.log('📝 FORM DATA RECEIVED:');
  console.log('='.repeat(50));
  console.log('👥 Readers:', readers);
  console.log('🔬 Interests:', interests);
  console.log('⏰ Received at:', new Date().toLocaleString());
  console.log('='.repeat(50));
  
  // Generate unique job ID
  const jobId = Date.now().toString();
  
  // Initialize job
  jobs.set(jobId, { status: 'started', progress: [] });
  
  // Run the filtering script with custom data using tsx instead of ts-node
  const scriptProcess = spawn('npx', ['tsx', 'scripts/filteringScript.ts', '--custom', readers, interests, '--job-id', jobId], {
    stdio: 'pipe'
  });
  
  // Capture stdout for progress updates
  scriptProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('📤 Script output:', output);
    
    // Parse progress signals
    if (output.includes('PROGRESS:')) {
      console.log('🎯 Found PROGRESS signal in output');
      const progressLine = output.split('\n').find(line => line.includes('PROGRESS:'));
      console.log('📋 Progress line:', progressLine);
      
      if (progressLine) {
        const parts = progressLine.split('PROGRESS:')[1].split('|');
        console.log('🔧 Split parts:', parts);
        
        const step = parts[0]?.trim();
        const message = parts[1]?.trim();
        
        console.log('📊 Sending progress update:', { step, message });
        sendProgressUpdate(jobId, step, message);
      }
    }
    
    // Parse UI results
    if (output.includes('UI_RESULTS:')) {
      console.log('🎨 Found UI_RESULTS signal in output');
      const resultsLine = output.split('\n').find(line => line.includes('UI_RESULTS:'));
      
      if (resultsLine) {
        try {
          const resultsJson = resultsLine.split('UI_RESULTS:')[1].trim();
          const results = JSON.parse(resultsJson);
          console.log('📋 Parsed UI results:', results);
          
          // Send results to UI
          sendProgressUpdate(jobId, 'results', JSON.stringify(results));
        } catch (error) {
          console.error('❌ Error parsing UI results:', error);
        }
      }
    }
  });
  
  scriptProcess.stderr.on('data', (data) => {
    console.error('❌ Script error:', data.toString());
  });
  
  scriptProcess.on('close', (code) => {
    console.log(`🏁 Filtering script completed with code ${code}`);
    if (code === 0) {
      sendProgressUpdate(jobId, 'completed', 'All done!');
    } else {
      sendProgressUpdate(jobId, 'error', 'Processing failed');
    }
  });
  
  res.json({ 
    jobId,
    message: 'Processing started with your custom interests!'
  });
});

// SSE endpoint for progress updates
app.get('/api/progress/:jobId', (req, res) => {
  const jobId = req.params.jobId;
  
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Store the connection
  sseConnections.set(jobId, res);
  
  // Send initial message
  res.write(`data: ${JSON.stringify({ step: 'started', message: 'Process initiated' })}\n\n`);
  
  // Clean up on client disconnect
  req.on('close', () => {
    sseConnections.delete(jobId);
  });
});

// Function to send progress updates via SSE
function sendProgressUpdate(jobId, step, message) {
  console.log('📡 Attempting to send SSE update:', { jobId, step, message });
  const connection = sseConnections.get(jobId);
  
  if (connection) {
    console.log('✅ SSE connection found, sending data');
    const data = JSON.stringify({ step, message });
    connection.write(`data: ${data}\n\n`);
    
    if (step === 'completed' || step === 'error') {
      connection.end();
      sseConnections.delete(jobId);
    }
  } else {
    console.error('❌ No SSE connection found for job:', jobId);
    console.log('Available connections:', Array.from(sseConnections.keys()));
  }
}

// Add preset API endpoint
app.get('/api/presets', async (req, res) => {
    try {
        // Execute the getPresets script
        const child = spawn('npx', ['tsx', 'scripts/getPresets.ts'], { stdio: 'pipe' });
        
        let output = '';
        let errorOutput = '';
        
        child.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        child.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        child.on('close', (code) => {
            if (code === 0) {
                try {
                    const presets = JSON.parse(output.trim());
                    res.json(presets);
                } catch (parseError) {
                    console.error('Error parsing presets output:', parseError);
                    console.error('Output was:', output);
                    res.status(500).json({ error: 'Failed to parse presets' });
                }
            } else {
                console.error('Error executing presets script, code:', code);
                console.error('Error output:', errorOutput);
                res.status(500).json({ error: 'Failed to load presets' });
            }
        });
        
    } catch (error) {
        console.error('Error loading presets:', error);
        res.status(500).json({ error: 'Failed to load presets' });
    }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log('📝 Open your browser and go to that URL to test the form!');
  console.log('💡 Form submissions will be logged here in the terminal.');
});