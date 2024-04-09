const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Authentication middleware that accepts an array of authorized roles
const requireRoleAuth = (authorizedRoles) => {
  return async (req, res, next) => {
    // Verify authentication
    const { authorization } = req.headers;
    if (!authorization) {
      return res
        .status(401)
        .json({ error: "Authorization token required. You might need to log out and log in" });
    }

    const token = authorization.split(" ")[1];

    try {
      const { _id } = jwt.verify(token, process.env.SECRET);
      const user = await User.findOne({ _id });
      if (!authorizedRoles.includes(user.userType)) {
        throw Error("Authorization not granted due to insufficient priveleges");
      }
      req.user = user;
      next();
    } catch (error) {
      console.log(error);
      res
        .status(401)
        .json({ error: "Authorization token required. You might need to log out and log in." });
    }
  };
};

module.exports = { requireRoleAuth };
