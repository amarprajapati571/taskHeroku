
require('dotenv').config();
const mongoose = require('mongoose');
const db=process.env.DB;

mongoose.connect(db).then(()=>{
    console.log('DB connected');
})
.catch((err)=>{
    console.log(err);
})
