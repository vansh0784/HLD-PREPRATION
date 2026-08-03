// Here i am writing the rate limiter middleware for express js, with my own logic of token-bucket algorithm, which is a simple and efficient way to limit the number of requests a user can make to an API within a certain time frame.

// we have to work with the state of the user, so we will use a Map to store the state of each user, where the key will be the user's IP address and the value will be an object containing the number of tokens and the last time the user made a request. but in production we can use redis or any other database to store the state of the user, but for this example we will use a Map.

const userMap = new Map<string, { tokens: number; lastRequestTime: number }>();
const maxTokens = 10; // maximum number of tokens a user can have
const refillRate = 1; // number of tokens to add per second

async function rateLimiterTokenBucket(req: any, res: any, next: any) {
  const userIP = req.ip;
  const now = Date.now();

  if (!userMap.has(userIP)) {
    userMap.set(userIP, { tokens: maxTokens, lastRequestTime: now });
  }
  const userData = userMap.get(userIP)!;
  const elapsedTime = now - userData.lastRequestTime;
  const tokensToAdd = Math.floor((elapsedTime / 1000) * refillRate);
  if (tokensToAdd > 0) {
    userData.tokens = Math.min(maxTokens, userData.tokens + tokensToAdd);
    userData.lastRequestTime += (tokensToAdd * 1000) / refillRate;
  }
  if (userData.tokens === 0) {
    return res.status(429).json({ error: "Too Many Requests" });
  }
  userData.tokens -= 1;
  next();
}

const queue: any = [];
const maxQueueSize = 50; // maximum number of requests to queue
const leakRate = 4; // number of requests to process per second

async function rateLimiterLeakyBucket(req: any, res: any, next: any) {
  const userIP = req.ip;

  if (queue.length >= maxQueueSize) {
    return res.status(429).json({ error: "Too Many Requests" });
  }
  queue.push({req, res, next});

  // background process to leak requests from the queue at a fixed rate
  setInterval(() => {
    if (queue.length > 0) {
      const { req, res, next } = queue.shift();
      next();
    }
  }, 1000 / leakRate);
}
