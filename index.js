const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')

dotenv.config()


require('./config/db')


const app = express()
app.use(cors())
app.use(express.json())




const PORT = process.env.PORT || 3000

app.listen(PORT,()=>{
    console.log(`Server is running at port ${PORT}`);
    
})

app.get('/',(req,res)=>{
    res.status(200).send(`<h1>Inside the server </h1>`)
})
