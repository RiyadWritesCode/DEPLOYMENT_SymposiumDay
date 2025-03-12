const Class = require("../models/classModel");
const mongoose = require("mongoose");

// Join class as a student
const joinClass = async (req, res) => {
  const { id, studentId } = req.params;
  const student = await mongoose.model("User").findById(studentId);

  const thisClass = await Class.findById(id);
  if (!thisClass) {
    return res.status(404).json({ error: "No such class" });
  }

  if (thisClass.gender !== student.gender && thisClass.gender !== "all") {
    return res
      .status(400)
      .json({ error: `This class already has the maximum number ${thisClass.gender} of students.` });
  }

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such class" });
  }

  if (student.userType !== "student") {
    return res.status(400).json({ error: "It is only possible to join classes as a student!" });
  }



  

  // Check if the student is already in the class
  if (thisClass.students.some((st) => st.student_id === student._id)) {
    return res.status(400).json({ error: "You are already enrolled in this class." });
  }

  const symposium = await mongoose.model("Symposium").findById(thisClass.symposium_id);

  if (!symposium.permissions.studentsJoiningClasses) {
    return res.status(404).json({
      error: "The admin has currently locked students from joining classes in this symposium.",
    });
  }

  // Check if the class already has the maximum number of students
  if (thisClass.students.length >= thisClass.maxStudents) {
    return res.status(400).json({ error: "Class has already reached maximum capacity" });
  }

  // Check if the student is enrolled in another class in the same block
  const classesInSameBlock = await Class.find({
    block: thisClass.block,
    _id: { $ne: id }, // Exclude the current class
    symposium_id: thisClass.symposium_id,
  }).lean();

  classInSameBlock = classesInSameBlock.find((classInBlock) =>
    classInBlock.students.some((st) => st.student_id.toString() === student._id.toString())
  );
  if (classInSameBlock) {
    return res.status(400).json({
      error: `You are already in another class during block #${thisClass.block}. Leave the other class named '${classInSameBlock.name}' to join this one.`,
    });
  }

  const classesWithSameName = await Class.find({
    name: thisClass.name,
    "students.student_id": student._id,
    symposium_id: thisClass.symposium_id,
  });

  if (classesWithSameName.length > 0) {
    return res.status(400).json({
      error: `You are already enrolled in a class with the same name. You cannot join two of the same classes twice in a day.`,
    });
  }

  const updatedClassInstance = await Class.findOneAndUpdate(
    { _id: id },
    { $push: { students: { student_id: student._id, attendance: null } } },
    { new: true }
  ).populate("presenter_id", "firstName lastName"); // Ensure presenter_id is populated

  if (!updatedClassInstance) {
    return res.status(404).json({ error: `Operation failed: failed to join class` });
  }

  // Convert the Mongoose document to a JavaScript object
  let classInfo = updatedClassInstance.toObject();

  // Append presenter information directly to the JavaScript object
  classInfo.presenterFirstName = updatedClassInstance.presenter_id.firstName;
  classInfo.presenterLastName = updatedClassInstance.presenter_id.lastName;

  res.status(200).json(classInfo);
};

const leaveClass = async (req, res) => {
  const { id, studentId } = req.params;
  const student = await mongoose.model("User").findById(studentId);

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such class" });
  }

  if (student.userType !== "student") {
    return res.status(400).json({ error: "It is only possible to leave classes as a student!" });
  }

  const thisClass = await Class.findById(id);
  if (!thisClass) {
    return res.status(404).json({ error: "No such class" });
  }

  // Check if the student is currently enrolled in the class
  if (!thisClass.students.some((st) => st.student_id.toString() === student._id.toString())) {
    return res.status(400).json({ error: "You are not enrolled in the class." });
  }

  const symposium = await mongoose.model("Symposium").findById(thisClass.symposium_id);
  if (!symposium.permissions.studentsLeavingClasses) {
    return res.status(404).json({
      error: "The admin has currently locked students from leaving classes in this symposium.",
    });
  }

  // Remove the student from the class
  const updatedClassInstance = await Class.findOneAndUpdate(
    { _id: id },
    { $pull: { students: { student_id: studentId } } }, // $pull operator to remove the student
    { new: true }
  ).populate("presenter_id", "firstName lastName"); // Ensure presenter_id is populated

  if (!updatedClassInstance) {
    return res.status(404).json({ error: `Operation failed: failed to join class` });
  }

  // Convert the Mongoose document to a JavaScript object
  let classInfo = updatedClassInstance.toObject();

  // Append presenter information directly to the JavaScript object
  classInfo.presenterFirstName = updatedClassInstance.presenter_id.firstName;
  classInfo.presenterLastName = updatedClassInstance.presenter_id.lastName;

  res.status(200).json(classInfo);
};

const getSymposiumJoinedClasses = async (req, res) => {
  const { symposium_id, student_id } = req.params;

  try {
    if (
      !mongoose.Types.ObjectId.isValid(symposium_id) ||
      !mongoose.Types.ObjectId.isValid(student_id)
    ) {
      return res.status(400).json({ error: "Invalid ID(s)." });
    }

    // Ensure student exists and get their details for later use
    const student = await mongoose.model("User").findById(student_id).lean();
    if (!student) {
      return res.status(404).json({ error: "Student not found." });
    }

    // Find classes within the specified symposium where the student is enrolled
    // Ensure to populate the students.student_id field if your schema supports it
    const joinedClasses = await Class.find({
      symposium_id: symposium_id,
      "students.student_id": student_id,
    })
      .populate({
        path: "students.student_id",
        select: "firstName lastName",
      })
      .populate("presenter_id", "firstName lastName")
      .lean();

    const joinedClassesWithDetails = joinedClasses.map((classItem) => {
      classItem.students = classItem.students.map((s) => {
        // Assuming population was successful and s.student_id now contains user details
        return {
          ...s,
          studentFirstName: s.student_id.firstName,
          studentLastName: s.student_id.lastName,
        };
      });

      if (classItem.presenter_id) {
        // Presenter details
        classItem.presenterFirstName = classItem.presenter_id.firstName;
        classItem.presenterLastName = classItem.presenter_id.lastName;
      }

      return classItem;
    });

    res.status(200).json(joinedClassesWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

getSymposiumCreatedClasses = async (req, res) => {
  const { symposium_id, presenter_id } = req.params;

  try {
    if (
      !mongoose.Types.ObjectId.isValid(symposium_id) ||
      !mongoose.Types.ObjectId.isValid(presenter_id)
    ) {
      return res.status(400).json({ error: "Invalid ID(s)." });
    }

    // Ensure student exists and get their details for later use
    const presenter = await mongoose.model("User").findById(presenter_id).lean();
    if (!presenter) {
      return res.status(404).json({ error: "Presenter not found." });
    }

    // Find classes within the specified symposium where the student is enrolled
    const joinedClasses = await Class.find({
      symposium_id: symposium_id,
      presenter_id: presenter_id,
    })
      .populate({
        path: "students.student_id",
        select: "firstName lastName",
      })
      .populate("presenter_id", "firstName lastName")
      .lean();

    const createdClassesWithDetails = joinedClasses.map((classItem) => {
      classItem.students = classItem.students.map((s) => {
        // Assuming population was successful and s.student_id now contains user details
        return {
          ...s,
          studentFirstName: s.student_id.firstName,
          studentLastName: s.student_id.lastName,
        };
      });

      if (classItem.presenter_id) {
        // Presenter details
        classItem.presenterFirstName = classItem.presenter_id.firstName;
        classItem.presenterLastName = classItem.presenter_id.lastName;
      }

      return classItem;
    });

    res.status(200).json(createdClassesWithDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
};

// Get all classes
const getClasses = async (req, res) => {
  try {
    const classInstances = await Class.find().sort({ block: 1 }); // Sort by block in ascending order
    res.status(200).json(classInstances);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getClass = async (req, res) => {
  const { id } = req.params;

  try {
    const thisClass = await Class.findById(id)
      .populate({
        path: "students.student_id",
        select: "firstName lastName grade gender email",
      })
      .populate("presenter_id", "firstName lastName")
      .lean();

    thisClass.students = thisClass.students.map((s) => {
      // Assuming population was successful and s.student_id now contains user details
      return {
        ...s,
        studentFirstName: s.student_id.firstName,
        studentLastName: s.student_id.lastName,
      };
    });

    thisClass.presenterFirstName = thisClass.presenter_id.firstName;
    thisClass.presenterLastName = thisClass.presenter_id.lastName;
    res.status(200).json(thisClass);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Delete a class
const deleteClass = async (req, res) => {
  try {
    const deletedClass = await Class.deleteClass(req.params.id, req.user);
    if (!deletedClass) {
      return res.status(404).json({ message: "Class not found or not owned by the user" });
    }
    res.status(200).json(deletedClass);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateClassAttendance = async (req, res) => {
  const { students } = req.body; // Assuming students is an array of { student_id, attendance }
  const { class_id } = req.params;

  // Validate class_id
  if (!mongoose.Types.ObjectId.isValid(class_id)) {
    return res.status(404).json({ error: "Invalid class ID" });
  }

  const thisClass = await Class.findById(class_id);
  if (!thisClass) {
    return res.status(404).json({ error: "Class not found" });
  }

  if (req.user._id.toString() !== thisClass.presenter_id.toString()) {
    return res.status(403).json({ error: "Unauthorized to update attendance" });
  }

  students.forEach(async (student) => {
    const studentObjectId = new mongoose.Types.ObjectId(student.student_id);

    const updateResult = await Class.updateOne(
      { _id: class_id, "students._id": studentObjectId },
      { $set: { "students.$.attendance": student.attendance } }
    );
  });

  try {
    // Fetch and return the updated class for confirmation
    const updatedClass = await Class.findById(class_id).populate("students.student_id");
    res.status(200).json(updatedClass);
  } catch (error) {
    res.status(500).json({ error: "Failed to update attendance" });
  }
};

// Create new class
const createClass = async (req, res) => {
  const { name, blocks, maxStudents, shortDescription, room, gender, symposium_id } = req.body;
  const presenter_id = req.user._id;

  const presenter = await mongoose.model("User").findById(presenter_id);

  try {
    let classInstances = await Class.createClass(
      name,
      blocks,
      maxStudents,
      shortDescription,
      room,
      presenter_id,
      gender,
      symposium_id
    );

    classInstances = classInstances.map((classInstance) => {
      return {
        ...classInstance.toObject(), // convert mongoose document to a plain JavaScript object
        presenterFirstName: presenter.firstName,
        presenterLastName: presenter.lastName,
        presenter_id: { _id: presenter._id },
      };
    });

    res.status(200).json(classInstances);
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.log(error);
  }
};

const updateClass = async (req, res) => {
  const { name, block, maxStudents, shortDescription, room, gender } = req.body;
  const { id } = req.params;

  // Validate the provided class ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Invalid class ID" });
  }

  try {
    // Fetch the existing class to retrieve the presenter_id and symposium_id
    const existingClass = await Class.findById(id);
    if (!existingClass) {
      return res.status(404).json({ error: "Class not found" });
    }

    const presenter_id = existingClass.presenter_id;
    const symposium_id = existingClass.symposium_id;

    // Perform the update with all required parameters
    const updatedClass = await Class.updateClass(
      id,
      name,
      block,
      maxStudents,
      shortDescription,
      room,
      gender,
      presenter_id,
      symposium_id
    );

    res.status(200).json(updatedClass);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = {
  updateClassAttendance,
  getClasses,
  getClass,
  deleteClass,
  createClass,
  joinClass,
  leaveClass,
  getSymposiumJoinedClasses,
  getSymposiumCreatedClasses,
  updateClass,
};
