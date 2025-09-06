const express = require("express");
const http = require("http");

const connectDB = require('./src/config/database');
const cors = require('cors');
const routes = require('./src/routes/index');
const app = express();
const port = process.env.PORT || 3011;
const server = http.createServer(app);

app.use(cors());

// Debug middleware for JSON parsing
app.use((req, res, next) => {
  if (req.method === 'PUT' && req.path.includes('updateStatus')) {
    console.log('=== DEBUG: Request Details ===');
    console.log('Method:', req.method);
    console.log('Path:', req.path);
    console.log('Content-Type:', req.get('Content-Type'));
    console.log('Raw Body Length:', req.get('Content-Length'));
  }
  next();
});

app.use(express.json({
  verify: (req, res, buf) => {
    if (req.method === 'PUT' && req.path.includes('updateStatus')) {
      console.log('=== DEBUG: Raw Buffer ===');
      console.log('Buffer:', buf.toString());
      console.log('Buffer Length:', buf.length);
    }
  }
}));

// Error handling middleware for JSON parsing
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    console.log('=== JSON PARSING ERROR ===');
    console.log('Error:', error.message);
    console.log('Request Body:', req.body);
    return res.status(400).json({
      success: false,
      message: 'Invalid JSON format',
      error: error.message,
      details: 'Please check your JSON syntax and ensure proper formatting'
    });
  }
  next();
});
connectDB();
// Initialize routes
routes(app);
app.get("/", (req, res) => {
        res.send("Hello World! 10 june 2025 Advising");
});
server.listen(port, async () => {
    
    console.log(`app is running on port`, port);
});