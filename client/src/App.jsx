import axios from 'axios'
import { useState } from 'react'
import './styles/App.css'

const App = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    amount: '999',
    email: 'youremail@gmail.com',
    currency: 'BWP'
  })

  const formatDisplayAmount = (cents) => (parseFloat(cents) / 100).toFixed(2)

  const handleInputChange = (e) => {
    const { name, value } = e.target
    if (name === 'amount') {
      const numericValue = value.replace(/[^\d.]/g, '')
      const cents = Math.round(parseFloat(numericValue) * 100)
      setFormData((prev) => ({
        ...prev,
        [name]: isNaN(cents) ? '' : cents.toString()
      }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
    setError('')
  }

  const validateForm = () => {
    if (!formData.email) {
      setError('Email is required')
      return false
    }
    if (!formData.amount || isNaN(formData.amount)) {
      setError('Please enter a valid amount')
      return false
    }
    return true
  }

  const handlePay = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      setIsLoading(true)
      setError('')

      const res = await axios.post('http://localhost:3000/api/pay', formData)
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

  return (
    <div className="page-container">
      <div className="container">
        <h1 className="title">Secure Payment</h1>
        <p className="description">Enter your details to complete the payment</p>

        <form onSubmit={handlePay} className="form">
          <div className="input-group">
            <label className="label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="your@email.com"
              className="input"
              disabled={isLoading}
            />
          </div>

          <div className="input-group">
            <label className="label">Amount (BWP)</label>
            <div className="amount-input">
              <span className="currency-symbol">P</span>
              <input
                type="text"
                name="amount"
                value={formatDisplayAmount(formData.amount)}
                onChange={handleInputChange}
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
      </div>
    </div>
  )
}

export default App
