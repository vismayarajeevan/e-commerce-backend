const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      default: 0.0
    },
    rating: {
      type: Number,
      default: 0
    },
    stock: {
      type: Number,
      default: 0
    },
    category: {
      type: String,
      required: true
    },
    brand: {
      type: String
    },
    
   
    availabilityStatus: {
      type: String
    },
    reviews: {
      type: [{
        rating: Number,
        comment: String,
        date: Date,
        reviewerName: String,
        reviewerEmail: String
      }],
      default: []
    },
   
    images: {
      type: [String],
      default: []
    },
    
    createdAt: {
      type: Date,
      default: Date.now
    }
  });

module.exports = mongoose.model('Product', productSchema);