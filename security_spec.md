# Mahdev Enterprise Security Specification (Phase 25)

## 1. Data Invariants & Zero-Trust Rules
1. **Public Read Integrity**: Public visitors can read catalog, services, portfolio, milestones, companies, and settings ONLY when status is actively `'active'`, `'published'`, or `'approved'`.
2. **Identity & Ownership Lock**: Customers can only read and update their own profile (`users/{userId}` where `request.auth.uid == userId`), bookings, orders, and payments.
3. **No Self-Privilege Escalation**: On profile creation, `role` MUST strictly be `'customer'`. On profile update, `role`, `status`, `uid`, and `createdAt` are IMMUTABLE by non-admins.
4. **Payment Integrity**: Customers CANNOT mark their own orders, bookings, or payments as `'paid'` or alter transactional totals.
5. **Immutable Audit Logs**: Audit log entries (`auditLogs/{logId}`) cannot be modified or deleted by anyone once created.
6. **Administrative Hierarchy**: Permissions cascade from `superAdmin` -> `admin` -> `manager` -> `staff` -> `customer`.

---

## 2. The "Dirty Dozen" Vulnerability Payloads (TDD Test Matrix)

| # | Attack Vector | Target Path | Injected Payload | Expected Result |
|---|---|---|---|---|
| 1 | Unauthenticated PII Scraping | `/users/target-customer-01` | Read attempt without Auth | `PERMISSION_DENIED` |
| 2 | Self-Assigned SuperAdmin | `/users/attacker-uid` | Create `{ role: 'superAdmin', email: 'attacker@evil.com' }` | `PERMISSION_DENIED` |
| 3 | Role Escalation on Profile Update | `/users/customer-uid` | Update `{ role: 'admin' }` | `PERMISSION_DENIED` |
| 4 | Cross-Customer Order Sniffing | `/orders/order-alice-123` | Read by Bob (`uid != alice`) | `PERMISSION_DENIED` |
| 5 | Cross-Customer Booking Sniffing | `/bookings/booking-alice-456` | Read by Bob (`uid != alice`) | `PERMISSION_DENIED` |
| 6 | Unauthorized Price Tampering | `/products/prod-tea-01` | Update `{ price: 0.01 }` by Customer | `PERMISSION_DENIED` |
| 7 | Payment Status Forgery | `/orders/order-bob-789` | Update `{ paymentStatus: 'paid' }` by Customer | `PERMISSION_DENIED` |
| 8 | Unapproved Testimonial Injection | `/testimonials/fake-test-01` | Read unapproved testimonial as Public | `PERMISSION_DENIED` |
| 9 | Unauthenticated Service Draft Read | `/services/srv-secret-draft` | Read `status: 'draft'` by Public | `PERMISSION_DENIED` |
| 10 | Customer Impersonation on Create | `/bookings/booking-new` | Create with `customerId: 'victim-uid'` | `PERMISSION_DENIED` |
| 11 | Audit Log Tampering | `/auditLogs/log-critical-01` | Update or Delete by Staff | `PERMISSION_DENIED` |
| 12 | Blanket Document Dump (`list`) | `/users` | List all user records by Customer | `PERMISSION_DENIED` |
