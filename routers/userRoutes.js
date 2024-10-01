const express = require("express");
const router = express.Router();
const User = require("./../models/user");
const { jwtAuthMiddleware, generateToken } = require("./../jwt");

// POST route to add a person
router.post("/signup", async (req, res) => {
  try {
    const data = req.body; // Assuming the request body contains the User data

    // Create a new User document using the Mongoose model
    const newUser = new User(data);

    // Save the new User to the database
    const response = await newUser.save();
    console.log("Data saved");

    const payload = {
      id: response.id,
    };
    console.log(JSON.stringify(payload));
    const token = generateToken(payload);
    console.log("Token is :", token);

    res.status(200).json({ response: response, token: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Login Router
router.post("/login", async (req, res) => {
  try {
    // Extract aadharCardNumber and password from request body
    const { aadharCardNumber, password } = req.body;

    // Find the user by aadharCardNumber
    const user = await User.findOne({ aadharCardNumber: aadharCardNumber });

    // If user does not exist or password does not match, return error
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // // Compare password
    // const isPasswordValid = await user.comparePassword(password);

    // // If password does not match, return error
    // if (!isPasswordValid) {
    //   return res.status(401).json({ error: "Invalid username or password" });
    // }

    // Generate Token
    const payload = {
      id: user._id,
    };
    const token = generateToken(payload);

    // Return token as response
    res.status(200).json({ token: token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Profile route
router.get("/profile", jwtAuthMiddleware, async (req, res) => {
  try {
    const userData = req.user;
    const userId = userData.id;
    const user = await Person.findById(userId);
    res.status(200).json({ user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT route to update a person by ID
router.put("/profile/password", async (req, res) => {
  try {
    const userId = req.user; // Extract the ID from the token
    const { currentPassword, newPassword } = req.body; // Extract current and new password form request body

    // Find the user by useId
    const user = await User.findById(userId);

    // If password does not match, return error
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Update the user's password
    user.password = newPassword;
    await user.save();

    console.log("Password updated");
    res.status(200).json({message: "Password Updated"});
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error"});
  }
});

module.exports = router;
