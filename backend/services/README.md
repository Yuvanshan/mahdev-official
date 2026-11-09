# Backend services

Backend services are grouped by business responsibility. HTTP routes and request handlers belong in `backend/api`; service modules should contain the work those handlers orchestrate.

| Area | Responsibility | Main modules |
|---|---|---|
| `booking/` | Booking document generation | `bookingConfirmationPdf.ts`, `bookingDetailsPdf.ts` |
| `communication/` | Email, notifications, WhatsApp and submission alerts | `emailService.ts`, `secureNotificationService.ts`, `submissionAlerts.ts`, `whatsappService.ts` |
| `invoices/` | Secure invoice generation | `secureInvoiceService.ts` |
| `media/` | Admin uploads and Firebase Storage integration | `adminMediaUpload.ts` |
| `orders/` | Authoritative order validation and signing | `secureOrderService.ts` |

Keep provider and persistence details behind these server-side services; do not import backend services into the browser application.
