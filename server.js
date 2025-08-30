const express = require("express");
const http = require("http");

const connectDB = require('./src/config/database');
const cors = require('cors');
const routes = require('./src/routes/index');
const app = express();
const port = process.env.PORT || 3011;
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
connectDB();
// Initialize routes
routes(app);
app.get("/", (req, res) => {
        res.send("Hello World! 10 june 2025 Advising");
});
server.listen(port, async () => {
    
    console.log(`app is running on port`, port);
});