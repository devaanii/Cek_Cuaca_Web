document.addEventListener('DOMContentLoaded', () => {
  const grid = document.querySelector('#news-grid')
  const statusEl = document.querySelector('#news-status')
  const form = document.querySelector('#news-form')
  const inputQ = document.querySelector('#news-q')
  const selectCat = document.querySelector('#news-cat')

  function render(items) {
    if (!Array.isArray(items) || items.length === 0) {
      grid.innerHTML = '<p>Tidak ada berita ditemukan.</p>'
      return
    }
    const html = items.map(item => {
      const imgSrc = item.image || '/img/news.png'
      const title = item.title || 'Tanpa judul'
      const desc = item.description || ''
      const href = item.url || '#'
      const date = item.published_at ? new Date(item.published_at).toLocaleString('id-ID') : ''
      const source = item.source || ''
      return `
        <article class="news-card">
          <a class="cover" href="${href}" target="_blank" rel="noopener">
            <img src="${imgSrc}" alt="">
          </a>
          <div class="news-content">
            <h3 class="title"><a href="${href}" target="_blank" rel="noopener">${title}</a></h3>
            <p class="desc">${desc}</p>
            <div class="meta"><span>${source}</span><span>${date}</span></div>
          </div>
        </article>`
    }).join('')
    grid.innerHTML = html
  }

  async function loadNews(params = {}) {
    const qs = new URLSearchParams()
    if (params.q) qs.set('q', params.q)
    if (params.categories) qs.set('categories', params.categories)
    if (params.limit) qs.set('limit', String(params.limit))
    if (params.sort) qs.set('sort', params.sort) // kirim sort

    statusEl.textContent = 'Memuat berita...'
    grid.innerHTML = ''

    try {
      const res = await fetch('/api/berita' + (qs.toString() ? `?${qs.toString()}` : ''))
      const data = await res.json()
      if (!res.ok || data.error) throw new Error(data.error || 'Gagal memuat berita')
      render(data.data)
      statusEl.textContent = ''
    } catch (e) {
      console.error(e)
      statusEl.textContent = 'Gagal memuat berita'
    }
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    loadNews({ q: inputQ.value.trim(), categories: selectCat.value, sort: 'popularity' })
  })

  // auto-load dengan sort popular
  loadNews({ categories: 'general', limit: 12, sort: 'popularity' })
})