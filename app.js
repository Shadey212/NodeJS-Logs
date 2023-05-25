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

let generating = false;
let logCount = 0;

const generateLogs = async () => {
  const logger = createLogger();
  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  while (generating) {
    const method = faker.random.arrayElement(httpMethods);
    const url = faker.internet.url();
    const status = faker.random.arrayElement([200, 201, 400, 404, 500]);
    const ip = faker.internet.ip(); // Fake IP
    const city = faker.address.city(); // Fake city
    const latitude = faker.address.latitude(); // Fake latitude
    const longitude = faker.address.longitude(); // Fake longitude
    const userAgent = faker.internet.userAgent(); // Fake user agent
    const log = {
      method,
      url,
      status,
      ip,
      city,
      geolocation: {
        latitude,
        longitude
      },
      userAgent,
      error: null,
      stack: null
    };
    
    if (status >= 400) {
      log.error = faker.random.words();
      log.stack = `Error at ${faker.random.arrayElement(['functionA', 'functionB', 'functionC'])} in ${faker.system.fileName()} line ${faker.random.number(100)}`; // More detailed fake stack trace
    }

    // Send log to Logtail with the appropriate level
    if (status >= 500) {
      await logger.critical(log); // Custom log level: critical
    } else if (status >= 400) {
      await logger.error(log);
    } else if (status >= 300) {
      await logger.warn(log);
    } else {
      await logger.info(log);
    }

    if (status < 300) { // Debug level logging
      log.debugMessage = faker.lorem.sentence();
      await logger.debug(log);
    }

    io.emit('log'); // Emit log count event

    await new Promise((resolve) => setTimeout(resolve, 100)); // Delay between generating logs
  }
};

io.on('connection', (socket) => {
  socket.on('start', () => {
    if (!generating) {
      generating = true;
      io.emit('log'); // Emit initial log count event
      generateLogs();
    }
  });  

  socket.on('stop', () => {
    generating = false;
    io.emit('log'); // Emit final log count event
  });  
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server listening on port 3000');
});
