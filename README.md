# PayGate Payment Integration Demo by [mrdiin.dev](https://github.com/mrdiin)

A full-stack payment integration demo using PayGate's PayWeb3 and PaySubs APIs, built with Express.js and React.

## Features

- Secure one-time payment processing through PayGate PayWeb3
- Recurring billing (subscriptions) through PayGate PaySubs
- Real-time transaction status updates
- Support for multiple currencies
- Configurable billing frequencies (weekly, monthly, bimonthly, quarterly)
- Process-now option for immediate payment on subscription creation
- Responsive UI for all devices
- Comprehensive error handling
- Transaction status tracking

## Prerequisites

- Node.js 16+
- PayGate merchant account or demo one
- PayGate ID and Secret Key or demo one

## Project Structure

- `/api` - Express.js backend server
- `/client` - React frontend application

## Installation

1. Clone the repository
2. Install dependencies:

```bash
# Install API dependencies
cd api
npm install

# Install Client dependencies
cd ../client
npm install
```

3. Configure environment variables:

Create `.env` file in `/api` directory:

```bash
BASE_URL=https://123-abc.ngrok-free.app       # for local development - please use NGROK or other tunneling services to expose your local server to the internet, not localhost, else it will fail
PORT=3000

# PayWeb3 credentials (optional, defaults to sandbox test credentials)
PAYWEB_ID=10011072130
PAYWEB_KEY=secret

# PaySubs credentials (optional, defaults to sandbox test credentials)
PAYSUBS_URL=https://www.paygate.co.za/paysubs/process.trans
PAYSUBS_ID=10011072130
PAYSUBS_KEY=secret
```

> **Note:** PayWeb3 and PaySubs use independent environment variables so they can be configured with different credentials per product.

## Running the Application

1. Start the API server:

```bash
cd api
npm run dev
```

2. Start the React client:

```bash
cd client
npm run dev
```

The application will be available at:

- API: http://localhost:3000
- Client: http://localhost:5173

## API Endpoints

### PayWeb3 (One-Time Payments)

- `POST /api/pay` - Initiate payment transaction
- `POST /api/return` - Handle payment return
- `GET /api/status` - Check payment status
- `POST /api/notify` - Handle PayGate notifications (IPN)

### PaySubs (Recurring Billing)

- `POST /api/paysubs/subscribe` - Initiate subscription with billing details
- `GET|POST /api/paysubs/return` - Handle subscription redirect from PayGate (supports both GET and POST)
- `GET /api/paysubs/status` - View subscription status page

## Checksum Implementation

Both PayWeb3 and PaySubs use MD5 checksums, but with different algorithms:

**PayWeb3:** Fields are concatenated directly (no separator) followed by the encryption key.
```
CHECKSUM = md5(VERSION + PAYGATE_ID + ... + NOTIFY_URL + KEY)
```

**PaySubs:** Fields are joined with pipe (`|`) delimiters, followed by a `|` separator and the encryption key. The `EMAIL` field is conditionally included only when provided.
```
CHECKSUM = md5(VERSION | PAYGATE_ID | ... | PROCESS_NOW_AMOUNT | KEY)
```

## Security Considerations

- All transactions are secured with MD5 checksums
- Sensitive data is never logged
- HTTPS required in production
- Input validation on all endpoints

## Production Deployment

1. Build the client:

```bash
cd client
npm run build
```

2. Set production environment variables (`PAYWEB_ID`, `PAYWEB_KEY`, `PAYSUBS_ID`, `PAYSUBS_KEY`, etc.)
3. Configure SSL/TLS
4. Update CORS settings in API
5. Set up proper monitoring and logging

## Sandbox Testing

For testing with PayGate's sandbox environment:

- **PayGate ID:** `10011072130`
- **Encryption Key:** `secret`
- **PaySubs endpoint:** `https://www.paygate.co.za/paysubs/process.trans`
- **PayWeb3 endpoint:** `https://secure.paygate.co.za/payweb3/process.trans`

The demo app defaults to these credentials when no environment variables are set.

## License

MIT

## Support

For technical support, please contact PayGate directly or raise an issue in this repository.
