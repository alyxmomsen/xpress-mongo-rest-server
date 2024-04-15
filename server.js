const express = require("express");
const app = express();
const bodyParser = require("body-parser");

// const jwt = require("jsonwebtoken");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const baseRouter = require("./routes/base-router");
const mongoose = require("mongoose");

require("dotenv").config();

// Middleware для обработки данных из тела запроса
app.use(cors({ origin: "http://localhost:3001", credentials: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use("/", baseRouter);
/* app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "http://192.168.70.221:3001");
  res.header("Access-Control-Allow-Credentials", true);
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept",
  );
  next();
}); */

// =========================

// Подключение к MongoDB
const db = mongoose.connection;

db.on("error", console.error.bind(console, "Ошибка подключения к MongoDB:"));
db.once("open", () => {
  console.log("Подключено к MongoDB");
});

mongoose.connect("mongodb://localhost:27017/mydatabase_666", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
console.log(process.env.secret_key);
// Запуск сервера
const port = 3000;
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
