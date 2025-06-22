const User = require("../models/user");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// @desc    Register user
exports.register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    const user = await User.create({
      username,
      email,
      password,
      role,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    res.status(201).json({ success: true, token });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// @desc    Login user
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    // Créez un objet utilisateur sans le mot de passe
    const userData = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      // Ajoutez d'autres champs nécessaires
    };

    res.status(200).json({
      success: true,
      token,
      user: userData, // Incluez les données utilisateur dans la réponse
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};
