# From Monolith to Microservices: Strangler Pattern, Traffic Migration & Saga Pattern

## We have always learned about microservices and monolithic architecture?

But can we actually answer this question:

> **How do you migrate a monolithic application to microservices?**

This is one of those questions which sounds simple when someone asks it, but when you actually have a running application with real users, real data and real traffic, it becomes a very different problem.

You can't just say:

> "Let's create some microservices and move the code."

Because the old application is already running.

People are already using it.

So the real challenge is:

**How do we slowly move functionality from the monolith to microservices without breaking the existing system?**

---

## 1. First, what do we actually mean by Microservices?

As we already know, in a microservices architecture, the application is divided into smaller services.

For example, an e-commerce application could have:

- **Order Service**
- **Payment Service**
- **User Service**
- **Inventory Service**
- **Delivery Service**

Each service is responsible for a particular business capability.

A service can:

- be written using different technologies if needed
- communicate with other services using REST, gRPC/RPC, messaging, etc.
- have its own database

That last point is especially important.

In a proper microservices architecture, we generally try to avoid having every service directly depend on the same database.

Instead:

```text
             ┌─────────────────┐
             │  Order Service  │
             └────────┬────────┘
                      │
                   Order DB

             ┌─────────────────┐
             │ Payment Service │
             └────────┬────────┘
                      │
                  Payment DB

             ┌─────────────────┐
             │ Delivery Service│
             └────────┬────────┘
                      │
                 Delivery DB
```

This gives each service more ownership over its own data and business logic.

But there is a problem.

**How do we reach this architecture if we already have a big monolithic application running in production?**

---

## 2. We don't usually rewrite the whole Monolith

This is probably the first thing I would keep in mind.

If a company has a large monolithic application, completely rewriting it into microservices is usually a very risky approach.

Imagine an existing application like this:

```text
                    ┌──────────────────────┐
                    │      MONOLITH        │
                    │                      │
                    │  User Module         │
                    │  Order Module        │
                    │  Payment Module      │
                    │  Inventory Module    │
                    │  Delivery Module     │
                    │                      │
                    └──────────┬───────────┘
                               │
                         Common Database
```

This application might already have:

- thousands of users
- years of business logic
- production data
- scheduled jobs
- integrations
- payment systems
- internal dependencies

So if we decide:

> "Let's rewrite everything into microservices."

we are basically throwing a lot of existing working code into the bin and hoping the new system behaves exactly like the old one.

That is not something I would want to do for a production system.

Instead, we can migrate **step by step**.

And this is where the **Strangler Pattern** comes in.

---

## 3. The Strangler Pattern

There is a pattern which is widely used for gradually replacing parts of a legacy system.

It is called the **Strangler Pattern** (or Strangler Fig Pattern).

The basic idea is pretty simple:

> **Don't replace the whole system at once. Slowly replace parts of the old system with new services.**

For example, let's say our monolith contains an **Order Module**.

```text
                 MONOLITH
        ┌────────────────────────┐
        │                        │
        │   User Module          │
        │   Order Module         │
        │   Payment Module       │
        │   Inventory Module     │
        │   Delivery Module      │
        │                        │
        └────────────────────────┘
```

Instead of touching everything, we decide:

> "Let's migrate the Order Module first."

Now we create:

```text
             ORDER-MICROSERVICE
                    │
                Order DB
```

But we don't immediately remove the old Order Module.

That would be risky.

We first make the new service behave correctly and then gradually move traffic towards it.

---

## 4. First Step — Identify a Service

Before writing any new microservice, we need to understand the existing application.

We look at the monolith and ask:

- Which module has a clear business responsibility?
- Which module changes independently?
- Which module has fewer dependencies?
- Which module can be separated without breaking everything?
- Where are the boundaries between different business areas?

For example:

```text
MONOLITH

┌──────────────────────────────────────┐
│                                      │
│  USER       ORDER       PAYMENT      │
│                                      │
│  INVENTORY  DELIVERY    NOTIFICATION │
│                                      │
└──────────────────────────────────────┘
```

We might decide that **Order** is a good candidate.

But simply moving all Order-related files into another project is not enough.

We need to look at the dependencies.

For example:

```text
Order
 ├── User
 ├── Inventory
 ├── Payment
 ├── Database
 └── Notification
```

If Order is directly calling everything inside the monolith, extracting it will be painful.

So before extracting it, we try to make the code boundaries cleaner.

This is where concepts like **low coupling** and **high cohesion** become important.

---

## 5. Low Coupling and High Cohesion

I personally think this is one of the most important parts of the migration.

### High Cohesion

A service should have things that belong together.

For example:

```text
ORDER SERVICE

- create order
- cancel order
- get order
- update order status
- order history
```

These things are closely related to the Order business capability.

So they have high cohesion.

### Low Coupling

At the same time, the Order Service should not be tightly connected to the internal implementation of every other module.

Bad:

```text
Order Service
     │
     ├── directly accesses Payment tables
     ├── directly accesses Inventory tables
     ├── directly accesses User tables
     └── directly accesses Delivery tables
```

Better:

```text
Order Service
      │
      ├──── API ────> Payment Service
      │
      ├──── API ────> Inventory Service
      │
      └──── Event ──> Delivery Service
```

The goal is not to remove every dependency.

The goal is to make the dependencies **explicit and manageable**.

---

## 6. Now Create the New Order Microservice

Once we understand the boundaries, we can create the new service.

For example:

```text
                ORDER MICROSERVICE
              ┌─────────────────────┐
              │                     │
              │ Order API            │
              │ Order Business Logic │
              │                     │
              └──────────┬──────────┘
                         │
                      Order DB
```

The old monolith is still running.

So now we have:

```text
                 ┌──────────────┐
                 │    Client    │
                 └──────┬───────┘
                        │
                        ▼
                 ┌──────────────┐
                 │ API Gateway  │
                 └──────┬───────┘
                        │
              ┌─────────┴─────────┐
              ▼                   ▼
        ┌───────────┐       ┌──────────────┐
        │  Monolith │       │Order Service │
        └───────────┘       └──────────────┘
```

Now comes the interesting part.

**How do we send traffic to the new service without suddenly moving everyone to it?**

---

## 7. Gradually Move the Traffic

This is where gradual traffic shifting becomes useful.

We don't necessarily move:

```text
100% → New Service
```

on day one.

Instead, we can start with a small percentage.

For example:

```text
10% Traffic  → ORDER-MICRO
90% Traffic  → ORDER MODULE
```

We monitor the new service.

We check things like:

- error rate
- response time
- CPU and memory
- database performance
- logs
- business metrics
- failed requests
- unexpected behaviour

If everything looks good, we can increase the traffic.

```text
30% Traffic  → ORDER-MICRO
70% Traffic  → ORDER MODULE
```

Then:

```text
60% Traffic  → ORDER-MICRO
40% Traffic  → ORDER MODULE
```

Then:

```text
90% Traffic  → ORDER-MICRO
10% Traffic  → ORDER MODULE
```

And finally:

```text
100% Traffic → ORDER-MICRO
0% Traffic   → ORDER MODULE
```

Now the old Order Module can eventually be removed from the monolith.

---

## 8. But how do we actually control this traffic?

This part is important.

We need something in front of our services which can decide where a request should go.

For example:

```text
                    CLIENT
                      │
                      ▼
                API Gateway
                      │
             ┌────────┴────────┐
             │                 │
             ▼                 ▼
      ORDER-MICRO         MONOLITH
```

The gateway/load balancer can use different strategies to gradually shift traffic.

For example, depending on the infrastructure, we can use:

- weighted routing
- load balancer rules
- feature flags
- canary deployments
- service mesh traffic policies

So the percentages are not something we manually calculate for every request.

The infrastructure decides where requests should go.

---

## 9. What if the new service fails?

This is one of the biggest reasons we don't immediately send 100% traffic to the new service.

Suppose we have:

```text
90% → ORDER-MICRO
10% → MONOLITH
```

and suddenly the new service starts returning errors.

We can reduce or stop traffic to the new service and send requests back to the old implementation.

For example:

```text
0%   → ORDER-MICRO
100% → MONOLITH
```

This is much safer than discovering a problem after completely removing the old implementation.

Of course, this only works properly if the migration is designed so that the old system can still handle the requests.

---

## 10. And this is basically the Strangler Pattern

The migration looks something like this:

```text
START

                    ┌─────────────┐
                    │  MONOLITH   │
                    │             │
                    │ User        │
                    │ Order       │
                    │ Payment     │
                    │ Inventory   │
                    │ Delivery    │
                    └─────────────┘


                Extract Order


                    ┌─────────────┐
                    │  MONOLITH   │
                    │             │
                    │ User        │
                    │ Payment     │
                    │ Inventory   │
                    │ Delivery    │
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │Order Service│
                    └─────────────┘


             Gradually move traffic


        MONOLITH                 ORDER SERVICE
        90%                           10%
        70%                           30%
        40%                           60%
        10%                           90%
         0%                          100%


                    FINAL

             ┌──────────────┐
             │ Order Service│
             └──────────────┘

        Order functionality is now
        outside the monolith.
```

We can repeat the same process for other parts.

```text
Monolith
   │
   ├── Extract Order
   │
   ├── Extract Payment
   │
   ├── Extract Inventory
   │
   ├── Extract Delivery
   │
   └── ...
```

So instead of one massive rewrite, the monolith slowly becomes smaller.

---

## 11. Now comes another problem — Databases

Okay, now we have our services.

But there is another problem which usually becomes painful during microservice migration.

**The database.**

In the monolith, we might have something like:

```text
                  MONOLITH
                     │
                     ▼
              ┌─────────────┐
              │ Common DB   │
              ├─────────────┤
              │ users       │
              │ orders      │
              │ payments    │
              │ inventory   │
              │ delivery    │
              └─────────────┘
```

This makes transactions relatively easy.

For example, suppose placing an order involves:

1. Creating an order
2. Reducing inventory
3. Creating a payment record

If everything is inside one database, we can potentially use a normal database transaction:

```text
BEGIN TRANSACTION

Create Order
Reduce Inventory
Create Payment

COMMIT
```

If something fails:

```text
ROLLBACK
```

Pretty simple.

But now we have moved to:

```text
Order Service       → Order DB

Payment Service     → Payment DB

Inventory Service   → Inventory DB

Delivery Service    → Delivery DB
```

Now things become different.

---

## 12. The Distributed Transaction Problem

Imagine a customer places an order.

The flow could be:

```text
Customer
   │
   ▼
Order Service
   │
   ├──────> Order DB
   │
   ▼
Payment Service
   │
   ├──────> Payment DB
   │
   ▼
Inventory Service
   │
   └──────> Inventory DB
```

Now imagine:

- Order creation succeeds
- Payment succeeds
- Inventory update fails

We can't simply do:

```text
ROLLBACK
```

across all databases like we did with one database.

Because these are now **different services and different databases**.

This is a distributed transaction problem.

And this is where the **Saga Pattern** comes in.

---

## 13. Saga Pattern

The Saga Pattern breaks one large transaction into a sequence of smaller local transactions.

For example:

```text
Create Order
     │
     ▼
Process Payment
     │
     ▼
Reserve Inventory
     │
     ▼
Create Delivery
```

Each service completes its own local transaction.

If something fails later, we perform a **compensating action** for the earlier successful steps.

For example:

```text
Create Order
     │
     ▼
Payment Successful
     │
     ▼
Inventory Failed
     │
     ▼
Cancel / Compensate Payment
     │
     ▼
Cancel Order
```

The important thing here is:

> We are not doing one big database rollback.

Instead, we are doing separate operations which compensate for the previous operations.

---

## 14. Where does Kafka come into the picture?

This is where I used to get a little confused.

**Saga is a pattern. Kafka is a technology.**

They are not the same thing.

Kafka can be used as the messaging/event backbone for implementing a Saga, but Saga does not require Kafka specifically.

For example:

```text
Order Service
      │
      │ OrderCreated
      ▼
    Kafka
      │
      ▼
Payment Service
      │
      │ PaymentCompleted
      ▼
    Kafka
      │
      ▼
Inventory Service
```

If Inventory fails:

```text
Inventory Service
      │
      │ InventoryFailed
      ▼
    Kafka
      │
      ▼
Payment Service
      │
      │ RefundPayment
      ▼
    Kafka
      │
      ▼
Order Service
      │
      │ CancelOrder
      ▼
```

So Kafka is basically helping services communicate asynchronously through events.

The Saga defines **how the business transaction is coordinated and compensated**.

---

## 15. Two common ways of implementing Saga

There are two common approaches.

### Choreography

In choreography, there is no single central controller.

Each service listens for events and decides what it needs to do.

For example:

```text
Order Service
     │
     │ OrderCreated
     ▼
   Kafka
     │
     ▼
Payment Service
     │
     │ PaymentCompleted
     ▼
   Kafka
     │
     ▼
Inventory Service
```

Each service reacts to events.

This can work nicely when the workflow is simple.

But if the workflow becomes very large, it can become difficult to understand who is responsible for what.

---

### Orchestration

In orchestration, we have a central Saga Orchestrator.

```text
              Saga Orchestrator
                 /     |      \
                /      |       \
               ▼       ▼        ▼
           Order    Payment   Inventory
           Service   Service    Service
```

The orchestrator tells each service what to do.

For example:

```text
Orchestrator
     │
     ├── Create Order
     │
     ├── Process Payment
     │
     ├── Reserve Inventory
     │
     └── Create Delivery
```

If Inventory fails:

```text
Inventory Failed
       │
       ▼
Orchestrator
       │
       ├── Refund Payment
       │
       └── Cancel Order
```

For complicated workflows, orchestration can sometimes make the overall flow easier to understand.

---

## 16. One important thing: Saga does NOT give us a normal ACID transaction

This is something worth remembering.

With one database, we can have something like:

```text
BEGIN

A
B
C

COMMIT
```

Everything commits together.

With Saga:

```text
A → B → C → D
```

Each step can commit independently.

If D fails, we don't magically undo A, B and C at the database level.

Instead, we execute compensating operations:

```text
D FAILED

↓
Compensate C
↓
Compensate B
↓
Compensate A
```

So the system is moving toward a consistent business state through these compensating actions.

This is why designing a Saga is not just:

> "Let's put Kafka in the middle."

We need to think about what happens when every step succeeds, fails, times out, or gets processed more than once.

---

## 17. So, how would I answer the interview question?

If an interviewer asks:

> **"How would you migrate a monolith to microservices?"**

I would explain it something like this:

First, I wouldn't rewrite the whole application at once.

I would identify a business capability inside the monolith which is a good candidate for extraction, for example the **Order Module**.

Then I would understand its dependencies and start separating the code around clear boundaries, keeping **high cohesion and low coupling** in mind.

After that, I would build an independent **Order Microservice** and make sure it behaves correctly with tests and production-like traffic.

Then I would use a gateway, load balancer, feature flag, or similar traffic management mechanism to gradually shift traffic:

```text
10%  → New Service
90%  → Monolith
```

then:

```text
30%  → New Service
70%  → Monolith
```

then:

```text
60%  → New Service
40%  → Monolith
```

and eventually:

```text
100% → New Service
```

During this process, I would monitor errors, latency, logs, resource usage and business metrics. If something goes wrong, I should be able to move traffic back to the monolith.

Once the new service is stable, I can remove that functionality from the monolith.

This gradual migration is commonly associated with the **Strangler Pattern**.

Then, as services become independent, I would also separate their data ownership.

That creates another challenge: transactions across multiple databases.

For example, Order, Payment and Inventory may now have their own databases.

For such distributed business transactions, I can use the **Saga Pattern**, where a business transaction is split into multiple local transactions and failures are handled using compensating actions.

Kafka can be used as the messaging layer for communicating events between services, but Kafka itself is not the Saga Pattern.

---

## 18. The whole picture

Putting everything together:

```text
                         CLIENT
                            │
                            ▼
                     ┌────────────┐
                     │ API Gateway│
                     └─────┬──────┘
                           │
          ┌────────────────┼─────────────────┐
          │                │                 │
          ▼                ▼                 ▼
      Order Service    Payment Service   User Service
          │                │                 │
          ▼                ▼                 ▼
       Order DB        Payment DB          User DB
          │
          │ Events
          ▼
       ┌───────┐
       │ Kafka │
       └───┬───┘
           │
           ├───────────────> Inventory Service
           │                       │
           │                       ▼
           │                  Inventory DB
           │
           └───────────────> Delivery Service
                                   │
                                   ▼
                              Delivery DB
```

And the migration itself looks like:

```text
MONOLITH
   │
   ├── Extract Order
   │
   ├── Test Order Service
   │
   ├── Send small % traffic
   │
   ├── Increase traffic gradually
   │
   ├── Move 100% traffic
   │
   ├── Remove Order from Monolith
   │
   ├── Extract Payment
   │
   ├── Extract Inventory
   │
   └── Continue...
```

Then when services have their own databases:

```text
Order DB
Payment DB
Inventory DB
Delivery DB
```

and a business transaction needs to cross multiple services:

```text
              Saga
               │
     ┌─────────┼─────────┐
     ▼         ▼         ▼
   Order     Payment   Inventory
   Local      Local      Local
Transaction Transaction Transaction
     │         │         │
     └─────────┴─────────┘
          Compensation
          when needed
```

---

## 19. My takeaway

For me, the main thing to remember is that **moving from monolith to microservices is not mainly a code conversion problem**.

It is more about gradually changing the architecture while keeping the existing system running.

The rough flow is:

```text
Monolith
   ↓
Find a good business boundary
   ↓
Reduce coupling
   ↓
Extract one service
   ↓
Test it
   ↓
Gradually shift traffic
   ↓
Monitor everything
   ↓
Move 100% traffic
   ↓
Remove old functionality
   ↓
Repeat
```

And after services start owning their own databases:

```text
Multiple Services
       ↓
Multiple Databases
       ↓
Distributed Transactions
       ↓
Saga Pattern
       ↓
Events / Messaging
       ↓
Kafka can be one option
```

So if someone asks me:

> **"How do you migrate a monolith to microservices?"**

I wouldn't just say:

> "We divide the monolith into small services."

I would say:

> **"We gradually extract business capabilities from the monolith, route traffic between the old and new implementations, monitor the new service, and slowly move the responsibility until the old component can be removed. When data ownership becomes distributed, we handle cross-service business transactions using patterns such as Saga, often with an event or messaging system."**

That sounds much closer to what actually happens in a real production migration.
