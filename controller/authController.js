const users = require('../model/authModel')
const bcrypt = require('bcrypt')
const nodemailer = require('nodemailer')
const jwt = require('jsonwebtoken')

// nodemailer setup

const transport = nodemailer.createTransport({
    service:"gmail",
    auth:{
        user : process.env.NodemailerMail,
      pass: process.env.NodemailerPassword
    }
})


// register
exports.registerController = async(req,res)=>{
    try {
     const {userName, email, password} = req.body
 
     // Validate required fields
     if(!userName || !email || !password){
         return res.status(400).json({message: 'All fields are required'})
     }
 
     // Validate email format
     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
     if(!emailRegex.test(email)){
         return res.status(400).json({message: 'Invalid email format'})
     }
 
     const encryptedPassword = await bcrypt.hash(password,10)
     const otp = Math.floor(100000 + Math.random() * 900000)
 
     const existingUser = await users.findOne({email})
 
     if(existingUser){
         if(existingUser.verified){
             return res.status(400).json({message:'User already registered and verified with this email'})
         } else {
             existingUser.otp = otp
             existingUser.password = encryptedPassword
             existingUser.verified = false; 
             await existingUser.save()
         }
     } else {
         const newUser = new users({
             userName,
             email,
             password: encryptedPassword,
             otp,
             verified: false 
         })
         await newUser.save()
     }
 
     // Send OTP email
     await transport.sendMail({
         from: process.env.NodemailerMail,
         to: email,
         subject: 'OTP Verification',
         text: `Your OTP for verification is: ${otp}`,
     })
 
     return res.status(200).json({message:'OTP sent successfully'})
 
    } catch (error) {
     console.error("Error during registration:", error)
     return res.status(500).json({ 
         message: 'Registration failed',
         error: error.message 
     })
    }
 }


// verify user
exports.verifyOtp = async (req,res)=>{
    try {
        const {email,otp} = req.body
        const existingUser = await users.findOne({email})

        if(!existingUser){
           return res.status(400).json('user not found')
        }
        if(existingUser.otp !=otp){
           return res.status(400).json('Invalid otp')
        }

        existingUser.verified = true
        existingUser.otp =''


        const token = jwt.sign({
            id:existingUser._id,
            admin:existingUser.isAdmin
        },process.env.JWT_SECRETKEY)

        await existingUser.save()
        res.status(200).json({message:'User verified',token, userId:existingUser._id, isAdmin:existingUser.isAdmin})
        
    } catch (error) {
        return res.status(500).json({message:"Failed to verify user"})
        console.log(error);
        
    }
}


// Resend OTP
exports.resendOTP =async(req, res)=> {
    try {
      const { email } = req.body;
  
      const user = await users.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      if (user.verified) {
        return res.status(400).json({ message: 'User already verified' });
      }
  
      // Generate a strictly numeric 6-digit OTP
      const otp = Math.floor(100000 + Math.random() * 900000); // Ensures a random 6-digit integer
  
      user.otp = otp;
      await user.save();
  
      // Send OTP via email
      await transport.sendMail({
        from: process.env.NodemailerMail,
        to: email,
        subject: 'Resent OTP Verification',
        text: `Your OTP for verification is: ${otp}`,
      });
  
      res.status(200).json({ message: 'OTP resent successfully' });
    } catch (error) {
      console.error('Error during OTP resend:', error);
      res.status(500).json({ message: 'Failed to resend OTP' });
    }
  }


// login

exports.loginUser = async(req,res)=>{
    try {

        const {email,password} = req.body

        const existingUser = await users.findOne({email})
        if(!existingUser || !existingUser.verified){
            return res.status(400).json('User not found')
        }

        const decryptedpassword = await bcrypt.compare(password,existingUser.password)

        if (!decryptedpassword) {
            return res.status(400).json({ message: 'Invalid password' });
        }

        // generate jwt token
        const token = jwt.sign({
            id:existingUser._id,
            admin:existingUser.isAdmin
        },process.env.JWT_SECRETKEY)

        res.status(200).json({message:'Login successful',token, userId:existingUser._id, isAdmin:existingUser.isAdmin,
            userName: existingUser.userName})
        
    } catch (error) {
        res.status(500).json({message:'Failed to login'})
        console.log(error);
        
    }
}