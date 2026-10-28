# Mahdev Pvt Ltd — Production Data Backup & Disaster Recovery Manual (Phase 34)

This operational manual outlines the enterprise data-protection architecture, scheduled backup procedures, Point-in-Time Recovery (PITR), and disaster recovery runbooks for **Mahdev Pvt Ltd**.

---

> **Current database:** Application records now live in Turso. The Firestore export and restore procedures below describe the previous Firestore deployment and do not back up or restore Turso data. The checked-in `firestore-dump.json` is the initial migration source; import it with `npm run migrate:turso`.

## Current Turso Migration Notes

- The server provisions a separate Turso table for each application collection.
- Set `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and `TURSO_DATABASE_NAME` in server runtime secrets before starting the server or migration command.
- The migration command upserts the JSON backup and does not delete existing Turso records.
- Configure and verify database backups for the Turso database in the Turso dashboard before production use.

## Legacy Firestore Backup and Restore Procedures

## 1. Protected Data Collections & Classification

The previous Firestore deployment stored mission-critical transactional, fiscal, and operational records in the configured Firestore database:

| Collection | Data Type | Classification | RPO Target | RTO Target |
| :--- | :--- | :--- | :--- | :--- |
| `/orders` | Order headers, line items, delivery tracking, refunds | **Tier 1 (Mission Critical)** | < 5 Minutes | < 30 Minutes |
| `/bookings` | SWS events, U1 studio sessions, Travels tour bookings | **Tier 1 (Mission Critical)** | < 5 Minutes | < 30 Minutes |
| `/transactions` | LankaPay & Stripe gateway tokens, payment records | **Tier 1 (Mission Critical)** | < 5 Minutes | < 15 Minutes |
| `/users` | Customer profiles, contact details, authentication metadata | **Tier 2 (Confidential)** | < 1 Hour | < 1 Hour |
| `/products` & `/categories` | E-commerce catalog, variant definitions, stock | **Tier 2 (Operational)** | < 4 Hours | < 1 Hour |
| `/system_settings` | Tax percentages, gateway modes, brand parameters | **Tier 2 (Operational)** | < 4 Hours | < 30 Minutes |
| `/audit_logs` | Administrative security audit trails, role changes | **Tier 3 (Compliance)** | < 24 Hours | < 2 Hours |
| `/portfolio` & `/services` | CMS media showcases, division offerings | **Tier 3 (Static Content)** | < 24 Hours | < 4 Hours |

---

## 2. Backup Architecture & Storage Infrastructure

```text
┌─────────────────────────────────────────────────────────────┐
│          Google Cloud Firestore Production Instance         │
│  (Database ID: ai-studio-mahdevpvtltd-b6505c20-...)         │
└──────────────┬───────────────────────────────┬──────────────┘
               │ Continuous (Sub-minute)       │ Daily at 02:00 UTC
               ▼                               ▼
┌───────────────────────────────┐   ┌─────────────────────────┐
│ Point-in-Time Recovery (PITR) │   │ Cloud Scheduler Export  │
│     7-Day Rolling Window      │   │   Cloud Function Trigger│
└───────────────────────────────┘   └────────────┬────────────┘
                                                 │
                                                 ▼
┌─────────────────────────────────────────────────────────────┐
│           Google Cloud Storage (GCS) Cold Backup            │
│   Bucket: `gs://mahdev-firestore-backups-asia-southeast1/`   │
│   ├─ /daily/   (30-day retention with lifecycle deletion)   │
│   ├─ /weekly/  (90-day retention)                           │
│   └─ /annual/  (7-year statutory fiscal tax compliance)     │
└─────────────────────────────────────────────────────────────┘
```

---

## 3. Scheduled Cloud Backup Setup (Google Cloud Platform)

### A. Enable Firestore Point-in-Time Recovery (PITR)
Run via Google Cloud Shell (`gcloud` CLI):
```bash
# Enable continuous PITR (7-day window for granular sub-minute restoration)
gcloud firestore databases update \
  --database="ai-studio-mahdevpvtltd-b6505c20-1d3d-4de0-a4bb-a8fb7ae999dd" \
  --enable-pitr
```

### B. Provision the Dedicated Cloud Storage Backup Bucket
```bash
# Set FIREBASE_PROJECT_ID and FIRESTORE_BACKUP_BUCKET in your shell first.
# Create the dedicated encrypted multi-region backup bucket in Asia-Southeast1.
gsutil mb -p "$FIREBASE_PROJECT_ID" -c STANDARD -l asia-southeast1 "gs://$FIRESTORE_BACKUP_BUCKET/"

# Enable Object Versioning for tamper resistance
gsutil versioning set on "gs://$FIRESTORE_BACKUP_BUCKET/"
```

### C. Configure Cloud Scheduler Automated Nightly Exports
Create a Cloud Scheduler job triggering the Firestore automated export endpoint:
```bash
gcloud scheduler jobs create http firestore-nightly-backup \
  --schedule="0 2 * * *" \
  --time-zone="Asia/Colombo" \
  --uri="https://firestore.googleapis.com/v1/projects/$FIREBASE_PROJECT_ID/databases/$FIRESTORE_DATABASE_ID:exportDocuments" \
  --http-method=POST \
  --message-body="{\"outputUriPrefix\":\"gs://$FIRESTORE_BACKUP_BUCKET/daily\"}" \
  --oauth-service-account-email="$FIREBASE_BACKUP_SERVICE_ACCOUNT_EMAIL"
```

---

## 4. Disaster Recovery & Restoration Procedures

### Scenario 1: Restore Entire Database from Point-in-Time (PITR)
If an accidental deletion or corruption occurred at `2026-08-19T03:10:00Z`:
```bash
# Restore to a new recovery database instance
gcloud firestore databases restore \
  --source-database="$FIRESTORE_DATABASE_ID" \
  --destination-database="$FIRESTORE_RECOVERY_DATABASE_ID" \
  --recovery-time="2026-08-19T03:10:00Z"
```

### Scenario 2: Restore Specific Corrupted Collection (e.g., `/orders`)
```bash
# Import only the orders collection from a specific daily backup snapshot
gcloud firestore import \
  --database="$FIRESTORE_DATABASE_ID" \
  --collection-ids="orders" \
  "gs://$FIRESTORE_BACKUP_BUCKET/daily/$FIRESTORE_BACKUP_TIMESTAMP/"
```

---

## 5. Responsible Administrators & Incident Escalation

| Role | Designee | Contact | Escalation SLA |
| :--- | :--- | :--- | :--- |
| **Principal Incident Commander** | Kamal Jayawardena (VP Infrastructure) | `ops@mahdev.lk` | **Immediate (Within 10 mins)** |
| **Lead Database Administrator** | Systems Engineering Lead | `security@mahdev.lk` | **Within 15 mins** |
| **Customer Support Lead** | Operations Liaison | `support@mahdev.lk` | **Within 30 mins** |

---

## 6. Non-Production Recovery Drill Verification

Recovery procedures should be rehearsed manually against an isolated non-production database before production use. This repository no longer includes an automated recovery drill test script.
