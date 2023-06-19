const mongoose = require("mongoose");
const express = require("express");

const app = express.Router();

mongoose.connect(
  "mongodb+srv://mani5060:mani5060@cluster0.kgley.mongodb.net/?retryWrites=true&w=majority",
  { userNewUrlParser: true }
);
const con = mongoose.connection

  .then((res) => console.log("MongoDB connected"))
  .catch((err) => console.log("Error connecting to MongoDb"));

app.get("/api/allAlumis", function () {
  return Alumni.find({});
});

app.post("/api/register", () => {
  const alumi = new Alumni({});
});

app.post("/api/login", () => {});

const adminRouter = require("./routes/admin");
app.use("/admin", adminRouter);
app.listen(5500, function () {
  console.log("Server Started");
});
