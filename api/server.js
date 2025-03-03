const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const axios = require('axios')
const crypto = require('crypto')
const qs = require('qs')
const morgan = require('morgan')
const exphbs = require('express-handlebars')
require('dotenv').config()

// Environment variables validation
const BASE_URL = process.env.BASE_URL
const PORT = process.env.PORT
const PAYGATE_URL = process.env.PAYGATE_URL
const PAYGATE_ID = process.env.PAYGATE_ID
const PAYGATE_KEY = process.env.PAYGATE_KEY

if (!PAYGATE_ID || !PAYGATE_KEY) {
  console.error('Required environment variables PAYGATE_ID and PAYGATE_KEY must be set')
  process.exit(1)
}

const app = express()

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true })) // Added for form data
app.use(morgan('dev'))

// Add at the top with other global variables
// In production, use a database to store transaction references
const transactionStore = new Map()

// Update app configuration
app.engine('handlebars', exphbs.engine())
app.set('view engine', 'handlebars')
app.set('views', './views')
app.use(express.static('public'))

// Home '/' route
app.get('/', (_req, res) => {
  res.render('home', {
    title: 'Payment Demo by mrdiin.dev'
  })
})

// === STEP 1: Initiate Transaction ===
app.post('/api/pay', async (req, res) => {
  try {
    const { amount, currency = 'BWP', email } = req.body

    // Input validation
    if (!amount || !email) {
      return res.status(400).json({ error: 'Amount and email are required' })
    }

    const formattedAmount = String(amount).replace(/[^0-9]/g, '')

    const transactionData = {
      PAYGATE_ID,
      REFERENCE: `ORDER_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      AMOUNT: formattedAmount,
      CURRENCY: currency,
      RETURN_URL: `${BASE_URL}/api/return`,
      TRANSACTION_DATE: new Date().toISOString().slice(0, 19).replace('T', ' '),
      LOCALE: 'en-bw',
      COUNTRY: 'BWA',
      EMAIL: email,
      NOTIFY_URL: `${BASE_URL}/api/notify`
    }

    // Generate CHECKSUM
    const checksum = generateSignature(transactionData)
    transactionData.CHECKSUM = checksum

    // Log request for debugging
    console.log('PayGate request:', transactionData)

    // Make request to PayGate
    const response = await axios.post(`${PAYGATE_URL}/payweb3/initiate.trans`, qs.stringify(transactionData), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      timeout: 10000 // 10 second timeout, just for in case. Lol.
    })

    const responseParams = parseResponse(response.data)

    // Validate PayGate response
    if (responseParams.ERROR) {
      throw new Error(`PayGate Error: ${responseParams.ERROR}`)
    }

    if (!responseParams.PAY_REQUEST_ID || !responseParams.CHECKSUM) {
      throw new Error('Invalid PayGate response: Missing required fields')
    }

    // Store reference mapped to PAY_REQUEST_ID
    transactionStore.set(responseParams.PAY_REQUEST_ID, transactionData.REFERENCE)

    // Return success response
    res.json({
      success: true,
      payRequestId: responseParams.PAY_REQUEST_ID,
      checksum: responseParams.CHECKSUM,
      paymentUrl: `${PAYGATE_URL}/payweb3/process.trans`,
      reference: transactionData.REFERENCE
    })
  } catch (error) {
    console.error('Payment initiation failed:', {
      message: error.message,
      stack: error.stack,
      response: error.response?.data
    })

    res.status(500).json({
      success: false,
      error: 'Payment initiation failed',
      message: error.message,
      code: error.response?.status
    })
  }
})

// === STEP 2: Handle Return from PayGate ===
app.post('/api/return', async (req, res) => {
  try {
    const data = { ...req.query, ...req.body }
    console.log('Payment Return Data:', data)

    // Simply redirect to status page with PAY_REQUEST_ID
    // Let the notify handler handle the actual transaction verification
    res.redirect(`/api/status?id=${data.PAY_REQUEST_ID}`)
  } catch (error) {
    console.error('Return handler error:', error)
    res.status(400).send('Error processing payment return')
  }
})

// === NEW: Status page endpoint ===
app.get('/api/status', async (req, res) => {
  try {
    const { id } = req.query
    if (!id) {
      throw new Error('Missing PAY_REQUEST_ID')
    }

    // Query PayGate for latest status
    const queryData = {
      PAYGATE_ID,
      PAY_REQUEST_ID: id,
      REFERENCE: transactionStore.get(id)
    }

    const checksum = generateSignature(queryData)
    queryData.CHECKSUM = checksum

    const queryResponse = await axios.post(`${PAYGATE_URL}/payweb3/query.trans`, qs.stringify(queryData), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000
    })

    const queryResult = parseResponse(queryResponse.data)
    const isSuccessful = queryResult.TRANSACTION_STATUS === '1'
    const statusMessage = isSuccessful ? 'Payment Successful' : 'Payment Failed'
    const detailedMessage = getStatusMessage(queryResult.TRANSACTION_STATUS)

    // Render status page HTML (existing HTML template)
    res.render('status', {
      title: 'Payment Status',
      isSuccessful,
      statusMessage,
      detailedMessage,
      reference: queryResult.REFERENCE,
      payRequestId: queryResult.PAY_REQUEST_ID
    })
  } catch (error) {
    console.error('Status page error:', error)
    res.status(400).send('Error checking payment status')
  }
})

// === STEP 3: Handle Notify (IPN) from PayGate ===
app.post('/api/notify', async (req, res) => {
  try {
    const notifyData = req.body
    console.log('Payment Notification Data:', notifyData)

    if (!notifyData.PAY_REQUEST_ID || !notifyData.TRANSACTION_STATUS) {
      throw new Error('Invalid notification data')
    }

    // Verify transaction status
    const isSuccessful = notifyData.TRANSACTION_STATUS === '1'

    console.log('isSuccessful', isSuccessful)

    // Update your database/business logic here
    // await updateOrderStatus(notifyData.REFERENCE, isSuccessful)
    // await sendConfirmationEmail(notifyData.EMAIL)

    // Respond with OK as required by PayGate
    res.send('OK')
  } catch (error) {
    console.error('Notification handler error:', error)
    res.status(400).send('Error processing notification')
  }
})

// === Helper Functions ===
function generateSignature(params) {
  const fields = [
    'PAYGATE_ID',
    'PAY_REQUEST_ID',
    'REFERENCE',
    'AMOUNT',
    'CURRENCY',
    'RETURN_URL',
    'TRANSACTION_DATE',
    'LOCALE',
    'COUNTRY',
    'EMAIL',
    'NOTIFY_URL'
  ]

  const hashString = fields.map((field) => String(params[field] || '')).join('') + PAYGATE_KEY

  return crypto.createHash('md5').update(hashString).digest('hex').toLowerCase()
}

function parseResponse(responseData) {
  if (!responseData || typeof responseData !== 'string') {
    throw new Error('Invalid response data from PayGate')
  }

  return responseData.split('&').reduce((acc, pair) => {
    const [key, value] = pair.split('=').map(decodeURIComponent)
    acc[key] = value
    return acc
  }, {})
}

// Add this helper function for detailed status messages
function getStatusMessage(status) {
  const statusMessages = {
    0: 'Not Done',
    1: 'Approved',
    2: 'Declined',
    3: 'Cancelled',
    4: 'User Cancelled',
    5: 'Received by PayGate',
    7: 'Settlement Voided'
  }
  return statusMessages[status] || 'Unknown Status'
}

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
