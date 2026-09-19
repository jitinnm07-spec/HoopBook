
# HoopBook — MongoDB + Email + Razorpay PayNow

HoopBook is a responsive React/Vite basketball court and training booking app with a real Node/Express backend.

## What changed

- **Local MongoDB:** all users, children, courts, slots, bookings and payments are stored in MongoDB (`mongodb://127.0.0.1:27017/hoopbook` by default). Browser localStorage is only a small UI cache.
- **Server-side authentication:** passwords are hashed with bcrypt; sessions use signed JWTs; admin routes are protected on the server.
- **Booking email:** SMTP/Nodemailer sends an email when a booking request is created and when an admin approves/rejects/waitlists it.
- **Payment email:** after Razorpay signature verification, the backend marks the booking paid and emails the customer.
- **Razorpay:** payment orders are created server-side. The frontend opens Razorpay Checkout. For a Singapore Razorpay account with PayNow enabled, customers can select PayNow; supported desktop flows can show the QR-based PayNow option.
- **Languages:** English, Mandarin/中文, and Malay/Bahasa Melayu are available from the language picker. The selected preference persists locally and is saved to the user's profile.
- **Responsive UI:** mobile phones, tablets and desktop/laptop layouts are supported.
- **No fake payment confirmation:** the old "type a transaction ID" flow is removed. Payment status is based on Razorpay's server-side signature verification.

Razorpay's current Singapore documentation states that its Singapore payment technology supports PayNow, cards and Apple Pay through its licensed payment-services partner Airwallex. See the official docs: https://razorpay.com/docs/payments/payment-gateway/?preferred-country=SG

## Requirements

- Node.js 18+
- MongoDB Community Server running locally
- A Razorpay Singapore account/keys with the required payment methods enabled
- SMTP credentials for email

## Setup

### 1. Start MongoDB

Make sure the local MongoDB service is running.

The default database URL is:

`mongodb://127.0.0.1:27017/hoopbook`

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy:

```text
.env.example -> .env
```

Set at least:

```env
MONGO_URI=mongodb://127.0.0.1:27017/hoopbook
JWT_SECRET=use-a-long-random-secret
CLIENT_URL=http://localhost:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-app-password
MAIL_FROM=HoopBook <your-email@example.com>

RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

For Gmail, use an App Password rather than your normal account password.

### 4. Start the backend

```bash
npm run server
```

The API runs at:

`http://localhost:4000`

Health check:

`http://localhost:4000/api/health`

### 5. Start the frontend

In another terminal:

```bash
npm run dev
```

Open:

`http://localhost:5173`

Or run both:

```bash
npm run dev:all
```

## Admin account

The server creates the first admin automatically:

```text
Email:    admin@hoopbook.local
Password: Admin@123
```

Change these through `.env` before using the application outside local development.

## Payment flow

1. Admin approves a booking and sets its fee in SGD.
2. The customer opens **Pay now**.
3. The backend creates a Razorpay order in **SGD**.
4. Razorpay Checkout opens.
5. The customer selects an available payment method. For a Singapore account with PayNow enabled, select **PayNow**; on supported desktop checkout flows the customer can scan the QR with a banking/payment app.
6. Razorpay returns the order/payment/signature values.
7. The backend verifies the signature using the Razorpay secret.
8. The backend marks the payment and booking as verified/paid.
9. HoopBook sends a confirmation email.

Do not put the Razorpay secret in React/Vite environment variables. Only `RAZORPAY_KEY_ID` may be exposed to the browser as part of the Checkout configuration; the secret stays on the server.

## Email flow

SMTP email is optional for local UI development, but required if you want booking/payment emails.

Emails are sent for:
- booking request received
- booking approved
- booking waitlisted/rejected
- payment confirmed

## MongoDB collections

The backend uses Mongoose models for:

- `users`
- `children`
- `courts`
- `slots`
- `bookings`
- `payments`
- `announcements`

## Project structure

```text
hoopbook/
  server/
    index.js
  src/
    context/
      AuthContext.jsx
      LanguageContext.jsx
    components/
    pages/
    utils/
      storage.js
    styles/
  .env.example
  package.json
```

## Production notes

For production, use:
- HTTPS
- a hosted MongoDB replica set rather than localhost
- a strong random JWT secret
- real SMTP credentials/transactional email service
- Razorpay production keys only after completing merchant onboarding
- Razorpay webhooks in addition to synchronous Checkout verification
- server-side rate limiting and audit logging
- secure cookie sessions if the deployment architecture permits
- CSP and a locked-down CORS origin

The application is intentionally configured for local MongoDB development as requested; `localhost` is not a production database.

## Important PayNow note

PayNow is a Singapore payment method. The app uses Razorpay's Singapore payment integration and displays PayNow as a payment choice when the merchant account has PayNow enabled. The exact Checkout presentation (including QR availability) is controlled by Razorpay/account configuration rather than by generating a fake QR in the React app.
