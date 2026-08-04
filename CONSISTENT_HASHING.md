# Consistent Hashing

## What is Consistent Hashing?

Consistent Hashing is a distributed hashing technique that minimizes
data movement when the number of servers changes. It is commonly used in
distributed caches, databases, CDNs, and load balancers to evenly
distribute data while supporting horizontal scaling.

The primary goal is:

- Evenly distribute data across multiple servers.
- Minimize key movement when servers are added or removed.
- Avoid expensive rebalancing of the entire dataset.

---

# Why do we need Consistent Hashing?

A naive approach to distribute data is:

```text
server = hash(key) % N
```

Where:

- `key` = Cache key / Data key
- `N` = Number of servers

This works well **only when the number of servers remains constant**.

In real systems, servers are frequently:

- Added during auto-scaling
- Removed after traffic decreases
- Replaced after failures
- Upgraded during maintenance

Whenever `N` changes, the result of `hash(key) % N` changes for almost
every key.

This causes:

- Massive cache misses
- Large-scale data migration
- Increased network traffic
- Temporary reduction in system performance

Consistent Hashing solves this problem by ensuring that only a small
subset of keys need to move.

---

# Example: Traditional Hashing

Suppose we have **4 servers**.

```text
server = hash(key) % 4
```

Key Hash Server

---

key0 18358617 1
key1 26143584 0
key2 18131146 2
key3 35863496 0
key4 34085809 1
key5 27581703 3
key6 38164978 2
key7 22530351 3

Now suppose one server is removed.

```text
server = hash(key) % 3
```

Almost every key gets mapped to a different server.

This means the entire cache has to be rebuilt, resulting in unnecessary
data movement.

---

# How Consistent Hashing Works

Instead of using modulo, Consistent Hashing maps both **servers** and
**keys** onto the same logical circular hash space called the **Hash
Ring**.

The ring represents the complete output range of the hash function.

Example:

```text
0 -----------------------------------------> 2^32 - 1

                 (Circular Ring)
```

The hash function can be SHA-1, MD5, MurmurHash, or any deterministic
hash function.

---

# Steps

## Step 1: Hash the Servers

Each server is hashed using its unique identifier (IP, hostname, etc.)
and placed on the ring.

```text
Hash(Server A)
Hash(Server B)
Hash(Server C)
```

---

## Step 2: Hash the Keys

Each data key (or cache key) is also hashed and placed on the same ring.

```text
Hash(User:123)

Hash(Product:101)

Hash(Order:987)
```

---

## Step 3: Locate the Server

For every key:

- Move **clockwise** on the ring.
- The **first server encountered** owns that key.

Example:

```text
          Key

            ↓

------------------------>

         Server B
```

This clockwise lookup determines the server responsible for storing the
data.

---

# Adding a Server

Suppose a new server joins the cluster.

The server is hashed and inserted into the ring according to its hash
value.

```text
Before

Server A -------- Server B -------- Server C

After

Server A ---- Server D ---- Server B ---- Server C
```

Only the keys between **Server A** and **Server D** move to the new
server.

All other keys remain unchanged.

---

# Removing a Server

When a server leaves the cluster:

- Only the keys owned by that server move.
- They are reassigned to the next server in the clockwise direction.
- The remaining keys stay on their original servers.

This significantly reduces data movement.

---

# Complexity

## Traditional Hashing

When one server is added or removed:

```text
Almost all keys move.

≈ O(K)

K = Total Number of Keys
```

---

## Consistent Hashing

Only the keys belonging to the affected partition move.

```text
≈ O(K / N)

K = Total Keys
N = Total Servers
```

This is the biggest advantage of Consistent Hashing.

---

# Problem with Basic Consistent Hashing

Even though Consistent Hashing minimizes data movement, it introduces
another issue.

Servers are randomly positioned on the ring.

As a result:

- Some partitions become very large.
- Some partitions become very small.

This leads to:

- Uneven load distribution
- Hotspots
- Under-utilized servers

---

# Virtual Nodes (VNodes)

To solve uneven distribution, each physical server is represented by
multiple **Virtual Nodes (VNodes)**.

Example:

```text
Physical Server A

↓

A1
A2
A3
A4
A5
```

Instead of occupying one position, the server occupies multiple
positions on the ring.

Benefits:

- Better load balancing
- Uniform key distribution
- Easier scaling
- Better fault tolerance

Most production systems use virtual nodes.

---

# Replication

In production, data is usually replicated.

Example:

```text
Key

↓

Server A

↓

Replica -> Server B

↓

Replica -> Server C
```

If one server fails, another replica can immediately serve the request.

---

# Pros

- Minimal data movement
- Excellent support for horizontal scaling
- Better cache hit ratio
- High availability
- Fault tolerant
- Widely used in distributed systems

---

# Cons

- Slightly more complex than modulo hashing
- Requires virtual nodes for good load balancing
- Replication logic adds additional complexity

---

# Real-World Applications

### Amazon DynamoDB

- Data partitioning
- Request routing

### Apache Cassandra

- Partitioning data across cluster nodes
- Replication

### Akamai CDN

- Mapping content to edge servers

### Discord

- Distributed routing of user data

### Maglev Load Balancer (Google)

- Consistent backend selection

---

# Traditional Hashing vs Consistent Hashing

---

Traditional Hashing Consistent Hashing

---

Uses `hash(key) % N` Uses a Hash Ring

Almost all keys move when `N` Only a small fraction of keys move
changes

Poor support for auto-scaling Excellent support for auto-scaling

High cache miss rate during scaling Minimal cache misses

---

---
