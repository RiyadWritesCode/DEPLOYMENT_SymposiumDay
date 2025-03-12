const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const validator = require("validator");
const dayjs = require("dayjs");
const customParseFormat = require("dayjs/plugin/customParseFormat");
dayjs.extend(customParseFormat);

const symposiumSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    presenters: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      required: true,
    },
    students: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
      required: true,
    },
    classes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class",
      },
    ],
    permissions: {
      presentersCreatingClasses: { type: Boolean, required: true },
      presentersDeletingClasses: { type: Boolean, required: true },
      studentsJoiningClasses: { type: Boolean, required: true },
      studentsLeavingClasses: { type: Boolean, required: true },
    },
    settings: {
      studentsSeeingClassmates: { type: Boolean, required: true },
      studentsSeeingClassGender: { type: Boolean, required: true },
    },
  },
  { timestamps: true }
);

symposiumSchema.statics.createSymposium = async function (name, date, permissions, settings) {
  if (
    !name ||
    !date ||
    !permissions ||
    !permissions.presentersCreatingClasses ||
    !permissions.presentersDeletingClasses ||
    !permissions.studentsJoiningClasses ||
    !permissions.studentsLeavingClasses ||
    !settings.studentsSeeingClassmates ||
    !settings.studentsSeeingClassGender
  ) {
    throw Error("All fields must be filled.");
  }

  if (!dayjs(date, "YYYY-MM-DD", true).isValid()) {
    throw Error("Date is in an invalid format.");
  }

  if (name.length > 20) {
    throw Error("Symposium date length is too long. Please keep it in 'Grade 3,5,6' format");
  }

  const nameExists = await this.findOne({ name });
  if (nameExists) {
    if (nameExists.date === date) {
      throw Error(`A symposium on this date with the same name already exists.`);
    }
  }

  const symposium = await this.create({
    name,
    date,
    presenters: [],
    students: [],
    classes: [],
    permissions,
    settings,
  });
  return symposium;
};

symposiumSchema.statics.deleteSymposiumAndClasses = async function (symposium_id) {
  let deletedSymposium = null;
  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    // Attempt to find the symposium by ID to ensure it exists before attempting deletion
    const symposium = await this.findById(symposium_id).session(session);
    if (!symposium) {
      throw new Error("Symposium not found");
    }

    deletedSymposium = await this.findOneAndDelete({ _id: symposium_id }).session(session);
    await mongoose
      .model("Class")
      .deleteMany({ _id: { $in: deletedSymposium.classes } })
      .session(session);

    await session.commitTransaction();
  } catch (error) {
    // If any operation fails, abort the transaction and undo any changes
    await session.abortTransaction();
    throw error; // Rethrow the error to be handled by the caller
  } finally {
    session.endSession(); // End the session regardless of transaction outcome
  }

  return deletedSymposium;
};

symposiumSchema.statics.addUsers = async function (users, userType, symposium_id) {
  if (userType !== "student" && userType !== "presenter") {
    throw new Error("User type must be either 'student' or 'presenter'");
  }

  // Find the symposium by ID
  const symposium = await this.findById(symposium_id);
  if (!symposium) {
    throw new Error("The symposium you are trying to add users to does not exist");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    let addedUsers = [];
    let emailSet = new Set();
    for (let user of users) {
      const { email, rowNum } = user;

      if (!validator.isEmail(email)) {
        throw new Error(`Email is not valid for user on row ${rowNum}`);
      }

      if (emailSet.has(email)) {
        throw new Error(`Duplicate email found for user on row ${rowNum}.`);
      }
      emailSet.add(email);

      const userInfo = await mongoose.model("User").findOne({ email }).session(session);
      if (!userInfo) {
        throw new Error(`A user with the email ${email} was not found on row ${rowNum}`);
      }
      if (userInfo.userType !== userType) {
        throw new Error(`The user on row ${rowNum} is not a ${userType}`);
      }

      const isAlreadyAdded =
        userType === "student"
          ? symposium.students.includes(userInfo._id)
          : symposium.presenters.includes(userInfo._id);

      if (isAlreadyAdded) {
        throw new Error(`The user on row ${rowNum} is already added to this symposium.`);
      }

      // Update the symposium by pushing new users to the appropriate array
      if (userType === "student") {
        symposium.students.push(userInfo._id);
      } else if (userType === "presenter") {
        symposium.presenters.push(userInfo._id);
      }

      addedUsers.push(userInfo);
    }

    // Save the updated symposium document
    await symposium.save({ session: session });

    await session.commitTransaction();

    return { symposium, addedUsers };
  } catch (error) {
    await session.abortTransaction();
    throw error; // Rethrow the error to be handled by the caller
  } finally {
    session.endSession();
  }
};

symposiumSchema.statics.removeUsers = async function (users, userType, symposium_id) {
  if (userType !== "student" && userType !== "presenter") {
    throw new Error("User type must be either 'student' or 'presenter'");
  }

  // Find the symposium by ID
  const symposium = await this.findById(symposium_id);
  if (!symposium) {
    throw new Error("The symposium you are trying to remove users from does not exist");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    let removedUsers = [];
    let deletedClasses = [];
    let emailSet = new Set();
    for (let user of users) {
      const { email, rowNum } = user;

      if (!validator.isEmail(email)) {
        throw new Error(`Email is not valid for user on row ${rowNum}`);
      }

      if (emailSet.has(email)) {
        throw new Error(`Duplicate email found for user on row ${rowNum}.`);
      }
      emailSet.add(email);

      const userInfo = await mongoose.model("User").findOne({ email }).session(session);
      if (!userInfo) {
        throw new Error(`A user with the email ${email} was not found on row ${rowNum}`);
      }
      if (userInfo.userType !== userType) {
        throw new Error(`The user on row ${rowNum} is not a ${userType}`);
      }

      if (userType === "presenter") {
        // Query the IDs of all classes created by this presenter for the symposium
        const classesToDelete = await mongoose
          .model("Class")
          .find({ presenter_id: userInfo._id, symposium_id: symposium._id }, "_id")
          .session(session)
          .lean();

        if (deletedClasses.deletedCount === 0) {
          deletedClasses = [];
        }

        const classIdsToDelete = classesToDelete.map((c) => c._id.toString());

        // Delete the classes
        await mongoose
          .model("Class")
          .deleteMany({ _id: { $in: classIdsToDelete } })
          .session(session);

        symposium.classes = symposium.classes.filter(
          (classId) => !classIdsToDelete.includes(classId.toString())
        );

        // Remove presenter from symposium
        symposium.presenters = symposium.presenters.filter(
          (presenterId) => !presenterId.equals(userInfo._id)
        );
      } else if (userType === "student") {
        await mongoose.model("Class").updateMany(
          {
            symposium_id,
          },
          {
            $pull: { students: { student_id: userInfo._id } },
          },
          { session: session }
        );

        // Remove the user from students array
        symposium.students = symposium.students.filter(
          (studentId) => !studentId.equals(userInfo._id)
        );
      }

      removedUsers.push(userInfo);
    }

    // Save the updated symposium document
    await symposium.save({ session: session });

    await session.commitTransaction();

    return { symposium, removedUsers, deletedClasses };
  } catch (error) {
    await session.abortTransaction();
    throw error; // Rethrow the error to be handled by the caller
  } finally {
    session.endSession();
  }
};

symposiumSchema.statics.addClasses = async function (classes, symposium_id) {
  const symposium = await this.findById(symposium_id);
  if (!symposium) {
    throw new Error("Symposium not found");
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    let addedClasses = [];

    for (let thisClass of classes) {
      const { presenterEmail, name, shortDescription, block, room, maxStudents, gender, rowNum } =
        thisClass;

      const presenter = await mongoose
        .model("User")
        .findOne({ email: presenterEmail })
        .session(session);
      if (!presenter) {
        throw new Error(
          `A presenter with the email ${presenterEmail} was not found on row ${rowNum}`
        );
      }
      if (!symposium.presenters.includes(presenter._id)) {
        throw new Error(`The presenter on row ${rowNum} is not enrolled in the symposium`);
      }
      if (presenter.userType !== "presenter") {
        throw new Error(`The user on row ${rowNum} is not a presenter`);
      }

      // Use the createClass static method from classSchema
      const newClass = await mongoose.model("Class").createClass(
        name,
        [block],
        maxStudents,
        shortDescription,
        room,
        presenter._id,
        gender,
        symposium_id,
        session // Pass the transaction session
      );
      symposium.classes.push(newClass._id);
      addedClasses.push(newClass);
    }

    await symposium.save({ session: session });
    await session.commitTransaction();
    return { symposium, addedClasses };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

symposiumSchema.statics.fillAvailableSpaces = async function (symposium_id) {
  const session = await mongoose.startSession();
  try {
    await session.startTransaction();
    const symposium = await this.findById(symposium_id).session(session);

    if (!symposium) throw new Error("Symposium not found");
    if (
      symposium.permissions.studentsJoiningClasses ||
      symposium.permissions.studentsLeavingClasses
    ) {
      throw new Error(
        "To fill all available spaces, temporarily disable students from joining or leaving classes."
      );
    }

    let classes = await mongoose
      .model("Class")
      .find({ _id: { $in: symposium.classes } })
      .session(session);

    const allStudents = await mongoose
      .model("User")
      .find({ _id: { $in: symposium.students } })
      .session(session);

    const enrolledStudentsByBlock = new Map();
    const classNameBlocks = new Map();

    classes.forEach((cls) => {
      cls.students.forEach((student) => {
        const studentIdStr = student.student_id.toString();
        enrolledStudentsByBlock.set(studentIdStr, enrolledStudentsByBlock.get(studentIdStr) || new Set());
        enrolledStudentsByBlock.get(studentIdStr).add(cls.block.toString());

        classNameBlocks.set(studentIdStr, classNameBlocks.get(studentIdStr) || new Set());
        classNameBlocks.get(studentIdStr).add(cls.name);
      });
    });

    let updatesMade = false;

    for (let student of allStudents) {
      const studentIdStr = student._id.toString();
      const studentEnrolledBlocks = enrolledStudentsByBlock.get(studentIdStr) || new Set();
      const studentEnrolledClassNames = classNameBlocks.get(studentIdStr) || new Set();

      // CHANGED: Filter available classes dynamically for each student
      let availableClasses = classes.filter(
        (cls) =>
          cls.students.length < cls.maxStudents &&
          !studentEnrolledBlocks.has(cls.block.toString()) &&
          !studentEnrolledClassNames.has(cls.name) &&
          (cls.gender === "all" || cls.gender === student.gender)
      );

      if (availableClasses.length === 0) continue;

      // CHANGED: Sort available classes to always choose the class with the fewest students
      availableClasses.sort((a, b) => a.students.length - b.students.length);

      let targetClass = availableClasses[0];
      targetClass.students.push({ student_id: student._id, attendance: null });

      enrolledStudentsByBlock.set(studentIdStr, studentEnrolledBlocks.add(targetClass.block.toString()));
      classNameBlocks.set(studentIdStr, studentEnrolledClassNames.add(targetClass.name));

      await targetClass.save({ session: session });
      updatesMade = true;
    }

    if (updatesMade) {
      await session.commitTransaction();
      session.endSession();
      return this.findById(symposium_id).populate("classes");
    } else {
      await session.abortTransaction();
      session.endSession();
      return symposium;
    }
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};


module.exports = mongoose.model("Symposium", symposiumSchema);
