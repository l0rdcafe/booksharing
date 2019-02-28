const express = require("express");
const path = require("path");
const morgan = require("morgan")("short");
const session = require("express-session");
const bodyParser = require("body-parser");
const expressValidator = require("express-validator");
const routes = require("./routes");
const store = require("./sessions/redis-store");
require("dotenv").config();

const app = express();

app.use(morgan);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "client/build")));
app.use(
  session({
    secret: process.env.SECRET,
    key: process.env.KEY,
    resave: false,
    saveUninitialized: false,
    store
  })
);
app.use(expressValidator());
app.use("/", routes);
app.use((err, req, res, next) => {
  res.status(err.status || 500).json({ error: err.message, ...err });
  next();
});

module.exports = app;
