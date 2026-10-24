import { useEffect } from 'react'

const BASE_URL = 'https://sriveerafireworks.com'

function getOrCreate(selector, tag, attrs = {}) {
  let el = document.querySelector(selector)
  if (!el) {
    el = document.createElement(tag)
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v))
    document.head.appendChild(el)
  }
  return el
}

/**
 * useSEO – lightweight hook to update page-level SEO meta tags dynamically.
 *
 * @param {Object} options
 * @param {string} options.title       – Full page title (document.title)
 * @param {string} options.description – Meta description
 * @param {string} options.url         – Path or full URL (e.g. '/products')
 * @param {boolean} [options.noIndex]  – If true, sets robots to noindex,nofollow
 */
export default function useSEO({ title, description, url, noIndex = false }) {
  useEffect(() => {
    // 1. document.title
    if (title) document.title = title

    // 2. meta description
    if (description) {
      getOrCreate('meta[name="description"]', 'meta', { name: 'description' })
        .setAttribute('content', description)
    }

    // 3. og:title
    if (title) {
      getOrCreate('meta[property="og:title"]', 'meta', { property: 'og:title' })
        .setAttribute('content', title)
    }

    // 4. og:description
    if (description) {
      getOrCreate('meta[property="og:description"]', 'meta', { property: 'og:description' })
        .setAttribute('content', description)
    }

    // 5. og:url
    if (url) {
      const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`
      getOrCreate('meta[property="og:url"]', 'meta', { property: 'og:url' })
        .setAttribute('content', fullUrl)

      // 6. canonical
      getOrCreate('link[rel="canonical"]', 'link', { rel: 'canonical' })
        .setAttribute('href', fullUrl)
    }

    // 7. robots
    getOrCreate('meta[name="robots"]', 'meta', { name: 'robots' })
      .setAttribute('content', noIndex ? 'noindex,nofollow' : 'index,follow')
  }, [title, description, url, noIndex])
}
