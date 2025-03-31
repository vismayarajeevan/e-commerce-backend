const express = require('express')
const router = express.Router()
const productController = require('../controller/productController')


router.get('/all-products',productController.getAllProductsController)



module.exports = router