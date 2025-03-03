# PayGate Payment Integration Demo by mrdiin.dev

A full-stack payment integration demo using PayGate's PayWeb3 API, built with Express.js and React.

## Features

- Secure payment processing through PayGate PayWeb3
- Real-time transaction status updates
- Support for multiple currencies
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

```
PAYGATE_URL=https://secure.paygate.co.za
PAYGATE_ID=<your_paygate_id> # for testing use "10011072130" (PayGate Demo ID)
PAYGATE_KEY=<your_paygate_key> # for testing use "secret" (PayGate Demo Secret Key)
PORT=3000
BASE_URL=https://ngrok.com/api/v1 # for local development - please use NGROK or other tunneling services to expose your local server to the internet, not localhost, else it will fail
```

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

- `POST /api/pay` - Initiate payment transaction
- `POST /api/return` - Handle payment return
- `GET /api/status` - Check payment status
- `POST /api/notify` - Handle PayGate notifications (IPN)

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

2. Set production environment variables
3. Configure SSL/TLS
4. Update CORS settings in API
5. Set up proper monitoring and logging

## License

MIT

## Support

For technical support, please contact PayGate directly or raise an issue in this repository.
