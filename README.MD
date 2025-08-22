# MedPharma — Backend

This README documents the current backend for the MedPharma assignment. It reflects the implementation completed during development: authentication, secure admin onboarding, appointment & doctor management, queue logic, and real‑time notifications.

---

## Project goal

Provide a backend that allows patients to book online consultations and gives them live visibility of:

* their position in the queue;
* an estimated waiting time (ETA);
* whether the doctor is running late;
* when it is their turn to join the call.

The backend exposes REST APIs, enforces authentication and validation, computes queues, and broadcasts real‑time events through Socket.IO.

---

## High-level design

* **Clients (mobile/web)** interact with the Express REST API for CRUD and use Socket.IO to subscribe to real‑time updates.
* **MongoDB Atlas (Mongoose)** stores users, doctors, appointments, and invites.
* **Socket.IO** runs in the same process, using rooms for `doctor:{id}` and `appointment:{id}`.
* Controllers emit broadcasts **after** DB writes so events reflect committed state.

Architecture (simplified):

```
Client (Web/Mobile)
  ├─ HTTPS REST API ──> Express (auth, CRUD, queue endpoints)
  └─ WebSocket (Socket.IO) ──> receive queue:state / queue:update / turn:now

Express API <──> MongoDB Atlas (Mongoose)
```

---

## Tech stack

* Node.js (ESM)
* Express
* MongoDB Atlas (Mongoose)
* Socket.IO (real-time)
* Joi (input validation)
* bcryptjs + jsonwebtoken (auth)
* nodemon (development)

---

## What’s implemented (current status)

**Core features implemented:**

* Project structure and modular code layout. ✅
* MongoDB connection via `src/config/db.js`. ✅
* Models: `User`, `Doctor`, `Appointment`, `Invite`. ✅
* Authentication:

  * Patient registration (public) — forced to `role: patient`. ✅
  * Login and `GET /api/auth/me`. ✅
  * JWT token issuance and `protect` middleware. ✅
  * `authorize` middleware for role-based access. ✅
* Admin onboarding:

  * One‑time `scripts/seedAdmin.js` to create the initial admin. ✅
  * Invite flow: `Invite` model and endpoints for admins to create single‑use, expiring invite tokens. ✅
* Doctor management: CRUD and `PATCH /api/doctors/:id/status` to set `isRunningLate`, `lateByMinutes`, and `avgConsultMinutes`. ✅
* Appointment management: create (patient-bound), list, update status, and admin/doctor views. ✅
* Queue utilities: `getQueueForDoctor()` and `estimateForAppointment()` used to compute position and ETA. ✅
* Real‑time: `src/sockets/io.js` and `src/sockets/queueSocket.js` plus broadcasts from controllers after DB changes. ✅
* Joi validation for request bodies and a generic validator middleware. ✅
* README, API summary, and operational/security notes. ✅

**Optional / future improvements:**

* Postman collection & Newman CI (recommended).
* Swagger/OpenAPI documentation.
* Refresh tokens, MFA, SSO/SCIM for enterprise admin management.
* Production logging & monitoring, rate limiting.

---

## File map (key files)

```
src/
  config/db.js
  index.js
  models/
    User.js
    Doctor.js
    Appointment.js
    Invite.js
  controllers/
    authController.js
    authInviteController.js
    doctorController.js
    appointmentController.js
    inviteController.js
  routes/
    auth.js
    doctors.js
    appointments.js
    admin.js
    queue.js
  middleware/
    auth.js        # protect + authorize
    validate.js    # Joi wrapper
  validations/
    authValidation.js
    doctorValidation.js
    appointmentValidation.js
  sockets/
    io.js
    queueSocket.js
  utils/
    estimateWait.js
scripts/
  seedAdmin.js

README.md
.env.example
```

---

## Environment variables

Create a `.env` at the project root (do not commit). Required keys:

```
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.../medpharma
JWT_SECRET=<strong-random-secret>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000
```

Optional keys for seed script:

```
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=ChangeThisNow!
```

Generate a secure `JWT_SECRET` locally:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## Run locally (development)

```bash
# install deps
npm install

# dev server
npm run dev
```

Verify:

* `GET http://localhost:5000/` → `{ "message": "MedPharma API is running..." }`
* Server logs show `MongoDB connected` when DB is available.

---

## Important API endpoints (summary)

Base URL: `http://localhost:<PORT>/api`

### Auth

* `POST /api/auth/register` — register **patient** (public). Requests cannot create admin directly.

  * Body: `{ name, email, password }`
* `POST /api/auth/login` — login returns `{ token, user }`.
* `GET /api/auth/me` — protected: returns current user.
* `POST /api/auth/register/invite` — register using an **invite token** (creates admin/doctor as invited).

### Admin (protected)

* `POST /api/admin/invites` — create an invite token (admin only).

### Doctors

* `GET /api/doctors`
* `POST /api/doctors` — create doctor (admin)
* `GET /api/doctors/:id`
* `PUT /api/doctors/:id` — update doctor (admin)
* `PATCH /api/doctors/:id/status` — update `isRunningLate`, `lateByMinutes`, `avgConsultMinutes` (admin)
* `DELETE /api/doctors/:id` — delete doctor (admin)

### Appointments

* `POST /api/appointments` — create appointment (protected patient)

  * Body: `{ patientName, patientEmail, patientPhone, doctor, date, reason? }`
* `GET /api/appointments/my` — list appointments for logged-in patient
* `GET /api/appointments/doctor/:doctorId` — get doctor's queue (doctor/admin)
* `PATCH /api/appointments/:id/status` — update status (cancel, confirm, complete)
* `GET /api/appointments` — admin view of all appointments

### Queue

* `GET /api/queue/doctor/:doctorId` — current queue list
* `GET /api/queue/appointment/:id/position` — position & ETA for an appointment

---

## Socket.IO events and payloads

**Client → Server**

* `queue:subscribe` `{ doctorId?, appointmentId? }` — join rooms; server responds with current state.
* `queue:unsubscribe` `{ doctorId?, appointmentId? }` — leave rooms.

**Server → Client**

* `queue:state` `{ doctorId, list }` — full queue list for the doctor.
* `queue:update` `{ appointmentId, position, etaMinutes }` — single appointment update.
* `turn:now` `{ appointmentId, joinUrl }` — prompt patient to join the call.
* `doctor:status` `{ doctorId, isRunningLate, lateByMinutes }` — doctor status broadcast.

Rooms:

* `doctor:{doctorId}` — broadcasts for a doctor's queue.
* `appointment:{appointmentId}` — targeted broadcasts for a single appointment.

---

## Queue & ETA calculation rules

* Queue = appointments with `status` in \[`pending`, `confirmed`], sorted ascending by `date`.
* Position = number of appointments with an earlier `date` in that queue.
* ETA (minutes) = `position * avgConsultMinutes + doctor.lateByMinutes`.

  * `avgConsultMinutes` stored on Doctor model; default = 12.
  * `lateByMinutes` is applied when doctor marks themselves late.

This method is deterministic and explainable. It is easy to improve later (e.g., incorporate historical consult durations, no-shows, or machine learning estimates).

---

## Broadcasts — placement & behavior

* Broadcasts are invoked in controllers **after** DB operations complete. That ensures events reflect committed state.
* Emissions are wrapped in `try/catch` and are best-effort; failures don’t break HTTP responses.
* Typical events emitted after operations:

  * After `createAppointment`: `queue:state` (doctor room) + `queue:update` (appointment room).
  * After `updateAppointmentStatus` or cancellation: same as above.
  * After `updateDoctorStatus`: `doctor:status` + `queue:state`.

---

## Admin onboarding & security model

* **Seed admin**: `scripts/seedAdmin.js` creates the first admin (run once). Do not commit secrets used for seeding.
* **Invite flow**: admins generate single-use, expiring invite tokens for additional admins/doctors. In production, send tokens via email.
* **Public registration** is limited to patients; admin creation is disabled on the public route.
* **Protect admin endpoints** using `protect` + `authorize('admin')` middleware.

Operational recommendations:

* Use email verification for invites.
* Log invite creation and admin actions for audit.
* Enforce MFA for admin accounts in production.

---

## Testing checklist (Postman)

Create a Postman environment with `BASE_URL`, `TOKEN`, `DOCTOR_ID`, `APPOINTMENT_ID`, `INVITE_TOKEN`.

Flow:

1. Register patient → login → save token.
2. Seed/create admin or create invite via an admin account.
3. Create a doctor (admin credentials required) → save `DOCTOR_ID`.
4. As patient, create appointment using `DOCTOR_ID` → save `APPOINTMENT_ID`.
5. Verify `GET /api/queue/appointment/:id/position` returns `position` and `etaMinutes`.
6. Start Socket.IO client, `queue:subscribe` and verify `queue:state`/`queue:update`/`turn:now` on mutations.

Export the Postman collection to `docs/postman_collection.json` for repeatable tests.

---

## Deployment & production notes

* Use managed secrets (AWS Secrets Manager / Azure Key Vault). Don’t store `.env` in the repo.
* For horizontal scaling of Socket.IO, use a Redis adapter or managed Pub/Sub and sticky sessions.
* Add monitoring/alerts for failed broadcasts, high error rates, and suspicious auth behavior.
* Consider short access tokens + refresh tokens, and SSO for enterprise admin provisioning.

---

## Pre-push checklist

1. Ensure `.gitignore` excludes `node_modules/`, `.env`, and log files.
2. Commit `.env.example` (no secrets).
3. Verify no secrets are present in staged commits (`git grep JWT_SECRET || true`).
4. Run `npm ci` and any tests/linting scripts.
5. Commit and push to remote.

If a secret has been pushed previously, rotate it immediately and purge the history using `git filter-repo` or BFG.

---


---

## License & author

MIT — Samuel Mensah Quaye

---


