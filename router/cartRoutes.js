const express = require('express');
const router = express.Router();
const cartController = require('../controller/cartController');
const { verifyToken } = require('../middleware/authMiddleware');

// Protected routes (require login)
router.post('/add', verifyToken, cartController.addToCart);
router.put('/update/:productId', verifyToken, cartController.updateCartItem);
router.delete('/remove/:productId', verifyToken, cartController.removeFromCart);
router.delete('/empty', verifyToken, cartController.emptyCart);
router.post('/move-to-wishlist/:productId', verifyToken, cartController.moveToWishlist);
router.get('/', verifyToken, cartController.getCart);

module.exports = router;