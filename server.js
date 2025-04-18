const express = require('express');
require('dotenv').config();
const db = require('./config/db');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/jobs', require('./routes/job.routes'));
app.use('/api/bids', require('./routes/bid.routes'));
app.use('/api/messages', require('./routes/message.routes'));
app.listen(process.env.PORT, ()=>{
    console.log(`Server is running on https://127.0.0.1:${process.env.PORT}`);
    db.connectDB();
})