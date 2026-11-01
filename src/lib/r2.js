const ACCOUNT_ID        = import.meta.env.VITE_R2_ACCOUNT_ID
const ACCESS_KEY_ID     = import.meta.env.VITE_R2_ACCESS_KEY_ID
const SECRET_ACCESS_KEY = import.meta.env.VITE_R2_SECRET_ACCESS_KEY
const BUCKET            = import.meta.env.VITE_R2_BUCKET
const PUBLIC_URL        = import.meta.env.VITE_R2_PUBLIC_URL  // e.g. https://images.sanvikacrackers.com

const R2_ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`
const REGION = 'auto'
const SERVICE = 's3'

async function sha256hex(data) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    typeof data === 'string' ? new TextEncoder().encode(data) : data
  )
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function hmacBytes(keyBytes, message) {
  const key = await crypto.subtle.importKey(
    'raw', keyBytes, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message))
  return new Uint8Array(sig)
}

async function getSigningKey(dateStamp) {
  const kDate    = await hmacBytes(new TextEncoder().encode('AWS4' + SECRET_ACCESS_KEY), dateStamp)
  const kRegion  = await hmacBytes(kDate, REGION)
  const kService = await hmacBytes(kRegion, SERVICE)
  return hmacBytes(kService, 'aws4_request')
}

async function buildPutAuth(key, contentType, fileBuffer) {
  const now = new Date()
  const amzDate   = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const dateStamp = amzDate.slice(0, 8)
  const host      = `${ACCOUNT_ID}.r2.cloudflarestorage.com`
  const payloadHash = await sha256hex(new Uint8Array(fileBuffer))

  const canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n` +
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`

  const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'

  const canonicalRequest = [
    'PUT',
    `/${BUCKET}/${key}`,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n')

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256hex(canonicalRequest),
  ].join('\n')

  const sigBytes  = await hmacBytes(await getSigningKey(dateStamp), stringToSign)
  const signature = Array.from(sigBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    amzDate,
    payloadHash,
  }
}

async function buildDeleteAuth(key) {
  const EMPTY_HASH = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
  const now = new Date()
  const amzDate   = now.toISOString().replace(/[:\-]|\.\d{3}/g, '').slice(0, 15) + 'Z'
  const dateStamp = amzDate.slice(0, 8)
  const host      = `${ACCOUNT_ID}.r2.cloudflarestorage.com`

  const canonicalHeaders =
    `host:${host}\n` +
    `x-amz-content-sha256:${EMPTY_HASH}\n` +
    `x-amz-date:${amzDate}\n`

  const signedHeaders = 'host;x-amz-content-sha256;x-amz-date'

  const canonicalRequest = [
    'DELETE',
    `/${BUCKET}/${key}`,
    '',
    canonicalHeaders,
    signedHeaders,
    EMPTY_HASH,
  ].join('\n')

  const credentialScope = `${dateStamp}/${REGION}/${SERVICE}/aws4_request`
  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    await sha256hex(canonicalRequest),
  ].join('\n')

  const sigBytes  = await hmacBytes(await getSigningKey(dateStamp), stringToSign)
  const signature = Array.from(sigBytes).map(b => b.toString(16).padStart(2, '0')).join('')

  return {
    authorization: `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY_ID}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`,
    amzDate,
    emptyHash: EMPTY_HASH,
  }
}

export function extractKey(url) {
  if (!url || !PUBLIC_URL) return null
  if (url.startsWith(PUBLIC_URL)) return url.slice(PUBLIC_URL.length).replace(/^\//, '')
  try { return new URL(url).pathname.replace(/^\//, '') } catch { return null }
}

export async function uploadImage(file) {
  const ext         = file.name.split('.').pop().toLowerCase() || 'jpg'
  const key         = `images/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  const contentType = file.type || 'image/jpeg'
  const fileBuffer  = await file.arrayBuffer()

  const { authorization, amzDate, payloadHash } = await buildPutAuth(key, contentType, fileBuffer)

  const res = await fetch(`${R2_ENDPOINT}/${BUCKET}/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': contentType,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      'Authorization': authorization,
    },
    body: fileBuffer,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`R2 upload failed (${res.status}): ${text}`)
  }

  return `${PUBLIC_URL}/${key}`
}

export async function deleteImage(url) {
  const key = extractKey(url)
  if (!key) return false
  try {
    const { authorization, amzDate, emptyHash } = await buildDeleteAuth(key)
    const res = await fetch(`${R2_ENDPOINT}/${BUCKET}/${key}`, {
      method: 'DELETE',
      headers: {
        'x-amz-date': amzDate,
        'x-amz-content-sha256': emptyHash,
        'Authorization': authorization,
      },
    })
    return res.ok
  } catch { return false }
}
