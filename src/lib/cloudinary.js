const CLOUD_NAME  = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const PRESET      = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
const API_KEY     = import.meta.env.VITE_CLOUDINARY_API_KEY
const API_SECRET  = import.meta.env.VITE_CLOUDINARY_API_SECRET

// ── SHA-1 signature ─────────────────────────────────
async function sha1Sign(paramsToSign) {
  const sorted = Object.keys(paramsToSign).sort()
  const str = sorted.map(k => `${k}=${paramsToSign[k]}`).join('&') + API_SECRET
  const buf = await crypto.subtle.digest('SHA-1', new TextEncoder().encode(str))
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Extract public_id from a Cloudinary URL ──────────
export function extractPublicId(url) {
  if (!url || !url.includes('res.cloudinary.com')) return null
  try {
    const parts = url.split('/upload/')
    if (parts.length < 2) return null
    const segs = parts[1].split('/')
    if (segs[0].startsWith('v') && !isNaN(segs[0].slice(1))) segs.shift()
    const full = segs.join('/')
    const dot = full.lastIndexOf('.')
    return dot !== -1 ? full.slice(0, dot) : full
  } catch { return null }
}

// ── Unsigned upload (product images) ────────────────
export async function uploadImage(file) {
  const fd = new FormData()
  fd.append('file', file)
  fd.append('upload_preset', PRESET)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST', body: fd,
  })
  if (!res.ok) {
    const e = await res.json()
    throw new Error(e.error?.message || 'Upload failed')
  }
  const data = await res.json()
  if (data.secure_url) return data.secure_url
  throw new Error('No URL returned from Cloudinary')
}

// ── Signed upload (hero banners etc.) ───────────────
export async function uploadImageSigned(file) {
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = await sha1Sign({ timestamp })
  const fd = new FormData()
  fd.append('file', file)
  fd.append('api_key', API_KEY)
  fd.append('timestamp', timestamp)
  fd.append('signature', signature)
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: 'POST', body: fd,
  })
  const data = await res.json()
  if (data.secure_url) return data.secure_url
  throw new Error(data.error?.message || 'Signed upload failed')
}

// ── Delete image ─────────────────────────────────────
export async function deleteImage(url) {
  const publicId = extractPublicId(url)
  if (!publicId || !CLOUD_NAME || !API_KEY || !API_SECRET) return false
  try {
    const timestamp = Math.floor(Date.now() / 1000)
    const signature = await sha1Sign({ public_id: publicId, timestamp })
    const fd = new FormData()
    fd.append('public_id', publicId)
    fd.append('api_key', API_KEY)
    fd.append('timestamp', timestamp)
    fd.append('signature', signature)
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/destroy`, {
      method: 'POST', body: fd,
    })
    const data = await res.json()
    return data.result === 'ok'
  } catch { return false }
}
