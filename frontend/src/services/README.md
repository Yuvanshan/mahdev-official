# Frontend services

Frontend services are browser-side adapters and domain orchestration. Views and components should call these services rather than reach into Firebase, storage, or HTTP clients directly.

- Root-level files such as `bookingService.ts`, `authService.ts`, `careerService.ts`, and `notificationService.ts` contain client-facing domain operations.
- `firestore/` contains collection-specific Firestore/Turso access adapters.
- `apiClient.ts`, `backendApiService.ts`, and `lib/` contain transport and SDK integration helpers.
- Keep secrets and privileged database operations in `backend/services/`.

When adding a service, put it next to the closest existing domain service and preserve the browser/server boundary.
