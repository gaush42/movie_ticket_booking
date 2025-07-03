let allShowtimes = []

document.addEventListener('DOMContentLoaded', async () => {
  await fetchShowtimes()
  initCityFilter()
  initSearch()
})

async function fetchShowtimes() {
  try {
    const res = await fetch('/api/showtimes/all')
    const data = await res.json()
    allShowtimes = data
    renderMovies(data)
  } catch (err) {
    console.error('Failed to fetch showtimes:', err)
  }
}

function renderMovies(showtimes) {
  const container = document.getElementById('movies-container')
  container.innerHTML = ''

  const grouped = {}

  for (const show of showtimes) {
    const movie = show.movie
    const theater = show.screen?.theater
    const screen = show.screen

    if (!movie || !theater) continue

    const movieId = movie._id
    if (!grouped[movieId]) {
      grouped[movieId] = {
        ...movie,
        showtimes: []
      }
    }

    grouped[movieId].showtimes.push({
      _id: show._id,
      startTime: show.startTime,
      theaterName: theater.theaterName,
      city: theater.city,
      screenName: screen?.name,
      ticketPrice: show.ticketPrice
    })
  }

  Object.values(grouped).forEach(movie => {
    const filteredShows = filterShowtimes(movie.showtimes)
    if (filteredShows.length === 0) return

    const card = document.createElement('div')
    card.className = 'movie-card'

    const showtimeHTML = filteredShows.map(st => `
      <div class="theater-info">📍 ${st.theaterName}, ${st.city} - ${st.screenName}</div>
      <div class="showtimes">
        ⏰ ${formatTime(st.startTime)} | ₹${st.ticketPrice}
        <br>
        <a href="select-seat.html?showtimeId=${st._id}" class="book-btn">Book Now</a>
      </div>
    `).join('<hr>')

    /*const showtimeHTML = filteredShows.map(st => `
      <div class="theater-info">📍 ${st.theaterName}, ${st.city} - ${st.screenName}</div>
      <div class="showtimes">⏰ ${formatTime(st.startTime)} | ₹${st.ticketPrice}</div>
    `).join('<hr>')*/

    card.innerHTML = `
      <img src="${movie.posterUrl}" alt="${movie.title}" class="movie-poster" />
      <div class="movie-info">
        <h3 class="movie-title">${movie.title}</h3>
        <p class="movie-genre">${movie.genre} | ${movie.language}</p>
        ${showtimeHTML}
      </div>
    `
    container.appendChild(card)
  })
}

function filterShowtimes(showtimes) {
  const selectedCity = document.getElementById('cityFilter').value
  if (selectedCity === 'all') return showtimes
  return showtimes.filter(st => st.city === selectedCity)
}

function initCityFilter() {
  const citySelect = document.getElementById('cityFilter')
  const cities = new Set(allShowtimes.map(st => st.screen?.theater?.city).filter(Boolean))

  for (const city of cities) {
    const option = document.createElement('option')
    option.value = city
    option.textContent = city
    citySelect.appendChild(option)
  }

  citySelect.addEventListener('change', () => renderMovies(allShowtimes))
}

function initSearch() {
  const searchInput = document.getElementById('searchInput')
  searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase()
    const filtered = allShowtimes.filter(st => st.movie?.title?.toLowerCase().includes(query))
    renderMovies(filtered)
  })
}

function formatTime(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
