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

const generateLogs = () => {
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
      log.stack = `Error at ${faker.random.arrayElement(['functionA', 'functionB', 'functionC'])} in ${faker.system.fileName()} line ${faker.datatype.number({ min: 1, max: 100 })}`; // More detailed fake stack trace
    }

    // Send log to Logtail with the appropriate level
    if (status >= 500) {
      logger.critical(log); // Custom log level: critical
    } else if (status >= 400) {
      logger.error(log);
    } else if (status >= 300) {
      logger.warn(log);
    } else {
      logger.info(log);
    }

    if (status < 300) { // Debug level logging
      log.debugMessage = faker.lorem.sentence();
      logger.debug(log);
    }

    io.emit('log'); // Emit log count event
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
