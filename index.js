const db = require("./db");
const express = require("express");
const app = express();
const host = process.env.HOST;
const port = process.env.PORT || 8000;
const jwt = require("jsonwebtoken");
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const bodyParser = require("body-parser");
const moment = require("moment");
const { generateCode } = require("./lib");
const Users = require("./models/User.model");
const request = require("request");
const cron = require("node-cron");
const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./docs/swagger.json');

const path = require('path');
app.use(express.static(path.join(__dirname, 'static')));
app.use(
    '/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, {
        customfavIcon: '/fav32.png',
        customSiteTitle: 'Task app',
        authorizeBtn: true,
        swaggerOptions: {
            filter: true,
            displayRequestDuration: true,
        },
    })
);

cron.schedule("*/5 * * * *", async () => {
  let dates = moment();
  await Users.updateMany(
    {
      genrateOtpExpire: { $gt: dates },
    },
    {
      $set: {
        otpExpire: true,
      },
    }
  );
});

app.post('/add-user',async(req,res)=>{
      let {name,phone} = req.body;
      const user=new Users({
        name:name,
        phone:phone
    });
    const data= await user.save();
    res.send('add students');
});
app.get('/',async(req,res)=>{
    res.send('home page');
});
app.post("/genrateOTP", async (req, res) => {
  let phone = req.body.phone;
  const data = await Users.findOne({ phone })
  if (data) {
    if (data.suspendedTime < moment()) {
      if (moment(data.genrateOtpTime) < moment()) {
        data.isActive = true;
        data.otpPass = 0;
        await data.save();
        if (data.isActive) {
          let otp = generateCode();
          data.otp = otp;
          data.genrateOtpTime = moment().add(1, "minutes");
          data.genrateOtpExpire = moment().add(5, "minutes");
          data.otpExpire = false;
          var options = {
            method: "GET",
            url: `https://be.platform.simplifii.com/api/v1/custom/sendOTP?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9&mobile=${phone}&OTP=${otp}`,
          };

          request(options, async function (error, response) {
            if (error) throw new Error(error);
            let items = JSON.parse(response.body);
            await data.save();
            res.json({
              status: true,
              message: `OTP send on your this number ${phone}`,
            });
          });
        }
      } else {
        res.json({
          status: false,
          message: `Please try agin after 1 min`,
        });
      }
    } else {
      res.json("Now you are suspended please try later");
    }
  } else {
    res.json({
      status: false,
      message: `${phone} is not found`,
    });
  }
});
app.post("/login", async (req, res) => {
  let { phone, otp } = req.body;
  let userData = await Users.findOne({ phone: phone });
  if (userData.isActive) {
    if (userData.otpExpire == false) {
      if (userData.otpUsed == false) {
        if (userData.otp === otp) {
          userData.otpUsed = true;
          userData.otpPass = 0;
          await userData.save();
          const token = jwt.sign(
            { userId: userData._id },
            process.env.JWT_SECRET_KEY,
            { expiresIn: "1d" }
          );
          res.json({
            token,
          });
        } else {
          let savePass = userData.otpPass;
          userData.otpPass = userData.otpPass + 1;
          await userData.save();
          if (savePass >= 5) {
            userData.isActive = false;
            userData.otpPass = userData.otpPass + 1;
            userData.suspendedTime = moment().add(1, "hours");
            await userData.save();
            return res.json({
              status: false,
              message: "Now you are block for 1 hour",
            });
          } else {
            return res.json({
              status: false,
              message: "Wrong  OTP",
            });
          }
        }
      } else {
        res.json({
          status: false,
          message: "This OTP is already used",
        });
      }
    } else {
      res.json({
        status: false,
        message: "your OTP is expire",
      });
    }
  } else {
    res.json({
      status: false,
      message: "you are block",
    });
  }
});

app.listen(port, () => {
  console.log(`server is running on port ${host}${port}`);
});
