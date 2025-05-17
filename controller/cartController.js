

const users = require('../model/authModel');
const products = require('../model/productModel');

// Helper function to calculate cart total
function calculateCartTotal(cartItems) {
    return cartItems.reduce((total, item) => {
        return total + (item.product.price * item.quantity);
    }, 0);
}

// Add to cart
exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1 } = req.body;
        const userId = req.user.id;

        // Check if product exists
        const product = await products.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Get user and their cart
        const user = await users.findById(userId);
        
        // Check if product already in cart
        const existingItemIndex = user.cart.findIndex(item => 
            item.product.toString() === productId
        );

        if (existingItemIndex >= 0) {
            // Update quantity if already in cart
            user.cart[existingItemIndex].quantity += quantity;
        } else {
            // Add new item to cart
            user.cart.push({
                product: productId,
                quantity
            });
        }

        await user.save();
        
        // Populate product details before sending response
        const populatedUser = await users.findById(userId).populate('cart.product');
        
        res.status(200).json({ 
            message: 'Product added to cart',
            cart: populatedUser.cart,
            total: calculateCartTotal(populatedUser.cart)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update cart item quantity (general update)
exports.updateCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const { quantity } = req.body;
        const userId = req.user.id;

        if (!quantity || isNaN(quantity) || quantity < 1) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        const user = await users.findOneAndUpdate(
            { 
                _id: userId,
                'cart.product': productId 
            },
            { 
                $set: { 'cart.$.quantity': quantity } 
            },
            { new: true }
        ).populate('cart.product');

        if (!user) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        res.status(200).json({ 
            message: 'Cart updated',
            cart: user.cart,
            total: calculateCartTotal(user.cart)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Remove from cart  
exports.removeFromCart = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        const user = await users.findByIdAndUpdate(
            userId,
            { $pull: { cart: { product: productId } } },
            { new: true }
        ).populate('cart.product');

        res.status(200).json({ 
            message: 'Item removed from cart',
            cart: user.cart,
            total: calculateCartTotal(user.cart)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Empty cart
exports.emptyCart = async (req, res) => {
    try {
        const userId = req.user.id;

        const user = await users.findByIdAndUpdate(
            userId,
            { $set: { cart: [] } },
            { new: true }
        );

        res.status(200).json({ 
            message: 'Cart emptied',
            cart: user.cart,
            total: 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Move item to wishlist  
exports.moveToWishlist = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        // First remove from cart
        const user = await users.findById(userId);
        const cartItemIndex = user.cart.findIndex(item => 
            item.product.toString() === productId
        );

        if (cartItemIndex === -1) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Check if already in wishlist
        if (user.wishlist.includes(productId)) {
            return res.status(400).json({ message: 'Product already in wishlist' });
        }

        // Remove from cart and add to wishlist
        user.cart.splice(cartItemIndex, 1);
        user.wishlist.push(productId);

        await user.save();
        
        const populatedUser = await users.findById(userId)
            .populate('cart.product')
            .populate('wishlist');

        res.status(200).json({ 
            message: 'Item moved to wishlist',
            cart: populatedUser.cart,
            wishlist: populatedUser.wishlist,
            total: calculateCartTotal(populatedUser.cart)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get cart
exports.getCart = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await users.findById(userId)
            .populate('cart.product');
        
        res.status(200).json({ 
            cart: user.cart,
            total: calculateCartTotal(user.cart)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Increment cart item quantity by 1
exports.incrementCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        const user = await users.findOneAndUpdate(
            { 
                _id: userId,
                'cart.product': productId 
            },
            { 
                $inc: { 'cart.$.quantity': 1 } 
            },
            { new: true }
        ).populate('cart.product');

        if (!user) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Find the updated item
        const updatedItem = user.cart.find(item => 
            item.product._id.toString() === productId
        );

        res.status(200).json({ 
            message: 'Item quantity increased',
            product: {
                _id: updatedItem.product._id,
                name: updatedItem.product.name,
                price: updatedItem.product.price,
                quantity: updatedItem.quantity,
                subtotal: updatedItem.product.price * updatedItem.quantity
            },
            total: calculateCartTotal(user.cart)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Decrement cart item quantity by 1 (minimum 1)
exports.decrementCartItem = async (req, res) => {
    try {
        const { productId } = req.params;
        const userId = req.user.id;

        // First find the item to check current quantity
        const user = await users.findById(userId).populate('cart.product');
        const cartItem = user.cart.find(item => 
            item.product._id.toString() === productId
        );

        if (!cartItem) {
            return res.status(404).json({ message: 'Item not found in cart' });
        }

        // Only decrement if quantity > 1
        if (cartItem.quantity > 1) {
            const updatedUser = await users.findOneAndUpdate(
                { 
                    _id: userId,
                    'cart.product': productId,
                    'cart.quantity': { $gt: 1 }
                },
                { 
                    $inc: { 'cart.$.quantity': -1 } 
                },
                { new: true }
            ).populate('cart.product');

            const updatedItem = updatedUser.cart.find(item => 
                item.product._id.toString() === productId
            );

            return res.status(200).json({ 
                message: 'Item quantity decreased',
                product: {
                    _id: updatedItem.product._id,
                    name: updatedItem.product.name,
                    price: updatedItem.product.price,
                    quantity: updatedItem.quantity,
                    subtotal: updatedItem.product.price * updatedItem.quantity
                },
                total: calculateCartTotal(updatedUser.cart)
            });
        }

        // If quantity is 1, return current product without changes
        res.status(200).json({ 
            message: 'Quantity cannot be less than 1',
            product: {
                _id: cartItem.product._id,
                name: cartItem.product.name,
                price: cartItem.product.price,
                quantity: cartItem.quantity,
                subtotal: cartItem.product.price * cartItem.quantity
            },
            total: calculateCartTotal(user.cart)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};