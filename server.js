const express = require('express');
require('dotenv').config();
const cors = require('cors');
const db = require('./config/db');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
    origin:'http://localhost:3000',
    credentials:true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/bids', require('./routes/bid.routes'));
app.listen(process.env.PORT, ()=>{
    console.log(`Server is running on https://127.0.0.1:${process.env.PORT}`);
    db.connectDB();
})