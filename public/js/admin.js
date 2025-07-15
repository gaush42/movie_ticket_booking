const API_BASE = '/api/admin'
const token = localStorage.getItem('token')

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadStats()
  loadMovies()
  loadPendingTheaters()
  
  // Add form event listener
  document.getElementById('movie-form').addEventListener('submit', handleMovieForm)
  
  // Initialize first section
  showSection('stats')
})

// Navigation functions
function showSection(sectionId) {
  // Update navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.remove('active')
  })
  document.querySelector(`[data-section="${sectionId}"]`).classList.add('active')
  
  // Update content
  document.querySelectorAll('.tab-content').forEach(section => {
    section.classList.remove('active')
  })
  document.getElementById(sectionId).classList.add('active')
  
  // Update page title
  const titles = {
    stats: 'Dashboard',
    movies: 'Movies',
    pending: 'Pending Theaters'
  }
  document.getElementById('page-title').textContent = titles[sectionId]
}

function toggleSidebar() {
  document.querySelector('.sidebar').classList.toggle('active')
}

function logout() {
  localStorage.removeItem('token')
  window.location.href = '/auth.html'
}

// Stats functions
async function loadStats() {
  try {
    const res = await fetch(`${API_BASE}/stats`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (!res.ok) throw new Error('Failed to load stats')
    
    const data = await res.json()
    renderStats(data)
  } catch (error) {
    console.error('Error loading stats:', error)
    document.getElementById('stats-container').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load statistics. Please try again.</p>
      </div>
    `
  }
}

function renderStats(data) {
  const container = document.getElementById('stats-container')
  
  container.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <h3>Total Movies</h3>
        <p>${data.totalMovies || 0}</p>
      </div>
      <div class="stat-card">
        <h3>Total Theaters</h3>
        <p>${data.totalTheaters || 0}</p>
      </div>
      <div class="stat-card">
        <h3>Total Screens</h3>
        <p>${data.totalScreens || 0}</p>
      </div>
      <div class="stat-card">
        <h3>Total Bookings</h3>
        <p>${data.totalBookings || 0}</p>
      </div>
      <div class="stat-card">
        <h3>Total Revenue</h3>
        <p>₹${data.totalRevenue || 0}</p>
      </div>
    </div>

    <div class="stats-section">
      <h3><i class="fas fa-play-circle"></i> Currently Showing</h3>
      <div class="scroll-box">
        ${data.currentlyShowing && data.currentlyShowing.length > 0 
          ? data.currentlyShowing.map(movie => `
            <div class="showing-item">
              <strong>${movie.movieTitle}</strong><br>
              <small>
                ${movie.showtimes.map(showtime => 
                  `${showtime.theater}, ${showtime.screen}, ${new Date(showtime.startTime).toLocaleString()}`
                ).join('<br>')}
              </small>
            </div>
          `).join('')
          : '<p>No movies currently showing</p>'
        }
      </div>
    </div>

    <div class="stats-section">
      <h3><i class="fas fa-film"></i> Movie Performance</h3>
      <ul class="stats-list">
        ${data.movieStats && data.movieStats.length > 0
          ? data.movieStats.map(movie => `
            <li>
              <strong>${movie.title}</strong>: ${movie.ticketsSold} tickets sold, 
              <span style="color: var(--primary-blue);">₹${movie.revenue}</span> revenue
            </li>
          `).join('')
          : '<li>No movie statistics available</li>'
        }
      </ul>
    </div>

    <div class="stats-section">
      <h3><i class="fas fa-building"></i> Theater Performance</h3>
      <ul class="stats-list">
        ${data.theaterStats && data.theaterStats.length > 0
          ? data.theaterStats.map(theater => `
            <li>
              <strong>${theater.theaterName}</strong>: ${theater.ticketsSold} tickets sold, 
              <span style="color: var(--primary-blue);">₹${theater.revenue}</span> revenue
            </li>
          `).join('')
          : '<li>No theater statistics available</li>'
        }
      </ul>
    </div>

    <div class="stats-section">
      <h3><i class="fas fa-desktop"></i> Screen Performance</h3>
      <ul class="stats-list">
        ${data.screenStats && data.screenStats.length > 0
          ? data.screenStats.map(screen => `
            <li>
              <strong>${screen.screenName}</strong> (${screen.theaterName}): ${screen.ticketsSold} tickets sold, 
              <span style="color: var(--primary-blue);">₹${screen.revenue}</span> revenue
            </li>
          `).join('')
          : '<li>No screen statistics available</li>'
        }
      </ul>
    </div>
  `
}

// Movie functions
async function loadMovies() {
  try {
    const res = await fetch('/api/movies')
    
    if (!res.ok) throw new Error('Failed to load movies')
    
    const movies = await res.json()
    renderMovies(movies)
  } catch (error) {
    console.error('Error loading movies:', error)
    document.getElementById('movie-list').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load movies. Please try again.</p>
      </div>
    `
  }
}

function renderMovies(movies) {
  const list = document.getElementById('movie-list')
  
  if (!movies || movies.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-film"></i>
        <p>No movies found. Add your first movie to get started!</p>
      </div>
    `
    return
  }
  
  list.innerHTML = movies.map(movie => `
    <div class="movie-card">
      <img src="${movie.posterUrl}" alt="${movie.title}" onerror="this.src='https://via.placeholder.com/300x200?text=No+Image'" />
      <div class="movie-card-content">
        <h4>${movie.title}</h4>
        <p><strong>Genre:</strong> ${movie.genre}</p>
        <p><strong>Language:</strong> ${movie.language}</p>
        <div class="movie-card-actions">
          <button class="btn btn-secondary" onclick="editMovie('${movie._id}', '${escapeHtml(movie.title)}', '${escapeHtml(movie.genre)}', '${escapeHtml(movie.language)}', '${escapeHtml(movie.posterUrl)}')">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="btn btn-danger" onclick="deleteMovie('${movie._id}')">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    </div>
  `).join('')
}

function openMovieForm() {
  document.getElementById('movieId').value = ''
  document.getElementById('title').value = ''
  document.getElementById('genre').value = ''
  document.getElementById('language').value = ''
  document.getElementById('posterUrl').value = ''
  document.getElementById('modal-title').textContent = 'Add New Movie'
  document.getElementById('movie-modal').style.display = 'block'
  document.body.style.overflow = 'hidden'
}

function closeMovieForm() {
  document.getElementById('movie-modal').style.display = 'none'
  document.body.style.overflow = 'auto'
}

function editMovie(id, title, genre, language, posterUrl) {
  document.getElementById('movieId').value = id
  document.getElementById('title').value = title
  document.getElementById('genre').value = genre
  document.getElementById('language').value = language
  document.getElementById('posterUrl').value = posterUrl
  document.getElementById('modal-title').textContent = 'Edit Movie'
  document.getElementById('movie-modal').style.display = 'block'
  document.body.style.overflow = 'hidden'
}

async function handleMovieForm(e) {
  e.preventDefault()
  
  const submitBtn = e.target.querySelector('button[type="submit"]')
  const originalText = submitBtn.innerHTML
  submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...'
  submitBtn.disabled = true
  
  try {
    const id = document.getElementById('movieId').value
    const movie = {
      title: document.getElementById('title').value.trim(),
      genre: document.getElementById('genre').value.trim(),
      language: document.getElementById('language').value.trim(),
      posterUrl: document.getElementById('posterUrl').value.trim()
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
      showNotification('Movie saved successfully!', 'success')
    } else {
      const error = await res.json()
      throw new Error(error.message || 'Failed to save movie')
    }
  } catch (error) {
    console.error('Error saving movie:', error)
    showNotification(error.message || 'Failed to save movie', 'error')
  } finally {
    submitBtn.innerHTML = originalText
    submitBtn.disabled = false
  }
}

async function deleteMovie(id) {
  if (!confirm('Are you sure you want to delete this movie? This action cannot be undone.')) return
  
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.ok) {
      loadMovies()
      showNotification('Movie deleted successfully!', 'success')
    } else {
      throw new Error('Failed to delete movie')
    }
  } catch (error) {
    console.error('Error deleting movie:', error)
    showNotification('Failed to delete movie', 'error')
  }
}

// Pending theaters functions
async function loadPendingTheaters() {
  try {
    const res = await fetch(`${API_BASE}/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (!res.ok) throw new Error('Failed to load pending theaters')
    
    const theaters = await res.json()
    renderPendingTheaters(theaters)
  } catch (error) {
    console.error('Error loading pending theaters:', error)
    document.getElementById('pending-list').innerHTML = `
      <div class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>Failed to load pending theaters. Please try again.</p>
      </div>
    `
  }
}

function renderPendingTheaters(theaters) {
  const list = document.getElementById('pending-list')
  
  if (!theaters || theaters.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-building"></i>
        <p>No pending theater applications at the moment.</p>
      </div>
    `
    return
  }
  
  list.innerHTML = theaters.map(theater => `
    <div class="pending-card">
      <h4>${theater.theaterName}</h4>
      <p><strong>Location:</strong> ${theater.city}</p>
      <p><strong>Manager:</strong> ${theater.managerName}</p>
      <p><strong>Email:</strong> ${theater.email}</p>
      <div class="pending-card-actions">
        <button class="btn btn-success" onclick="approveTheater('${theater._id}')">
          <i class="fas fa-check"></i> Approve
        </button>
        <button class="btn btn-danger" onclick="rejectTheater('${theater._id}')">
          <i class="fas fa-times"></i> Reject
        </button>
      </div>
    </div>
  `).join('')
}

async function approveTheater(id) {
  if (!confirm('Are you sure you want to approve this theater?')) return
  
  try {
    const res = await fetch(`${API_BASE}/approve/${id}`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.ok) {
      loadPendingTheaters()
      loadStats() // Refresh stats
      showNotification('Theater approved successfully!', 'success')
    } else {
      throw new Error('Failed to approve theater')
    }
  } catch (error) {
    console.error('Error approving theater:', error)
    showNotification('Failed to approve theater', 'error')
  }
}

async function rejectTheater(id) {
  if (!confirm('Are you sure you want to reject this theater application?')) return
  
  try {
    const res = await fetch(`${API_BASE}/reject/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` }
    })
    
    if (res.ok) {
      loadPendingTheaters()
      showNotification('Theater application rejected', 'success')
    } else {
      throw new Error('Failed to reject theater')
    }
  } catch (error) {
    console.error('Error rejecting theater:', error)
    showNotification('Failed to reject theater', 'error')
  }
}

// Utility functions
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, function(m) { return map[m] })
}

function showNotification(message, type = 'info') {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.notification')
  existingNotifications.forEach(notification => notification.remove())
  
  // Create notification element
  const notification = document.createElement('div')
  notification.className = `notification notification-${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close" onclick="this.parentElement.remove()">
      <i class="fas fa-times"></i>
    </button>
  `
  
  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
    color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
    padding: 1rem 1.5rem;
    border-radius: 8px;
    border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 1rem;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `
  
  // Add animation keyframes
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style')
    style.id = 'notification-styles'
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex: 1;
      }
      .notification-close {
        background: none;
        border: none;
        cursor: pointer;
        opacity: 0.7;
        padding: 0.25rem;
        border-radius: 4px;
        transition: all 0.2s ease;
      }
      .notification-close:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.1);
      }
    `
    document.head.appendChild(style)
  }
  
  document.body.appendChild(notification)
  
  // Auto-remove after 5 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove()
    }
  }, 5000)
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-backdrop')) {
    closeMovieForm()
  }
})

// Close modal with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeMovieForm()
  }
})

// Close sidebar when clicking outside (mobile)
document.addEventListener('click', (e) => {
  const sidebar = document.querySelector('.sidebar')
  const menuBtn = document.querySelector('.mobile-menu-btn')
  
  if (window.innerWidth <= 768 && 
      sidebar.classList.contains('active') && 
      !sidebar.contains(e.target) && 
      !menuBtn.contains(e.target)) {
    sidebar.classList.remove('active')
  }
})