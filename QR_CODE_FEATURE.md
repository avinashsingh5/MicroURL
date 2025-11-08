# QR Code Feature Documentation

## Overview

QR code generation is now available for all shortened URLs. QR codes are generated on-demand and are not stored in the database to save resources.

## Features

- ✅ **On-demand Generation** - QR codes are generated when requested, not stored
- ✅ **Rate Limited** - 15 requests per 15 minutes per user to prevent misuse
- ✅ **User Authentication Required** - Only logged-in users can generate QR codes
- ✅ **Download Support** - Users can download QR codes as PNG images
- ✅ **Regeneration** - Users can regenerate QR codes anytime (within rate limits)

## Rate Limiting

### User-Based Rate Limiting
- **Limit**: 15 QR code generations per 15 minutes per user
- **Scope**: Per authenticated user (based on user ID)
- **Storage**: In-memory (resets on server restart)
- **Cleanup**: Automatic cleanup of expired entries every 5 minutes

### IP-Based Rate Limiting
- **Limit**: 30 requests per 15 minutes per IP address
- **Purpose**: Additional protection against abuse
- **Scope**: Per IP address

### Rate Limit Error Response
```json
{
  "error": "Rate limit exceeded. You can generate 15 QR codes per 15 minutes. Please try again in X minute(s).",
  "retryAfter": 900
}
```

## API Endpoints

### GET `/api/my-links/:slug/qrcode`
Generate QR code for a user's link.

**Authentication**: Required  
**Rate Limit**: 15 per 15 minutes (user), 30 per 15 minutes (IP)

**Response**:
```json
{
  "success": true,
  "qrCode": "data:image/png;base64,iVBORw0KG...",
  "shortUrl": "https://your-domain.com/abc123"
}
```

### GET `/api/analytics/:slug/qrcode`
Generate QR code via analytics endpoint (same functionality).

**Authentication**: Required  
**Rate Limit**: 15 per 15 minutes (user), 30 per 15 minutes (IP)

## Frontend Implementation

### Components Updated
1. **Shortener.jsx** - QR code generation in analytics section
2. **Dashboard.jsx** - QR code generation in analytics modal

### Features
- Generate QR code button
- Display QR code as image
- Download QR code as PNG
- Regenerate QR code
- Rate limit error messages
- Loading states

## Usage

1. **User shortens a URL** (while logged in)
2. **Views analytics** for the shortened URL
3. **Clicks "Generate QR Code"** button
4. **QR code is generated** and displayed
5. **User can download** the QR code
6. **User can regenerate** if needed (within rate limits)

## Technical Details

### QR Code Specifications
- **Size**: 300x300 pixels
- **Format**: PNG (base64 data URL)
- **Error Correction**: Medium (M)
- **Content**: Short URL (e.g., `https://your-domain.com/abc123`)
- **Colors**: Black on white

### Dependencies
- **Backend**: `qrcode` (^1.5.3)
- **Backend**: `express-rate-limit` (^7.1.5)

### Installation
```bash
cd server
npm install
```

## Rate Limit Configuration

To modify rate limits, edit `server/middleware/rateLimiter.js`:

```javascript
const windowMs = 15 * 60 * 1000; // 15 minutes
const maxRequests = 15; // 15 requests per window
```

## Security Considerations

1. **Authentication Required** - Only authenticated users can generate QR codes
2. **User Verification** - QR codes can only be generated for user's own links
3. **Rate Limiting** - Prevents abuse and resource exhaustion
4. **No Storage** - QR codes are not stored, reducing database load
5. **Expiration Check** - Expired links cannot generate QR codes

## Future Enhancements

Possible improvements:
- Custom QR code colors/branding
- Different QR code sizes
- QR code analytics (scan tracking)
- Batch QR code generation
- QR code templates

