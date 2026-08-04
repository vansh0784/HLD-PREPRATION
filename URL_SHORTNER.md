# URL Shortener - High Level Design

> **Purpose:**  
> This project is built for learning High-Level Design (HLD). The goal is to understand the architecture, design decisions, trade-offs, scalability challenges, and distributed system concepts involved in building a production-ready URL Shortener.

---

# Functional Requirements

The system should support the following:

- Generate a short URL from a long URL.
- Redirect users from the short URL to the original URL.
- Allow users to specify an optional expiry time.
- Track the number of clicks for analytics.
- Support custom aliases (future enhancement).
- Support authenticated users (future enhancement).

---

# Non-Functional Requirements

The system should be:

- Highly Available
- Highly Scalable
- Durable
- Low Latency
- Fault Tolerant
- Eventually Consistent (Analytics)

---

# Back of the Envelope Estimation (BOE)

## Assumptions

| Metric             | Value      |
| ------------------ | ---------- |
| Daily URL Creation | 1 Million  |
| Daily URL Reads    | 10 Million |
| Read : Write Ratio | 10 : 1     |
| Data Retention     | 10 Years   |

---

## Traffic Estimation

### Write Traffic

```
1,000,000 / 86,400

≈ 12 Writes / Second
```

Peak Traffic (3x)

```
≈ 40 Writes / Second
```

---

### Read Traffic

```
10,000,000 / 86,400

≈ 116 Reads / Second
```

Peak Traffic (3x)

```
≈ 350 Reads / Second
```

> The application is **read-heavy**, with a read-to-write ratio of approximately **10:1**.

---

## Storage Estimation

Assume every URL record occupies approximately **500 Bytes**.

### Daily Storage

```
1,000,000 × 500 Bytes

≈ 500 MB / Day
```

### Yearly Storage

```
500 MB × 365

≈ 182 GB / Year
```

### Storage for 10 Years

```
≈ 1.8 TB
```

> _(Ignoring replication, indexes and backups.)_

---

## Number of Short Codes Required

```
1 Million URLs / Day

×

365 Days

×

10 Years

≈ 3.65 Billion URLs
```

---

## Short Code Length

Character Set

```
0-9
a-z
A-Z
```

Total Characters

```
62
```

Possible Combinations

| Length | Capacity     |
| ------ | ------------ |
| 5      | 916 Million  |
| 6      | 56.8 Billion |
| 7      | 3.5 Trillion |

A **6-character** Base62 encoded short code is sufficient for our scale.

---

## Cache Estimation

Assume we cache the hottest **10 Million URLs**.

```
10 Million × 500 Bytes

≈ 5 GB RAM
```

Considering metadata and Redis overhead,

```
≈ 6-8 GB RAM
```

---

# Database Schema

## URL_STORE

```sql
id BIGINT PRIMARY KEY,
long_url TEXT,
short_code VARCHAR(6) UNIQUE,
created_user_id BIGINT,
created_at TIMESTAMP,
updated_at TIMESTAMP,
expires_at TIMESTAMP,
click_count BIGINT
```

Indexes

```sql
UNIQUE(short_code)
INDEX(created_user_id)
```

---

## USER

```sql
id BIGINT PRIMARY KEY,
username VARCHAR(100),
full_name VARCHAR(255),
email VARCHAR(255),
password_hash VARCHAR(255),
created_at TIMESTAMP,
updated_at TIMESTAMP
```

Indexes

```sql
UNIQUE(email)
UNIQUE(username)
```

---

## ANALYTICS (Future Enhancement)

```sql
id BIGINT PRIMARY KEY,
url_id BIGINT,
click_count BIGINT,
created_at TIMESTAMP,
updated_at TIMESTAMP
```

---

# API Design

## Create Short URL

### Endpoint

```
POST /short-url
```

### Request

```json
{
  "url": "https://example.com",
  "expiry": "optional"
}
```

### Response

```json
{
  "short_url": "abc123"
}
```

---

## Redirect

### Endpoint

```
GET /{shortCode}
```

### Response

```
302 Redirect
```

---

# Unique ID Generation

The system must generate IDs that are:

- Unique
- Distributed
- Fast
- Collision Free

---

## Why not UUID?

### UUID v4

**Pros**

- Globally Unique
- Random

**Cons**

- 128-bit
- Poor Database Index Locality
- Larger Storage

---

### UUID v7

**Pros**

- Time Ordered
- Better Index Performance

**Cons**

- Still 128-bit
- Larger than required

---

## Better Options

### Snowflake

Snowflake IDs are composed of:

```
Timestamp

+

Machine ID

+

Sequence Number
```

Advantages

- Ordered
- Fast
- Distributed
- Small (64-bit)

---

### ZooKeeper

ZooKeeper can also be used for generating globally unique sequential IDs, although Snowflake is generally preferred because it avoids centralized coordination for every request.

---

# Why Base62?

Snowflake generates a numeric ID.

Example

```
184467123987623
```

This is not suitable for a URL.

Instead, encode it using Base62.

Character Set

```
0-9

a-z

A-Z
```

Result

```
abc123
```

Advantages

- Compact
- URL Safe
- Human Readable

---

# High-Level Architecture

```text
                        Client
                           │
                           ▼
                    Load Balancer
                           │
          ┌────────────────┴────────────────┐
          │                                 │
     URL Service                      URL Service
          │                                 │
          └────────────────┬────────────────┘
                           │
                    Snowflake Service
                           │
                           ▼
                     Base62 Encoder
                           │
                           ▼
                    Primary Database
                           │
              ┌────────────┴────────────┐
              │                         │
         Read Replica              Read Replica
                           │
                           ▼
                         Redis
```

---

# Write Flow

```text
Client

↓

POST /short-url

↓

Load Balancer

↓

URL Service

↓

Validate Request

↓

Generate Snowflake ID

↓

Base62 Encode

↓

Insert into Primary Database

↓

Update Redis Cache

↓

Return Short URL
```

---

# Read Flow

```text
Client

↓

GET /abc123

↓

Load Balancer

↓

Redis

↓

Cache Hit?

├── Yes
│
│   ↓
│
│ Return Long URL
│
└── No

    ↓

URL Service

↓

Database Lookup

↓

Update Redis Cache

↓

302 Redirect
```

---

# Scaling Considerations

- Deploy multiple stateless URL service instances.
- Place services behind a Load Balancer.
- Cache frequently accessed URLs using Redis.
- Use Primary-Replica database replication.
- Shard the database when storage grows significantly.
- Use asynchronous event processing (Kafka/RabbitMQ) for analytics.
- Add CDN for globally distributed users.

---

# Future Enhancements

- Custom Alias
- QR Code Generation
- Password Protected URLs
- URL Preview
- URL Expiration
- Analytics Dashboard
- Geo-Based Analytics
- Rate Limiting
- Abuse Detection
- User Dashboard

---

# Tech Stack (One Possible Choice)

| Component      | Technology           |
| -------------- | -------------------- |
| API            | Node.js / NestJS     |
| Cache          | Redis                |
| Database       | PostgreSQL / MySQL   |
| Message Queue  | Kafka / RabbitMQ     |
| Load Balancer  | Nginx / AWS ALB      |
| Object Storage | Amazon S3 (optional) |
| Monitoring     | Prometheus + Grafana |
| Logging        | ELK Stack            |
