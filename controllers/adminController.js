const Movie = require('../models/movieModel')
const Showtime = require('../models/showtimeModel')
const Booking = require('../models/bookingModel')
const Theater = require('../models/theaterModel')
const Screen = require('../models/screenModel')

const getStats = async (req, res, next) => {
  try {
    const totalMovies = await Movie.countDocuments()
    const totalTheaters = await Theater.countDocuments()
    const totalScreens = await Screen.countDocuments()
    const totalBookings = await Booking.countDocuments()

    const allBookings = await Booking.find().populate({
      path: 'showtime',
      populate: [{ path: 'movie' }, { path: 'screen', populate: 'theater' }]
    })

    const totalRevenue = allBookings.reduce((sum, b) => sum + b.totalPrice, 0)

    // Currently showing
    const now = new Date()
    const currentShowtimes = await Showtime.find({ startTime: { $gte: now } })
      .populate('movie')
      .populate({ path: 'screen', populate: 'theater' })

    const currentlyShowing = []
    currentShowtimes.forEach(s => {
      if (!s.movie || !s.screen || !s.screen.theater) return
      currentlyShowing.push({
        movieTitle: s.movie.title,
        showtimes: [{
          theater: s.screen.theater.theaterName,
          screen: s.screen.name,
          startTime: s.startTime
        }]
      })
    })

    // Stats per movie
    const movieStatsMap = {}
    const theaterStatsMap = {}
    const screenStatsMap = {}

    allBookings.forEach(b => {
      const movie = b.showtime?.movie
      const screen = b.showtime?.screen
      const theater = screen?.theater

      if (movie) {
        if (!movieStatsMap[movie._id]) {
          movieStatsMap[movie._id] = {
            title: movie.title,
            ticketsSold: 0,
            revenue: 0
          }
        }
        movieStatsMap[movie._id].ticketsSold += b.seats.length
        movieStatsMap[movie._id].revenue += b.totalPrice
      }

      if (theater) {
        if (!theaterStatsMap[theater._id]) {
          theaterStatsMap[theater._id] = {
            theaterName: theater.theaterName,
            ticketsSold: 0,
            revenue: 0
          }
        }
        theaterStatsMap[theater._id].ticketsSold += b.seats.length
        theaterStatsMap[theater._id].revenue += b.totalPrice
      }

      if (screen) {
        const screenKey = `${screen._id}-${screen.name}`
        if (!screenStatsMap[screenKey]) {
          screenStatsMap[screenKey] = {
            screenName: screen.name,
            theaterName: screen.theater.theaterName,
            ticketsSold: 0,
            revenue: 0
          }
        }
        screenStatsMap[screenKey].ticketsSold += b.seats.length
        screenStatsMap[screenKey].revenue += b.totalPrice
      }
    })

    res.json({
      totalMovies,
      totalTheaters,
      totalScreens,
      totalBookings,
      totalRevenue,
      currentlyShowing,
      movieStats: Object.values(movieStatsMap),
      theaterStats: Object.values(theaterStatsMap),
      screenStats: Object.values(screenStatsMap)
    })
  } catch (err) {
    next(err)
  }
}

module.exports = {
    getStats
}
