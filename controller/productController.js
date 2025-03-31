const products = require('../model/productModel')


exports.getAllProductsController = async(req,res)=>{

    try {
        const allProducts = await products.find()
        res.status(200).json(allProducts)
        
    } catch (error) {
        res.status(401).json(error)
    }
    
}