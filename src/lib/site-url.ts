/**
 * Get the site URL for auth redirects
 * Automatically detects the correct URL based on environment and headers
 */

export function getSiteUrl(headers?: Headers): string {
  // If NEXT_PUBLIC_SITE_URL is set, use it
  if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL !== 'http://localhost:3000') {
    return process.env.NEXT_PUBLIC_SITE_URL
  }

  // Try to get URL from request headers (for server-side)
  if (headers) {
    const host = headers.get('host')
    const protocol = headers.get('x-forwarded-proto') || 'https'
    if (host && !host.includes('localhost')) {
      return `${protocol}://${host}`
    }
  }

  // Try to get URL from Vercel environment variables
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`
  }

  // Try to get URL from Netlify environment variables
  if (process.env.DEPLOY_URL) {
    return process.env.DEPLOY_URL
  }

  // Fallback to localhost for development
  return 'http://localhost:3000'
}

/**
 * Get the auth callback URL
 */
export function getAuthCallbackUrl(headers?: Headers): string {
  return `${getSiteUrl(headers)}/auth/callback`
}
