# Signal Protocol

> A learning article about how modern end-to-end encrypted messaging systems establish trust, derive encryption keys, protect individual messages, and recover from key compromise.

---

## 1. Introduction

This document is based on my learning of the **Signal Protocol**, a family of cryptographic specifications designed to provide **end-to-end encryption (E2EE)** for private communication.

The ideas behind the Signal Protocol can be used to build systems for:

- 💬 Text messaging
- 📷 Image and video sharing
- 📎 File sharing
- 🎤 Voice notes
- 📞 Voice communication
- 📹 Video communication
- 👥 Group communication
- 📱 Multi-device messaging

The fundamental goal is:

> **Only the communicating endpoints should be able to access the plaintext of a protected message.**

The server should be able to deliver encrypted data without possessing the keys necessary to decrypt the content.

The Signal Protocol is not one single cryptographic algorithm. It is better understood as a **collection of protocols and algorithms that work together**.

The official Signal specifications currently include components such as:

- XEdDSA / VXEdDSA
- X3DH
- PQXDH
- Double Ratchet
- Sesame
- ML-KEM Braid

The Signal documentation describes these as separate specifications that can be composed to build secure communication systems.

---

# 2. What Problem Are We Trying to Solve?

Suppose Alice wants to send a message to Bob.

Without encryption:

```text
Alice
  │
  │ "Hello Bob"
  ▼
Server
  │
  │ "Hello Bob"
  ▼
Bob
```

The server can see:

```text
Hello Bob
```

An attacker who compromises the network may also potentially observe the plaintext if the communication is not adequately protected.

We want:

```text
Alice
  │
  │ "Hello Bob"
  ▼
Encrypt
  │
  │ 8F A2 91 C4 ...
  ▼
Server
  │
  │ 8F A2 91 C4 ...
  ▼
Bob
  │
  │ Decrypt
  ▼
"Hello Bob"
```

The server only handles:

```text
Ciphertext
```

It should not have the keys required to recover:

```text
"Hello Bob"
```

This is the basic idea behind **end-to-end encryption**.

---

# 3. What Does End-to-End Encryption Mean?

E2EE means that encryption happens at the endpoints.

For example:

```text
Alice's Device
     │
     │ Encrypt
     ▼
  Ciphertext
     │
     ▼
   Server
     │
     │ Forward
     ▼
  Ciphertext
     │
     ▼
Bob's Device
     │
     │ Decrypt
     ▼
 Plaintext
```

The important property is:

```text
Server ≠ trusted decryption endpoint
```

The server can still perform many useful operations:

- Authenticate users
- Store public keys
- Store encrypted messages temporarily
- Deliver messages
- Manage device records
- Provide push notifications
- Store encrypted media
- Route messages

But it should not be able to decrypt the actual message contents.

---

# 4. E2EE Is More Than Just Encryption

A common beginner mistake is to think:

> "E2EE means encrypt the message with AES."

That is not enough.

A real E2EE messaging system needs to solve several problems:

```text
                 E2EE
                  │
       ┌──────────┼──────────┐
       │          │          │
       ▼          ▼          ▼
   Identity     Key        Message
   Binding      Agreement  Encryption
       │          │          │
       └──────────┼──────────┘
                  │
                  ▼
           Key Rotation
                  │
                  ▼
        Forward Secrecy
                  │
                  ▼
       Post-Compromise Security
                  │
                  ▼
          Multi-device Support
```

This is why the Signal Protocol is composed of multiple components.

---

# 5. The Main Components

A simplified view of the modern Signal architecture is:

```text
                  Signal Protocol
                         │
       ┌─────────────────┼─────────────────┐
       │                 │                 │
       ▼                 ▼                 ▼
   Identity          Initial Key       Ongoing
   & Signatures      Agreement          Encryption
       │                 │                 │
       │                 ▼                 ▼
       │              PQXDH          Double Ratchet
       │
       ▼
     Keys
       │
       └───────────────┐
                       ▼
                   Sesame
              Multi-device/session
                  management
```

Historically, **X3DH** was used for the initial key agreement. The newer **PQXDH** specification extends this approach with post-quantum protection.

---

# 6. Important Cryptographic Concepts

Before understanding Signal Protocol, it helps to understand a few cryptographic concepts.

---

## 6.1 Symmetric Encryption

Symmetric encryption uses the same secret key to encrypt and decrypt data.

```text
           Secret Key
               │
               ▼
Plaintext ──> Encrypt ──> Ciphertext
                              │
                              ▼
                         Decrypt
                              │
                              ▼
                          Plaintext
```

For example:

```text
Key = K

Encrypt(message, K)
       ↓
Ciphertext

Decrypt(ciphertext, K)
       ↓
Message
```

Symmetric encryption is efficient and is therefore suitable for encrypting large amounts of data.

Examples of symmetric cryptographic primitives include:

- AES
- ChaCha20
- AEAD constructions such as AES-GCM and ChaCha20-Poly1305

---

# 7. Asymmetric Cryptography

Asymmetric cryptography uses a key pair:

```text
Public Key
Private Key
```

The public key can be shared.

The private key must remain secret.

Conceptually:

```text
             Bob
              │
       ┌──────┴──────┐
       ▼             ▼
   Public Key    Private Key
```

Public-key cryptography is useful for:

- Identity
- Authentication
- Key agreement
- Digital signatures

But asymmetric cryptography is generally more expensive than symmetric encryption.

Therefore, a messaging system typically uses public-key cryptography to establish shared secrets and symmetric cryptography to encrypt the actual messages.

---

# 8. Key Agreement

Alice and Bob need to establish a secret that an attacker cannot obtain.

For example:

```text
Alice                         Bob

Private A                  Private B
Public A                   Public B

     \                         /
      \                       /
       └── Key Agreement ────┘
                 │
                 ▼
          Shared Secret
```

The important property is:

```text
Alice Shared Secret
        =
Bob Shared Secret
```

while:

```text
Attacker ≠ Shared Secret
```

The Signal Protocol uses Diffie-Hellman-style key agreement as part of its initial session establishment.

---

# 9. Identity Keys

Every device needs a cryptographic identity.

Conceptually:

```text
Device
  │
  ├── Identity Private Key
  │
  └── Identity Public Key
```

The private key stays on the device.

The public key can be distributed to other users through the server.

For example:

```text
Alice Device
    │
    │ Identity Public Key
    ▼
  Server
    │
    │
    ▼
Bob Device
```

Bob can use Alice's identity information to establish cryptographic trust with Alice's device.

---

# 10. Why Identity Verification Matters

Suppose the server tells Alice:

```text
"This is Bob's public key."
```

How does Alice know that the key actually belongs to Bob?

This is the **identity binding problem**.

If a malicious server can replace Bob's public key:

```text
Bob Key

      ↓

Malicious Key
```

then an attacker could potentially perform a man-in-the-middle attack.

Therefore, secure messaging systems provide mechanisms for users to authenticate identity keys.

Examples include:

- Safety numbers
- Fingerprints
- QR-code verification

The Signal specifications explicitly note that authentication of identity public keys is necessary for users to obtain a cryptographic guarantee about who they are communicating with.

---

# 11. Prekeys

A major problem in messaging is:

> What if Bob is offline?

Alice should still be able to initiate a conversation.

Bob therefore publishes cryptographic material to the server ahead of time.

These are called **prekeys**.

Conceptually:

```text
Bob Device
    │
    │ Upload public key material
    ▼
 Server
    │
    ├── Identity Key
    ├── Signed Prekey
    └── One-Time Prekeys
```

Alice can retrieve this information even when Bob is offline.

---

# 12. Signed Prekey

A signed prekey is a public key associated with Bob's identity.

Conceptually:

```text
Bob Identity Key
       │
       │ Signs
       ▼
Bob Signed Prekey
```

This allows Alice to verify that the signed prekey is associated with Bob's identity key.

The original X3DH specification describes the published bundle as including:

- Identity key
- Signed prekey
- Signature over the signed prekey
- One-time prekeys

---

# 13. One-Time Prekeys

One-time prekeys provide additional protection during session establishment.

Bob may publish:

```text
OPK1
OPK2
OPK3
OPK4
OPK5
...
```

Alice obtains one of them.

Conceptually:

```text
Server

OPK1 ──> Alice
OPK2
OPK3
OPK4
```

After a one-time prekey is consumed, it should not be reused.

This allows multiple asynchronous session initiations while Bob is offline.

---

# 14. Initial Key Agreement

Historically, Signal used **X3DH — Extended Triple Diffie-Hellman** for asynchronous initial key agreement.

Today, Signal has introduced **PQXDH — Post-Quantum Extended Diffie-Hellman** as an evolution of X3DH.

PQXDH is designed to establish a shared secret between two parties even when the recipient is offline and has published cryptographic material to a server.

A simplified flow is:

```text
                 Bob
                  │
         Generate key material
                  │
                  ▼
               Server
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
Identity Key          Prekeys / PQ keys
        │                   │
        └─────────┬─────────┘
                  │
                  ▼
                Alice
                  │
                  │ Fetch bundle
                  ▼
           Key Agreement
                  │
                  ▼
            Shared Secret
```

---

# 15. PQXDH

PQXDH stands for:

> **Post-Quantum Extended Diffie-Hellman**

The purpose of PQXDH is to improve the initial key agreement against future quantum attacks.

The protocol combines classical elliptic-curve cryptography with post-quantum key encapsulation techniques.

The current Signal specification describes PQXDH as providing post-quantum forward secrecy and protection against certain future quantum threats, while its authentication still relies on the security of classical discrete-log-based mechanisms in the current revision.

A simplified conceptual representation is:

```text
Classical Key Agreement
          +
Post-Quantum KEM
          │
          ▼
    Shared Secret
```

The exact protocol involves considerably more cryptographic detail than this simplified model.

---

# 16. Why Post-Quantum Security Matters

Consider an attacker who records encrypted traffic today:

```text
2026
 │
 ├── Capture encrypted messages
 │
 └── Store ciphertext
          │
          ▼
       Years later
          │
          ▼
 Powerful quantum computer
```

If future technology can break the cryptographic assumptions used by the original key agreement, the attacker might attempt to decrypt previously recorded traffic.

This is often described as:

> **Harvest now, decrypt later**

PQXDH is designed to strengthen the initial key establishment against this type of future threat. Signal introduced PQXDH as an upgrade to X3DH specifically to add post-quantum protection.

---

# 17. From Shared Secret to Message Encryption

After the initial key agreement:

```text
Alice
  │
  │ PQXDH
  ▼
Shared Secret
  │
  ▼
Double Ratchet
  │
  ▼
Message Keys
```

The shared secret is not simply reused forever.

Instead, the Signal Protocol uses the **Double Ratchet** to continuously derive new keys.

---

# 18. The Double Ratchet

The Double Ratchet is one of the most important parts of the Signal Protocol.

Its purpose is to continuously evolve the cryptographic state of a conversation.

Instead of:

```text
Conversation
     │
     ▼
One Key
     │
     ├── Message 1
     ├── Message 2
     ├── Message 3
     └── Message 4
```

the system derives different message keys:

```text
Conversation
     │
     ▼
Root Key
     │
     ├── Message Key 1
     ├── Message Key 2
     ├── Message Key 3
     ├── Message Key 4
     └── Message Key 5
```

The current Double Ratchet specification describes a combination of:

1. A symmetric-key ratchet
2. A Diffie-Hellman ratchet

---

# 19. Symmetric-Key Ratchet

The symmetric ratchet can be thought of as a chain of keys.

```text
Chain Key 1
    │
    ▼
 KDF
    │
    ├── Message Key 1
    │
    └── Chain Key 2
             │
             ▼
            KDF
             │
             ├── Message Key 2
             │
             └── Chain Key 3
                      │
                      ▼
                     KDF
                      │
                      └── Message Key 3
```

Every message consumes a new key.

This is important because compromise of one message key should not automatically reveal every other message.

---

# 20. What Is a KDF?

KDF means:

> **Key Derivation Function**

A KDF takes secret material and derives new cryptographic keys from it.

Conceptually:

```text
Secret Input
     │
     ▼
    KDF
     │
     ├── New Key
     └── New Chain State
```

The Double Ratchet specification uses KDF chains for deriving message keys and updating chain keys.

Common constructions used in cryptographic protocols include:

- HKDF
- HMAC-based constructions

---

# 21. Diffie-Hellman Ratchet

The second part of the Double Ratchet is the **Diffie-Hellman ratchet**.

Each side periodically generates a new DH key pair.

Conceptually:

```text
Alice                         Bob

New DH Key Pair            New DH Key Pair
      │                           │
      │──── Public Key ──────────>│
      │                           │
      │<──── Public Key ──────────│
      │                           │
      └──── DH Calculation ───────┘
                   │
                   ▼
             New Secret
                   │
                   ▼
              New Root Key
```

The resulting DH output is fed into the root KDF chain.

This creates a new cryptographic state.

---

# 22. Why Is It Called "Double" Ratchet?

Because there are two ratchets:

```text
              Double Ratchet
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
   Symmetric Ratchet     DH Ratchet
          │                   │
          │                   │
          ▼                   ▼
    Message Keys        New Secrets
          │                   │
          └─────────┬─────────┘
                    ▼
               Root Key
```

The symmetric ratchet advances with messages.

The DH ratchet periodically introduces fresh Diffie-Hellman material.

---

# 23. Forward Secrecy

One of the most important security properties is **forward secrecy**.

Suppose Alice and Bob exchange:

```text
Message 1
Message 2
Message 3
Message 4
```

Each message uses derived key material.

If an attacker obtains the current key state:

```text
Attacker compromises device
             │
             ▼
       Current State
```

the attacker should not automatically be able to decrypt every historical message.

Conceptually:

```text
Past
 │
 ├── Key 1 ❌
 ├── Key 2 ❌
 ├── Key 3 ❌
 │
 ▼
Current Key
```

The protocol continuously evolves its keys so that past message keys are not derivable from later state.

The Double Ratchet specification explicitly describes deriving new keys for every message so that earlier keys cannot be calculated from later ones.

---

# 24. Post-Compromise Security

Forward secrecy protects the past.

But what happens if an attacker compromises a device **right now**?

Without recovery:

```text
Attacker
   │
   ▼
Compromised Device
   │
   ├── Current Keys
   ├── Future Keys
   └── Future Messages
```

The Double Ratchet's DH ratchet helps the communicating parties recover after fresh uncompromised key material is exchanged.

Conceptually:

```text
Compromise
    │
    ▼
Attacker knows current state
    │
    ▼
New DH Ratchet
    │
    ▼
New secret unknown to attacker
    │
    ▼
New keys
    │
    ▼
Security recovery
```

This is commonly referred to as **post-compromise security**.

The current Double Ratchet specification discusses break-in recovery and includes newer post-quantum ratcheting mechanisms as well.

---

# 25. Message Encryption

Once a message key has been derived:

```text
Message Key
     │
     ▼
AEAD Encryption
     │
     ├── Plaintext
     ├── Associated Data
     │
     ▼
Ciphertext + Authentication Tag
```

The message is encrypted using an authenticated encryption construction.

This provides:

1. Confidentiality
2. Integrity
3. Authentication of the protected ciphertext

The Signal Double Ratchet specification defines encryption/decryption using AEAD and associated data.

---

# 26. Associated Data

Encryption does not necessarily mean that every piece of information must be hidden in the same way.

Some metadata can be included as **Associated Data (AD)**.

Conceptually:

```text
             ┌───────────────┐
             │   Plaintext   │
             └───────┬───────┘
                     │
                     ▼
                 Encrypt
                     │
             ┌───────┴────────┐
             │                │
             ▼                ▼
        Ciphertext      Authentication
                            Tag
```

Associated data is authenticated but not necessarily encrypted.

This allows protocol metadata to be integrity-protected without putting it inside the encrypted plaintext.

---

# 27. A Complete Simplified Message Flow

Now we can combine everything.

```text
Alice                              Server                         Bob
  │                                  │                             │
  │                                  │<── Publish key material ────│
  │                                  │                             │
  │──── Fetch Bob's prekeys ────────>│                             │
  │<──── Prekey bundle ──────────────│                             │
  │                                  │                             │
  │                                  │                             │
  │────────── PQXDH ──────────────────────────────────────────────>│
  │                                  │                             │
  │                                  │                             │
  │<──────────── Shared Secret / Session Establishment ──────────>│
  │                                  │                             │
  │                                  │                             │
  │──── Message + Double Ratchet ───>│                             │
  │                                  │──── Encrypted message ─────>│
  │                                  │                             │
  │                                  │                             │
  │<────────────── Double Ratchet response ───────────────────────│
```

The server transports ciphertext but does not need the plaintext encryption keys.

---

# 28. The Server's Role

E2EE does **not** mean the server becomes useless.

The server can still be responsible for:

```text
                Server
                  │
       ┌──────────┼───────────┐
       │          │           │
       ▼          ▼           ▼
   User Data   Public Keys  Messages
       │          │           │
       ▼          ▼           ▼
   Devices     Prekeys     Ciphertext
```

The server may handle:

- User registration
- Device registration
- Public key distribution
- Prekey storage
- Message queues
- Message delivery
- Push notification triggers
- Encrypted media storage
- Multi-device routing

But it should not possess the plaintext message encryption keys.

---

# 29. What Happens When Bob Is Offline?

This is one of the most interesting parts of the architecture.

Suppose:

```text
Alice = Online
Bob   = Offline
```

Bob has already uploaded his public key material:

```text
Bob
 │
 ├── Identity Public Key
 ├── Signed Prekey
 ├── One-Time Prekeys
 └── PQ Prekeys
        │
        ▼
      Server
```

Alice can retrieve this information:

```text
Alice
  │
  ├── Request Bob's prekey bundle
  │
  ▼
Server
  │
  └── Bob's public key material
```

Alice can then establish the initial cryptographic state and send an encrypted message.

The server stores the ciphertext until Bob comes online.

This asynchronous behavior is one of the core design goals of X3DH/PQXDH.

---

# 30. Multi-Device Messaging

Real users rarely have only one device.

For example:

```text
Alice
 ├── Phone
 ├── Laptop
 └── Tablet

Bob
 ├── Phone
 └── Laptop
```

Now encryption becomes more complicated.

Instead of:

```text
Alice → Bob
```

the system may need to reason about:

```text
Alice Phone   → Bob Phone
Alice Phone   → Bob Laptop
Alice Laptop  → Bob Phone
Alice Laptop  → Bob Laptop
```

Each device can have its own cryptographic identity and session state.

This is where **session management** becomes important.

---

# 31. Sesame

**Sesame** is a protocol for managing asynchronous message-encryption sessions in a multi-device environment.

The Signal specification describes Sesame as managing Double Ratchet sessions created through X3DH and handling asynchronous, multi-device communication.

Conceptually:

```text
                 User
                  │
        ┌─────────┼─────────┐
        │         │         │
        ▼         ▼         ▼
      Phone     Laptop    Tablet
        │         │         │
        ▼         ▼         ▼
     Session   Session   Session
        │         │         │
        └─────────┼─────────┘
                  ▼
             Server State
```

The exact implementation can be more sophisticated, but the important concept is:

> **A user may have multiple devices, and each device may have its own cryptographic sessions.**

---

# 32. What About Images and Videos?

A large file should generally not be encrypted directly through the messaging ratchet byte-by-byte.

Instead, a common architecture is:

```text
Image / Video / File
        │
        ▼
Generate random media key
        │
        ▼
Encrypt media
        │
        ▼
Upload encrypted media
        │
        ▼
Storage Server
```

Then the encrypted message contains information that allows the recipient to retrieve and decrypt the media.

Conceptually:

```text
                 Message
                    │
        ┌───────────┴───────────┐
        │                       │
        ▼                       ▼
   Media URL              Media Key
        │                       │
        ▼                       ▼
   Encrypted File          Encrypted/Protected
                           through message system
```

The important architectural principle is:

> **The media server stores ciphertext, while the media decryption key is delivered through the E2EE channel.**

---

# 33. Media Encryption Example

Suppose Alice sends an image.

### Step 1 — Generate a random media key

```text
Random Media Key
       │
       ▼
     K_media
```

### Step 2 — Encrypt the image

```text
Image
  │
  │ K_media
  ▼
AEAD Encryption
  │
  ▼
Encrypted Image
```

### Step 3 — Upload the encrypted image

```text
Alice
  │
  │ Encrypted Image
  ▼
Media Server
```

The media server does not need:

```text
K_media
```

### Step 4 — Send the media key through the E2EE message

```text
Alice
  │
  │ Message contains protected media metadata
  │ + media key information
  ▼
Bob
```

### Step 5 — Bob downloads and decrypts

```text
Bob
 │
 ├── Receive encrypted message
 │
 ├── Obtain media key
 │
 ├── Download encrypted image
 │
 └── Decrypt image
```

---

# 34. Voice Notes

Voice notes can follow essentially the same architecture as media.

```text
Voice Recording
      │
      ▼
Generate Media Key
      │
      ▼
Encrypt Audio
      │
      ▼
Upload Ciphertext
      │
      ▼
Media Storage
```

Then:

```text
E2EE Message
     │
     ├── Media Reference
     ├── Encryption Metadata
     └── Media Key Information
```

The recipient uses the protected information to retrieve and decrypt the voice note.

---

# 35. Voice and Video Calls

Real-time calls introduce additional requirements.

A simplified architecture might look like:

```text
Alice
  │
  │ Signaling
  ▼
Server
  │
  ▼
Bob

Alice ═══════════════════ Bob
       Encrypted Media
```

The server may help with:

- Signaling
- Session establishment
- NAT traversal
- Candidate exchange
- Call routing

But the media encryption should be designed so that the server cannot simply read the audio/video stream.

The exact architecture for real-time encrypted calls is separate from the messaging Double Ratchet and should not be assumed to be identical to message encryption.

---

# 36. Important Distinction: Signal Protocol vs Signal App

These terms are related but not identical.

### Signal Protocol

A collection of cryptographic specifications.

### Signal Messenger

A messaging application that uses Signal's technology and implements a complete messaging system around it.

Therefore:

```text
Signal Protocol
       │
       ├── Cryptographic protocols
       ├── Key agreement
       ├── Ratcheting
       └── Session management

Signal Messenger
       │
       ├── User interface
       ├── Messaging infrastructure
       ├── Push notifications
       ├── Media systems
       ├── Calling
       └── Signal Protocol
```

The Signal documentation describes the protocol specifications separately from its software libraries.

---

# 37. What Happens If the Server Is Compromised?

Suppose an attacker compromises the messaging server.

The attacker may obtain:

```text
Encrypted messages
Public keys
Device information
Encrypted media
Routing information
```

But ideally they should not obtain:

```text
Plaintext messages
Message encryption keys
Media decryption keys
Private identity keys
```

Therefore:

```text
Server Compromise
       │
       ▼
Encrypted Data
       │
       ▼
Still difficult to decrypt
without endpoint keys
```

However, E2EE does **not** make the entire system invulnerable.

If an attacker compromises the endpoint device itself, they may access plaintext while the user is using the application.

---

# 38. E2EE Does Not Protect Everything

This is an important distinction.

E2EE primarily protects **content** from unauthorized intermediaries.

It does not automatically hide all metadata.

Depending on the architecture, a server may still know things such as:

```text
Alice sent something
Bob received something
Timestamp
Message size
IP/network information
Device information
```

Therefore:

```text
E2EE ≠ Complete Anonymity
```

Encryption protects content, while metadata protection is a separate problem.

---

# 39. Key Lifecycle

A useful way to think about the entire protocol is through the lifecycle of keys.

```text
                  Key Lifecycle

                      │
                      ▼
              Identity Keys
                      │
                      ▼
                 Prekeys
                      │
                      ▼
              Initial Agreement
                   PQXDH
                      │
                      ▼
                Shared Secret
                      │
                      ▼
               Double Ratchet
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
       Chain Keys           DH Ratchet
            │                   │
            ▼                   ▼
       Message Keys       New Root Keys
            │                   │
            └─────────┬─────────┘
                      ▼
               New Message Keys
```

---

# 40. Complete Simplified Architecture

Putting everything together:

```text
                         USER A
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
              Identity           Device
                Keys               Keys
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
                     PQXDH / X3DH
                           │
                           ▼
                     Shared Secret
                           │
                           ▼
                    Double Ratchet
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
            Message Keys       Media Keys
                  │                 │
                  ▼                 ▼
              Ciphertext      Encrypted Media
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
                         SERVER
                           │
                  ┌────────┴────────┐
                  │                 │
                  ▼                 ▼
             Message Queue     Media Storage
                  │                 │
                  └────────┬────────┘
                           │
                           ▼
                         USER B
                           │
                           ▼
                      Decryption
```

---

# 41. The Most Important Security Properties

A Signal-style E2EE system attempts to provide several important properties.

## Confidentiality

Only authorized endpoints should be able to read the message.

```text
Ciphertext
   │
   └── Cannot be understood without keys
```

---

## Authentication

Users should be able to establish who they are communicating with.

```text
Alice
  │
  ▼
Authenticated Bob Identity
```

---

## Forward Secrecy

Compromise of current state should not automatically reveal old messages.

```text
Past Keys
   │
   └── Destroyed / inaccessible
```

---

## Post-Compromise Security

After a temporary compromise, fresh ratchet operations can allow the session to recover.

```text
Compromise
    ↓
Fresh Key Agreement
    ↓
New Secret
    ↓
Recovery
```

---

## Message Integrity

An attacker should not be able to modify ciphertext without detection.

```text
Ciphertext
    │
    ▼
Authentication Check
    │
 ┌──┴──┐
 ▼     ▼
Valid Invalid
```

---

# 42. Why Keys Are Deleted

A very important principle in secure messaging is:

> **Do not keep cryptographic material longer than necessary.**

For example:

```text
Message
   │
   ▼
Message Key
   │
   ▼
Decrypt
   │
   ▼
Delete / Advance State
```

If old keys remain permanently available:

```text
Device Storage
 ├── Key 1
 ├── Key 2
 ├── Key 3
 ├── Key 4
 └── Key 5
```

then compromise of the device can expose more historical data.

Key deletion and state advancement therefore play an important role in forward secrecy.

---

# 43. Why We Cannot Just Use One AES Key

A simple implementation might look like:

```text
Alice
  │
  └── AES Key ───────────────> Bob

Message 1 → AES
Message 2 → AES
Message 3 → AES
Message 4 → AES
```

This is dangerous.

If the key is compromised:

```text
Attacker gets AES Key
       │
       ├── Message 1
       ├── Message 2
       ├── Message 3
       └── Message 4
```

Everything protected by that key may be compromised.

A ratcheting design instead looks like:

```text
Root Key
   │
   ▼
Chain Key
   │
   ├── Message Key 1
   │
   ├── Message Key 2
   │
   ├── Message Key 3
   │
   └── Message Key 4
```

and the state continues to evolve.

---

# 44. Why the Server Stores Public Keys

A common misconception is:

> "If the server has the keys, E2EE is broken."

Not necessarily.

The server can store **public keys**.

For example:

```text
Server
 │
 ├── Alice Public Key
 ├── Bob Public Key
 ├── Bob Signed Prekey
 └── Bob One-Time Prekeys
```

These are designed to be distributed publicly.

The important secret material remains on the devices:

```text
Alice Device
 └── Private Keys

Bob Device
 └── Private Keys
```

---

# 45. Public vs Private Key Material

A useful mental model:

```text
                 Device
                   │
          ┌────────┴────────┐
          │                 │
          ▼                 ▼
      Public Keys       Private Keys
          │                 │
          ▼                 ▼
        Server            Device
          │
          ▼
      Distributed
```

The server can distribute public cryptographic information.

It should not receive private key material that would allow it to decrypt users' conversations.

---

# 46. Simplified End-to-End Example

Let's walk through a conversation.

Alice wants to send:

```text
"Hey Bob!"
```

## Step 1 — Bob publishes key material

```text
Bob
 │
 ├── Identity Public Key
 ├── Signed Prekey
 ├── One-Time Prekeys
 └── PQ Prekey Material
        │
        ▼
      Server
```

---

## Step 2 — Alice fetches Bob's public key bundle

```text
Alice
 │
 ├── Request Bob's key bundle
 ▼
Server
 │
 └── Bob's public key material
 ▼
Alice
```

---

## Step 3 — Alice performs initial key agreement

```text
Alice + Bob's Public Key Material
             │
             ▼
           PQXDH
             │
             ▼
       Shared Secret
```

---

## Step 4 — Initialize Double Ratchet

```text
Shared Secret
      │
      ▼
Double Ratchet
      │
      ▼
Message Key
```

---

## Step 5 — Encrypt the message

```text
"Hey Bob!"
     │
     ▼
Message Key
     │
     ▼
AEAD
     │
     ▼
Ciphertext
```

---

## Step 6 — Send ciphertext

```text
Alice
  │
  │ Ciphertext
  ▼
Server
  │
  │ Ciphertext
  ▼
Bob
```

---

## Step 7 — Bob derives the appropriate key

```text
Bob's Ratchet State
        │
        ▼
Message Key
        │
        ▼
Decrypt
```

---

## Step 8 — Bob sees the plaintext

```text
Ciphertext
    │
    ▼
Decrypt
    │
    ▼
"Hey Bob!"
```

---

# 47. Full Mental Model

The entire Signal-style messaging architecture can be remembered as:

```text
                   SIGNAL PROTOCOL
                         │
                         ▼
                 Establish Identity
                         │
                         ▼
                  Publish Prekeys
                         │
                         ▼
                Initial Key Agreement
                       PQXDH
                         │
                         ▼
                  Shared Secret
                         │
                         ▼
                  Double Ratchet
                         │
              ┌──────────┴──────────┐
              ▼                     ▼
       Symmetric Ratchet       DH Ratchet
              │                     │
              └──────────┬──────────┘
                         ▼
                    Message Keys
                         │
                         ▼
                  AEAD Encryption
                         │
                         ▼
                     Ciphertext
                         │
                         ▼
                       Server
                         │
                         ▼
                    Ciphertext
                         │
                         ▼
                      Receiver
                         │
                         ▼
                      Decrypt
                         │
                         ▼
                      Plaintext
```

---

# 48. The Big Picture

The most important thing to understand is that **Signal Protocol is not "one encryption algorithm."**

It is a combination of cryptographic mechanisms solving different problems.

```text
Problem                         Solution

Who am I talking to?       → Identity keys / authentication

How do we start securely? → PQXDH

What if the user is
offline?                   → Prekeys / asynchronous key agreement

How do we encrypt
messages?                  → Message keys + AEAD

What if a key is
compromised?               → Double Ratchet

How do keys keep changing? → Symmetric + DH ratchets

How do multiple devices
work?                      → Session/device management such as Sesame

How do we protect large
media files?               → Separate media encryption + E2EE key delivery
```

---

# 49. Final Summary

The Signal Protocol provides a framework for building secure asynchronous communication systems.

At a high level:

```text
Identity
   ↓
Prekeys
   ↓
PQXDH
   ↓
Shared Secret
   ↓
Double Ratchet
   ↓
Message Keys
   ↓
AEAD Encryption
   ↓
Ciphertext
   ↓
Server
   ↓
Ciphertext
   ↓
Receiver
   ↓
Decryption
```

The most important concepts to remember are:

### 1. Identity Keys

Used to establish cryptographic identity.

### 2. Prekeys

Allow asynchronous session establishment, even when the recipient is offline.

### 3. PQXDH

Establishes the initial shared secret with additional post-quantum protection.

### 4. Double Ratchet

Continuously evolves the session's cryptographic state.

### 5. Message Keys

Different messages use derived key material rather than one permanent encryption key.

### 6. Forward Secrecy

Past messages should remain protected even if later state is compromised.

### 7. Post-Compromise Security

Fresh ratchet operations can allow a compromised session to recover.

### 8. AEAD

Provides authenticated encryption for protected message data.

### 9. Sesame / Session Management

Helps manage asynchronous and multi-device sessions.

### 10. E2EE Media

Large files, images, videos, and voice notes can be encrypted separately, while their decryption information is delivered through the protected messaging channel.

---

# 50. One-Line Mental Model

If I had to remember the entire Signal Protocol in one sentence:

> **Establish identity → establish a shared secret → continuously ratchet keys → encrypt every message with evolving keys → deliver only ciphertext through the server.**

---

# References

The explanations in this document are based primarily on the official Signal Protocol specifications.

- [Signal Protocol Documentation](https://signal.org/docs/)
- [X3DH Specification](https://signal.org/docs/specifications/x3dh/)
- [PQXDH Specification](https://signal.org/docs/specifications/pqxdh/)
- [Double Ratchet Specification](https://signal.org/docs/specifications/doubleratchet/)
- [Sesame Specification](https://signal.org/docs/specifications/sesame/)
- [Signal — Quantum Resistance and the Signal Protocol](https://signal.org/blog/pqxdh/)

The current Signal documentation identifies PQXDH as the post-quantum evolution of X3DH, while the current Double Ratchet specification also describes post-quantum ratcheting work.
