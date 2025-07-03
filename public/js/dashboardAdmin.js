function showSection(sectionId) {
  document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none')
  document.getElementById(sectionId).style.display = 'block'
}

// Movie modal handlers
function openMovieForm() {
  document.getElementById('movie-form').reset()
  document.getElementById('movie-modal').style.display = 'flex'
}

function closeMovieForm() {
  document.getElementById('movie-modal').style.display = 'none'
}

document.getElementById('movie-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const token = localStorage.getItem('token')
  const movie = {
    title: document.getElementById('title').value,
    genre: document.getElementById('genre').value,
    language: document.getElementById('language').value,
    posterUrl: document.getElementById('posterUrl').value
  }

  const res = await fetch('/api/movies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify(movie)
  })

  const data = await res.json()
  if (res.ok) {
    alert('Movie added!')
    closeMovieForm()
    loadMovies()
  } else {
    alert(data.message || 'Error')
  }
})

async function loadMovies() {
  const res = await fetch('/api/movies')
  const movies = await res.json()

  const container = document.getElementById('movie-list')
  container.innerHTML = ''
  movies.forEach(m => {
    const div = document.createElement('div')
    div.innerHTML = `
      <strong>${m.title}</strong> | ${m.genre} | ${m.language}<br>
      <img src="${m.posterUrl}" height="80"><hr>
    `
    container.appendChild(div)
  })
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  loadMovies()
})
