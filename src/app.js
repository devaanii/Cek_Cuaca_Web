const path = require('path')
const express = require('express')
const hbs = require('hbs')
const geocode = require('./utils/geocode')
const forecast = require('./utils/prediksiCuaca')

const app = express()

//Mendefinisikan jalur/path untuk konfigurasi Express
const direktoriPublik = path.join(__dirname, '../public')
const direktoriViews = path.join(__dirname, '../templates/views')
const direktoriPartials = path.join(__dirname, '../templates/partials')

//Setup handlebars engine dan lokasi folder views
app.set('view engine', 'hbs')
app.set('views', direktoriViews)
hbs.registerPartials(direktoriPartials)

//Setup direktori statis
app.use(express.static(direktoriPublik))

//halaman utama
app.get('', (req, res) => {
    res.render('index', {
        judul: 'Aplikasi Cek Cuaca ☀️', 
        nama: 'Devani' })
})

app.get('/bantuan', (req, res) => {
    res.render('bantuan', {
        judul: 'Bantuan',
        teksBantuan: 'Ini adalah halaman bantuan',
        nama: 'Devani'
    })
})

app.get('/infoCuaca', (req, res) => {
    if (!req.query.address) {
        return res.send({
            error: 'Kamu harus memasukkan lokasi yang ingin dicari.'
        })
    }

    geocode(req.query.address, (error, { latitude, longitude, location } = {}) => {
        if (error) {
            return res.send({error})
        }
        forecast(latitude, longitude, (error, dataPrediksi) => {
            if (error) {
                return res.send({error})
            }
            res.send({
                prediksiCuaca: dataPrediksi,
                lokasi: location,
                alamat: req.query.address
            })
        })
    })
})

// halaman tentang
app.get('/tentang', (req, res) => {
    res.render('tentang', {
        judul: 'Tentang Saya',
        nama: 'Devani'
    })
})

app.get('/bantuan/', (req, res) => {
    res.render('404', {
        judul: '404',
        nama: 'Devani',
        pesanKesalahan: 'Artikel yang dicari tidak ditemukan.'
    })
})

// Halaman Berita 
app.get('/berita', (req, res) => {
    res.render('berita', { judul: 'Berita', nama: 'Devani' })
})

// API Berita
app.get('/api/berita', async (req, res) => {
    try {
        const key = process.env.MEDIASTACK_KEY || 'a25f771d88e3c79301619a83ebd01080'
        const q = (req.query.q || '').toString().trim()
        const categories = (req.query.categories || '').toString().trim()
        const limit = (req.query.limit || '12').toString()
        const languages = (req.query.languages || '').toString().trim()
        const sortReq = (req.query.sort || 'popularity').toString().trim() // default: popularity

        const fetchNews = async (sortParam) => {
            const url = new URL('http://api.mediastack.com/v1/news')
            url.searchParams.set('access_key', key)
            if (q) url.searchParams.set('keywords', q)
            if (categories) url.searchParams.set('categories', categories)
            if (languages) url.searchParams.set('languages', languages)
            url.searchParams.set('sort', sortParam)
            url.searchParams.set('limit', limit)
            console.log('MediaStack URL:', url.toString())

            const resp = await fetch(url)
            const api = await resp.json()
            return { resp, api }
        }

        // try popularity first, then fallback
        let { resp, api } = await fetchNews(sortReq)
        if ((!resp.ok || api?.error) && sortReq === 'popularity') {
            console.warn('Sort "popularity" gagal, fallback ke "published_desc"')
            ;({ resp, api } = await fetchNews('published_desc'))
        }

        if (!resp.ok || api?.error) {
            const msg = api?.error?.message || `Gagal memuat berita (${resp.status})`
            return res.status(502).send({ data: [], error: msg })
        }

        const items = Array.isArray(api.data) ? api.data.map(a => ({
            title: a.title,
            description: a.description,
            url: a.url,
            image: a.image,
            source: a.source,
            published_at: a.published_at
        })) : []

        res.send({ data: items })
    } catch (err) {
        console.error('ERR /api/berita:', err)
        res.status(500).send({ data: [], error: 'Gagal memuat berita' })
    }
})

app.use((req, res) => {
  res.status(404).render('404', {
    judul: '404',
    nama: 'Devani',
    pesanKesalahan: 'Halaman tidak ditemukan.'
  })
})

app.listen(4000, () => {
    console.log('Server berjalan pada port 4000')
})