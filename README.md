# 🎬 BookMyMovie – Movie Ticket Booking System

A full-featured Movie Ticket Booking Web Application with role-based dashboards for Admins and Theater Managers. Built with Node.js, Express, MongoDB, and JWT authentication. Supports real-time showtime management, seat selection, booking, and revenue statistics.

---

## 🚀 Features

- ✅ JWT-based Role Authentication (Admin, Theater Manager, User)
- 🎭 Admin Dashboard for managing:
  - Movies (CRUD)
  - Theaters (Approval system)
  - Screens & Showtimes
  - Revenue & Booking Statistics with Charts
- 🎟 Theater Manager Dashboard:
  - Create, edit, delete screens & showtimes
  - View stats of their own theater (revenue, bookings, movie performance)
- 📊 Statistics:
  - Overall: movies, theaters, screens, bookings, revenue
  - Per-Theater, Per-Movie, Per-Screen insights
- 💺 Seat Layout per screen (customizable)
- 📅 Upcoming and ongoing showtime listings
- 🖼 Movie posters & metadata

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB + Mongoose
- **Authentication:** JWT, Bcrypt
- **Payments:** Cashfree PG API (Sandbox/Live)
- **Frontend:** HTML, CSS, JavaScript

---

## 📁 Project Structure
```
├── config/
│ ├── dbConfig.js
│ └── roleList.js
├── models/
│ ├── userModel.js
│ ├── theaterModel.js
│ ├── screenModel.js
│ ├── movieModel.js
│ ├── showtimeModel.js
│ └── bookingModel.js
├── controllers/
│ ├── adminController.js
│ ├── theaterController.js
│ └── showtimeController.js
├── routes/
│ ├── adminRoutes.js
│ ├── managerRoutes.js
│ └── authRoutes.js
├── middleware/
│ ├── verifyJWT.js
│ └── verifyRole.js
├── public/
│ ├── html/ # HTML Pages
│ ├── css/ # Stylesheets
│ └── js/ # Frontend Logic
├── seed.js # MongoDB Seeder Script
├── server.js
└── .env
```

## 🔐 Environment Variables (`.env`)
```
MONGO_CONNECTION_URL=your_mongodb_url
JWT_SECRET=your_jwt_secret
SIB_API_KEY=your_brevo_api_key
CASHFREE_APP_ID=your_cashfree_app_id
CASHFREE_SECRET_KEY=your_cashfree_secret
CASHFREE_ENV=sandbox
```

## Install dependencies

```npm install```
## Run the project

```npm run dev```