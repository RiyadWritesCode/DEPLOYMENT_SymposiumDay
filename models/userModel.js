const mongoose = require("mongoose");
const validator = require("validator");
const { encrypt, decrypt } = require("../models/encryption");
const { transporter } = require("../controllers/emailController");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    userType: {
      type: String,
      required: true,
      enum: ["student", "presenter", "admin"],
    },
    gender: {
      type: String,
      required: false,
      enum: ["male", "female"],
    },
    grade: {
      type: Number,
      required: false,
      min: 1,
      max: 12,
    },
    section: {
      type: String,
      required: false,
      trim: true,
    },
  },
  { timestamps: true }
);

function checkWhitespace(str) {
  return /\s/.test(str);
}

// Static signup method
userSchema.statics.createUser = async function (
  firstName,
  lastName,
  email,
  password,
  userType,
  gender,
  grade,
  section
) {
  if (!firstName || !lastName || !email || !password || !userType) {
    throw Error("All fields must be filled");
  }
  if (userType != "student" && userType != "presenter" && userType != "admin") {
    throw Error("User type needs to be either student, presenter, or admin");
  }
  if (checkWhitespace(email)) {
    throw Error("Remove the whitespace in the email field.");
  }
  if (checkWhitespace(password)) {
    throw Error("Remove the whitespace in the password field");
  }

  let userObj = {
    firstName,
    lastName,
    email,
    password,
    userType,
  };

  if (userType === "student") {
    if (!gender || !grade || !section) {
      throw Error("All fields must be filled for students");
    }
    if (gender !== "male" && gender !== "female") {
      throw Error("Gender must be either male or female");
    }
    if (grade > 12 || grade < 1) {
      throw Error("Grade must be from 1-12 for students");
    }
    if (section >= 5) {
      throw Error(
        "Class should be less than or equal to 5 characters. If a student is in 10A, their class is just 'A'."
      );
    }

    userObj.gender = gender;
    userObj.grade = grade;
    userObj.section = section;
  }

  if (!validator.isEmail(email)) {
    throw Error("Email is not valid");
  }
  const exists = await this.findOne({ email });
  if (exists) {
    throw Error(`Email is already in use`);
  }

  if (password.length < 5) {
    throw Error("Password must be at least 5 characters long");
  }

  userObj.password = encrypt(password);

  const user = await this.create(userObj);
  await transporter.sendMail(
    {
      from: "info@symposiumday.com",
      to: user.email,
      subject: "SymposiumDay Account Information",
      html: `
        <h1>Hello ${user.firstName}!</h1>
        <h2>Welcome to <a href="https://symposiumday.com" target="_blank">SymposiumDay.com</a>, here are your account credentials.</h2>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Password:</strong> ${decrypt(user.password)}</p>
        <br />
        <hr/ >
        <br />
        <h1>Common Questions:</h1>
        <h2>What is this?</h2>
        <p><a href="https://symposiumday.com" target="_blank">SymposiumDay.com</a> is a website used by raha school to have days where students can choose what classes they will have.</p>
        <h2>How to use <a href="https://symposiumday.com" target="_blank">SymposiumDay.com</a>?</h2>
        ${
          user.userType === "student"
            ? "<p>To learn how to use <a href='https://symposiumday.com' target='_blank'>SymposiumDay.com</a> as a student watch this <a href='https://loom.com' target='_blank'>loom video</a>.</p>"
            : "<p>To learn how to use <a href='https://symposiumday.com' target='_blank'>SymposiumDay.com</a> as a presenter watch this <a href='https://loom.com' target='_blank'>loom video</a>.</p>"
        }
        <h2>Other Questions?</h2>
        <p>If you have any other questions, suggestions, or issues with <a href="https://symposiumday.com" target="_blank">SymposiumDay.com</a> feel free to message Riyad Rzayev on teams or email riyad.rzayev@ris.ae.</p>
        `,
    },
    function (error, info) {
      if (error) {
        return console.log(error);
        throw Error("Account information email could not be send to the user.");
      }
      console.log("Message sent: " + info.response);
    }
  );
  return user;
};

// Static signup method
userSchema.statics.createUsers = async function (users, userType) {
  if (!userType || (userType !== "student" && userType !== "presenter")) {
    throw new Error("User type must be either 'student' or 'presenter'");
  }

  // Collect user objects after validation
  const userObjects = [];
  const emailSet = new Set();

  for (let index = 0; index < users.length; index++) {
    const { firstName, lastName, email, password, gender, grade, section, rowNum } = users[index];

    if (!firstName || !lastName || !email || !password) {
      throw new Error(`All fields must be filled for user on row ${rowNum}`);
    }
    if (checkWhitespace(email)) {
      throw Error(`Remove the whitespace in the email field for user on row ${rowNum}`);
    }
    if (checkWhitespace(password)) {
      throw Error(`Remove the whitespace in the password field for user on row ${rowNum}`);
    }

    if (!validator.isEmail(email)) {
      throw new Error(`Email is not valid for user on row ${rowNum}`);
    }

    if (password.length < 5) {
      throw new Error(`Password must be at least 5 characters long for user on row ${rowNum}`);
    }

    // Duplicate email check within the batch
    if (emailSet.has(email)) {
      throw new Error(`Duplicate email found for user on row ${rowNum}`);
    }
    emailSet.add(email);

    // Check if email already exists in the database
    const exists = await this.findOne({ email });
    if (exists) {
      throw Error(`Email is already in use for user on row ${rowNum}`);
    }

    let userObj = { firstName, lastName, email, password, userType };
    userObj.password = encrypt(userObj.password);

    if (userType === "student") {
      if (!gender || !grade || !section) {
        throw Error(`All fields must be filled for student on row ${rowNum}`);
      }
      if (gender !== "male" && gender !== "female") {
        throw Error(`Gender must be either male or female for student on row ${rowNum}`);
      }
      if (grade > 12 || grade < 1) {
        throw Error(`Grade must be from 1-12 for students for student on row ${rowNum}`);
      }
      if (section > 5) {
        throw Error(
          "Class should be less than or equal to 5 characters. If a student is in 10A, their class is just 'A'."
        );
      }
      userObj.gender = gender;
      userObj.grade = grade;
      userObj.section = section;
    }

    userObjects.push(userObj);
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const newUsers = await this.create(userObjects, { sessions: session });
    for (const user of newUsers) {
      await transporter.sendMail(
        {
          from: "info@symposiumday.com",
          to: user.email,
          subject: "SymposiumDay Account Information",
          html: `
            <h1>Hello ${user.firstName}!</h1>
            <h2>Welcome to <a href="https://symposiumday.com" target="_blank">SymposiumDay.com</a>, here are your account credentials.</h2>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Password:</strong> ${decrypt(user.password)}</p>
            <br />
            <hr/ >
            <br />
            <h1>Common Questions:</h1>
            <h2>What is this?</h2>
            <p><a href="https://symposiumday.com" target="_blank">SymposiumDay.com</a> is a website used by raha school to have days where students can choose what classes they will have.</p>
            <h2>How to use <a href="https://symposiumday.com" target="_blank">SymposiumDay.com</a>?</h2>
            ${
              user.userType === "student"
                ? "<p>To learn how to use <a href='https://symposiumday.com' target='_blank'>SymposiumDay.com</a> as a student watch this <a href='https://loom.com' target='_blank'>loom video</a>.</p>"
                : "<p>To learn how to use <a href='https://symposiumday.com' target='_blank'>SymposiumDay.com</a> as a presenter watch this <a href='https://loom.com' target='_blank'>loom video</a>.</p>"
            }
            <h2>Other Questions?</h2>
            <p>If you have any other questions, suggestions, or issues with <a href="https://symposiumday.com" target="_blank">SymposiumDay.com</a> feel free to message Riyad Rzayev on teams or email riyad.rzayev@ris.ae.</p>
            `,
        },
        function (error, info) {
          if (error) {
            return console.log(error);
            throw Error("Account information email could not be send to the user.");
          }
          console.log("Message sent: " + info.response);
        }
      );
    }
    await session.commitTransaction();
    return newUsers;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

// Static login method
userSchema.statics.login = async function (email, password, userType) {
  if (!email || !password || !userType) {
    throw Error("All fields must be filled");
  }
  if (userType != "student" && userType != "presenter" && userType != "admin") {
    throw Error("User type needs to be either student, presenter, or admin");
  }

  if (!validator.isEmail(email)) {
    throw Error("Email is not valid");
  }
  const user = await this.findOne({ email });
  if (!user) {
    throw Error("Incorrect email");
  }
  const typeMatch = user.userType === userType;
  if (!typeMatch) {
    throw Error(`You are a ${user.userType} but trying to login as a ${userType}!`);
  }

  if (userType !== "admin") {
    if (user.password !== encrypt(password)) {
      throw Error("Incorrect password");
    }
  } else {
    if (password !== user.password) {
      throw Error("Incorrect password");
    }
  }

  return user;
};

userSchema.statics.deleteUser = async function (user_id, admin_id) {
  const session = await mongoose.startSession();
  await session.startTransaction();
  try {
    const deletedUser = await this.findOneAndDelete({ _id: user_id }).session(session);
    if (!deletedUser) {
      throw new Error("User not found.");
    }

    if (deletedUser.userType === "presenter") {
      // Fetch all classes created by the presenter
      const classes = await mongoose
        .model("Class")
        .find({ presenter_id: deletedUser._id })
        .session(session);

      // Use the deleteClass method for each class
      for (const classObj of classes) {
        await mongoose.model("Class").deleteClass(classObj._id, admin_id, session);
      }
    }

    if (deletedUser.userType === "student") {
      const classes = await mongoose
        .model("Class")
        .find({ "students.student_id": deletedUser._id });

      for (const classObj of classes) {
        await mongoose.model("Class").findOneAndUpdate(
          { _id: classObj._id },
          { $pull: { students: { student_id: deletedUser._id } } }, // $pull operator to remove the student
          { new: true }
        );
      }
    }

    // Update symposiums removing this user as a presenter or student
    const query = {};
    const update = {};
    if (deletedUser.userType === "presenter") {
      query.presenters = deletedUser._id;
      update.$pull = { presenters: deletedUser._id };
    } else if (deletedUser.userType === "student") {
      query.students = deletedUser._id;
      update.$pull = { students: deletedUser._id };
    }

    await mongoose.model("Symposium").updateMany(query, update).session(session);

    await session.commitTransaction();
    return deletedUser;
  } catch (error) {
    await session.abortTransaction();
    throw error; // Rethrow the error for the caller to handle
  } finally {
    session.endSession();
  }
};

module.exports = mongoose.model("User", userSchema);
