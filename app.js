const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const faker = require('faker');
const { createLogger } = require('./logtail.config');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" directory
app.use(express.static('public'));

const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];
let generating = false;
let logCount = 0;

const generateLogs = async () => {
  const logger = createLogger();
  while (generating) {
    const method = faker.random.arrayElement(httpMethods);
    const url = faker.internet.url();
    const status = faker.random.arrayElement([200, 201, 400, 404, 500]);
    const log = {
      method,
      url,
      status,
      error: null,
      stack: null
    };

    if (status >= 400) {
      log.error = faker.random.words();
      log.stack = faker.random.words(5);
    }

    // Send log to Logtail with the appropriate level
        if (status >= 500) {
            await logtail.error(log);
        } else if (status >= 400) {
            await logtail.warn(log);
        } else {
            await logtail.info(log);
        }

    logCount += 1;
    io.emit('log', logCount);
  }
};

io.on('connection', (socket) => {
  socket.on('start', () => {
    if (!generating) {
      generating = true;
      generateLogs();
    }
  });

  socket.on('stop', () => {
    generating = false;
  });
});

const port = process.env.PORT || 3000;
server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});