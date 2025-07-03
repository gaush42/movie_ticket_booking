document.getElementById('screen-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const formData = new FormData(e.target)
  const data = Object.fromEntries(formData.entries())

  data.seatLayout = JSON.parse(data.seatLayout)

  await api.post('/screens', data, localStorage.getItem('token'))
  alert('Screen added')
  e.target.reset()
})

document.getElementById('showtime-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const formData = new FormData(e.target)
  const data = Object.fromEntries(formData.entries())

  await api.post('/showtimes', data, localStorage.getItem('token'))
  alert('Showtime added')
  e.target.reset()
})
