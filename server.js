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
  
  // Generate unique job ID
  const jobId = Date.now().toString();
  
  // Store job info
  jobs.set(jobId, {
    status: 'processing',
    readers,
    interests,
    startTime: new Date(),
    results: null
  });
  
  // TODO: Start your filtering script with custom data
  console.log(`Job ${jobId} started for readers: ${readers}`);
  console.log(`Interests: ${interests}`);
  
  // Simulate processing (replace with actual script execution)
  setTimeout(() => {
    jobs.get(jobId).status = 'completed';
    jobs.get(jobId).results = { message: 'Demo results would go here' };
  }, 5000); // 5 second demo delay
  
  res.json({ 
    jobId, 
    message: 'Processing started! Check back in a few minutes.',
    statusUrl: `/api/status/${jobId}`
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
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Open your browser and go to that URL to test the form!');
});