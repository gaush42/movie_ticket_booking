const urlParams = new URLSearchParams(window.location.search)
const showtimeId = urlParams.get('showtimeId')
const seatContainer = document.getElementById('seat-container')
const totalCostEl = document.getElementById('total-cost')
let ticketPrice = 0
let selectedSeats = []

document.addEventListener('DOMContentLoaded', async () => {
  if (!showtimeId) return alert('Invalid showtime ID')

  try {
    //const res = await fetch(`/api/showtimes/${showtimeId}`)
    const res = await fetch(`/api/showtimes/${showtimeId}/seats`)
    const showtime = await res.json()
    //console.log(res)
    //const layout = showtime.screen?.seatLayout || []
    const layout = showtime.seatLayout || []
    const booked = showtime.bookedSeats || []
    ticketPrice = showtime.ticketPrice || 0

    layout.forEach(row => {
      const rowEl = document.createElement('div')
      rowEl.classList.add('seat-row')
      row.forEach(seat => {
        const seatEl = document.createElement('div')
        seatEl.classList.add('seat')
        seatEl.textContent = seat

        if (booked.includes(seat)) {
          seatEl.classList.add('booked')
        } else {
          seatEl.addEventListener('click', () => toggleSeat(seatEl, seat))
        }

        rowEl.appendChild(seatEl)
      })
      seatContainer.appendChild(rowEl)
    })

    document.getElementById('bookBtn').addEventListener('click', () => {
      bookSeats(showtimeId, selectedSeats)
    })
  } catch (err) {
    console.error('Error loading seat layout:', err)
  }
})

function toggleSeat(el, seat) {
  if (el.classList.contains('selected')) {
    el.classList.remove('selected')
    selectedSeats = selectedSeats.filter(s => s !== seat)
  } else {
    el.classList.add('selected')
    selectedSeats.push(seat)
  }
  updateTotalCost()
}
function updateTotalCost() {
  const total = selectedSeats.length * ticketPrice
  totalCostEl.textContent = `Total: ₹${total}`
}

async function bookSeats(showtimeId, seats) {
  if (seats.length === 0) return alert('Select at least one seat!')

  const token = localStorage.getItem('token')  // assuming you store JWT here

  const res = await fetch(`/api/booking/ticket`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ showtimeId, seats })
  })

  const data = await res.json()
  if (res.ok) {
    alert('Booking successful!')
    window.location.href = `/pass.html?bookingId=${data.bookingId}`
  } else {
    alert(data.message || 'Booking failed')
  }
}

