import { useState, useEffect } from 'react'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'

function Dashboard({ user }) {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedLink, setSelectedLink] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loadingAnalytics, setLoadingAnalytics] = useState(false)
  const [copied, setCopied] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [loadingQRCode, setLoadingQRCode] = useState(false)
  const [qrError, setQrError] = useState('')

  useEffect(() => {
    fetchLinks()
  }, [])

  const fetchLinks = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await axios.get(`${API_URL}/api/my-links`)
      setLinks(response.data.links)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch links')
    } finally {
      setLoading(false)
    }
  }

  const fetchLinkAnalytics = async (slug) => {
    setLoadingAnalytics(true)
    setSelectedLink(slug)
    setQrCode(null)
    setQrError('')
    try {
      const response = await axios.get(`${API_URL}/api/my-links/${slug}/analytics`)
      setAnalytics(response.data)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      setAnalytics(null)
    } finally {
      setLoadingAnalytics(false)
    }
  }

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const fetchQRCode = async (slugToFetch) => {
    if (!slugToFetch) return
    
    setLoadingQRCode(true)
    setQrError('')
    setQrCode(null)
    
    try {
      const response = await axios.get(`${API_URL}/api/my-links/${slugToFetch}/qrcode`)
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
    if (!qrCode || !selectedLink) return
    
    const link = document.createElement('a')
    link.href = qrCode
    link.download = `qrcode-${selectedLink}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0)

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md rounded-2xl shadow-2xl p-8 text-center border border-gray-200/50 dark:border-dark-border">
          <div className="text-gray-600 dark:text-dark-text-muted">Loading your links...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-10">
        <h2 className="text-5xl font-bold mb-4 bg-gradient-primary bg-clip-text text-transparent">
          My Links Dashboard
        </h2>
        <p className="text-lg text-gray-600 dark:text-dark-text-muted">Manage and track all your shortened URLs</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-dark-border">
          <p className="text-sm text-gray-600 dark:text-dark-text-muted font-medium mb-2">Total Links</p>
          <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">{links.length}</p>
        </div>
        <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-dark-border">
          <p className="text-sm text-gray-600 dark:text-dark-text-muted font-medium mb-2">Total Clicks</p>
          <p className="text-4xl font-bold text-accent-blue">{totalClicks}</p>
        </div>
        <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md rounded-2xl shadow-xl p-6 border border-gray-200/50 dark:border-dark-border">
          <p className="text-sm text-gray-600 dark:text-dark-text-muted font-medium mb-2">Active Links</p>
          <p className="text-4xl font-bold text-green-600 dark:text-green-400">
            {links.filter(link => !link.isExpired).length}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6">
          {error}
        </div>
      )}

      {/* Links List */}
      <div className="bg-white/90 dark:bg-dark-card/90 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 border border-gray-200/50 dark:border-dark-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Your Links</h3>
          <button
            onClick={fetchLinks}
            className="px-4 py-2 bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-dark-text rounded-lg hover:bg-gray-200 dark:hover:bg-dark-border transition-all duration-200 text-sm font-medium"
          >
            Refresh
          </button>
        </div>

        {links.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-card dark:bg-gradient-card-dark flex items-center justify-center">
              <svg className="w-10 h-10 text-gray-400 dark:text-dark-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <p className="text-lg text-gray-500 dark:text-dark-text-muted mb-2 font-medium">No links yet!</p>
            <p className="text-sm text-gray-400 dark:text-dark-text-muted">Start shortening URLs to see them here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {links.map((link) => (
              <div
                key={link._id}
                className="border-2 border-gray-200 dark:border-dark-border rounded-xl p-5 hover:shadow-lg hover:border-primary-300 dark:hover:border-primary-700 transition-all duration-200 bg-gradient-card dark:bg-gradient-card-dark"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <a
                        href={link.shortUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm break-all font-medium transition-colors"
                      >
                        {link.shortUrl}
                      </a>
                      <button
                        onClick={() => copyToClipboard(link.shortUrl)}
                        className="text-gray-400 dark:text-dark-text-muted hover:text-primary-600 dark:hover:text-primary-400 text-sm transition-colors"
                        title="Copy"
                      >
                        {copied ? '✓' : '📋'}
                      </button>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-dark-text-muted break-all mb-3">{link.originalUrl}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs">
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg font-medium">
                        👆 {link.clicks} clicks
                      </span>
                      <span className="px-2 py-1 bg-gray-100 dark:bg-dark-surface text-gray-700 dark:text-dark-text rounded-lg">
                        📅 {new Date(link.createdAt).toLocaleDateString()}
                      </span>
                      {link.isExpired ? (
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg font-medium">
                          ⏰ Expired
                        </span>
                      ) : link.expiresAt ? (
                        <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 rounded-lg">
                          ⏰ Expires: {new Date(link.expiresAt).toLocaleDateString()}
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg font-medium">
                          ✓ No expiration
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => fetchLinkAnalytics(link.slug)}
                    className="px-5 py-2.5 bg-gradient-primary text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/50 transition-all duration-200 text-sm font-semibold transform hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
                  >
                    View Analytics
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Analytics Modal */}
      {selectedLink && (
        <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => {
          setSelectedLink(null)
          setAnalytics(null)
        }}>
          <div className="bg-white/95 dark:bg-dark-card/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50 dark:border-dark-border" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-dark-text">Link Analytics</h3>
              <button
                onClick={() => {
                  setSelectedLink(null)
                  setAnalytics(null)
                }}
                className="text-gray-400 dark:text-dark-text-muted hover:text-gray-600 dark:hover:text-dark-text text-3xl leading-none transition-colors"
              >
                ×
              </button>
            </div>

            {loadingAnalytics ? (
              <div className="text-center py-8 text-gray-600 dark:text-dark-text-muted">Loading analytics...</div>
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
                      <p className="text-sm font-mono text-gray-900 dark:text-dark-text break-all flex-1">{analytics.shortUrl}</p>
                      <button
                        onClick={() => copyToClipboard(analytics.shortUrl)}
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

                {/* QR Code Section */}
                <div className="border-t border-gray-200 dark:border-dark-border pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-dark-text">QR Code</h4>
                    <button
                      onClick={() => fetchQRCode(selectedLink)}
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
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-dark-text-muted">Failed to load analytics</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
