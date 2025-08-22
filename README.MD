# MedPharma — Backend

This README describes the backend I built for the MedPharma . It explains what the system does, how it works, what is implemented, and how to run and test it.

---

## Project summary — problem we solve

Patients book online consultations. Once booked they need clear visibility about:

* Their position in the queue.
* Estimated waiting time.
* Whether the doctor is running late.
* When it is their turn to join the call.

This backend provides REST APIs, authentication, and real-time channels to deliver those features.

---

## High-level solution

Here's how it works in one line:

* Users sign up and log in. Patients create appointments for a doctor. The backend stores appointments and computes the queue for each doctor. When appointments or doctor status change, the server broadcasts updates over Socket.IO so clients get live queue position, ETA, and turn alerts.

Architecture (simplified):

```
Mobile / Web Client <----HTTPS----> Express API (REST)
                      \                 |
                       \--Socket.IO----> Socket Server (same process)

Express API <----> MongoDB Atlas (Mongoose)
```

---

## Tech stack

* Node.js (ESM)
* Express
* MongoDB Atlas (Mongoose)
* Socket.IO for real-time events
* Joi for request validation
* bcryptjs + jsonwebtoken for auth
* nodemon for development

---

## What is implemented (status)

**Done:**

* Project structure (config, models, controllers, routes, sockets, utils).
* MongoDB connection and `.env` support.
* Models:

  * `User` (with password hashing).
  * `Doctor` (name, email, phone, availability, avgConsultMinutes, isRunningLate, lateByMinutes).
  * `Appointment` (patient ref, patient info, doctor ref, date, reason, status).
* Authentication:

  * Register, login, `me` endpoint.
  * JWT token generation and verify middleware (`protect`).
  * Role-based middleware (`authorize`).
* Validation with Joi for auth, doctor, appointment inputs.
* Appointment endpoints (create, list, update status, get user appointments).
* Doctor endpoints (CRUD, status patch).
* Queue utilities (`getQueueForDoctor`, `estimateForAppointment`) to compute positions and ETAs.
* Socket.IO helpers (`initIO`, `getIO`) and `queueSocket` subscribe/rooms pattern.
* Real-time broadcast calls added in controllers after DB changes.
* README and API quick docs.

**Pending / Optional:**

* Full Postman collection (can be added).
* Swagger UI (optional).
* Advanced production features: refresh tokens, rate-limiting, request throttling, logging/monitoring, and more tests.

---

## Key files (quick map)

* `src/index.js` — app entry and socket init.
* `src/config/db.js` — MongoDB connection.
* `src/models/User.js` — user schema and password hashing.
* `src/models/Doctor.js` — doctor schema.
* `src/models/Appointment.js` — appointment schema.
* `src/controllers/authController.js` — register/login/me.
* `src/controllers/appointmentController.js` — create/update appointments.
* `src/controllers/doctorController.js` — doctor operations.
* `src/routes/auth.js`, `src/routes/appointments.js`, `src/routes/doctors.js`, `src/routes/queue.js` — routers.
* `src/middleware/auth.js` — `protect`, `authorize`.
* `src/middleware/validate.js` — Joi wrapper.
* `src/validations/*.js` — Joi schemas.
* `src/utils/estimateWait.js` — queue and ETA logic.
* `src/sockets/io.js` — init/get IO.
* `src/sockets/queueSocket.js` — subscribe/unsubscribe handlers.

---

## API — important endpoints

Base URL: `http://localhost:5000/api`

**Auth**

* `POST /api/auth/register`

  * Body: `{ name, email, password, role? }`
  * Response: `{ token, user }`

* `POST /api/auth/login`

  * Body: `{ email, password }`
  * Response: `{ token, user }`

* `GET /api/auth/me` (protected)

  * Header: `Authorization: Bearer <token>`
  * Response: current user object

**Doctors**

* `GET /api/doctors` — list all doctors
* `POST /api/doctors` — create doctor (admin)
* `GET /api/doctors/:id` — doctor detail
* `PUT /api/doctors/:id` — update doctor (admin)
* `PATCH /api/doctors/:id/status` — update status fields (admin)
* `DELETE /api/doctors/:id` — delete doctor (admin)

**Appointments**

* `POST /api/appointments` — create appointment (protected patient)

  * Body: `{ patientName, patientEmail, patientPhone, doctor, date, reason? }`

* `GET /api/appointments/my` — list appointments for logged-in user

* `GET /api/appointments/doctor/:doctorId` — get doctor's queue (doctor/admin)

* `GET /api/appointments` — admin view

* `PATCH /api/appointments/:id/status` — change status (cancel, confirm, complete)

**Queue**

* `GET /api/queue/doctor/:doctorId` — current queue list
* `GET /api/queue/appointment/:id/position` — position & ETA for one appointment

---

## Socket.IO — events and payloads

**Client → Server**

* `queue:subscribe` `{ doctorId?, appointmentId? }` — join rooms. Server replies with current state.
* `queue:unsubscribe` `{ doctorId?, appointmentId? }` — leave rooms.

**Server → Client**

* `queue:state` `{ doctorId, list }` — full queue (list of appointments sorted by date).
* `queue:update` `{ appointmentId, position, etaMinutes }` — updated ETA/position for a single appointment.
* `turn:now` `{ appointmentId, joinUrl }` — signal to patient that it's their turn.
* `doctor:status` `{ doctorId, isRunningLate, lateByMinutes }` — doctor status message.

Rooms used:

* `doctor:{doctorId}` — broadcasts for a doctor's whole queue.
* `appointment:{appointmentId}` — targeted broadcasts for one appointment.

---

## Wait time and position calculation (rules)

* Queue for a doctor is derived from appointments with status `pending` or `confirmed` and sorted by `date`.
* Position for an appointment = number of appointments with earlier `date` in that queue.
* ETA = `position * avgConsultMinutes + doctor.lateByMinutes`.

  * `avgConsultMinutes` is stored on the doctor document. Default is 12 minutes.
  * `doctor.lateByMinutes` is added when doctor marks themself late.

This method is simple and deterministic. It is transparent and easy to explain to users.

---

## Security & best practices implemented

* Passwords are hashed with bcrypt.
* JWT tokens sign user id and role. Token expiry is configurable via `.env`.
* Validation applied to incoming data via Joi.
* CORS is set to `CLIENT_ORIGIN` from `.env`.
* `.env` and `node_modules/` are ignored in `.gitignore`.

Notes for production:

* Use refresh tokens and short access tokens.
* Store secrets in a secret manager (AWS Secrets Manager, Azure Key Vault, etc.).
* Enforce HTTPS and HSTS.
* Add rate-limiting and request throttling.

---

## Dev setup — run locally

1. Clone repo and install:

```bash
git clone <your-repo>
cd medpharma-backend
npm install
```

2. Create `.env` at project root with:

```
PORT=5000
MONGO_URI=<your-mongo-atlas-connection-string>
JWT_SECRET=<generate-a-strong-secret>
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:3000
```

3. Start the server in dev:

```bash
npm run dev
```

4. Confirm the server is up:

* `GET http://localhost:5000/` should return `{"message":"MedPharma API is running..."}`
* Check `MongoDB connected` in logs.

---

## Quick Postman test flow

1. **Register** a patient:

```
POST /api/auth/register
Body: {"name":"Test","email":"test@example.com","password":"secret123"}
```

2. **Login** to get token.

3. **Create a doctor** (use admin token or create a doctor user then attach doctor role).

4. **Create appointments** using patient token. Use the doctor `_id` from step 3.

5. **Subscribe** to socket rooms from a Socket.IO client and observe `queue:state` and `queue:update` when appointments are created or status changes.

---

## Deployment notes

* Use MongoDB Atlas for production DB.
* Set `MONGO_URI` and `JWT_SECRET` in environment variables on the host.
* For Socket.IO, use sticky sessions if you scale to multiple instances (or use a message broker like Redis for Pub/Sub).
* Deploy to Render, Railway, Heroku, or any node host. Set `CLIENT_ORIGIN` accordingly.

---

## Troubleshooting

* `MongoDB connection error` → check `MONGO_URI` and IP access in Atlas.
* `Invalid token` → ensure `JWT_SECRET` matches the signing secret and system time is correct.
* Socket not connecting → check CORS and `CLIENT_ORIGIN`. Verify that the client uses the same protocol and host.

---

## Next steps & improvements

* Add refresh tokens and a refresh flow.
* Add tests (unit + integration) and a CI workflow.
* Add Postman collection and Swagger UI.
* Implement notification delivery (email/push/SMS) for `turn:now`.

---

## License & author

MIT — Samuel Mensah Quaye

If you want, I can now:


