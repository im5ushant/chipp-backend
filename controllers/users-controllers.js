const mongoose = require("mongoose");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const HttpError = require("../models/http-error");
const User = require("../models/user");
const { send } = require("process");



// ---------------- NODEMAILER CONFIG -------------------
let testAccount;
let transporter;
const nodeMailerConfig = async () => {
  testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};
nodeMailerConfig();



// ---------------- TWILIO CONFIG ----------------------
// const smsAccountSid = process.env.SMS_ACCOUNT_SID;
// const smsAuthToken = process.env.SMS_AUTH_TOKEN;
// const client = require("twilio")(smsAccountSid, smsAuthToken);




// ---------------- MOBILE OTP -------------------------
// const sendOTP = async (req, res, next) => {
//   const phone = req.body.phone;
//   const otp = Math.floor(100000 + Math.random() * 900000);
//   const ttl = 2 * 60 * 1000;
//   const expires = Date.now() + ttl;
//   const data = `${phone}.${otp}.${expires}`;
//   const hash = crypto.createHmac("sha256", process.env.SMS_SECRET_KEY).update(data).digest("hex");
//   const fullhash = `${hash}.${expires}`;

//   client.messages
//     .create({
//       body: `Your one time login password is ${otp}`,
//       from: +17603776044,
//       to: phone,
//     })
//     .then((messages) => console.log(messages))
//     .catch((err) => console.error(err));

//   res.status(200).send({ phone, hash: fullhash });
// };




// ---------------- VERIFY OTP --------------------------
// const verifyOTP = async (req, res, next) => {
//   const phone = req.body.phone;
//   const hash = req.body.hash;
//   const otp = req.body.otp;

//   let [hashValue, expires] = hash.split(".");

//   let now = Date.now();

//   if (now > parseInt(expires)) {
//     return res.status(504).send({ message: "OTP Expired" });
//   }

//   let data = `${phone}.${otp}.${expires}`;
//   const newCalculatedHash = crypto
//     .createHmac("sha256", process.env.SMS_SECRET_KEY)
//     .update(data)
//     .digest("hex");

//   if (newCalculatedHash === hashValue) {
//     return res.status(202).send({ message: "User Confirmed" });
//   } else {
//     return res
//       .status(400)
//       .send({ verification: false, message: "Incorrect OTP" });
//   }
// };




// ---------------- SEND EMAIL ----------------------
const sendemail = async (req, res, next) => {
  let info = await transporter.sendMail({
    from: '"Chipp" <noreply@chipp.co.in>', // sender address
    to: "sushantdevsingh4@gmail.com", // list of receivers
    subject: "Please Verify Your Email Address", // Subject line
    html: "<b>Click here to confirm your email</b>", // html body
  });

  if (info.messageId) {
    res.send("Email Sent");
  } else {
    res.send("Error with sending email");
  }
};




// ---------------- GET USER BY ID ------------------------
const getUserById = async (req, res, next) => {
  const userId = req.params.uid;

  let user;
  try {
    user = await User.findById(userId, "-password");
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find the user for the provided id.",
      404
    );
    return next(error);
  }

  res.json({ user: user.toObject({ getters: true }) });
};



// ---------------- SIGNUP -------------------
const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid Field!", 422));
  }

  const { name, email, password, phone } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Sign up failed, please try again later!", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "User already exists, please login instead",
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    emailconfirmed: false,
    password: hashedPassword,
    phone,
    // image: req.file.path,
    fundraisers: [],
    notices: [],
    donations: [],
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      process.env.JWT_KEY
    );
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  // let emailConfirmToken;
  // try {
  //   emailConfirmToken = jwt.sign(
  //     { userId: createdUser.id },
  //     "email_confirmation_key",
  //     { expiresIn: "900s" }
  //   );
  // } catch (err) {
  //   const error = new HttpError(err, 500);
  //   return next(error);
  // }

  // const url = `${process.env.FRONTEND_URL}user/confirmemail/${emailConfirmToken}`;

  // try {
  //   let info = await transporter.sendMail({
  //     from: '"Chipp" <noreply@chipp.co.in>', // sender address
  //     to: `${createdUser.email}`, // list of receivers
  //     subject: "Please Verify Your Email Address", // Subject line
  //     html: `<a href="https://${url}">Click here to confirm your email</a>`, // html body
  //   });
  // } catch (err) {
  //   const error = new HttpError(err, 500);
  //   return next(error);
  // }

  //--------------Trash-----------------
  // if (info.messageId) {
  //   res.send("Email Sent");
  // } else {
  //   res.send("Error with sending email");
  // }

  const responseData = createdUser.toObject({ getters: true });

  res.status(201).json({
    user: {
      id: responseData.id,
      email: responseData.email,
      name: responseData.name,
      image: responseData.image,
      phone: responseData.phone,
      donations: responseData.donations,
      fundraisers: responseData.fundraisers,
      token: token,
    },
  });
};



// ---------------- CONFIRM EMAIL -------------------
const confirmEmail = async (req, res, next) => {
  const email_token = req.params.token;

  const userId = jwt.verify(email_token, "email_confirmation_key");

  let user;
  try {
    user = await User.findById(userId.userId);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find the user for the provided id.",
      404
    );
    return next(error);
  }

  user.emailconfirmed = true;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.json({ message: "E-Mail Confirmed!" });
};




// ---------------- SIGNIN -------------------
const signin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid Field!", 422));
  }

  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Login Failed, please try again later", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("E-Mail does not exist", 401);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid Password!", 403);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY
    );
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  const responseData = existingUser.toObject({ getters: true });

  res.status(201).json({
    user: {
      id: responseData.id,
      email: responseData.email,
      emailconfirmed: responseData.emailconfirmed,
      name: responseData.name,
      image: responseData.image,
      phone: responseData.phone,
      donations: responseData.donations,
      fundraisers: responseData.fundraisers,
      token: token,
    },
  });
};



// ---------------- UPDATE PROFILE DETAILS -------------------
const updateProfileDetails = async (req, res, next) => {
  const { id, name, email, phone } = req.body;

  let existingUser;
  try {
    existingUser = await User.findById(id, "-password");
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      "Could not find the user for the provided id.",
      404
    );
    return next(error);
  }

  if (name !== "") {
    existingUser.name = name;
  }

  if (email !== "" && existingUser.email != email) {
    existingUser.emailconfirmed = false;

    let emailConfirmToken;
    try {
      emailConfirmToken = jwt.sign({ userId: id }, "email_confirmation_key", {
        expiresIn: "900s",
      });
    } catch (err) {
      const error = new HttpError(err, 500);
      return next(error);
    }

    const url = `${process.env.FRONTEND_URL}user/confirmemail/${emailConfirmToken}`;

    let info = await transporter.sendMail({
      from: '"Chipp" <noreply@chipp.co.in>', // sender address
      to: `${email}`, // list of receivers
      subject: "Please Verify Your Email Address", // Subject line
      html: `<a href="https://${url}">Click here to confirm your email</a>`, // html body
    });

    // if (info.messageId) {
    //   res.send("Email Sent");
    // } else {
    //   res.send("Error with sending email");
    // }
    existingUser.email = email;
  }

  if (phone !== "") {
    existingUser.phone = phone;
  }

  try {
    await existingUser.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ message: "Details Updated Successfully" });
};



// ---------------- AADHAR UPLOAD -------------------
const aadharUpload = async (req, res, next) => {
  const { userId } = req.body;

  let user;
  try {
    user = await User.findById(userId, "-password");
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find the user for the provided id.",
      404
    );
    return next(error);
  }

  user.kycdocuments.aadharCard = req.file.path;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ message: "Aadhar Uploaded" });
};



// ---------------- PANCARD UPLOAD -------------------
const pancardUpload = async (req, res, next) => {
  const { userId } = req.body;

  let user;
  try {
    user = await User.findById(userId, "-password");
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find the user for the provided id.",
      404
    );
    return next(error);
  }

  user.kycdocuments.panCard = req.file.path;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ message: "Pan Card Uploaded" });
};




// ---------------- USER IMAGE UPLOAD -------------------
const userimageUpload = async (req, res, next) => {
  const { userId } = req.body;

  let user;
  try {
    user = await User.findById(userId, "-password");
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!user) {
    const error = new HttpError(
      "Could not find the user for the provided id.",
      404
    );
    return next(error);
  }

  user.kycdocuments.userImage = req.file.path;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ message: "User Image Uploaded" });
};




// ---------------- CHANGE PASSWORD -------------------
const changePassword = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid Field!", 422));
  }

  const { email, currPass, newPass } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Login Failed, please try again later", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("E-Mail does not exist", 401);
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(currPass, existingUser.password);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError("Invalid Password!", 403);
    return next(error);
  }

  let hashedPassword;

  if (isValidPassword) {
    try {
      hashedPassword = await bcrypt.hash(newPass, 12);
    } catch (err) {
      const error = new HttpError(err, 500);
      return next(error);
    }
  }

  existingUser.password = hashedPassword;

  try {
    await existingUser.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ message: "Password Changed Successfully" });
};



// ---------------- FORGOT PASSWORD VERIFY -------------------
const verifyForgotPassword = async (req, res, next) => {
  const { email } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Process Failed, please try again later", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("E-Mail does not exist", 401);
    return next(error);
  }

  let forgotPasswordToken;
  try {
    forgotPasswordToken = jwt.sign({ email: email }, "forgot_password_key", {
      expiresIn: "900s",
    });
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  const url = `${process.env.FRONTEND_URL}user/confirmforgotpassword/${forgotPasswordToken}`;

  let info = await transporter.sendMail({
    from: '"Chipp" <noreply@chipp.co.in>', // sender address
    to: `${email}`, // list of receivers
    subject: "Chipp Account Recovery", // Subject line
    html: `<a href="https://${url}">Click here to recover your account</a>`, // html body
  });

  // if (info.messageId) {
  //   res.send("Email Sent");
  // } else {
  //   res.send("Error with sending email");
  // }

  res.json({ message: "Change Password" });
};


// ---------------- FORGOT PASSWORD CONFIRM ---------------------
const confirmForgotPassword = async (req, res, next) => {
  const password_token = req.params.token;

  const email = jwt.verify(password_token, "forgot_password_key");

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email.email });
  } catch (err) {
    const error = new HttpError(
      "Authorization Failed, please try again later",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("E-Mail does not exist", 401);
    return next(error);
  }

  res.status(200).json({ message: "Permission Granted" });
};



// ---------------- CHANGE FORGOT PASSWORD ---------------------
const changeForgotPassword = async (req, res, next) => {
  const password_token = req.params.token;

  const { newPass } = req.body;

  const email = jwt.verify(password_token, "forgot_password_key");

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email.email });
  } catch (err) {
    const error = new HttpError("Login Failed, please try again later", 500);
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("E-Mail does not exist", 401);
    return next(error);
  }

  let hashedPassword;

  try {
    hashedPassword = await bcrypt.hash(newPass, 12);
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  existingUser.password = hashedPassword;

  try {
    await existingUser.save();
  } catch (err) {
    const error = new HttpError(err, 500);
    return next(error);
  }

  res.status(200).json({ message: "Password Changed Successfully" });
};





exports.getUserById = getUserById;
exports.signup = signup;
exports.confirmEmail = confirmEmail;
exports.signin = signin;
exports.updateProfileDetails = updateProfileDetails;
exports.aadharUpload = aadharUpload;
exports.pancardUpload = pancardUpload;
exports.userimageUpload = userimageUpload;
exports.changePassword = changePassword;
exports.verifyForgotPassword = verifyForgotPassword;
exports.confirmForgotPassword = confirmForgotPassword;
exports.changeForgotPassword = changeForgotPassword;
exports.sendemail = sendemail;
// exports.sendOTP = sendOTP;
// exports.verifyOTP = verifyOTP;