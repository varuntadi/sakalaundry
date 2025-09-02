const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');

router.post('/register', async (req,res)=>{
  try{
    const { name,email,password,role } = req.body;
    const hashed = await bcrypt.hash(password,10);
    const user = new User({ name,email,password:hashed,role });
    await user.save();
    res.json({ message:"User registered ✅" });
  }catch(err){
    res.status(400).json({ error: err.message });
  }
});

router.post('/login', async (req,res)=>{
  try{
    const { email,password } = req.body;
    const user = await User.findOne({ email });
    if(!user) return res.status(404).json({ error:"User not found" });

    const match = await bcrypt.compare(password,user.password);
    if(!match) return res.status(400).json({ error:"Wrong password" });

    const token = jwt.sign({ id:user._id, role:user.role }, process.env.JWT_SECRET, { expiresIn:'7d' });
    res.json({ token, user });
  }catch(err){
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
