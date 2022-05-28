const fs = require("fs");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
// const cors = require("cors");

dotenv.config({
  path: "./.env",
});

const url = `mongodb+srv://${process.env.DB_DEV_USER}:${process.env.DB_DEV_PASS}@cluster0.ksjva.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const fundraiserRoutes = require("./routes/fundraisers-routes");
const usersRoutes = require("./routes/users-routes");
const noticeRoutes = require("./routes/notice-routes");
const HttpError = require("./models/http-error");

const app = express();

app.use(express.json());

app.use(
  "/uploads/images/profiles",
  express.static(path.join("uploads", "images", "profiles"))
);
app.use(
  "/uploads/images/fundraisers",
  express.static(path.join("uploads", "images", "fundraisers"))
);
app.use(
  "/uploads/images/documents",
  express.static(path.join("uploads", "images", "documents"))
);

//CORS allowance header
app.use((req, res, next) => {
  res.setHeader("Reached", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PATCH, DELETE')
  next();
});
// app.use(cors({origin: '*'}));

app.use("/api/fundraiser", fundraiserRoutes);
app.use("/api/user", usersRoutes);
app.use("/api/notice", noticeRoutes);
app.use('/', (req, res) => {
  res.send('Welcome to Chipp');
})
app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

app.use((error, req, res, next) => {
  if (req.file) {
    fs.unlink(req.file.path, (err) => {
      console.log(err);
    });
  }

  if (res.headerSent) {
    return next(error);
  }
  res.status(error.code || 500);
  res.json({ message: error.message || "An unknown error occured" });
});

mongoose
  .connect(
    url,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    app.listen(5000, function(){
      console.log("Express server listening on port 5000");
    });
  })
  .catch((err) => {
    console.log(err);
  });
