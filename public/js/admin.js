const API_BASE = '/api/admin'
const token = localStorage.getItem('token')

document.addEventListener('DOMContentLoaded', () => {
  loadStats()
  loadMovies()
  loadPendingTheaters()

  document.getElementById('movie-form').addEventListener('submit', handleMovieForm)
})

function showSection(sectionId) {
  document.querySelectorAll('.tab-content').forEach(sec => sec.style.display = 'none')
  document.getElementById(sectionId).style.display = 'block'
}

function logout() {
  localStorage.removeItem('token')
  window.location.href = '/auth.html'
}

// ----- Stats -----
/*async function loadStats() {
  const res = await fetch(`${API_BASE}/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  const container = document.getElementById('stats-container')
  container.innerHTML = `
    <p><strong>Total Movies:</strong> ${data.totalMovies}</p>
    <p><strong>Total Theaters:</strong> ${data.totalTheaters}</p>
    <p><strong>Total Screens:</strong> ${data.totalScreens}</p>
    <p><strong>Total Bookings:</strong> ${data.totalBookings}</p>
    <p><strong>Total Revenue:</strong> ₹${data.totalRevenue}</p>
    <h4>Currently Showing:</h4>
    <ul>${data.currentlyShowing.map(m =>
      `<li>${m.movieTitle} - ${m.showtimes.map(s => `${s.theater}, ${s.screen}, ${new Date(s.startTime).toLocaleString()}`).join('; ')}</li>`
    ).join('')}</ul>
    <h4>Movie Stats:</h4>
    <ul>${data.movieStats.map(m => `<li>${m.title}: ${m.ticketsSold} tickets, ₹${m.revenue}</li>`).join('')}</ul>
    <h4>Theater Stats:</h4>
    <ul>${data.theaterStats.map(t => `<li>${t.theaterName}: ${t.ticketsSold} tickets, ₹${t.revenue}</li>`).join('')}</ul>
    <h4>Screen Stats:</h4>
    <ul>${data.screenStats.map(s => `<li>${s.screenName} (${s.theaterName}): ${s.ticketsSold} tickets, ₹${s.revenue}</li>`).join('')}</ul>
  `
}*/
async function loadStats() {
  const res = await fetch(`${API_BASE}/stats`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const data = await res.json()
  const container = document.getElementById('stats-container')

  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card"><h3>Total Movies</h3><p>${data.totalMovies}</p></div>
      <div class="stat-card"><h3>Total Theaters</h3><p>${data.totalTheaters}</p></div>
      <div class="stat-card"><h3>Total Screens</h3><p>${data.totalScreens}</p></div>
      <div class="stat-card"><h3>Total Bookings</h3><p>${data.totalBookings}</p></div>
      <div class="stat-card"><h3>Total Revenue</h3><p>₹${data.totalRevenue}</p></div>
    </div>

    <div class="stats-section">
      <h3>🎥 Currently Showing</h3>
      <div class="scroll-box">
        ${data.currentlyShowing.map(m =>
          `<div class="showing-item"><strong>${m.movieTitle}</strong><br><small>${m.showtimes.map(s =>
            `${s.theater}, ${s.screen}, ${new Date(s.startTime).toLocaleString()}`
          ).join('<br>')}</small></div>`
        ).join('')}
      </div>
    </div>

    <div class="stats-section">
      <h3>🎬 Movie Stats</h3>
      <ul class="stats-list">
        ${data.movieStats.map(m => `<li><strong>${m.title}</strong>: ${m.ticketsSold} tickets, ₹${m.revenue}</li>`).join('')}
      </ul>
    </div>

    <div class="stats-section">
      <h3>🏢 Theater Stats</h3>
      <ul class="stats-list">
        ${data.theaterStats.map(t => `<li><strong>${t.theaterName}</strong>: ${t.ticketsSold} tickets, ₹${t.revenue}</li>`).join('')}
      </ul>
    </div>

    <div class="stats-section">
      <h3>🖥 Screen Stats</h3>
      <ul class="stats-list">
        ${data.screenStats.map(s => `<li><strong>${s.screenName}</strong> (${s.theaterName}): ${s.ticketsSold} tickets, ₹${s.revenue}</li>`).join('')}
      </ul>
    </div>
  `
}


// ----- Movies -----
async function loadMovies() {
  const res = await fetch('/api/movies')
  const movies = await res.json()
  const list = document.getElementById('movie-list')
  list.innerHTML = movies.map(movie => `
    <div class="movie-card">
      <img src="${movie.posterUrl}" height="100" />
      <p><strong>${movie.title}</strong> (${movie.language}) - ${movie.genre}</p>
      <button onclick="editMovie('${movie._id}', '${movie.title}', '${movie.genre}', '${movie.language}', '${movie.posterUrl}')">✏️</button>
      <button onclick="deleteMovie('${movie._id}')">🗑️</button>
    </div>
  `).join('')
}

function openMovieForm() {
  document.getElementById('movieId').value = ''
  document.getElementById('title').value = ''
  document.getElementById('genre').value = ''
  document.getElementById('language').value = ''
  document.getElementById('posterUrl').value = ''
  document.getElementById('modal-title').textContent = 'Add Movie'
  document.getElementById('movie-modal').style.display = 'block'
}

function closeMovieForm() {
  document.getElementById('movie-modal').style.display = 'none'
}

function editMovie(id, title, genre, language, posterUrl) {
  document.getElementById('movieId').value = id
  document.getElementById('title').value = title
  document.getElementById('genre').value = genre
  document.getElementById('language').value = language
  document.getElementById('posterUrl').value = posterUrl
  document.getElementById('modal-title').textContent = 'Edit Movie'
  document.getElementById('movie-modal').style.display = 'block'
}

async function handleMovieForm(e) {
  e.preventDefault()
  const id = document.getElementById('movieId').value
  const movie = {
    title: document.getElementById('title').value,
    genre: document.getElementById('genre').value,
    language: document.getElementById('language').value,
    posterUrl: document.getElementById('posterUrl').value
  }

  const method = id ? 'PUT' : 'POST'
  const url = id ? `${API_BASE}/${id}` : API_BASE

  const res = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(movie)
  })

  if (res.ok) {
    closeMovieForm()
    loadMovies()
  } else {
    alert('Error saving movie')
  }
}

async function deleteMovie(id) {
  if (!confirm('Delete this movie?')) return
  await fetch(`${API_BASE}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  })
  loadMovies()
}

// ----- Pending Theaters -----
async function loadPendingTheaters() {
  const res = await fetch(`${API_BASE}/pending`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  const theaters = await res.json()
  const list = document.getElementById('pending-list')
  list.innerHTML = theaters.map(t => `
    <div class="pending-card">
      <p><strong>${t.theaterName}</strong> - ${t.city}</p>
      <p>Manager: ${t.managerName} | Email: ${t.email}</p>
      <button onclick="approveTheater('${t._id}')">✅ Approve</button>
    </div>
  `).join('')
}

async function approveTheater(id) {
  await fetch(`${API_BASE}/approve/${id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  })
  loadPendingTheaters()
}
