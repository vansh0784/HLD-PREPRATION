# My Notes on Distributed Systems & CAP Theorem (Blog Draft)

Hey everyone! Writing down my personal notes and thoughts while learning the CAP theorem. When I started reading about distributed DBs, I got super confused between Availability and Partition Tolerance, so putting everything here in simple words for quick revision later.

---

## 1. What is CAP Theorem anyway?

Basically, in any distributed database (multiple machines running together), you can only pick **2 out of these 3 guarantees** at the same time:

- **C — Consistency:** Everyone sees the latest updated data instantly. If I write something on Node 1, anyone reading from Node 2 right after must see that same value, not old stale data.
- **A — Availability:** Every alive node must give a successful response (no errors, no 500s, no timeout).
- **P — Partition Tolerance:** The system keeps running even if the network cable cuts or nodes cant talk to each other.

---

## 2. The Biggest Confusion: Availability (A) vs Partition Tolerance (P)

Honestly, at first both sounded same to me because both are about "system staying up". But here is the actual difference:

- **Availability ($A$)** is from the **client/user perspective**. The user sends a request, and server MUST give a valid reply, not an error like "Try again later".
- **Partition Tolerance ($P$)** is about the **network hardware**. Cables break, routers fail, packets drop. $P$ means your cluster doesn't totally crash when servers get disconnected.

### Simple Bank Example (London & Tokyo Branch)

Imagine my bank has 2 servers: **London** and **Tokyo**. Both show I have \$100.

1. An undersea cable breaks between them $\rightarrow$ **Network Partition ($P$) happens!**
2. I deposit \$50 in London. London balance = \$150. But London cannot tell Tokyo because cable is cut.
3. Now a friend checks my balance in Tokyo. What should Tokyo do?
   - **Choice 1 (Consistency / CP):** Tokyo says _"Sorry, network is down, cannot check balance right now"_ (Error). Data stays safe, but **Availability is broken**.
   - **Choice 2 (Availability / AP):** Tokyo says _"You have \$100"_ (old data). System answered successfully, but **Consistency is broken**.

---

## 3. Why CA System is a Lie in Distributed Systems?

People often ask: _"Can't we just choose CA (Consistency + Availability)?"_

Short answer: **No, not in real distributed systems.**

In the real world, network failure is inevitable. You cannot just "disable" network partitions unless your entire database runs on a single machine (like standalone Postgres/MySQL on your laptop). Once you add a second server, you **MUST** have $P$.

So the real question is always:
$$\text{When a network break happens (P)} \longrightarrow \text{Do you want CP or AP?}$$

---

## 4. CP vs AP Systems Breakdown

                [ User Request ]
                     │
       ┌─────────────┴─────────────┐
       ▼                           ▼

┌───────────┐ ┌───────────┐
│ Node 1 │ │ Node 2 │
└─────┬─────┘ └─────┬─────┘
│ │
└─── X ── [Cable Cut] ── X ──┘

### CP (Consistency + Partition Tolerance)

- If nodes cannot sync, they will reject writes or reads to avoid giving wrong data.
- **Good for:** Money transactions, bank accounts, inventory systems where selling same item twice is a disaster.
- **Examples:** Google Spanner, MongoDB (with majority write concern), HBase, ZooKeeper, etcd.

### AP (Availability + Partition Tolerance)

- Keeps answering fast using whatever local data it has, even if it might be slightly outdated. Nodes will sync later when network fixes.
- **Good for:** Social media likes, YouTube view counters, comments feed, product reviews.
- **Examples:** Cassandra, DynamoDB (default mode), CouchDB.

---

## 5. Quick Comparison Table

| Feature                                | CP Systems                     | AP Systems                              |
| :------------------------------------- | :----------------------------- | :-------------------------------------- |
| **Main Goal**                          | Data must be 100% correct      | Zero downtime, always respond           |
| **What happens during network split?** | User gets timeouts / 503 error | User gets fast reply (maybe stale data) |
| **When to use?**                       | Banking, payment checkouts     | Likes, tweets, activity feeds           |
| **Databases**                          | Spanner, MongoDB, etcd         | Cassandra, DynamoDB, CouchDB            |

---

## 6. Pro Tip: What is PACELC? (Good for Interviews)

CAP theorem only talks about what happens **when a network break occurs**. But what about the other 99% of the time when the network is totally fine?

That's where **PACELC** comes in:

- **If Partition ($P$):** Choose between **$A$** and **$C$**.
- **Else ($E$ - normal time):** Choose between **Latency ($L$)** and **Consistency ($C$)**.

_(Basically, during normal days, if you want super strong consistency, you have to wait for all nodes to acknowledge, so your API latency goes up)._

---

## 7. Quick Summary for My Future Interviews

- Never tell the interviewer you will build a "CA" distributed database. CA only works on single node.
- Availability in CAP is very strict: every non-failing node must return a successful answer without error.
- Pick **CP** when incorrect data loses money; pick **AP** when downtime is worse than stale data.
