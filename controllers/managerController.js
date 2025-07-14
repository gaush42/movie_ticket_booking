const Theater = require('../models/theaterModel');
const Screen = require('../models/screenModel');
const Showtime = require('../models/showtimeModel');
const Booking = require('../models/bookingModel');
const Movie = require('../models/movieModel');

const getManagerStats = async (req, res) => {
  try {
    
    const managerEmail = req.user.email;
    console.log('managerEmail:', managerEmail);

    // Find the theater managed by this manager
    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    // Get screens of this theater
    const screens = await Screen.find({ theater: theater._id });

    const screenIds = screens.map(s => s._id);

    // Get showtimes on these screens
    const showtimes = await Showtime.find({ screen: { $in: screenIds } }).populate('movie screen');

    // Get bookings for these showtimes
    const showtimeIds = showtimes.map(s => s._id);
    const bookings = await Booking.find({ showtime: { $in: showtimeIds } })
      .populate({
        path: 'showtime',
        populate: {
          path: 'movie'
        }
      });

    // Compute stats
    const totalScreens = screens.length;
    const totalShowtimes = showtimes.length;
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);

    // Movie-wise breakdown
    const movieStatsMap = {};
    for (const booking of bookings) {
      const movieId = booking.showtime.movie._id;
      if (!movieStatsMap[movieId]) {
        movieStatsMap[movieId] = {
          title: booking.showtime.movie.title,
          ticketsSold: 0,
          revenue: 0
        };
      }
      movieStatsMap[movieId].ticketsSold += booking.seats.length;
      movieStatsMap[movieId].revenue += booking.totalPrice;
    }

    const movieStats = Object.values(movieStatsMap);

    res.json({
      theaterName: theater.theaterName,
      city: theater.city,
      totalScreens,
      totalShowtimes,
      totalBookings,
      totalRevenue,
      movieStats
    });

  } catch (err) {
    console.error('Manager stats error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const getManagerShowtimes = async (req, res) => {
  try {
    const managerEmail = req.user.email;

    // Find the theater managed by this manager
    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    // Get screens of this theater
    const screens = await Screen.find({ theater: theater._id });
    const screenIds = screens.map(s => s._id);

    // Get showtimes on these screens with full details
    const showtimes = await Showtime.find({ screen: { $in: screenIds } })
      .populate('movie', 'title language genre duration rating posterUrl')
      .populate('screen', 'name seatLayout')
      .sort({ startTime: 1 }); // Sort by start time

    // Group showtimes by screen for better organization
    const screenShowtimes = {};
    
    // Initialize each screen
    screens.forEach(screen => {
      screenShowtimes[screen._id] = {
        screenId: screen._id,
        screenName: screen.name,
        totalSeats: screen.seatLayout.flat().length,
        showtimes: []
      };
    });

    // Add showtimes to their respective screens
    showtimes.forEach(showtime => {
      const screenId = showtime.screen._id.toString();
      
      screenShowtimes[screenId].showtimes.push({
        showtimeId: showtime._id,
        movie: {
          id: showtime.movie._id,
          title: showtime.movie.title,
          language: showtime.movie.language,
          genre: showtime.movie.genre,
          duration: showtime.movie.duration,
          rating: showtime.movie.rating,
          posterUrl: showtime.movie.posterUrl
        },
        startTime: showtime.startTime,
        ticketPrice: showtime.ticketPrice,
        bookedSeats: showtime.bookedSeats,
        availableSeats: screen.seatLayout.flat().length - showtime.bookedSeats.length,
        occupancyRate: Math.round((showtime.bookedSeats.length / screen.seatLayout.flat().length) * 100)
      });
    });

    // Convert to array and filter out screens with no showtimes if needed
    const screenData = Object.values(screenShowtimes);

    // Summary statistics
    const totalScreens = screens.length;
    const totalShowtimes = showtimes.length;
    const totalBookedSeats = showtimes.reduce((sum, st) => sum + st.bookedSeats.length, 0);
    const totalSeats = screens.reduce((sum, screen) => sum + screen.seatLayout.flat().length, 0) * showtimes.length;
    const overallOccupancy = totalSeats > 0 ? Math.round((totalBookedSeats / totalSeats) * 100) : 0;

    res.json({
      theater: {
        id: theater._id,
        name: theater.theaterName,
        city: theater.city,
        email: theater.email
      },
      summary: {
        totalScreens,
        totalShowtimes,
        totalBookedSeats,
        overallOccupancy: `${overallOccupancy}%`
      },
      screens: screenData
    });

  } catch (err) {
    console.error('Manager showtimes error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Alternative controller for a flat list view (without grouping by screen)
const getManagerShowtimesList = async (req, res) => {
  try {
    const managerEmail = req.user.email;

    // Find the theater managed by this manager
    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    // Get screens of this theater
    const screens = await Screen.find({ theater: theater._id });
    const screenIds = screens.map(s => s._id);

    // Get showtimes with full details in a flat list
    const showtimes = await Showtime.find({ screen: { $in: screenIds } })
      .populate('movie', 'title language genre duration rating posterUrl')
      .populate('screen', 'name seatLayout')
      .sort({ startTime: 1 });

    // Format the response
    const showtimesList = showtimes.map(showtime => ({
      showtimeId: showtime._id,
      movie: {
        id: showtime.movie._id,
        title: showtime.movie.title,
        language: showtime.movie.language,
        genre: showtime.movie.genre,
        duration: showtime.movie.duration,
        rating: showtime.movie.rating,
        posterUrl: showtime.movie.posterUrl
      },
      screen: {
        id: showtime.screen._id,
        name: showtime.screen.name,
        totalSeats: showtime.screen.seatLayout.flat().length
      },
      startTime: showtime.startTime,
      ticketPrice: showtime.ticketPrice,
      bookedSeats: showtime.bookedSeats,
      availableSeats: showtime.screen.seatLayout.flat().length - showtime.bookedSeats.length,
      occupancyRate: Math.round((showtime.bookedSeats.length / showtime.screen.seatLayout.flat().length) * 100)
    }));

    res.json({
      theater: {
        id: theater._id,
        name: theater.theaterName,
        city: theater.city,
        email: theater.email
      },
      totalShowtimes: showtimes.length,
      showtimes: showtimesList
    });

  } catch (err) {
    console.error('Manager showtimes list error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};




// ==================== THEATER MANAGEMENT ====================

// Get theater details
const getTheaterDetails = async (req, res) => {
  try {
    const managerEmail = req.user.email;
    
    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    res.json({
      theater: {
        id: theater._id,
        name: theater.theaterName,
        city: theater.city,
        address: theater.address,
        email: theater.email,
        phone: theater.phone,
        createdAt: theater.createdAt
      }
    });

  } catch (err) {
    console.error('Get theater details error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update theater details
const updateTheaterDetails = async (req, res) => {
  try {
    const managerEmail = req.user.email;
    const { theaterName, city, address, phone } = req.body;

    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    // Update theater details
    const updatedTheater = await Theater.findByIdAndUpdate(
      theater._id,
      {
        theaterName: theaterName || theater.theaterName,
        city: city || theater.city,
        address: address || theater.address,
        phone: phone || theater.phone
      },
      { new: true }
    );

    res.json({
      message: 'Theater updated successfully',
      theater: {
        id: updatedTheater._id,
        name: updatedTheater.theaterName,
        city: updatedTheater.city,
        address: updatedTheater.address,
        email: updatedTheater.email,
        phone: updatedTheater.phone
      }
    });

  } catch (err) {
    console.error('Update theater error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== SCREEN MANAGEMENT ====================

// Get all screens of the theater
const getScreens = async (req, res) => {
  try {
    const managerEmail = req.user.email;
    
    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    const screens = await Screen.find({ theater: theater._id });

    const screenData = screens.map(screen => ({
      id: screen._id,
      name: screen.name,
      totalSeats: screen.seatLayout.flat().length,
      seatLayout: screen.seatLayout,
      createdAt: screen.createdAt
    }));

    res.json({
      theater: theater.theaterName,
      totalScreens: screens.length,
      screens: screenData
    });

  } catch (err) {
    console.error('Get screens error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new screen
const createScreen = async (req, res) => {
  try {
    const managerEmail = req.user.email;
    const { name, seatLayout } = req.body;

    if (!name || !seatLayout) {
      return res.status(400).json({ message: 'Screen name and seat layout are required' });
    }

    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    // Check if screen name already exists in this theater
    const existingScreen = await Screen.findOne({ theater: theater._id, name });
    if (existingScreen) {
      return res.status(400).json({ message: 'Screen with this name already exists' });
    }

    const newScreen = new Screen({
      theater: theater._id,
      name,
      seatLayout
    });

    await newScreen.save();

    res.status(201).json({
      message: 'Screen created successfully',
      screen: {
        id: newScreen._id,
        name: newScreen.name,
        totalSeats: newScreen.seatLayout.flat().length,
        seatLayout: newScreen.seatLayout
      }
    });

  } catch (err) {
    console.error('Create screen error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update screen
const updateScreen = async (req, res) => {
  try {
    const managerEmail = req.user.email;
    const { screenId } = req.params;
    const { name, seatLayout } = req.body;

    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    const screen = await Screen.findOne({ _id: screenId, theater: theater._id });
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found or not owned by this theater' });
    }

    // Check if new name conflicts with existing screens
    if (name && name !== screen.name) {
      const existingScreen = await Screen.findOne({ theater: theater._id, name });
      if (existingScreen) {
        return res.status(400).json({ message: 'Screen with this name already exists' });
      }
    }

    const updatedScreen = await Screen.findByIdAndUpdate(
      screenId,
      {
        name: name || screen.name,
        seatLayout: seatLayout || screen.seatLayout
      },
      { new: true }
    );

    res.json({
      message: 'Screen updated successfully',
      screen: {
        id: updatedScreen._id,
        name: updatedScreen.name,
        totalSeats: updatedScreen.seatLayout.flat().length,
        seatLayout: updatedScreen.seatLayout
      }
    });

  } catch (err) {
    console.error('Update screen error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete screen
const deleteScreen = async (req, res) => {
  try {
    const managerEmail = req.user.email;
    const { screenId } = req.params;

    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    const screen = await Screen.findOne({ _id: screenId, theater: theater._id });
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found or not owned by this theater' });
    }

    // Check if there are any active showtimes for this screen
    const activeShowtimes = await Showtime.find({ screen: screenId });
    if (activeShowtimes.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete screen with active showtimes. Please delete all showtimes first.',
        activeShowtimes: activeShowtimes.length
      });
    }

    await Screen.findByIdAndDelete(screenId);

    res.json({
      message: 'Screen deleted successfully',
      deletedScreen: {
        id: screen._id,
        name: screen.name
      }
    });

  } catch (err) {
    console.error('Delete screen error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== SHOWTIME MANAGEMENT ====================

// Create new showtime
const createShowtime = async (req, res) => {
  try {
    const managerEmail = req.user.email;
    const { screenId, movieId, startTime, ticketPrice } = req.body;

    if (!screenId || !movieId || !startTime || !ticketPrice) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    // Verify the screen belongs to this theater
    const screen = await Screen.findOne({ _id: screenId, theater: theater._id });
    if (!screen) {
      return res.status(404).json({ message: 'Screen not found or not owned by this theater' });
    }

    // Verify the movie exists
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: 'Movie not found' });
    }

    // Check for conflicting showtimes (same screen, overlapping times)
    const movieDuration = movie.duration; // in minutes
    const showStartTime = new Date(startTime);
    const showEndTime = new Date(showStartTime.getTime() + movieDuration * 60000);

    const conflictingShowtimes = await Showtime.find({
      screen: screenId,
      $or: [
        {
          startTime: { $lt: showEndTime },
          $expr: {
            $gt: [
              { $add: ['$startTime', { $multiply: ['$movie.duration', 60000] }] },
              showStartTime
            ]
          }
        }
      ]
    });

    if (conflictingShowtimes.length > 0) {
      return res.status(400).json({ 
        message: 'Showtime conflicts with existing showtimes',
        conflictingShowtimes: conflictingShowtimes.length
      });
    }

    const newShowtime = new Showtime({
      screen: screenId,
      movie: movieId,
      startTime: showStartTime,
      ticketPrice,
      bookedSeats: []
    });

    await newShowtime.save();

    // Populate the response
    const populatedShowtime = await Showtime.findById(newShowtime._id)
      .populate('movie', 'title language genre duration rating')
      .populate('screen', 'name');

    res.status(201).json({
      message: 'Showtime created successfully',
      showtime: {
        id: populatedShowtime._id,
        movie: populatedShowtime.movie,
        screen: populatedShowtime.screen,
        startTime: populatedShowtime.startTime,
        ticketPrice: populatedShowtime.ticketPrice,
        bookedSeats: populatedShowtime.bookedSeats
      }
    });

  } catch (err) {
    console.error('Create showtime error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update showtime
const updateShowtime = async (req, res) => {
  try {
    const managerEmail = req.user.email;
    const { showtimeId } = req.params;
    const { startTime, ticketPrice } = req.body;

    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    // Get the showtime and verify it belongs to this theater
    const showtime = await Showtime.findById(showtimeId).populate('screen');
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    if (showtime.screen.theater.toString() !== theater._id.toString()) {
      return res.status(403).json({ message: 'This showtime does not belong to your theater' });
    }

    // Check if there are any bookings for this showtime
    if (showtime.bookedSeats.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot update showtime with existing bookings',
        bookedSeats: showtime.bookedSeats.length
      });
    }

    const updatedShowtime = await Showtime.findByIdAndUpdate(
      showtimeId,
      {
        startTime: startTime || showtime.startTime,
        ticketPrice: ticketPrice || showtime.ticketPrice
      },
      { new: true }
    ).populate('movie', 'title language genre duration rating')
     .populate('screen', 'name');

    res.json({
      message: 'Showtime updated successfully',
      showtime: {
        id: updatedShowtime._id,
        movie: updatedShowtime.movie,
        screen: updatedShowtime.screen,
        startTime: updatedShowtime.startTime,
        ticketPrice: updatedShowtime.ticketPrice,
        bookedSeats: updatedShowtime.bookedSeats
      }
    });

  } catch (err) {
    console.error('Update showtime error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete showtime
const deleteShowtime = async (req, res) => {
  try {
    const managerEmail = req.user.email;
    const { showtimeId } = req.params;

    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    // Get the showtime and verify it belongs to this theater
    const showtime = await Showtime.findById(showtimeId).populate('screen movie');
    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    if (showtime.screen.theater.toString() !== theater._id.toString()) {
      return res.status(403).json({ message: 'This showtime does not belong to your theater' });
    }

    // Check if there are any bookings for this showtime
    const bookings = await Booking.find({ showtime: showtimeId });
    if (bookings.length > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete showtime with existing bookings',
        totalBookings: bookings.length
      });
    }

    await Showtime.findByIdAndDelete(showtimeId);

    res.json({
      message: 'Showtime deleted successfully',
      deletedShowtime: {
        id: showtime._id,
        movie: showtime.movie.title,
        screen: showtime.screen.name,
        startTime: showtime.startTime
      }
    });

  } catch (err) {
    console.error('Delete showtime error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// ==================== BOOKING MANAGEMENT ====================

// Get all bookings for the theater
const getTheaterBookings = async (req, res) => {
  try {
    const managerEmail = req.user.email;
    const { status, startDate, endDate } = req.query;

    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    // Get all screens of this theater
    const screens = await Screen.find({ theater: theater._id });
    const screenIds = screens.map(s => s._id);

    // Get all showtimes for these screens
    const showtimes = await Showtime.find({ screen: { $in: screenIds } });
    const showtimeIds = showtimes.map(s => s._id);

    // Build booking query
    let bookingQuery = { showtime: { $in: showtimeIds } };
    
    if (status) {
      bookingQuery.status = status;
    }

    if (startDate || endDate) {
      bookingQuery.createdAt = {};
      if (startDate) bookingQuery.createdAt.$gte = new Date(startDate);
      if (endDate) bookingQuery.createdAt.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(bookingQuery)
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title language genre duration rating' },
          { path: 'screen', select: 'name' }
        ]
      })
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 });

    const bookingData = bookings.map(booking => ({
      id: booking._id,
      user: booking.user,
      movie: booking.showtime.movie,
      screen: booking.showtime.screen,
      startTime: booking.showtime.startTime,
      seats: booking.seats,
      totalPrice: booking.totalPrice,
      status: booking.status,
      bookingDate: booking.createdAt
    }));

    // Calculate summary
    const totalBookings = bookings.length;
    const totalRevenue = bookings.reduce((sum, b) => sum + b.totalPrice, 0);
    const statusCounts = bookings.reduce((acc, b) => {
      acc[b.status] = (acc[b.status] || 0) + 1;
      return acc;
    }, {});

    res.json({
      theater: theater.theaterName,
      summary: {
        totalBookings,
        totalRevenue,
        statusCounts
      },
      bookings: bookingData
    });

  } catch (err) {
    console.error('Get theater bookings error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel booking (if allowed)
const cancelBooking = async (req, res) => {
  try {
    const managerEmail = req.user.email;
    const { bookingId } = req.params;

    const theater = await Theater.findOne({ email: managerEmail });
    if (!theater) {
      return res.status(404).json({ message: 'Theater not found for this manager.' });
    }

    const booking = await Booking.findById(bookingId)
      .populate({
        path: 'showtime',
        populate: { path: 'screen' }
      });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Verify the booking belongs to this theater
    if (booking.showtime.screen.theater.toString() !== theater._id.toString()) {
      return res.status(403).json({ message: 'This booking does not belong to your theater' });
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'Booking is already cancelled' });
    }

    // Update booking status
    booking.status = 'cancelled';
    await booking.save();

    // Remove seats from showtime's bookedSeats
    const showtime = await Showtime.findById(booking.showtime._id);
    showtime.bookedSeats = showtime.bookedSeats.filter(seat => 
      !booking.seats.includes(seat)
    );
    await showtime.save();

    res.json({
      message: 'Booking cancelled successfully',
      booking: {
        id: booking._id,
        status: booking.status,
        refundAmount: booking.totalPrice
      }
    });

  } catch (err) {
    console.error('Cancel booking error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  // Theater management
  getTheaterDetails,
  updateTheaterDetails,
  
  // Screen management
  getScreens,
  createScreen,
  updateScreen,
  deleteScreen,
  
  // Showtime management
  createShowtime,
  updateShowtime,
  deleteShowtime,
  getManagerShowtimes,
  getManagerShowtimesList,
  
  // Booking management
  getTheaterBookings,
  cancelBooking,

  getManagerStats
};