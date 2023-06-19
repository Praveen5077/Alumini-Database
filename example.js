const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");
const countriesRoutes = require("./routes/countries");
const admin = require("./routes/admin");

const app = express.Router();

// app.use(bodyParser.json());
// app.use(cors());

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", "*");
//   res.setHeader(
//     "Access-Control-Allow-Methods",
//     "OPTIONS, GET, POST, PUT, PATCH, DELETE"
//   );
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
//   next();
// });
const port = process.env.PORT || 7000;

app.use("/api/v1/countries", countriesRoutes);
app.use("/api/v1/admin", admin);

app.get("/api/allAlumis", function () {
  return Alumni.find({});
});

app.post("/api/register", () => {
  const alumi = new Alumni({});
});

app.post("/api/login", () => {});

app.use((error, req, res, next) => {
  console.log("app.js error: ", error);
  const status = error.statusCode || 500;
  const message = error.message;
  const data = error.data;
  res.status(status).json({
    message: message,
    data: data,
  });
});

app.listen(port, () => console.log(`server running on port ${port}`));
