# HTTP/1.1 vs HTTP/2

HTTP (Hypertext Transfer Protocol) is the protocol used for communication between clients and servers on the web.

**HTTP/1.1** and **HTTP/2** provide the same fundamental request/response model, but HTTP/2 introduces several improvements that make communication more efficient, especially when a webpage needs to load many resources.

---

## 1. Quick Comparison

| Feature                | HTTP/1.1       | HTTP/2                    |
| ---------------------- | -------------- | ------------------------- |
| Communication format   | Text-based     | Binary framing            |
| Multiplexing           | ❌ No          | ✅ Yes                    |
| Multiple requests      | Limited        | ✅ Concurrent streams     |
| Header compression     | ❌ No          | ✅ HPACK                  |
| TCP connections        | Often multiple | Usually one               |
| Request prioritization | Limited        | ✅ Supported              |
| Server Push            | ❌ No          | ✅ Supported\*            |
| Performance            | Good           | Better for many resources |
| Transport protocol     | TCP            | TCP                       |

> **Note:** HTTP/2 Server Push is part of the protocol, but modern browsers generally do not use it.

---

# 2. HTTP/1.1

HTTP/1.1 is the traditional HTTP protocol that has been widely used on the web.

A basic HTTP/1.1 request looks like this:

```http
GET /users HTTP/1.1
Host: example.com
Accept: application/json
```

The server then sends a response:

```http
HTTP/1.1 200 OK
Content-Type: application/json

[
  {
    "id": 1,
    "name": "John"
  }
]
```

The communication is fundamentally **text-based**.

---

## 2.1 HTTP/1.1 Request Flow

Conceptually, requests can look like:

```text
Client
  │
  ├── Request 1 ──────> Server
  │<──── Response 1 ───
  │
  ├── Request 2 ──────> Server
  │<──── Response 2 ───
  │
  └── Request 3 ──────> Server
       <── Response 3 ─
```

HTTP/1.1 supports persistent TCP connections, but there are limitations around how requests are processed on a connection.

Because modern webpages contain many resources, browsers can open multiple TCP connections.

For example:

```text
Web Page
   │
   ├── HTML
   ├── CSS
   ├── JavaScript
   ├── Image
   ├── Image
   ├── Font
   └── API request
```

The browser may use multiple connections to improve loading performance.

---

# 3. HTTP/2

HTTP/2 was designed to improve the efficiency of HTTP communication without fundamentally changing the application-level request/response model.

One of its biggest improvements is **multiplexing**.

Instead of treating every request as an independent connection, HTTP/2 can send multiple streams through the same TCP connection.

```text
Client
   │
   │
   └──────────── One TCP Connection ────────────┐
                                                │
              ┌── Stream A ────────────────────┤
              ├── Stream B ────────────────────┤
              ├── Stream C ────────────────────┤
              └── Stream D ────────────────────┘
```

---

# 4. Multiplexing

Multiplexing is one of the most important concepts in HTTP/2.

### HTTP/1.1

Conceptually:

```text
Request A ─────────────> Response A
Request B ─────────────> Response B
Request C ─────────────> Response C
```

There can be waiting and connection management overhead.

### HTTP/2

HTTP/2 divides communication into **streams and frames**.

Multiple streams can be interleaved:

```text
One TCP Connection
│
├── A1
├── B1
├── C1
├── A2
├── C2
├── B2
└── A3
```

The data belonging to different requests can therefore travel through the same connection.

---

# 5. What Is a Stream?

In HTTP/2, each request/response exchange can be associated with a **stream**.

For example:

```text
TCP Connection
│
├── Stream 1 → GET /index.html
│
├── Stream 3 → GET /style.css
│
├── Stream 5 → GET /app.js
│
└── Stream 7 → GET /image.png
```

All of these streams can use the same TCP connection.

Each stream is identified by a **stream ID**.

---

# 6. What Is a Frame?

HTTP/2 doesn't send an entire HTTP message as one large block.

Instead, it breaks communication into smaller **binary frames**.

Conceptually:

```text
HTTP/2 Connection
│
├── HEADERS frame
├── DATA frame
├── HEADERS frame
├── DATA frame
├── DATA frame
└── DATA frame
```

Different frame types are used for different purposes.

Some important HTTP/2 frame types include:

| Frame           | Purpose                            |
| --------------- | ---------------------------------- |
| `HEADERS`       | Carries HTTP headers               |
| `DATA`          | Carries request/response body      |
| `SETTINGS`      | Communicates connection settings   |
| `WINDOW_UPDATE` | Controls flow control              |
| `RST_STREAM`    | Terminates a stream                |
| `PING`          | Checks connection health / latency |
| `GOAWAY`        | Gracefully closes a connection     |

---

# 7. Binary Framing

HTTP/1.1 is fundamentally text-based.

For example:

```http
GET /users HTTP/1.1
Host: example.com
Accept: application/json
```

HTTP/2 represents communication using **binary frames**.

Conceptually:

```text
HTTP/2
   │
   ├── HEADERS frame
   ├── DATA frame
   ├── HEADERS frame
   └── DATA frame
```

The important point is:

> HTTP/2 uses a binary framing layer underneath the HTTP semantics.

This makes communication easier for the protocol implementation to parse and manage efficiently.

---

# 8. Header Compression

HTTP requests often contain repetitive headers.

For example:

```http
Host: example.com
User-Agent: Chrome
Accept: application/json
Authorization: Bearer abc123
Cookie: session=xyz
```

When a browser sends many requests to the same server, many of these values remain unchanged.

With HTTP/1.1, these headers may be sent repeatedly.

HTTP/2 introduces **HPACK**, a header compression mechanism.

---

## 8.1 HPACK

HTTP/2 can maintain a dynamic table of previously seen headers.

Conceptually:

```text
Request 1:

Authorization: Bearer abc123
Cookie: session=xyz
```

The server/client can remember these values.

Later:

```text
Request 2:

Authorization: Bearer abc123
Cookie: session=xyz
```

Instead of repeatedly sending the complete information, HTTP/2 can reference information already present in the header table.

This reduces the amount of data transferred.

---

# 9. Connection Difference

One of the biggest practical differences is how connections are used.

### HTTP/1.1

Browsers may use multiple TCP connections:

```text
Client
 │
 ├── TCP Connection 1
 │      └── Request A
 │
 ├── TCP Connection 2
 │      └── Request B
 │
 ├── TCP Connection 3
 │      └── Request C
 │
 └── TCP Connection 4
        └── Request D
```

### HTTP/2

Multiple streams can share one TCP connection:

```text
Client
 │
 └── TCP Connection
       │
       ├── Stream A
       ├── Stream B
       ├── Stream C
       └── Stream D
```

This reduces the overhead associated with establishing and managing multiple connections.

---

# 10. Head-of-Line Blocking

This is an important concept when comparing HTTP/1.1 and HTTP/2.

## HTTP/1.1

HTTP/1.1 has request ordering limitations that can cause one response to delay subsequent responses on a connection.

Conceptually:

```text
Request A
   ↓
Waiting...
   ↓
Response A
   ↓
Request B
   ↓
Response B
```

This can create application-level head-of-line blocking.

---

## HTTP/2

HTTP/2 multiplexes streams:

```text
Stream A → A1 → A2 → A3
Stream B → B1 → B2
Stream C → C1 → C2 → C3
```

Frames from different streams can be interleaved.

So one slow HTTP stream does not necessarily prevent other HTTP streams from making progress.

### However, there is an important limitation

HTTP/2 still runs over **TCP**.

TCP itself guarantees ordered delivery.

Therefore, if a TCP packet is lost, TCP may need to wait for retransmission before delivering later data to the application.

So HTTP/2 reduces **HTTP-level head-of-line blocking**, but it does not completely eliminate transport-level head-of-line blocking.

HTTP/3 addresses this differently by using QUIC.

---

# 11. HTTP/2 Prioritization

HTTP/2 supports mechanisms for expressing priorities between streams.

For example, a browser could conceptually prioritize:

```text
Priority

HTML        ██████████
CSS         █████████
JavaScript  ███████
Images      ███
Analytics   █
```

Critical resources can therefore be handled before less important resources.

> Modern browser implementations and HTTP/2 stacks vary in how they handle prioritization.

---

# 12. HTTP/2 Server Push

HTTP/2 introduced **Server Push**.

The idea was that the server could send resources to the client before the client explicitly requested them.

For example:

```text
Client
  │
  │ GET /index.html
  └────────────────────> Server
                         │
                         ├── index.html
                         ├── style.css
                         └── app.js
```

The server could push resources it believed the browser would need.

However, Server Push was not widely adopted and modern browsers generally do not use it.

Today, techniques such as:

```html
<link rel="preload" href="/style.css" />
```

are generally preferred for telling the browser about important resources.

---

# 13. HTTP/2 Still Uses TCP

A very common misconception is:

> HTTP/2 uses UDP.

This is **incorrect**.

HTTP/2 normally runs over TCP:

```text
HTTP/2
   ↓
TCP
   ↓
IP
```

HTTP/1.1 also uses TCP:

```text
HTTP/1.1
   ↓
TCP
   ↓
IP
```

HTTP/3 is different.

```text
HTTP/3
   ↓
QUIC
   ↓
UDP
   ↓
IP
```

Therefore:

```text
HTTP/1.1 → TCP
HTTP/2   → TCP
HTTP/3   → QUIC → UDP
```

---

# 14. HTTP/1.1 vs HTTP/2 Example

Suppose a webpage requires:

```text
1. index.html
2. style.css
3. app.js
4. logo.png
5. profile.png
```

## HTTP/1.1

Conceptually, the browser may use multiple TCP connections:

```text
Connection 1
 └── index.html

Connection 2
 ├── style.css
 └── app.js

Connection 3
 ├── logo.png
 └── profile.png
```

There is overhead associated with managing multiple connections.

---

## HTTP/2

The same resources can use one TCP connection:

```text
One TCP Connection
│
├── Stream 1 → index.html
├── Stream 3 → style.css
├── Stream 5 → app.js
├── Stream 7 → logo.png
└── Stream 9 → profile.png
```

Frames from these streams can be interleaved:

```text
HEADERS(Stream 1)
DATA(Stream 1)

HEADERS(Stream 3)
DATA(Stream 3)

HEADERS(Stream 5)
DATA(Stream 5)

DATA(Stream 1)
DATA(Stream 7)
DATA(Stream 5)
```

---

# 15. HTTP/2 Protocol Stack

A simplified protocol stack looks like:

```text
┌─────────────────────────┐
│        HTTP/2           │
├─────────────────────────┤
│    Binary Framing       │
├─────────────────────────┤
│          TCP            │
├─────────────────────────┤
│           IP            │
└─────────────────────────┘
```

HTTP/1.1:

```text
┌─────────────────────────┐
│       HTTP/1.1          │
├─────────────────────────┤
│          TCP            │
├─────────────────────────┤
│           IP            │
└─────────────────────────┘
```

HTTP/3:

```text
┌─────────────────────────┐
│        HTTP/3           │
├─────────────────────────┤
│          QUIC           │
├─────────────────────────┤
│          UDP            │
├─────────────────────────┤
│           IP            │
└─────────────────────────┘
```

---

# 16. HTTP/1.1 vs HTTP/2 vs HTTP/3

It is useful to understand all three together.

| Feature                   | HTTP/1.1 | HTTP/2 | HTTP/3 |
| ------------------------- | -------- | ------ | ------ |
| Transport                 | TCP      | TCP    | QUIC   |
| Underlying protocol       | TCP      | TCP    | UDP    |
| Binary framing            | ❌       | ✅     | ✅     |
| Multiplexing              | ❌       | ✅     | ✅     |
| Header compression        | ❌       | HPACK  | QPACK  |
| Multiple streams          | ❌       | ✅     | ✅     |
| TCP head-of-line blocking | N/A      | ✅     | ❌     |
| Connection migration      | ❌       | ❌     | ✅     |

The evolution is roughly:

```text
HTTP/1.1
   │
   │ Multiplexing
   │ Binary framing
   │ Header compression
   ↓
HTTP/2
   │
   │ QUIC
   │ UDP
   │ Better stream isolation
   │ Connection migration
   ↓
HTTP/3
```

---

# 17. Simple Mental Model

Think about HTTP/1.1 as multiple lanes where each lane has limitations:

```text
🚗 → 🚗 → 🚗

🚗 → 🚗

🚗 → 🚗 → 🚗
```

HTTP/2 is more like one highway carrying multiple streams:

```text
════════════════════════════════
 A → B → C → A → C → B → A
════════════════════════════════
        One TCP connection
```

HTTP/3 goes a step further:

```text
QUIC
 │
 ├── Stream A
 ├── Stream B
 ├── Stream C
 └── Stream D

Independent streams
over UDP
```

---

# 18. Main Advantages of HTTP/2

HTTP/2 provides several important improvements:

### 1. Multiplexing

Multiple requests can share one TCP connection.

### 2. Binary framing

Messages are divided into efficient binary frames.

### 3. Header compression

HPACK reduces repetitive header overhead.

### 4. Stream prioritization

Important resources can be prioritized.

### 5. Better connection utilization

One connection can carry many concurrent streams.

---

# 19. Does HTTP/2 Change REST APIs?

Not fundamentally.

For example, a REST API can still use:

```http
GET /users
POST /users
GET /users/123
PUT /users/123
DELETE /users/123
```

The application-level HTTP semantics remain largely the same.

The major changes happen underneath:

```text
Application
     ↓
HTTP semantics
     ↓
HTTP/2 framing
     ↓
TCP
```

So your API can continue using:

```text
GET
POST
PUT
PATCH
DELETE
```

while the underlying connection uses HTTP/2.

---

# 20. How Does the Browser Know to Use HTTP/2?

HTTPS connections commonly negotiate the HTTP version using **ALPN (Application-Layer Protocol Negotiation)** during TLS setup.

Conceptually:

```text
Client                         Server
  │                              │
  │──── TLS connection ─────────>│
  │                              │
  │──── ALPN: h2 ──────────────>│
  │                              │
  │<──── HTTP/2 selected ───────│
  │                              │
  │──── HTTP/2 requests ───────>│
```

The protocol identifier for HTTP/2 is commonly:

```text
h2
```

HTTP/1.1 is commonly identified as:

```text
http/1.1
```

---

# 21. Important Takeaway

The easiest way to remember the difference is:

```text
HTTP/1.1
    ↓
Text-based messages
    ↓
Limited parallelism
    ↓
Often multiple TCP connections


HTTP/2
    ↓
Binary frames
    ↓
Multiple streams
    ↓
Multiplexing
    ↓
Header compression
    ↓
Usually one TCP connection
```

---

# 22. In One Sentence

> **HTTP/1.1 has limited request parallelism and often relies on multiple TCP connections, while HTTP/2 introduces binary framing, multiplexing, and HPACK header compression to efficiently handle multiple requests over a shared TCP connection.**

---

# 23. Final Mental Model

```text
                HTTP Evolution

        ┌──────────────────────┐
        │       HTTP/1.1       │
        │                      │
        │ Text-based           │
        │ Limited parallelism  │
        │ TCP                  │
        └──────────┬───────────┘
                   │
                   │ Improvements
                   ▼
        ┌──────────────────────┐
        │        HTTP/2        │
        │                      │
        │ Binary frames        │
        │ Multiplexing         │
        │ HPACK                │
        │ TCP                  │
        └──────────┬───────────┘
                   │
                   │ New transport
                   ▼
        ┌──────────────────────┐
        │        HTTP/3        │
        │                      │
        │ Binary framing       │
        │ Multiplexing         │
        │ QPACK                │
        │ QUIC                 │
        │ UDP                  │
        └──────────────────────┘
```

### Remember These Three

```text
HTTP/1.1 → TCP + limited parallelism

HTTP/2   → TCP + multiplexing + binary framing

HTTP/3   → QUIC/UDP + multiplexing
```
