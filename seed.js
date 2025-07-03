const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const User = require('./models/userModel')
const Theater = require('./models/theaterModel')
const Movie = require('./models/movieModel')
const Screen = require('./models/screenModel')
const Showtime = require('./models/showtimeModel')
const Booking = require('./models/bookingModel')

const genres = ['Action', 'Drama', 'Sci-Fi', 'Romance', 'Comedy', 'Thriller']
const languages = ['English', 'Hindi', 'Tamil', 'Telugu', 'Korean']

function randomChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateSeatLayout(rows = 5, cols = 6) {
  const layout = []
  for (let i = 0; i < rows; i++) {
    const row = []
    for (let j = 1; j <= cols; j++) {
      row.push(String.fromCharCode(65 + i) + j)
    }
    layout.push(row)
  }
  return layout
}

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_CONNECTION_URL)
    console.log('✅ Connected to MongoDB')

    // Clear all collections
    await Promise.all([
      User.deleteMany(),
      Theater.deleteMany(),
      Movie.deleteMany(),
      Screen.deleteMany(),
      Showtime.deleteMany(),
      Booking.deleteMany()
    ])

    const hashedPwd = bcrypt.hashSync('password123', 10)

    // 👤 Users
    const [admin, manager, user] = await User.insertMany([
      {
        fullname: 'Admin User',
        email: 'admin@a.com',
        password: hashedPwd,
        role: ['Administrator']
      },
      {
        fullname: 'Manager One',
        email: 'manager@m.com',
        password: hashedPwd,
        role: ['Theater_Manager']
      },
      {
        fullname: 'User One',
        email: 'user@u.com',
        password: hashedPwd,
        role: ['User']
      }
    ])

    // 🏢 Theater
    const theater = await Theater.create({
      theaterName: "PVR Cinema",
      managerName: "Manager One",
      email: "manager@m.com",
      phone: "9876543210",
      city: "Mumbai",
      status: "Approved"
    })

    // 🎬 Movies
    const movies = []
    for (let i = 1; i <= 10; i++) {
      movies.push({
        title: `Movie ${i}`,
        genre: randomChoice(genres),
        language: randomChoice(languages),
        duration: 90 + Math.floor(Math.random() * 60),
        rating: randomChoice(['U', 'U/A', 'A']),
        posterUrl: `https://picsum.photos/200?random=${i}`
      })
    }
    const insertedMovies = await Movie.insertMany(movies)

    // 🖥 Screens (linked to theater)
    const screens = []
    for (let i = 1; i <= 5; i++) {
      screens.push({
        name: `Screen ${i}`,
        theater: theater._id,
        seatLayout: generateSeatLayout(5, 6)
      })
    }
    const insertedScreens = await Screen.insertMany(screens)

    // ⏰ Showtimes (2 per screen)
    const showtimes = []
    insertedScreens.forEach((screen, i) => {
      for (let j = 0; j < 2; j++) {
        showtimes.push({
          screen: screen._id,
          movie: insertedMovies[(i + j) % insertedMovies.length]._id,
          startTime: new Date(Date.now() + (i + j + 1) * 60 * 60000),
          ticketPrice: 150 + 20 * j,
          bookedSeats: j === 0 ? ['A1', 'A2'] : []
        })
      }
    })
    const insertedShowtimes = await Showtime.insertMany(showtimes)

    // 🎟 Booking
    await Booking.create({
      user: user._id,
      showtime: insertedShowtimes[0]._id,
      seats: ['A1', 'A2'],
      totalPrice: 300,
      bookingTime: new Date()
    })

    console.log('✅ Seed completed: Users, Theater, Movies, Screens, Showtimes, Booking')
  } catch (err) {
    console.error('❌ Seeding Error:', err)
  } finally {
    mongoose.connection.close()
  }
}

seed()
