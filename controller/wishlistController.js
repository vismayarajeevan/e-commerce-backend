const users = require('../model/authModel')
const products = require('../model/productModel')

exports.addToWishlist = async (req, res) => {
    try {
        const { productId } = req.body;
        const userId = req.user.id;

        // Check if product exists
        const product = await products.findById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Add to wishlist if not already there
        const user = await users.findByIdAndUpdate(
            userId,
            { $addToSet: { wishlist: productId } }, // $addToSet prevents duplicates
            { new: true }
        ).populate('wishlist');

        res.status(200).json({ 
            message: 'Product added to wishlist',
            wishlist: user.wishlist 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};


// get wishlist products

exports.getWishlist = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await users.findById(userId).populate('wishlist');
        
        res.status(200).json({ wishlist: user.wishlist });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};