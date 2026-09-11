# Mahdev Enterprise — Secure Backend Services Architecture (Phase 28)

## 1. Executive Security Strategy

In accordance with enterprise banking and zero-trust security standards, sensitive operations must never be entrusted to client-side browser execution. Client-side state is treated as untrusted user input, requiring strict server-authoritative recalculation, cryptographic validation, rate-limiting, and IAM/role enforcement.

---

## 2. Server-Side Execution Matrix

| Operation Category | Execution Target | Risk Mitigated | Authorization Scope |
| :--- | :--- | :--- | :--- |
| **Payment Verification** | Server (`/api/payment/verify`) | Tampering with payment signatures, counterfeit auth codes | Public / Customer Token + HMAC Check |
| **Payment Webhooks** | Server (`/api/payment/webhook`) | Forged gateway callbacks, replay attacks | HMAC SHA-256 Signature Verification |
| **Order Creation Validation** | Server (`/api/orders/validate-and-create`) | Client-side price modifications, cart tampering, negative quantities, forged coupon rates | Rate-limited Public / Customer Token |
| **Order Status Transitions** | Server (`/api/orders/status-update`) | Unauthorized state transitions (e.g. unverified `paid` or `delivered` states) | Admin / Staff Role Bearer Token |
| **Fiscal Invoice Generation** | Server (`/api/invoices/generate`) | Invoice total tampering, sequence collisions, tax calculation errors | Customer Token / Admin Token |
| **Multi-Channel Notifications** | Server (`/api/notifications/dispatch`) | Exposure of SMTP / SendGrid / Twilio / WhatsApp API secrets to browser | Customer / Admin / Internal Event |
| **Admin Operations & Audit** | Server (`/api/admin/*`) | Privilege escalation, audit tampering | SuperAdmin / Admin Bearer Session |

---

## 3. Server Endpoints & Authorization Specifications

### 3.1. Order Validation & Creation
- **Endpoint**: `POST /api/orders/validate-and-create`
- **Rate Limit**: 20 requests / minute per IP
- **Input Payload**:
  ```json
  {
    "customerId": "usr_99812",
    "customerEmail": "client@enterprise.lk",
    "customerName": "Kasun Fernando",
    "customerPhone": "+94 75 092 8078",
    "shippingAddress": {
      "street": "42 Galle Road",
      "city": "Colombo",
      "country": "Sri Lanka",
      "postalCode": "00300"
    },
    "items": [
      {
        "productId": "prod-tea-01",
        "name": "Single-Estate Ceylon Earl Grey Reserve",
        "unitPrice": 38.0,
        "quantity": 2
      }
    ],
    "couponCode": "WELCOME10",
    "currency": "USD",
    "deliveryMethod": "standard"
  }
  ```
- **Server Actions**:
  1. Recalculates unit prices from authoritative server master catalog (`MASTER_PRICE_REGISTRY`).
  2. Verifies coupon validity and recalculates percentage/fixed discounts.
  3. Computes authoritative shipping fees and 8% VAT/SSCL.
  4. Generates unique order identifier (`ORD-2026-XXXXX`) and cryptographic HMAC SHA-256 `orderSignature`.
  5. Ingests action into `serverAuditLogs`.

---

### 3.2. Order Status Transition
- **Endpoint**: `POST /api/orders/status-update`
- **Authorization**: `Authorization: Bearer <AdminSessionToken>` (Role: `superAdmin`, `admin`, `manager`, `staff`)
- **Input Payload**:
  ```json
  {
    "orderId": "ORD-2026-8941",
    "currentStatus": "confirmed",
    "newStatus": "in_production",
    "trackingNumber": "TRK-DHL-99281",
    "notes": "Packaging sealed at Mahdev High-Altitude Facility."
  }
  ```
- **State Machine Rules**:
  - `pending_payment` $\rightarrow$ `paid`, `cancelled`, `confirmed`
  - `paid` $\rightarrow$ `confirmed`, `refunded`, `in_production`
  - `confirmed` $\rightarrow$ `in_production`, `dispatched`, `cancelled`, `refunded`
  - `in_production` $\rightarrow$ `dispatched`, `cancelled`
  - `dispatched` $\rightarrow$ `delivered`, `cancelled`
  - `delivered` $\rightarrow$ `refunded`

---

### 3.3. Fiscal Invoice Generation
- **Endpoint**: `POST /api/invoices/generate`
- **Rate Limit**: 30 requests / minute per IP
- **Input Payload**:
  ```json
  {
    "orderId": "ORD-2026-8941",
    "customerName": "Kasun Fernando",
    "customerEmail": "client@enterprise.lk",
    "items": [...],
    "subtotal": 148.0,
    "discount": 14.8,
    "tax": 10.66,
    "shipping": 0.0,
    "total": 143.86,
    "currency": "USD",
    "paymentMethod": "LankaPay IPG",
    "transactionId": "TXN-2026-8812-9A4B"
  }
  ```
- **Cryptographic Output**:
  - Generates sequential fiscal number (`INV-2026-XXXXX`).
  - Computes `digitalSignature = HMAC_SHA256(invoiceNumber:orderId:total:SALT)`.
  - Produces official issuer metadata with Mahdev Pvt Ltd VAT and commercial registration numbers.

---

### 3.4. Multi-Channel Notification Router
- **Endpoint**: `POST /api/notifications/dispatch`
- **Rate Limit**: 40 requests / minute per IP
- **Supported Channels**: Email, SMS, WhatsApp Business API
- **Input Payload**:
  ```json
  {
    "type": "order_confirmation",
    "recipient": {
      "name": "Kasun Fernando",
      "email": "kasun@enterprise.lk",
      "phone": "+94 75 092 8078"
    },
    "data": {
      "orderId": "ORD-2026-8941",
      "totalAmount": 143.86,
      "itemCount": 2
    },
    "channels": ["email", "whatsapp"]
  }
  ```
- **Security Safeguard**: Third-party communication provider credentials (SMTP, AWS SES, Twilio, WhatsApp Cloud API) are strictly isolated in server environment variables and never bundled into client distributions.

---

## 4. Firestore IAM vs. Security Rules Cautionary Guidance

> [!CAUTION]
> When executing server-side operations with Firebase Admin SDK or Cloud Functions, queries bypass Firestore Security Rules and operate with Full IAM Root authority.
> **Mandatory Server-Side Guardrails**:
> 1. All server functions must explicitly verify authenticated JWT claims (`req.headers.authorization`) before performing mutations.
> 2. Administrative mutations must verify role membership (`superAdmin`, `admin`, `manager`) in `serverAuditLogs` prior to database writes.
> 3. Strict schema validation is applied in code prior to writing records.

---

## 5. Client Integration Layer
The client invokes these trusted operations via `src/services/backendApiService.ts`, which automatically injects:
- Firebase App Check attestation token (`X-Firebase-AppCheck`)
- Administrative bearer tokens (`Authorization: Bearer <token>`)
- Structured JSON error handling
