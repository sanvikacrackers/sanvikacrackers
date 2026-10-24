const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  Prefer: 'return=representation',
}

function parseSupabaseError(text) {
  try {
    const obj = JSON.parse(text)
    const msg = obj.message || obj.details || text
    if (msg.includes('duplicate key') && msg.includes('product_code'))
      return 'A product with this code already exists.'
    if (msg.includes('not-null') && msg.includes('name'))
      return 'Product name is required.'
    if (msg.includes('not-null') && msg.includes('price'))
      return 'Price is required.'
    if (msg.includes('not-null') && msg.includes('category'))
      return 'Category is required.'
    return msg
  } catch {
    return text
  }
}

export async function api(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers, ...options })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(parseSupabaseError(text))
  }
  const text = await res.text()
  return text ? JSON.parse(text) : null
}
