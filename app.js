// app.js
const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const path = require('path');
const ScenarioGenerator = require('./scenarioGenerator');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from /public
app.use(express.static('public'));

// Create our scenario generator
const scenarioGenerator = new ScenarioGenerator(io);

// Start generating logs immediately
scenarioGenerator.start();

io.on('connection', (socket) => {
  socket.on('start', () => {
    scenarioGenerator.start();
    io.emit('log');
  });

  socket.on('stop', () => {
    scenarioGenerator.stop();
    io.emit('log');
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server listening on port 3000');
});