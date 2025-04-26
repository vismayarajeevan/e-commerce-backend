const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware')
const wishlistController = require('../controller/wishlistController')

router.post('/add', verifyToken, wishlistController.addToWishlist);
router.get('/', verifyToken, wishlistController.getWishlist);

module.exports = router