const express = require('express');
const router = express.Router();

const { verifyToken } = require('../middleware/authMiddleware')
const wishlistController = require('../controller/wishlistController')

router.post('/add', verifyToken, wishlistController.addToWishlist);
router.delete('/:productId', verifyToken, wishlistController.removeFromWishlist);
router.get('/', verifyToken, wishlistController.getWishlist);

module.exports = router