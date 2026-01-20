// backend/routes/tripRoutes.js - UPDATED
const express = require('express');
const router = express.Router();
const tripController = require('../controllers/tripController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// AI Trip Planning
router.post('/plan', tripController.generateTripPlan);
router.get('/plan/:groupId', tripController.getTripPlan);
router.put('/plan/:groupId', tripController.updateTripPlan);

// Hotel Search & Booking
router.post('/hotels/search', tripController.searchHotels);
router.post('/booking', tripController.createGroupBooking);
router.get('/booking/:groupId', tripController.getGroupBookings);
router.put('/booking/:bookingId', tripController.updateBookingStatus);

// Expense Management with UPI
router.post('/expenses', tripController.addExpense);
router.get('/expenses/:groupId', tripController.getExpenses);
router.delete('/expenses/:expenseId', tripController.deleteExpense);

// AI Route Suggestions
router.get('/routes/:groupId', tripController.getRouteSuggestions);

module.exports = router;