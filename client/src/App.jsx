import axios from 'axios'
import { useState } from 'react'
import './styles/App.css'

const API_BASE = 'http://localhost:3005'

const SUBS_FREQUENCIES = [
  { code: '112', label: 'Weekly on Monday' },
  { code: '113', label: 'Weekly on Tuesday' },
  { code: '114', label: 'Weekly on Wednesday' },
  { code: '115', label: 'Weekly on Thursday' },
  { code: '116', label: 'Weekly on Friday' },
  { code: '117', label: 'Weekly on Saturday' },
  { code: '201', label: 'Monthly on 1st' },
  { code: '215', label: 'Monthly on 15th' },
  { code: '228', label: 'Monthly on 28th' },
  { code: '229', label: 'Last day of month' },
  { code: '301', label: 'Every 2 months on 1st' },
  { code: '329', label: 'Every 2 months on last day' },
  { code: '401', label: 'Every 3 months on 1st' },
  { code: '429', label: 'Every 3 months on last day' }
]

const App = () => {
  const [activeTab, setActiveTab] = useState('pay')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // PayNow form state
  const [payForm, setPayForm] = useState({
    amount: '999',
    email: 'youremail@gmail.com',
    currency: 'ZAR'
  })

  // Subscribe form state
  const [subForm, setSubForm] = useState({
    email: 'youremail@gmail.com',
    amount: '3299',
    currency: 'ZAR',
    subsStartDate: new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    subsEndDate: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
    subsFrequency: '228',
    processNow: 'YES',
    processNowAmount: '3299'
  })

  const formatDisplayAmount = (cents) => (parseFloat(cents) / 100).toFixed(2)

  const handlePayInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'amount') {
      const numericValue = value.replace(/[^\d.]/g, '')
      const cents = Math.round(parseFloat(numericValue) * 100)
      setPayForm((prev) => ({
        ...prev,
        [name]: isNaN(cents) ? '' : cents.toString()
      }))
    } else {
      setPayForm((prev) => ({ ...prev, [name]: value }))
    }
    setError('')
  }

  const handleSubInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'amount' || name === 'processNowAmount') {
      const numericValue = value.replace(/[^\d.]/g, '')
      const cents = Math.round(parseFloat(numericValue) * 100)
      setSubForm((prev) => ({
        ...prev,
        [name]: isNaN(cents) ? '' : cents.toString()
      }))
    } else {
      setSubForm((prev) => ({ ...prev, [name]: value }))
    }
    setError('')
  }

  const validatePayForm = () => {
    if (!payForm.email) {
      setError('Email is required')
      return false
    }
    if (!payForm.amount || isNaN(payForm.amount)) {
      setError('Please enter a valid amount')
      return false
    }
    return true
  }

  const validateSubForm = () => {
    if (!subForm.email) {
      setError('Email is required')
      return false
    }
    if (!subForm.amount || isNaN(subForm.amount)) {
      setError('Please enter a valid subscription amount')
      return false
    }
    if (!subForm.subsStartDate || !subForm.subsEndDate) {
      setError('Subscription start and end dates are required')
      return false
    }
    if (subForm.processNow === 'YES' && (!subForm.processNowAmount || isNaN(subForm.processNowAmount))) {
      setError('Please enter a valid process now amount')
      return false
    }
    return true
  }

  const handlePay = async (e) => {
    e.preventDefault()
    if (!validatePayForm()) return

    try {
      setIsLoading(true)
      setError('')

      const res = await axios.post(`${API_BASE}/api/pay`, payForm)
      const { payRequestId, checksum, paymentUrl } = res.data

      if (!payRequestId || !checksum) {
        throw new Error('Invalid response from payment server')
      }

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = paymentUrl

      const fields = { PAY_REQUEST_ID: payRequestId, CHECKSUM: checksum }
      Object.entries(fields).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      setIsLoading(false)
      console.error('Payment error:', error)
      setError(error.response?.data?.message || error.message || 'Payment initiation failed')
    }
  }

  const handleSubscribe = async (e) => {
    e.preventDefault()
    if (!validateSubForm()) return

    try {
      setIsLoading(true)
      setError('')

      const res = await axios.post(`${API_BASE}/api/paysubs/subscribe`, subForm)
      const { formFields, paymentUrl } = res.data

      if (!formFields || !formFields.CHECKSUM) {
        throw new Error('Invalid response from subscription server')
      }

      const form = document.createElement('form')
      form.method = 'POST'
      form.action = paymentUrl

      Object.entries(formFields).forEach(([key, value]) => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = key
        input.value = value
        form.appendChild(input)
      })

      document.body.appendChild(form)
      form.submit()
    } catch (error) {
      setIsLoading(false)
      console.error('Subscription error:', error)
      setError(error.response?.data?.message || error.message || 'Subscription initiation failed')
    }
  }

  const today = new Date().toISOString().slice(0, 10)

  return (
    <div className="page-container">
      <div className="container">
        <h1 className="title">Secure Payment</h1>
        <p className="description">Pay once or subscribe with recurring billing</p>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'pay' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('pay')
              setError('')
            }}
          >
            Pay Now
          </button>
          <button
            className={`tab ${activeTab === 'subscribe' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('subscribe')
              setError('')
            }}
          >
            Subscribe
          </button>
        </div>

        {activeTab === 'pay' && (
          <form onSubmit={handlePay} className="form">
            <div className="input-group">
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                value={payForm.email}
                onChange={handlePayInputChange}
                placeholder="your@email.com"
                className="input"
                disabled={isLoading}
              />
            </div>

            <div className="input-group">
              <label className="label">Amount (ZAR)</label>
              <div className="amount-input">
                <span className="currency-symbol">R</span>
                <input
                  type="text"
                  name="amount"
                  value={formatDisplayAmount(payForm.amount)}
                  onChange={handlePayInputChange}
                  className="input amount-field"
                  disabled={isLoading}
                />
              </div>
            </div>

            {error && <div className="error">{error}</div>}

            <button type="submit" className="button" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Pay Now'}
            </button>
          </form>
        )}

        {activeTab === 'subscribe' && (
          <form onSubmit={handleSubscribe} className="form">
            <div className="input-group">
              <label className="label">Email</label>
              <input
                type="email"
                name="email"
                value={subForm.email}
                onChange={handleSubInputChange}
                placeholder="your@email.com"
                className="input"
                disabled={isLoading}
              />
            </div>

            <div className="input-group">
              <label className="label">Subscription Amount (ZAR)</label>
              <div className="amount-input">
                <span className="currency-symbol">R</span>
                <input
                  type="text"
                  name="amount"
                  value={formatDisplayAmount(subForm.amount)}
                  onChange={handleSubInputChange}
                  className="input amount-field"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="input-row">
              <div className="input-group">
                <label className="label">Start Date</label>
                <input
                  type="date"
                  name="subsStartDate"
                  value={subForm.subsStartDate}
                  onChange={handleSubInputChange}
                  className="input"
                  min={today}
                  disabled={isLoading}
                />
              </div>
              <div className="input-group">
                <label className="label">End Date</label>
                <input
                  type="date"
                  name="subsEndDate"
                  value={subForm.subsEndDate}
                  onChange={handleSubInputChange}
                  className="input"
                  min={subForm.subsStartDate || today}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="label">Billing Frequency</label>
              <select
                name="subsFrequency"
                value={subForm.subsFrequency}
                onChange={handleSubInputChange}
                className="input"
                disabled={isLoading}
              >
                {SUBS_FREQUENCIES.map((f) => (
                  <option key={f.code} value={f.code}>
                    {f.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="label">Process Payment Now</label>
              <div className="radio-group">
                <label className="radio-label">
                  <input
                    type="radio"
                    name="processNow"
                    value="YES"
                    checked={subForm.processNow === 'YES'}
                    onChange={handleSubInputChange}
                    disabled={isLoading}
                  />
                  Yes
                </label>
                <label className="radio-label">
                  <input
                    type="radio"
                    name="processNow"
                    value="NO"
                    checked={subForm.processNow === 'NO'}
                    onChange={handleSubInputChange}
                    disabled={isLoading}
                  />
                  No
                </label>
              </div>
            </div>

            {subForm.processNow === 'YES' && (
              <div className="input-group">
                <label className="label">Process Now Amount (ZAR)</label>
                <div className="amount-input">
                  <span className="currency-symbol">R</span>
                  <input
                    type="text"
                    name="processNowAmount"
                    value={formatDisplayAmount(subForm.processNowAmount)}
                    onChange={handleSubInputChange}
                    className="input amount-field"
                    disabled={isLoading}
                  />
                </div>
              </div>
            )}

            {error && <div className="error">{error}</div>}

            <button type="submit" className="button" disabled={isLoading}>
              {isLoading ? 'Processing...' : 'Subscribe'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

export default App
