const express = require('express')
const crypto = require('node:crypto')
const movies = require('./movies.json')
const { validateMovie, validatePartialMovie } = require('./schemas/movies')

const app = express()
app.use(express.json()) // Middleware para parsear el body de las peticiones
app.disable('x-powered-by')// Ocultar la cabecera X-Powered-By

// metodos normales: GET/HEAD/POST
// metodos  complejos: PUT/DELETE/PATCH

// CORS PRE-FLIGHT
// OPTIONS /movies

app.get('/movies', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*') // Soluciona el problema de CORS

  const { genre } = req.query
  if (genre) {
    const filteredMovies = movies.filter(
      movie => movie.genre.some(g => g.toLowerCase() === genre.toLowerCase())
    )
    return res.json(filteredMovies)
  }
  res.json(movies)
})

app.get('/movies/:id', (req, res) => { // path-to-regexp
  const { id } = req.params
  const movie = movies.find(movie => movie.id === id)
  if (movie) return res.json(movie)

  res.status(404).json({ message: 'Movie not found' })
})

app.post('/movies', (req, res) => {
  const result = validateMovie(req.body)

  if (result.error) {
    // 422 Unprocessable Entity
    return res.status(400).json({ error: JSON.parse(result.error.message) })
  }

  // en base de datos
  const newMovie = {
    id: crypto.randomUUID(), // uuid v4
    ...result.data
  }

  // Esto no sería REST, porque estamos guardando
  // el estado de la aplicación en memoria
  movies.push(newMovie)

  res.status(201).json(newMovie)
})

app.delete('/movies/:id', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')

  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex === -1) {
    return res.status(404).json({ message: 'Movie not found' })
  }
  movies.splice(movieIndex, 1)
  res.status(204).send()

  return res.json({ message: 'Movie deleted' })
})

app.patch('/movies/:id', (req, res) => {
  const result = validatePartialMovie(req.body)

  if (!result.success) {
    return res.status(400).json({ message: 'Movie not found' })
  }
  const { id } = req.params
  const movieIndex = movies.findIndex(movie => movie.id === id)

  if (movieIndex < 0) {
    return res.status(404).json({ message: 'Movie not found' })
  }
  const updateMovie = {
    ...movies[movieIndex],
    ...result.data
  }
  movies[movieIndex] = updateMovie

  return res.json(updateMovie)
})

app.options('/movies/:id', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH')
  res.send()
}

)

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
