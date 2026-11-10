# Five Percentage

A responsive loan and Girvi management application built with React, Vite, Tailwind CSS, Express, MongoDB, JWT, bcrypt, and optional Cloudinary image uploads.

## Requirements

- Node.js 20.19+ or 22.12+
- MongoDB Atlas connection string (or a local MongoDB instance)
- Cloudinary account credentials only if you want to upload customer/property photos

## Configure and run

1. Copy `server/.env.example` to `server/.env` and set `MONGODB_URI` and a unique `JWT_SECRET` (at least 32 characters). Set the Cloudinary variables to enable image uploads.
2. In a terminal, install and start the API:

   ```powershell
   cd server
   npm install
   npm run dev
   ```

3. In a second terminal, install and start the frontend:

   ```powershell
   cd client
   npm install
   npm run dev
   ```

4. Open the Vite URL (normally `http://localhost:5173`) and create an account. Vite proxies `/api` requests to the API on port 5000.

For production, set `CLIENT_ORIGIN` to the deployed frontend origin, build the frontend with `npm run build` in `client`, and run the API with `npm start` in `server`. Configure HTTPS and production secrets in your hosting environment; never commit `.env` files.

## Seed test data

With `server/.env` configured for a development/test database, run:

```powershell
cd server
$env:ALLOW_TEST_SEED = "true"
npm run seed:test
Remove-Item Env:ALLOW_TEST_SEED
```

The script refuses to run in production and requires the explicit `ALLOW_TEST_SEED=true` confirmation. It creates five isolated test accounts, 25 customers and loans per account, pledged properties, and sample payments. Loan and payment dates span the last year. It is safe to rerun: the test accounts and records are upserted, not cleared. Existing seed-account passwords are not changed.

New test accounts use the password `FivePercentTest!2026`:

| Account | Email |
|---|---|
| Aarav Mehta | `seed.user1@example.test` |
| Diya Nair | `seed.user2@example.test` |
| Kabir Shah | `seed.user3@example.test` |
| Mira Iyer | `seed.user4@example.test` |
| Rohan Das | `seed.user5@example.test` |

Use these credentials only with local or test data. Point `MONGODB_URI` at a disposable development/test database before running the seeder.

## API

- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/dashboard`
- `GET /api/customers`, `PATCH /api/customers/:id`
- `GET /api/loans`, `GET /api/loans/:id`, `POST /api/loans`, `PATCH /api/loans/:id`, `DELETE /api/loans/:id`
- `GET /api/payments`, `POST /api/payments`
- `POST /api/uploads/images` (Cloudinary; up to 9 JPEG, PNG, or WebP files, 8 MB each)
- `GET /api/health`

All customer, property, loan, payment, and upload endpoints require a bearer token. Database queries are scoped to the authenticated user. Deleting a loan also deletes its associated property and payment history; its customer remains available for other loans.

## Interest and balances

Interest is calculated on the server using simple interest. Monthly interest accrues for each completed monthly period; annual interest accrues daily using `days / 365`. Principal payments reduce outstanding principal and future interest accrues on the reduced balance; interest payments reduce accrued outstanding interest. Payment amounts are checked against the relevant outstanding balance at the supplied payment date. Values are rounded to the nearest paise.

## Checks

```powershell
cd client
npm run build
npm run lint

cd ..\server
npm run check
npm test
```
