// Theater Manager Dashboard JavaScript
class TheaterManager {
    constructor() {
        this.baseURL = 'http://localhost:3000/api/manager';
        this.authURL = 'http://localhost:3000/api/auth';
        this.token = sessionStorage.getItem('token') || null;
        this.theaterData = null;
        this.screensData = null;
        this.showtimesData = null;
        this.bookingsData = null;
        this.statsData = null;
        
        this.init();
    }

    async init() {
        // Check if token exists and is valid
        if (!this.token) {
            await this.showLogin();
            return;
        }

        try {
            await this.loadAllData();
        } catch (error) {
            console.error('Initialization error:', error);
            await this.showLogin();
        }
    }

    async showLogin() {
        const email = prompt('Enter your email:');
        const password = prompt('Enter your password:');
        
        if (email && password) {
            await this.login(email, password);
        }
    }

    async login(email, password) {
        try {
            const response = await fetch(`${this.authURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.token = data.token || data.accessToken;
                sessionStorage.setItem('token', this.token);
                await this.loadAllData();
            } else {
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Login failed: ' + error.message);
        }
    }

    async apiCall(endpoint, method = 'GET', data = null) {
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.token}`
        };

        const config = {
            method,
            headers
        };

        if (data && method !== 'GET') {
            config.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(`${this.baseURL}${endpoint}`, config);
            
            if (!response.ok) {
                if (response.status === 401) {
                    sessionStorage.removeItem('token');
                    await this.showLogin();
                    return;
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }

    async loadAllData() {
        try {
            // Load all data in parallel
            const [theater, screens, showtimes, bookings, stats] = await Promise.all([
                this.apiCall('/theater'),
                this.apiCall('/screens'),
                this.apiCall('/showtimes/list'),
                this.apiCall('/bookings'),
                this.apiCall('/stats')
            ]);

            this.theaterData = theater;
            this.screensData = screens;
            this.showtimesData = showtimes;
            this.bookingsData = bookings;
            this.statsData = stats;

            this.renderAll();
        } catch (error) {
            console.error('Error loading data:', error);
            this.showError('Failed to load data: ' + error.message);
        }
    }

    renderAll() {
        this.renderTheaterInfo();
        this.renderDashboard();
        this.renderScreens();
        this.renderShowtimes();
        this.renderBookings();
        this.populateScreenOptions();
    }

    renderTheaterInfo() {
        const theaterInfoDiv = document.getElementById('theaterInfo');
        if (this.theaterData && this.theaterData.theater) {
            const theater = this.theaterData.theater;
            theaterInfoDiv.innerHTML = `
                <h2>${theater.name}</h2>
                <p><strong>Location:</strong> ${theater.city}</p>
                <p><strong>Email:</strong> ${theater.email}</p>
                <p><strong>Phone:</strong> ${theater.phone}</p>
                <p><strong>Created:</strong> ${new Date(theater.createdAt).toLocaleDateString()}</p>
            `;
        }
    }

    renderDashboard() {
        const statsContainer = document.getElementById('statsContainer');
        const movieStatsDiv = document.getElementById('movieStats');

        if (this.statsData) {
            // Render stats cards
            statsContainer.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${this.statsData.totalScreens}</div>
                        <div class="stat-label">Total Screens</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.statsData.totalShowtimes}</div>
                        <div class="stat-label">Total Showtimes</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.statsData.totalBookings}</div>
                        <div class="stat-label">Total Bookings</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">₹${this.statsData.totalRevenue}</div>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                </div>
            `;

            // Render movie stats
            if (this.statsData.movieStats && this.statsData.movieStats.length > 0) {
                movieStatsDiv.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>Movie</th>
                                <th>Tickets Sold</th>
                                <th>Revenue</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.statsData.movieStats.map(movie => `
                                <tr>
                                    <td>${movie.title}</td>
                                    <td>${movie.ticketsSold}</td>
                                    <td>₹${movie.revenue}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                movieStatsDiv.innerHTML = '<p>No movie statistics available.</p>';
            }
        }
    }

    renderScreens() {
        const screensContainer = document.getElementById('screensContainer');
        
        if (this.screensData && this.screensData.screens) {
            screensContainer.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${this.screensData.totalScreens}</div>
                        <div class="stat-label">Total Screens</div>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Screen Name</th>
                            <th>Total Seats</th>
                            <th>Seat Layout</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.screensData.screens.map(screen => `
                            <tr>
                                <td>${screen.name}</td>
                                <td>${screen.totalSeats}</td>
                                <td>
                                    <div class="seat-layout">
                                        ${screen.seatLayout.map(row => `
                                            <div class="seat-row">
                                                ${row.map(seat => `
                                                    <div class="seat">${seat}</div>
                                                `).join('')}
                                            </div>
                                        `).join('')}
                                    </div>
                                </td>
                                <td>
                                    <button class="btn" onclick="editScreen('${screen.id}', '${screen.name}', ${screen.totalSeats})">Edit</button>
                                    <button class="btn btn-danger" onclick="deleteScreen('${screen.id}')">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    renderShowtimes() {
        const showtimesContainer = document.getElementById('showtimesContainer');
        
        if (this.showtimesData && this.showtimesData.showtimes) {
            showtimesContainer.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${this.showtimesData.totalShowtimes}</div>
                        <div class="stat-label">Total Showtimes</div>
                    </div>
                </div>
                
                <table>
                    <thead>
                        <tr>
                            <th>Movie</th>
                            <th>Screen</th>
                            <th>Start Time</th>
                            <th>Price</th>
                            <th>Available Seats</th>
                            <th>Occupancy</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${this.showtimesData.showtimes.map(showtime => `
                            <tr>
                                <td>
                                    <div><strong>${showtime.movie.title}</strong></div>
                                    <div><small>${showtime.movie.language} | ${showtime.movie.genre} | ${showtime.movie.rating}</small></div>
                                </td>
                                <td>${showtime.screen.name}</td>
                                <td>${new Date(showtime.startTime).toLocaleString()}</td>
                                <td>₹${showtime.ticketPrice}</td>
                                <td>${showtime.availableSeats}/${showtime.screen.totalSeats}</td>
                                <td>${showtime.occupancyRate}%</td>
                                <td>
                                    <button class="btn" onclick="editShowtime('${showtime.showtimeId}')">Edit</button>
                                    <button class="btn btn-danger" onclick="deleteShowtime('${showtime.showtimeId}')">Delete</button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    renderBookings() {
        const bookingsSummary = document.getElementById('bookingsSummary');
        const bookingsContainer = document.getElementById('bookingsContainer');
        
        if (this.bookingsData) {
            // Render summary
            bookingsSummary.innerHTML = `
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${this.bookingsData.summary.totalBookings}</div>
                        <div class="stat-label">Total Bookings</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">₹${this.bookingsData.summary.totalRevenue}</div>
                        <div class="stat-label">Total Revenue</div>
                    </div>
                </div>
            `;

            // Render bookings table
            if (this.bookingsData.bookings && this.bookingsData.bookings.length > 0) {
                bookingsContainer.innerHTML = `
                    <table>
                        <thead>
                            <tr>
                                <th>Booking ID</th>
                                <th>Customer</th>
                                <th>Movie</th>
                                <th>Screen</th>
                                <th>Show Time</th>
                                <th>Seats</th>
                                <th>Total Price</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.bookingsData.bookings.map(booking => `
                                <tr>
                                    <td>${booking.id}</td>
                                    <td>${booking.user.email}</td>
                                    <td>
                                        <div><strong>${booking.movie.title}</strong></div>
                                        <div><small>${booking.movie.language} | ${booking.movie.genre}</small></div>
                                    </td>
                                    <td>${booking.screen.name}</td>
                                    <td>${new Date(booking.startTime).toLocaleString()}</td>
                                    <td>${booking.seats.join(', ')}</td>
                                    <td>₹${booking.totalPrice}</td>
                                    <td>
                                        <button class="btn btn-danger" onclick="cancelBooking('${booking.id}')">Cancel</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                `;
            } else {
                bookingsContainer.innerHTML = '<p>No bookings found.</p>';
            }
        }
    }

    populateScreenOptions() {
        const screenSelect = document.getElementById('screenId');
        if (this.screensData && this.screensData.screens) {
            screenSelect.innerHTML = '<option value="">Select Screen</option>' +
                this.screensData.screens.map(screen => 
                    `<option value="${screen.id}">${screen.name}</option>`
                ).join('');
        }
    }

    async createScreen(formData) {
        try {
            const screenData = {
                name: formData.name,
                totalSeats: parseInt(formData.totalSeats),
                seatLayout: this.generateSeatLayout(parseInt(formData.rows), parseInt(formData.seatsPerRow))
            };

            await this.apiCall('/screens', 'POST', screenData);
            await this.loadAllData();
            this.closeModal('createScreenModal');
            this.showSuccess('Screen created successfully!');
        } catch (error) {
            this.showError('Failed to create screen: ' + error.message);
        }
    }

    async updateScreen(screenId, formData) {
        try {
            const screenData = {
                name: formData.name,
                totalSeats: parseInt(formData.totalSeats)
            };

            await this.apiCall(`/screens/${screenId}`, 'PUT', screenData);
            await this.loadAllData();
            this.closeModal('editScreenModal');
            this.showSuccess('Screen updated successfully!');
        } catch (error) {
            this.showError('Failed to update screen: ' + error.message);
        }
    }

    async deleteScreen(screenId) {
        if (confirm('Are you sure you want to delete this screen?')) {
            try {
                await this.apiCall(`/screens/${screenId}`, 'DELETE');
                await this.loadAllData();
                this.showSuccess('Screen deleted successfully!');
            } catch (error) {
                this.showError('Failed to delete screen: ' + error.message);
            }
        }
    }

    async createShowtime(formData) {
        try {
            const showtimeData = {
                movieId: formData.movieId,
                screenId: formData.screenId,
                startTime: new Date(formData.startTime).toISOString(),
                ticketPrice: parseFloat(formData.ticketPrice)
            };

            await this.apiCall('/showtimes', 'POST', showtimeData);
            await this.loadAllData();
            this.closeModal('createShowtimeModal');
            this.showSuccess('Showtime created successfully!');
        } catch (error) {
            this.showError('Failed to create showtime: ' + error.message);
        }
    }

    async deleteShowtime(showtimeId) {
        if (confirm('Are you sure you want to delete this showtime?')) {
            try {
                await this.apiCall(`/showtimes/${showtimeId}`, 'DELETE');
                await this.loadAllData();
                this.showSuccess('Showtime deleted successfully!');
            } catch (error) {
                this.showError('Failed to delete showtime: ' + error.message);
            }
        }
    }

    async cancelBooking(bookingId) {
        if (confirm('Are you sure you want to cancel this booking?')) {
            try {
                await this.apiCall(`/bookings/${bookingId}/cancel`, 'PUT');
                await this.loadAllData();
                this.showSuccess('Booking cancelled successfully!');
            } catch (error) {
                this.showError('Failed to cancel booking: ' + error.message);
            }
        }
    }

    generateSeatLayout(rows, seatsPerRow) {
        const layout = [];
        const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 1; j <= seatsPerRow; j++) {
                row.push(`${rowLabels[i]}${j}`);
            }
            layout.push(row);
        }
        
        return layout;
    }

    showError(message) {
        // Create temporary error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.textContent = message;
        document.body.insertBefore(errorDiv, document.body.firstChild);
        
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showSuccess(message) {
        // Create temporary success notification
        const successDiv = document.createElement('div');
        successDiv.className = 'success';
        successDiv.textContent = message;
        document.body.insertBefore(successDiv, document.body.firstChild);
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'block';
        }
    }

    logout() {
        sessionStorage.removeItem('token');
        this.token = null;
        this.theaterData = null;
        this.screensData = null;
        this.showtimesData = null;
        this.bookingsData = null;
        this.statsData = null;
        
        // Clear all containers
        const containers = [
            'theaterInfo', 'statsContainer', 'movieStats', 'screensContainer',
            'showtimesContainer', 'bookingsSummary', 'bookingsContainer'
        ];
        
        containers.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.innerHTML = '';
            }
        });
        
        this.showLogin();
    }

    // Method to refresh data
    async refreshData() {
        try {
            await this.loadAllData();
            this.showSuccess('Data refreshed successfully!');
        } catch (error) {
            this.showError('Failed to refresh data: ' + error.message);
        }
    }

    // Method to handle form submissions
    handleScreenForm(formElement, isEdit = false, screenId = null) {
        const formData = new FormData(formElement);
        const data = Object.fromEntries(formData);
        
        if (isEdit && screenId) {
            this.updateScreen(screenId, data);
        } else {
            this.createScreen(data);
        }
    }

    handleShowtimeForm(formElement) {
        const formData = new FormData(formElement);
        const data = Object.fromEntries(formData);
        this.createShowtime(data);
    }

    // Method to format currency
    formatCurrency(amount) {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR'
        }).format(amount);
    }

    // Method to format date
    formatDate(dateString) {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Global functions for HTML onclick handlers
let theaterManager;

// Tab management functions
function showTab(tabName) {
    // Hide all tab contents
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    const selectedTab = document.getElementById(tabName);
    if (selectedTab) {
        selectedTab.classList.add('active');
    }
    
    // Add active class to clicked tab button
    event.target.classList.add('active');
}

// Modal management functions
function showCreateScreenModal() {
    theaterManager.openModal('createScreenModal');
}

function showCreateShowtimeModal() {
    theaterManager.openModal('createShowtimeModal');
}

function closeModal(modalId) {
    theaterManager.closeModal(modalId);
}

// Screen management functions
function editScreen(screenId, screenName, totalSeats) {
    theaterManager.openModal('editScreenModal');
    document.getElementById('editScreenName').value = screenName;
    document.getElementById('editTotalSeats').value = totalSeats;
    document.getElementById('editScreenId').value = screenId;
}

function deleteScreen(screenId) {
    theaterManager.deleteScreen(screenId);
}

// Showtime management functions
function editShowtime(showtimeId) {
    theaterManager.openModal('editShowtimeModal');
    // Populate form with showtime data
}

function deleteShowtime(showtimeId) {
    theaterManager.deleteShowtime(showtimeId);
}

// Booking management functions
function cancelBooking(bookingId) {
    theaterManager.cancelBooking(bookingId);
}

// Initialize the theater manager when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    theaterManager = new TheaterManager();
    
    // Add event listeners for forms
    const createScreenForm = document.getElementById('createScreenForm');
    if (createScreenForm) {
        createScreenForm.addEventListener('submit', function(e) {
            e.preventDefault();
            theaterManager.handleScreenForm(this);
        });
    }
    
    const editScreenForm = document.getElementById('editScreenForm');
    if (editScreenForm) {
        editScreenForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const screenId = document.getElementById('editScreenId').value;
            theaterManager.handleScreenForm(this, true, screenId);
        });
    }
    
    const createShowtimeForm = document.getElementById('createShowtimeForm');
    if (createShowtimeForm) {
        createShowtimeForm.addEventListener('submit', function(e) {
            e.preventDefault();
            theaterManager.handleShowtimeForm(this);
        });
    }
    
    // Add refresh button functionality
    const refreshButton = document.getElementById('refreshButton');
    if (refreshButton) {
        refreshButton.addEventListener('click', function() {
            theaterManager.refreshData();
        });
    }
    
    // Add logout button functionality
    const logoutButton = document.getElementById('logoutButton');
    if (logoutButton) {
        logoutButton.addEventListener('click', function() {
            theaterManager.logout();
        });
    }
    
    // Close modals when clicking outside of them
    window.addEventListener('click', function(event) {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        });
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TheaterManager;
}