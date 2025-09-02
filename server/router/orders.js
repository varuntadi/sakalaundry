const express = require('express');
const router = express.Router();
const Order = require('../models/order');

router.post('/', async (req,res)=>{
  try{
    const order = new Order(req.body);
    await order.save();
    res.json(order);
  }catch(err){
    res.status(400).json({ error: err.message });
  }
});

router.get('/', async (req,res)=>{
  try{
    const orders = await Order.find().populate('userId');
    res.json(orders);
  }catch(err){
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
