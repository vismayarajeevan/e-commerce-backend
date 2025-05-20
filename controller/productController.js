const products = require('../model/productModel')


// exports.getAllProductsController = async(req,res)=>{

//     try {
//         const allProducts = await products.find()
//         res.status(200).json(allProducts)
        
//     } catch (error) {
//         res.status(401).json(error)
//     }
    
// }

exports.getAllProductsController = async(req,res)=>{
    const searchKey = req.query.search || ''; // Get search query or default to empty string
    
    try {
        let query = {};
        if(searchKey) {
            query = {
                $or: [
                    { title: { $regex: searchKey, $options: 'i' } },
                    { description: { $regex: searchKey, $options: 'i' } },
                    { category: { $regex: searchKey, $options: 'i' } }
                ]
            }
        }
        
        const allProducts = await products.find(query)
        res.status(200).json(allProducts)
    } catch (error) {
        res.status(401).json(error)
    }
}