import { useState } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function Shortener({ user }) {
  const [url, setUrl] = useState('')
  const [customSlug, setCustomSlug] = useState('')
  const [useAISlug, setUseAISlug] = useState(false)
  const [expirationHours, setExpirationHours] = useState('')
  const [expirationDays, setExpirationDays] = useState('')
  const [shortUrl, setShortUrl] = useState('')
  const [slug, setSlug] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [analytics, setAnalytics] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [loadingQRCode, setLoadingQRCode] = useState(false)
  const [qrError, setQrError] = useState('')

  const handleShorten = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setShortUrl('')
    setAnalytics(null)

    try {
      const response = await axios.post(`${API_URL}/api/shorten`, {
        url,
        customSlug: customSlug.trim() || undefined,
        useAISlug,
        expirationHours: expirationHours ? parseInt(expirationHours) : undefined,
        expirationDays: expirationDays ? parseInt(expirationDays) : undefined,
      })

      setShortUrl(response.data.shortUrl)
      setSlug(response.data.slug)
      setAnalytics(null)
      setQrCode(null)
      setQrError('')
      
      if (user) {
        setTimeout(() => {
          fetchAnalytics(response.data.slug)
        }, 500)
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to shorten URL')
    } finally {
      setLoading(false)
    }
  }

  const fetchAnalytics = async (slugToFetch) => {
    if (!slugToFetch) return
    
    setLoadingAnalytics(true)
    try {
      const response = await axios.get(`${API_URL}/api/analytics/${slugToFetch}`)
      setAnalytics(response.data)
    } catch (err) {
      if (err.response?.status === 401) {
        setAnalytics(null)
      } else {
        console.error('Failed to fetch analytics:', err)
      }
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const fetchQRCode = async (slugToFetch) => {
    if (!slugToFetch || !user) return
    
    setLoadingQRCode(true)
    setQrError('')
    setQrCode(null)
    
    try {
      const response = await axios.get(`${API_URL}/api/analytics/${slugToFetch}/qrcode`)
      setQrCode(response.data.qrCode)
    } catch (err) {
      if (err.response?.status === 429) {
        setQrError(err.response?.data?.error || 'Rate limit exceeded. Please try again later.')
      } else {
        setQrError(err.response?.data?.error || 'Failed to generate QR code')
      }
      console.error('Failed to generate QR code:', err)
    } finally {
      setLoadingQRCode(false)
    }
  }

  const downloadQRCode = () => {
    if (!qrCode) return
    
    const link = document.createElement('a')
    link.href = qrCode
    link.download = `qrcode-${slug}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const resetForm = () => {
    setUrl('')
    setCustomSlug('')
    setUseAISlug(false)
    setExpirationHours('')
    setExpirationDays('')
    setShortUrl('')
    setSlug('')
    setAnalytics(null)
    setError('')
    setQrCode(null)
    setQrError('')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
          Shorten Your URL
        </h2>
        <p className="text-lg text-gray-600 dark:text-dark-text-muted">
          Create short links with custom slugs, AI generation, and analytics
        </p>
      </div>

      <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 mb-6 border border-gray-200/50 dark:border-dark-border">
        <form onSubmit={handleShorten} className="space-y-6">
          <div>
            <label htmlFor="url" className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">
              Original URL *
            </label>
            <input
              type="url"
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com/very/long/url"
              required
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted"
            />
          </div>

          <div>
            <label htmlFor="customSlug" className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">
              Custom Slug (optional, case-sensitive)
            </label>
            <input
              type="text"
              id="customSlug"
              value={customSlug}
              onChange={(e) => {
                setCustomSlug(e.target.value)
                setUseAISlug(false)
              }}
              placeholder="my-custom-slug"
              disabled={useAISlug}
              className="w-full px-4 py-3 border-2 border-gray-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted disabled:bg-gray-100 dark:disabled:bg-dark-surface/50 disabled:cursor-not-allowed"
            />
          </div>

          <div className="flex items-center p-4 bg-gradient-card dark:bg-gradient-card-dark rounded-xl">
            <input
              type="checkbox"
              id="useAISlug"
              checked={useAISlug}
              onChange={(e) => {
                setUseAISlug(e.target.checked)
                if (e.target.checked) setCustomSlug('')
              }}
              className="h-5 w-5 text-primary-500 focus:ring-primary-500 border-gray-300 dark:border-dark-border rounded cursor-pointer"
            />
            <label htmlFor="useAISlug" className="ml-3 block text-sm font-medium text-gray-700 dark:text-dark-text cursor-pointer">
              ✨ Use AI to generate smart slug
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="expirationHours" className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">
                Expiration (Hours)
              </label>
              <input
                type="number"
                id="expirationHours"
                value={expirationHours}
                onChange={(e) => setExpirationHours(e.target.value)}
                placeholder="24"
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted"
              />
            </div>
            <div>
              <label htmlFor="expirationDays" className="block text-sm font-semibold text-gray-700 dark:text-dark-text mb-2">
                Expiration (Days)
              </label>
              <input
                type="number"
                id="expirationDays"
                value={expirationDays}
                onChange={(e) => setExpirationDays(e.target.value)}
                placeholder="7"
                min="0"
                className="w-full px-4 py-3 border-2 border-gray-300 dark:border-dark-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all duration-200 bg-white dark:bg-dark-surface text-gray-900 dark:text-dark-text placeholder-gray-400 dark:placeholder-dark-text-muted"
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-primary text-white py-4 px-6 rounded-xl font-semibold hover:shadow-lg hover:shadow-primary-500/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Shortening...
              </span>
            ) : (
              'Shorten URL'
            )}
          </button>
        </form>
      </div>

      {shortUrl && (
        <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 mb-6 border border-gray-200/50 dark:border-dark-border animate-fade-in">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Short URL Created!</h3>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <input
              type="text"
              value={shortUrl}
              readOnly
              className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-dark-border rounded-xl bg-gray-50 dark:bg-dark-surface font-mono text-sm text-gray-900 dark:text-dark-text"
            />
            <button
              onClick={() => copyToClipboard(shortUrl)}
              className={`px-6 py-3 rounded-xl font-semibold transition-all duration-200 ${
                copied
                  ? 'bg-green-500 text-white'
                  : 'bg-gradient-primary text-white hover:shadow-lg hover:shadow-primary-500/50'
              } transform hover:scale-[1.02] active:scale-[0.98]`}
            >
              {copied ? '✓ Copied!' : 'Copy'}
            </button>
          </div>
          <button
            onClick={resetForm}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors font-medium"
          >
            Create another short URL
          </button>
        </div>
      )}

      {slug && (
        <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-200/50 dark:border-dark-border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Analytics</h3>
            {user && (
              <button
                onClick={() => fetchAnalytics(slug)}
                disabled={loadingAnalytics}
                className="px-4 py-2 bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border transition-all duration-200 text-sm font-medium disabled:opacity-50"
              >
                {loadingAnalytics ? 'Loading...' : 'Refresh'}
              </button>
            )}
          </div>

          {!user ? (
            <div className="text-center py-8">
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-xl p-6 mb-4">
                <p className="text-yellow-800 dark:text-yellow-400 font-semibold mb-2 text-lg">🔒 Analytics Require Login</p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-4">
                  You need to be logged in to view analytics for your shortened URLs.
                </p>
                <p className="text-yellow-600 dark:text-yellow-400 text-xs">
                  Note: Analytics are only available for URLs created while logged in.
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-dark-text-muted">
                Login or register to track clicks, view creation dates, and monitor your links.
              </p>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-2">Total Clicks</p>
                  <p className="text-4xl font-bold text-blue-700 dark:text-blue-300">{analytics.clicks}</p>
                </div>
                <div className={`bg-gradient-to-br p-6 rounded-xl border ${
                  analytics.isExpired
                    ? 'from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 border-red-200 dark:border-red-800'
                    : 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-800'
                }`}>
                  <p className={`text-sm font-medium mb-2 ${
                    analytics.isExpired
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-green-600 dark:text-green-400'
                  }`}>Status</p>
                  <p className={`text-4xl font-bold ${
                    analytics.isExpired
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-green-700 dark:text-green-300'
                  }`}>
                    {analytics.isExpired ? 'Expired' : 'Active'}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 dark:border-dark-border pt-6 space-y-4">
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-muted font-medium mb-2">Short URL</p>
                  <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
                    <p className="text-sm font-mono text-gray-900 dark:text-dark-text break-all flex-1">{analytics.shortUrl || `${window.location.origin}/${analytics.slug}`}</p>
                    <button
                      onClick={() => copyToClipboard(analytics.shortUrl || `${window.location.origin}/${analytics.slug}`)}
                      className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-xs font-medium px-2 py-1 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                    >
                      {copied ? '✓' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-dark-text-muted font-medium mb-2">Original URL</p>
                  <p className="text-sm font-mono text-gray-900 dark:text-dark-text break-all p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">{analytics.originalUrl}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-dark-text-muted font-medium mb-2">Slug</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-dark-text p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">{analytics.slug}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-dark-text-muted font-medium mb-2">Created At</p>
                    <p className="text-sm text-gray-900 dark:text-dark-text p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
                      {new Date(analytics.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {analytics.expiresAt && (
                  <div>
                    <p className="text-sm text-gray-600 dark:text-dark-text-muted font-medium mb-2">Expires At</p>
                    <p className="text-sm text-gray-900 dark:text-dark-text p-3 bg-gray-50 dark:bg-dark-surface rounded-lg">
                      {new Date(analytics.expiresAt).toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* QR Code Section - Only for logged in users */}
              {user && (
                <div className="border-t border-gray-200 dark:border-dark-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-dark-text">QR Code</h4>
                    <button
                      onClick={() => fetchQRCode(slug)}
                      disabled={loadingQRCode}
                      className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-200 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loadingQRCode ? 'Generating...' : qrCode ? 'Regenerate QR Code' : 'Generate QR Code'}
                    </button>
                  </div>
                  
                  {qrError && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4">
                      {qrError}
                    </div>
                  )}

                  {qrCode ? (
                    <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 dark:bg-dark-surface rounded-xl">
                      <img 
                        src={qrCode} 
                        alt="QR Code" 
                        className="w-48 h-48 border-4 border-white dark:border-dark-card rounded-lg shadow-lg"
                      />
                      <button
                        onClick={downloadQRCode}
                        className="px-4 py-2 bg-gradient-primary text-white rounded-lg hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-200 text-sm font-medium"
                      >
                        Download QR Code
                      </button>
                    </div>
                  ) : !loadingQRCode && (
                    <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted bg-gray-50 dark:bg-dark-surface rounded-xl">
                      <p className="text-sm mb-2">Click "Generate QR Code" to create a QR code for this link</p>
                      <p className="text-xs text-gray-400 dark:text-dark-text-muted">Rate limit: 15 requests per 15 minutes</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted">
              {loadingAnalytics ? 'Loading analytics...' : 'Click refresh to load analytics'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default Shortener
