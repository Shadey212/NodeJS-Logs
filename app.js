const express = require('express');
const { Server } = require('socket.io');
const http = require('http');
const faker = require('faker');
const { createLogger } = require('./logtail.config');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

let generating = false;

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const generateLogs = async () => {
  const logger = createLogger();
  const httpMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

  while (generating) {
    try {
      const method = faker.random.arrayElement(httpMethods);
      const url = faker.internet.url();
      const status = faker.random.arrayElement([200, 201, 400, 404, 500]);
      const ip = faker.internet.ip();
      const countryCode = faker.address.countryCode();
      const latitude = faker.address.latitude();
      const longitude = faker.address.longitude();
      const userAgent = faker.internet.userAgent();

      const log = {
        method,
        url,
        status,
        ip,
        geolocation: {
          countryCode,
          latitude,
          longitude
        },
        userAgent,
        error: null,
        stack: null
      };

      if (status >= 400) {
        log.error = faker.random.words();
        log.stack = `Error at ${faker.random.arrayElement(['functionA', 'functionB', 'functionC'])} in ${faker.system.fileName()} line ${faker.datatype.number({ min: 1, max: 100 })}`;
      }

      if (status >= 500) {
        logger.fatal(log);
      } else if (status >= 400) {
        logger.error(log);
      } else if (status >= 300) {
        logger.warn(log);
      } else if (status >= 200) {
        logger.http(log); // Using .http method for http status codes
      } else {
        logger.info(log);
      }

      if (status < 300) {
        log.debugMessage = faker.lorem.sentence();
        logger.debug(log);
      }

      // Let's add more log levels
      logger.verbose({ message: faker.lorem.sentence() });
      logger.silly({ message: faker.lorem.sentence() });
      logger.trace({ message: faker.lorem.sentence() });

      io.emit('log');

      // Add delay here
      await delay(50); // 50ms delay
    } catch (error) {
      console.error('Error generating logs:', error);
      generating = false;
    }
  }
};

io.on('connection', (socket) => {
  socket.on('start', () => {
    if (!generating) {
      generating = true;
      io.emit('log');
      generateLogs();
    }
  });

  socket.on('stop', () => {
    generating = false;
    io.emit('log');
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server listening on port 3000');
});
