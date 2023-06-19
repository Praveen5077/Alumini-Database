const jwt = require("jsonwebtoken");

// Load User model
const Alumni = require("../../models/admin");

exports.register = async (req, res, next) => {
  try {
    const { user_name, password } = req.body;
    if (user_name === "" || user_name === null || user_name === undefined) {
      res.status(500).json({
        success: false,
        data: [],
        message: "Message here",
      });
    } else if (password === "" || password === null || password === undefined) {
      res.status(500).json({
        success: false,
        data: [],
        message: "Message here",
      });
    } else {
      const adminAvailable = await Alumni.find({ user_name: user_name });
      if (adminAvailable.length > 0) {
        res.status(409).json({
          success: false,
          data: [],
          message: "Message here",
        });
      } else {
        // Store hash in your password DB.
        const adminData = new Alumni({
          user_name: user_name,
          password: password,
        });
        await adminData.save();
        res.status(200).json({
          success: true,
          data: [],
          message: "Message here",
        });
      }
    }
  } catch (error) {
    console.log("Error", error);
    if (!error.statusCode) {
      error.statusCode = 500;
    }
  }
};
