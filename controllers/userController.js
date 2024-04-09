const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../models/encryption");

const createToken = (_id) => {
  return jwt.sign({ _id }, process.env.SECRET, { expiresIn: "30d" });
};

const loginUser = async (req, res) => {
  const { email, password, userType } = req.body;

  try {
    const user = await User.login(email, password, userType);

    // create a token
    const token = createToken(user._id);

    res.status(200).json({ email, token, userType, _id: user._id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const createUser = async (req, res) => {
  const { firstName, lastName, email, password, userType, gender, grade, section } = req.body;
  let user;

  try {
    if (userType === "student") {
      user = await User.createUser(
        firstName,
        lastName,
        email,
        password,
        userType,
        gender,
        grade,
        section
      );
    } else {
      user = await User.createUser(firstName, lastName, email, password, userType);
    }
    user.password = decrypt(user.password);
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const createBatch = async (req, res) => {
  const { users, type } = req.body;

  try {
    const createdUsers = await User.createUsers(users, type);
    createdUsers.forEach((user) => {
      user.password = decrypt(user.password);
    });

    res.status(200).json(createdUsers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getUsers = async (req, res) => {
  const users = await User.find().sort({ createdAt: -1 });
  users.forEach((user) => {
    user.password = decrypt(user.password);
  });
  res.status(200).json(users);
};

const getStudentUsers = async (req, res) => {
  const users = await User.find({ userType: "student" }).sort({ createdAt: -1 });
  users.forEach((user) => {
    user.password = decrypt(user.password);
  });
  res.status(200).json(users);
};

const getPresenterUsers = async (req, res) => {
  const users = await mongoose
    .model("User")
    .find({ userType: "presenter" })
    .sort({ createdAt: -1 });
  users.forEach((user) => {
    user.password = decrypt(user.password);
  });
  res.status(200).json(users);
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deletedUser = await User.deleteUser(id, req.user);

    res.status(200).json(deletedUser);
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.log(error.message);
  }
};

const getUser = async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such user" });
  }
  const user = await User.findById({ _id: id });
  if (!user) {
    return res.status(400).json({ error: "No such user" });
  }
  user.password = decrypt(user.password);
  res.status(200).json(user);
};

const updateUser = async (req, res) => {
  const { firstName, lastName, email, password, gender, grade, section } = req.body;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such user" });
  }

  let updates = {};
  if (firstName) {
    updates.firstName = firstName;
  }
  if (lastName) {
    updates.lastName = lastName;
  }
  if (email) {
    updates.email = email;
  }
  if (password) {
    updates.password = encrypt(password);
  }
  if (gender) {
    updates.gender = gender;
  }
  if (grade) {
    updates.grade = grade;
  }
  if (section) {
    updates.section = section;
  }

  const user = await User.findOneAndUpdate({ _id: id }, updates, { new: true });
  if (!user) {
    return res.status(400).json({ error: "No such user" });
  }
  res.status(200).json(user);
};

module.exports = {
  loginUser,
  createUser,
  createBatch,
  getUsers,
  getStudentUsers,
  getPresenterUsers,
  getUser,
  deleteUser,
  updateUser,
};
