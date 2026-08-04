# Rate Limiting

## What is Rate Limiting?

Rate limiting is a mechanism used to control the number of requests a client can make to a server within a specified time period.

Its primary purpose is to:

- Prevent server overload
- Protect against abuse (spam, bots, brute-force attacks)
- Ensure fair usage among clients
- Improve overall system stability

---

## Where should Rate Limiting be implemented?

Rate limiting should always be enforced on the **server side**.

Common places include:

- API Gateway (most common)
- Reverse Proxy (Nginx, Envoy, Kong)
- Load Balancer
- Application Middleware (Express, NestJS, Spring Boot, etc.)

Example:

```
Client
   |
   |
   v
  API Gateway - Rate Limiter
   |
   | Allowed
   v
Application Server

Rejected
   |
   +-------> HTTP 429 (Too Many Requests)
```

### What about the client side?

The client may also implement techniques like:

- Disable a button after clicking
- Debounce search requests
- Throttle scroll or resize events

These improve the user experience but **do not replace server-side rate limiting**, since a malicious client can bypass them completely.

---

## NestJS

NestJS provides a built-in throttling module.

```
@nestjs/throttler
```

It is useful for implementing basic rate limiting at the application level.

---

## Popular Rate Limiting Algorithms

### 1. Token Bucket

- Bucket contains tokens.
- Every request consumes one token.
- Tokens are replenished over time.
- Supports burst traffic.

Use cases:

- Public APIs
- API Gateways
- Cloud services

---

### 2. Leaky Bucket

- Incoming requests are placed into a queue.
- Requests leave the queue at a constant rate.
- If the queue becomes full, new requests are rejected.

Use cases:

- Traffic shaping
- Preventing sudden spikes
- Maintaining a constant processing rate

---

### 3. Window-Based Algorithms

These divide time into windows and count requests.

Examples:

- Fixed Window Counter
- Sliding Window Log
- Sliding Window Counter

Use cases:

- Login rate limiting
- API quotas
- Per-user request limits
