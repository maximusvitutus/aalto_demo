const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware to parse JSON and serve static files
app.use(express.json());
app.use(express.static('public'));

// Store active jobs (in production, you'd use a database)
const jobs = new Map();

// Serve the main form
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle form submission
app.post('/api/submit', (req, res) => {
  const { readers, interests } = req.body;
  
  // This will show in your terminal/console
  console.log('='.repeat(50));
  console.log('📝 FORM DATA RECEIVED:');
  console.log('='.repeat(50));
  console.log('👥 Readers:', readers);
  console.log('🔬 Interests:', interests);
  console.log('⏰ Received at:', new Date().toLocaleString());
  console.log('='.repeat(50));
  
  // Send response back to browser
  res.json({ 
    message: 'Data received successfully! Check your terminal to see the logged data.',
    receivedData: { readers, interests }
  });
});

// Check job status
app.get('/api/status/:jobId', (req, res) => {
  const job = jobs.get(req.params.jobId);
  
  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }
  
  res.json({
    status: job.status,
    results: job.results
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log('📝 Open your browser and go to that URL to test the form!');
  console.log('💡 Form submissions will be logged here in the terminal.');
});