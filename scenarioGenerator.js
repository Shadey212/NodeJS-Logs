const faker = require('faker');
const { createLogger } = require('./logtail.config');

/**
 * Returns a numeric ID with length between 1 and 6 digits.
 * E.g. "3", "42", "999999"
 */
function generateNumericUserId() {
  const length = faker.datatype.number({ min: 1, max: 6 });
  let id = '';
  for (let i = 0; i < length; i++) {
    id += faker.datatype.number({ min: 0, max: 9 }).toString();
  }
  return id;
}

/**
 * Bot user agents
 */
const BOT_USER_AGENTS = [
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mozilla/5.0 (compatible; Facebookbot/1.0; +http://www.facebook.com/externalhit_uatext.php)",
  "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)"
];

/**
 * Real/most-used user agents (10 examples)
 */
const REAL_USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.5615.137 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; rv:112.0) Gecko/20100101 Firefox/112.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0.3 Safari/605.1.15",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 16_4_1 like Mac OS X) AppleWebKit/604.5.6 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 13; Pixel 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.5481.153 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:100.0) Gecko/20100101 Firefox/100.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 11_3_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/90.0.4430.93 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; WOW64; rv:55.0) Gecko/20100101 Firefox/55.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/50.0.2661.102 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Safari/605.1.15"
];

/**
 * Picks a user-agent with 5% chance of a bot and 95% a real browser UA
 */
function pickUserAgent() {
  const botChance = 0.05; // 5% chance
  const roll = Math.random();
  if (roll < botChance) {
    return BOT_USER_AGENTS[Math.floor(Math.random() * BOT_USER_AGENTS.length)];
  } else {
    return REAL_USER_AGENTS[Math.floor(Math.random() * REAL_USER_AGENTS.length)];
  }
}

// Create a pool of 10 users, each with a random-length numeric ID
const USERS = Array.from({ length: 10 }).map(() => ({
  userId: generateNumericUserId(),
  username: faker.internet.userName(),
  email: faker.internet.email(),
  sessionId: null,
  cart: [],
  deviceType: faker.random.arrayElement(['desktop', 'mobile', 'tablet']),
  operatingSystem: faker.random.arrayElement(['Windows 10', 'macOS', 'iOS', 'Android', 'Linux']),
}));

// We’ll keep 6 products, but add a random category to each for more detail
const PRODUCTS = Array.from({ length: 6 }).map(() => ({
  productId: faker.datatype.uuid(),
  name: faker.commerce.productName(),
  category: faker.commerce.department(),
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
function randomCountryCode() {
  return faker.address.countryCode();
}
function randomGeo() {
  return {
    latitude: faker.address.latitude(),
    longitude: faker.address.longitude(),
  };
}

const SHIPPING_PROVIDERS = ['UPS', 'FedEx', 'DHL', 'USPS', 'Royal Mail', 'Amazon Logistics'];
const PAYMENT_METHODS = ['Credit Card', 'PayPal', 'Apple Pay', 'Google Pay', 'Bank Transfer'];

// For random "extra" log levels
const ADDITIONAL_LOG_LEVELS = ['warn', 'debug', 'verbose', 'silly'];
// 5% chance to produce an extra log entry with one of those levels
const EXTRA_LOG_CHANCE = 0.05;

class ScenarioGenerator {
  constructor(io) {
    this.logger = createLogger();
    this.io = io;
    this.generating = false;

    // If you want to generate logs faster, reduce delay or
    // produce multiple events per loop
    this.delayMs = 10;
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

        // Possibly generate an "extra" log with a random lesser-used level
        this.maybeGenerateAdditionalLog();
      } catch (err) {
        this.logger.error(`\u001B[31m[GENERATOR_ERROR]\u001B[0m ${err.message}`, {
          stack: err.stack
        });
        this.generating = false;
      }

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
    }
    this.io.emit('log');
  }

  // -----------
  // MAIN EVENTS
  // -----------

  generateLoginLog(user) {
    user.sessionId = faker.datatype.uuid();

    const message = `User \u001B[1;32m${user.userId}\u001B[0m logged in (device: ${user.deviceType}).`;

    const log = {
      event: 'USER_LOGIN',
      message,
      userId: user.userId,
      sessionId: user.sessionId,
      username: user.username,
      email: user.email,
      deviceType: user.deviceType,
      operatingSystem: user.operatingSystem,
      ip: randomIP(),
      userAgent: pickUserAgent(),
      geolocation: {
        countryCode: randomCountryCode(),
        ...randomGeo(),
      },
      loginPath: '/api/login',
    };

    this.logger.info(log);
  }

  generateBrowseLog(user) {
    if (!user.sessionId) return;

    const product = faker.random.arrayElement(PRODUCTS);
    const message = `User \u001B[1;32m${user.userId}\u001B[0m browsed \u001B[33m${product.name}\u001B[0m in category [${product.category}].`;

    const log = {
      event: 'USER_BROWSE',
      message,
      userId: user.userId,
      sessionId: user.sessionId,
      productId: product.productId,
      productName: product.name,
      productCategory: product.category,
      ip: randomIP(),
      userAgent: pickUserAgent(),
      geolocation: {
        countryCode: randomCountryCode(),
        ...randomGeo(),
      },
      browsePath: '/api/products',
      deviceType: user.deviceType,
      operatingSystem: user.operatingSystem
    };

    this.logger.info(log);
  }

  generateAddToCartLog(user) {
    if (!user.sessionId) return;

    const product = faker.random.arrayElement(PRODUCTS);
    const quantity = faker.datatype.number({ min: 1, max: 5 });
    for (let i = 0; i < quantity; i++) {
      user.cart.push(product);
    }

    const message = `User \u001B[1;32m${user.userId}\u001B[0m added \u001B[1m${product.name}\u001B[0m (x${quantity}) to cart.`;

    const log = {
      event: 'ADD_TO_CART',
      message,
      userId: user.userId,
      sessionId: user.sessionId,
      productId: product.productId,
      productName: product.name,
      productCategory: product.category,
      quantity,
      cartSize: user.cart.length,
      cartContents: user.cart.map((p) => p.productId),
      addToCartPath: '/api/cart/add',
      deviceType: user.deviceType,
      operatingSystem: user.operatingSystem,
      userAgent: pickUserAgent(),
    };

    this.logger.info(log);
  }

  generateCheckoutLog(user) {
    if (!user.sessionId || user.cart.length === 0) return;

    const message = `User \u001B[1;32m${user.userId}\u001B[0m is checking out with ${user.cart.length} items.`;

    const log = {
      event: 'CHECKOUT',
      message,
      userId: user.userId,
      sessionId: user.sessionId,
      cartContents: user.cart.map((p) => ({
        productId: p.productId,
        name: p.name,
        category: p.category,
        price: p.price
      })),
      checkoutPath: '/api/checkout',
      deviceType: user.deviceType,
      operatingSystem: user.operatingSystem,
      userAgent: pickUserAgent(),
    };

    this.logger.info(log);
  }

  generatePaymentLog(user) {
    if (!user.sessionId || user.cart.length === 0) return;

    const isFailure = Math.random() < 0.05; // 5% chance to fail
    const totalAmount = user.cart
      .reduce((acc, p) => acc + parseFloat(p.price), 0)
      .toFixed(2);

    const paymentMethod = faker.random.arrayElement(PAYMENT_METHODS);
    const paymentLink = `https://example.com/pay?session=${user.sessionId}`;

    if (isFailure) {
      const message = `\u001B[31mPayment failed!\u001B[0m (User: ${user.userId}, method: ${paymentMethod})`;

      const log = {
        event: 'PAYMENT',
        message,
        userId: user.userId,
        sessionId: user.sessionId,
        totalAmount,
        success: false,
        error: 'Payment gateway error (simulated).',
        paymentMethod,
        paymentLink,
        paymentPath: '/api/payment',
        deviceType: user.deviceType,
        operatingSystem: user.operatingSystem,
        userAgent: pickUserAgent(),
      };
      this.logger.error(log);
    } else {
      const message = `Payment of \u001B[1;32m$${totalAmount}\u001B[0m successful for user ${user.userId} via ${paymentMethod}.`;

      const log = {
        event: 'PAYMENT',
        message,
        userId: user.userId,
        sessionId: user.sessionId,
        totalAmount,
        success: true,
        paymentMethod,
        paymentLink,
        paymentPath: '/api/payment',
        deviceType: user.deviceType,
        operatingSystem: user.operatingSystem,
        userAgent: pickUserAgent(),
      };
      this.logger.info(log);

      // Clear the cart
      user.cart = [];
    }
  }

  generateShippingLog(user) {
    if (!user.sessionId) return;

    const shippingProvider = faker.random.arrayElement(SHIPPING_PROVIDERS);
    const deliveryEstimate = faker.date.soon(7).toISOString().split('T')[0];

    const message = `Order shipped for user \u001B[1;32m${user.userId}\u001B[0m via ${shippingProvider}.`;
    const log = {
      event: 'SHIPPING',
      message,
      userId: user.userId,
      sessionId: user.sessionId,
      trackingCode: faker.datatype.uuid(),
      shippingProvider,
      deliveryEstimate,
      shippingAddress: faker.address.streetAddress(),
      shippingPath: '/api/shipping',
      geolocation: {
        countryCode: randomCountryCode(),
        ...randomGeo(),
      },
      deviceType: user.deviceType,
      operatingSystem: user.operatingSystem,
      userAgent: pickUserAgent(),
    };
    this.logger.info(log);
  }

  // ----------------------------------
  // Additional minor log levels
  // ----------------------------------

  maybeGenerateAdditionalLog() {
    // 5% chance to log something at debug/warn/verbose/silly
    if (Math.random() < EXTRA_LOG_CHANCE) {
      const chosenLevel = faker.random.arrayElement(ADDITIONAL_LOG_LEVELS);

      // Just an example message
      const randomMsg = faker.lorem.sentence();
      // Maybe attach some random fields
      const extraFields = {
        event: `RANDOM_${chosenLevel.toUpperCase()}`,
        userAgent: pickUserAgent(),
        debugKey: faker.random.alphaNumeric(8),
      };

      switch (chosenLevel) {
        case 'warn':
          this.logger.warn(randomMsg, extraFields);
          break;
        case 'debug':
          this.logger.debug(randomMsg, extraFields);
          break;
        case 'verbose':
          this.logger.verbose(randomMsg, extraFields);
          break;
        case 'silly':
          this.logger.silly(randomMsg, extraFields);
          break;
      }
    }
  }
}

module.exports = ScenarioGenerator;