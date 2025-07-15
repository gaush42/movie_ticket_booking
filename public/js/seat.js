// Enhanced Seat Booking JavaScript with improved UX
class SeatBooking {
  constructor() {
    this.urlParams = new URLSearchParams(window.location.search);
    this.showtimeId = this.urlParams.get('showtimeId');
    this.seatContainer = document.getElementById('seat-container');
    this.totalCostEl = document.getElementById('total-cost');
    this.selectedSeatsListEl = document.getElementById('selected-seats-list');
    this.bookBtn = document.getElementById('bookBtn');
    this.loadingOverlay = document.getElementById('loading');
    
    this.ticketPrice = 0;
    this.selectedSeats = [];
    this.seatLayout = [];
    this.bookedSeats = [];
    
    this.init();
  }

  async init() {
    if (!this.showtimeId) {
      this.showError('Invalid showtime ID');
      return;
    }

    try {
      this.showLoading(true);
      await this.loadSeats();
      this.renderSeats();
      this.setupEventListeners();
      this.showLoading(false);
    } catch (error) {
      console.error('Error initializing seat booking:', error);
      this.showError('Failed to load seat layout. Please try again.');
      this.showLoading(false);
    }
  }

  async loadSeats() {
    try {
      const response = await fetch(`/api/showtimes/${this.showtimeId}/seats`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const showtime = await response.json();
      
      this.seatLayout = showtime.seatLayout || [];
      this.bookedSeats = showtime.bookedSeats || [];
      this.ticketPrice = showtime.ticketPrice || 0;
      
      // Update movie info if available
      if (showtime.movie) {
        this.updateMovieInfo(showtime.movie, showtime);
      }
      
    } catch (error) {
      console.error('Error loading seats:', error);
      throw error;
    }
  }

  updateMovieInfo(movie, showtime) {
    const movieTitleEl = document.querySelector('.movie-title');
    const dateEl = document.querySelector('.date');
    const timeEl = document.querySelector('.time');
    const screenEl = document.querySelector('.screen');
    
    if (movieTitleEl && movie.title) {
      movieTitleEl.textContent = movie.title;
    }
    
    if (showtime.date && dateEl) {
      dateEl.textContent = this.formatDate(showtime.date);
    }
    
    if (showtime.time && timeEl) {
      timeEl.textContent = showtime.time;
    }
    
    if (showtime.screen && screenEl) {
      screenEl.textContent = `Screen ${showtime.screen}`;
    }
  }

  renderSeats() {
    this.seatContainer.innerHTML = '';
    
    this.seatLayout.forEach((row, rowIndex) => {
      const rowEl = document.createElement('div');
      rowEl.classList.add('seat-row');
      rowEl.setAttribute('data-row', String.fromCharCode(65 + rowIndex)); // A, B, C, etc.
      
      row.forEach(seat => {
        const seatEl = document.createElement('div');
        seatEl.classList.add('seat');
        seatEl.textContent = seat;
        seatEl.setAttribute('data-seat', seat);
        
        if (this.bookedSeats.includes(seat)) {
          seatEl.classList.add('booked');
          seatEl.title = 'This seat is already booked';
        } else {
          seatEl.classList.add('available');
          seatEl.title = `Select seat ${seat} - ₹${this.ticketPrice}`;
          seatEl.addEventListener('click', () => this.toggleSeat(seatEl, seat));
        }
        
        rowEl.appendChild(seatEl);
      });
      
      this.seatContainer.appendChild(rowEl);
    });
  }

  toggleSeat(seatEl, seat) {
    if (seatEl.classList.contains('booked')) {
      return;
    }
    
    // Add visual feedback
    seatEl.style.transform = 'scale(0.95)';
    setTimeout(() => {
      seatEl.style.transform = '';
    }, 150);
    
    if (seatEl.classList.contains('selected')) {
      seatEl.classList.remove('selected');
      seatEl.classList.add('available');
      seatEl.title = `Select seat ${seat} - ₹${this.ticketPrice}`;
      this.selectedSeats = this.selectedSeats.filter(s => s !== seat);
    } else {
      seatEl.classList.remove('available');
      seatEl.classList.add('selected');
      seatEl.title = `Selected seat ${seat} - ₹${this.ticketPrice}`;
      this.selectedSeats.push(seat);
    }
    
    this.updateBookingSummary();
  }

  updateBookingSummary() {
    const seatCount = this.selectedSeats.length;
    const total = seatCount * this.ticketPrice;
    
    // Update seat count
    const seatsCountEl = document.querySelector('.seats-count');
    if (seatsCountEl) {
      seatsCountEl.textContent = `${seatCount} seat${seatCount !== 1 ? 's' : ''} selected`;
    }
    
    // Update total cost
    this.totalCostEl.textContent = `₹${total.toLocaleString()}`;
    
    // Update selected seats list
    this.updateSelectedSeatsList();
    
    // Update book button state
    this.bookBtn.disabled = seatCount === 0;
    
    // Add pulse animation to total when it changes
    if (seatCount > 0) {
      this.totalCostEl.style.animation = 'none';
      setTimeout(() => {
        this.totalCostEl.style.animation = 'pulse 0.5s ease-out';
      }, 10);
    }
  }

  updateSelectedSeatsList() {
    this.selectedSeatsListEl.innerHTML = '';
    
    this.selectedSeats.forEach(seat => {
      const seatTag = document.createElement('span');
      seatTag.classList.add('selected-seat-tag');
      seatTag.textContent = seat;
      this.selectedSeatsListEl.appendChild(seatTag);
    });
  }

  setupEventListeners() {
    this.bookBtn.addEventListener('click', () => this.bookSeats());
    
    // Add keyboard support
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !this.bookBtn.disabled) {
        this.bookSeats();
      }
    });
  }

  async bookSeats() {
    if (this.selectedSeats.length === 0) {
      this.showError('Please select at least one seat!');
      return;
    }

    try {
      this.showLoading(true);
      this.bookBtn.disabled = true;
      
      const token = this.getAuthToken();
      
      const response = await fetch('/api/booking/ticket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          showtimeId: this.showtimeId,
          seats: this.selectedSeats
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        this.showSuccess('Booking successful! Redirecting to your ticket...');
        setTimeout(() => {
          window.location.href = `/pass.html?bookingId=${data.bookingId}`;
        }, 1500);
      } else {
        throw new Error(data.message || 'Booking failed');
      }
      
    } catch (error) {
      console.error('Booking error:', error);
      this.showError(error.message || 'Booking failed. Please try again.');
      this.bookBtn.disabled = false;
      this.showLoading(false);
    }
  }

  getAuthToken() {
    // In a real application, you would use a secure method to store tokens
    // For demo purposes, we'll use a simple variable
    return localStorage.getItem('token');
  }

  showLoading(show) {
    this.loadingOverlay.style.display = show ? 'flex' : 'none';
  }

  showError(message) {
    this.showNotification(message, 'error');
  }

  showSuccess(message) {
    this.showNotification(message, 'success');
  }

  showNotification(message, type) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
      <div class="notification-content">
        <span class="notification-icon">${type === 'error' ? '⚠️' : '✅'}</span>
        <span class="notification-message">${message}</span>
      </div>
    `;
    
    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'error' ? '#E63946' : '#4CAF50'};
      color: white;
      padding: 1rem 1.5rem;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      z-index: 1001;
      animation: slideInRight 0.3s ease-out;
      max-width: 300px;
      font-family: var(--font-family);
    `;
    
    // Add animation styles
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInRight {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
      
      .notification-icon {
        font-size: 1.2rem;
      }
      
      .notification-message {
        flex: 1;
        font-weight: 500;
      }
      
      @keyframes pulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }
    `;
    
    if (!document.querySelector('#notification-styles')) {
      style.id = 'notification-styles';
      document.head.appendChild(style);
    }
    
    document.body.appendChild(notification);
    
    // Remove notification after 4 seconds
    setTimeout(() => {
      notification.style.animation = 'slideInRight 0.3s ease-out reverse';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 4000);
  }

  formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      });
    }
  }
}

// Initialize the seat booking system when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new SeatBooking();
});