// scenarioGenerator.js
const faker = require('faker');
const { createLogger } = require('./logtail.config');

// A small set of test users/products
const USERS = Array.from({ length: 5 }).map((_, i) => ({
  userId: `user_${i + 1}`,
  username: faker.internet.userName(),
  email: faker.internet.email(),
  sessionId: null,
  cart: [],
}));

const PRODUCTS = Array.from({ length: 6 }).map(() => ({
  productId: faker.datatype.uuid(),
  name: faker.commerce.productName(),
  price: faker.commerce.price(),
}));

// Weighted events
const EVENT_WEIGHTS = [
  { event: 'LOGIN',       weight: 0.2 },
  { event: 'BROWSE',      weight: 0.3 },
  { event: 'ADD_TO_CART', weight: 0.25 },
  { event: 'CHECKOUT',    weight: 0.15 },
  { event: 'PAYMENT',     weight: 0.07 },
  { event: 'SHIPPING',    weight: 0.03 },
];

function pickEvent() {
  const rand = Math.random();
  let cumulative = 0;
  for (const { event, weight } of EVENT_WEIGHTS) {
    cumulative += weight;
    if (rand < cumulative) return event;
  }
  return 'LOGIN'; // fallback
}

function randomIP() {
  return faker.internet.ip();
}
function randomUserAgent() {
  return faker.internet.userAgent();
}
function randomCountryCode() {
  return faker.address.countryCode();
}
function randomGeo() {
  return {
    latitude: faker.address.latitude(),
    longitude: faker.address.longitude(),
  };
}

class ScenarioGenerator {
  constructor(io) {
    this.logger = createLogger();
    this.io = io;
    this.generating = false;
    this.delayMs = 200;
  }

  start() {
    if (!this.generating) {
      this.generating = true;
      this.generateLoop();
    }
  }

  stop() {
    this.generating = false;
  }

  async generateLoop() {
    while (this.generating) {
      try {
        const eventType = pickEvent();
        const user = faker.random.arrayElement(USERS);
        await this.generateEvent(eventType, user);
      } catch (err) {
        // Red / bold error message
        this.logger.error(`\u001B[31m[GENERATOR_ERROR]\u001B[0m ${err.message || err}`, { stack: err.stack });
        this.generating = false;
      }
      // small delay
      await new Promise((r) => setTimeout(r, this.delayMs));
    }
  }

  async generateEvent(eventType, user) {
    switch (eventType) {
      case 'LOGIN':
        this.generateLoginLog(user);
        break;
      case 'BROWSE':
        this.generateBrowseLog(user);
        break;
      case 'ADD_TO_CART':
        this.generateAddToCartLog(user);
        break;
      case 'CHECKOUT':
        this.generateCheckoutLog(user);
        break;
      case 'PAYMENT':
        this.generatePaymentLog(user);
        break;
      case 'SHIPPING':
        this.generateShippingLog(user);
        break;
      default:
        break;
    }
    // tell the frontend
    this.io.emit('log');
  }

  generateLoginLog(user) {
    // Reassign a new sessionId each time
    user.sessionId = faker.datatype.uuid();

    // Green/bold for userId
    const message = `User \u001B[1;32m${user.userId}\u001B[0m logged in.`;

    const log = {
      event: 'USER_LOGIN',
      message,
      userId: user.userId,
      sessionId: user.sessionId,
      ip: randomIP(),
      userAgent: randomUserAgent(),
      geolocation: {
        countryCode: randomCountryCode(),
        ...randomGeo(),
      },
    };

    this.logger.info(log);
  }

  generateBrowseLog(user) {
    if (!user.sessionId) return;

    const product = faker.random.arrayElement(PRODUCTS);
    const message = `User \u001B[1;32m${user.userId}\u001B[0m browsed ` +
                    `\u001B[33m${product.name}\u001B[0m.`;

    const log = {
      event: 'USER_BROWSE',
      message,
      userId: user.userId,
      sessionId: user.sessionId,
      productId: product.productId,
      ip: randomIP(),
      userAgent: randomUserAgent(),
      geolocation: {
        countryCode: randomCountryCode(),
        ...randomGeo(),
      },
    };

    this.logger.info(log);
  }

  generateAddToCartLog(user) {
    if (!user.sessionId) return;

    const product = faker.random.arrayElement(PRODUCTS);
    user.cart.push(product);

    // Bold/green for userId, bold for product name
    const message = `User \u001B[1;32m${user.userId}\u001B[0m added ` +
                    `\u001B[1m${product.name}\u001B[0m to cart.`;

    const log = {
      event: 'ADD_TO_CART',
      message,
      userId: user.userId,
      sessionId: user.sessionId,
      productId: product.productId,
      cartSize: user.cart.length,
    };

    this.logger.info(log);
  }

  generateCheckoutLog(user) {
    if (!user.sessionId || user.cart.length === 0) return;

    const message = `User \u001B[1;32m${user.userId}\u001B[0m is checking out.`;
    const log = {
      event: 'CHECKOUT',
      message,
      userId: user.userId,
      sessionId: user.sessionId,
      cartContents: user.cart.map((p) => p.productId),
    };

    this.logger.info(log);
  }

  generatePaymentLog(user) {
    if (!user.sessionId || user.cart.length === 0) return;

    const isFailure = Math.random() < 0.05; // 5% chance to fail
    const totalAmount = user.cart
      .reduce((acc, p) => acc + parseFloat(p.price), 0)
      .toFixed(2);

    if (isFailure) {
      // red for failure
      const message = `\u001B[31mPayment failed!\u001B[0m (User: ${user.userId})`;

      const log = {
        event: 'PAYMENT',
        message,
        userId: user.userId,
        sessionId: user.sessionId,
        totalAmount,
        success: false,
        error: 'Payment gateway error (simulated).',
      };
      this.logger.error(log);
    } else {
      // bold green for success
      const message = `Payment of \u001B[1;32m$${totalAmount}\u001B[0m successful for user ${user.userId}.`;

      const log = {
        event: 'PAYMENT',
        message,
        userId: user.userId,
        sessionId: user.sessionId,
        totalAmount,
        success: true,
      };
      this.logger.info(log);

      // empty the cart
      user.cart = [];
    }
  }

  generateShippingLog(user) {
    // Only relevant if user has paid, so cart should be empty
    if (!user.sessionId) return;

    const message = `Order shipped for user \u001B[1;32m${user.userId}\u001B[0m.`;
    const log = {
      event: 'SHIPPING',
      message,
      userId: user.userId,
      sessionId: user.sessionId,
      trackingCode: faker.datatype.uuid(),
      shippingAddress: faker.address.streetAddress(),
      geolocation: {
        countryCode: randomCountryCode(),
        ...randomGeo(),
      },
    };
    this.logger.info(log);
  }
}

module.exports = ScenarioGenerator;