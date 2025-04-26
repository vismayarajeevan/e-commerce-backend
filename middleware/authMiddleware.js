// authMiddleware.js
const jwt = require('jsonwebtoken');
const users = require('../model/authModel');

const verifyToken = async (req, res, next) => {
    try {
        // Get token from header
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ 
                message: 'Authentication required. Please login.' 
            });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRETKEY);
        
        // Check if user still exists
        const user = await users.findById(decoded.id);
        if (!user) {
            return res.status(401).json({ 
                message: 'User not found. Please login again.' 
            });
        }

        // Attach user to request
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                message: 'Invalid token. Please login again.' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                message: 'Session expired. Please login again.' 
            });
        }

        res.status(500).json({ 
            message: 'Authentication failed. Please try again.' 
        });
    }
};

const verifyAdmin = (req, res, next) => {
    verifyToken(req, res, () => {
        if (!req.user.isAdmin) {
            return res.status(403).json({ 
                message: 'Access denied. Admin privileges required.' 
            });
        }
        next();
    });
};

module.exports = { verifyToken, verifyAdmin };