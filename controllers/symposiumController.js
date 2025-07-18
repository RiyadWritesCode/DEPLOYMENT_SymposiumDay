const Symposium = require("../models/symposiumModel");
const mongoose = require("mongoose");
const { encrypt, decrypt } = require("../models/encryption");
const { transporter } = require("./emailController");

const createSymposium = async (req, res) => {
  const { name, date, permissions, settings } = req.body;

  try {
    const updatedSymposiumAndClasses = await Symposium.createSymposium(
      name,
      date,
      permissions,
      settings
    );
    res.status(200).json(updatedSymposiumAndClasses);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const addClassesToSymposium = async (req, res) => {
  const { classes } = req.body;
  const { id } = req.params;

  try {
    const symposium = await Symposium.addClasses(classes, id);
    res.status(200).json(symposium);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const updateSymposium = async (req, res) => {
  const { name, date, permissions, settings } = req.body;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such symposium" });
  }

  let updates = {};
  if (name) {
    updates.name = name;
  }
  if (date) {
    updates.date = date;
  }
  if (permissions) {
    updates.permissions = permissions;
  }
  if (settings) {
    updates.settings = settings;
  }

  const symposium = await Symposium.findOneAndUpdate({ _id: id }, updates, { new: true });
  if (!symposium) {
    return res.status(400).json({ error: "No such symposium" });
  }
  res.status(200).json(symposium);
};

const addUsersToSymposiumWithEmails = async (req, res) => {
  const { users, userType } = req.body;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such symposium" });
  }
  try {
    const updatedSymposiumAndUsers = await Symposium.addUsers(users, userType, id);
    res.status(200).json(updatedSymposiumAndUsers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const removeUsersFromSymposiumWithEmails = async (req, res) => {
  const { users, userType } = req.body;
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such symposium" });
  }
  try {
    const updatedSymposiumAndUsers = await Symposium.removeUsers(users, userType, id);
    res.status(200).json(updatedSymposiumAndUsers);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const removeUserFromSymposium = async (req, res) => {
  const { id, user_id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "No such symposium" });
  }
  if (!mongoose.Types.ObjectId.isValid(user_id)) {
    return res.status(404).json({ error: "No such user" });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const symposium = await Symposium.findById(id);
    const removedUser = await mongoose.model("User").findById(user_id);
    let deletedClasses = [];
    if (removedUser.userType === "presenter") {
      // Query the IDs of all classes created by this presenter for the symposium
      const classesToDelete = await mongoose
        .model("Class")
        .find({ presenter_id: removedUser._id, symposium_id: symposium._id }, "_id")
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
        (presenterId) => !presenterId.equals(removedUser._id)
      );
    } else if (removedUser.userType === "student") {
      // This ensures students are also removed from the classes' students arrays
      await mongoose.model("Class").updateMany(
        {
          symposium_id: id,
        },
        {
          $pull: { students: { student_id: user_id } },
        },
        { session: session }
      );

      // Remove the user from students array
      symposium.students = symposium.students.filter(
        (studentId) => !studentId.equals(removedUser._id)
      );
    }

    await symposium.save({ session: session });
    await session.commitTransaction();

    return res.status(200).json({ symposium, removedUser, deletedClasses });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ error: error.message });
  } finally {
    session.endSession();
  }
};

const addStudentsToSymposiumByGrade = async (req, res) => {
  const { id } = req.params;
  const { grades } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Symposium not found" });
  }
  if (!grades || grades.length === 0) {
    return res.status(400).json({ error: "Select at least one grade to add students" });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();
    const symposium = await Symposium.findById(id).session(session);
    if (!symposium) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Symposium not found" });
    }

    // Utilize $addToSet to prevent adding duplicates and to add multiple students in one operation
    // Also, use a single query to get all students from the selected grades at once
    const studentsToAdd = await mongoose
      .model("User")
      .find({ userType: "student", grade: { $in: grades } })
      .session(session)
      .lean();

    // Filter out IDs that are already part of the symposium to ensure only new students are added
    const newStudentIdsToAdd = studentsToAdd
      .filter((student) => !symposium.students.includes(student._id))
      .map((student) => student._id);

    // If no new students found, return an informative response without making changes
    if (newStudentIdsToAdd.length === 0) {
      await session.abortTransaction();
      return res.status(404).json({ error: "No new students found for the selected grades" });
    }

    // Add the selected students to the symposium
    const updatedSymposium = await Symposium.findByIdAndUpdate(
      id,
      { $addToSet: { students: { $each: newStudentIdsToAdd } } },
      { new: true, session: session }
    );

    // Fetch the added students' details for the response
    const addedStudentsDetails = studentsToAdd.filter((student) =>
      newStudentIdsToAdd.includes(student._id)
    );

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      symposium: updatedSymposium,
      addedStudents: addedStudentsDetails,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    res.status(500).json({ error: error.message });
  }
};

const removeStudentsFromSymposiumByGrade = async (req, res) => {
  const { id } = req.params;
  const { grades } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(404).json({ error: "Symposium not found" });
  }

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    const symposium = await Symposium.findById(id).session(session);
    if (!symposium) {
      await session.abortTransaction();
      return res.status(404).json({ error: "Symposium not found" });
    }

    const studentsToRemove = await mongoose
      .model("User")
      .find(
        {
          userType: "student",
          grade: { $in: grades },
        },
        "_id"
      )
      .session(session)
      .lean();

    const studentIdsToRemove = studentsToRemove.map((student) => student._id); // Keep as ObjectId for $in query

    // Check if there are students to remove
    if (studentIdsToRemove.length === 0) {
      await session.abortTransaction();
      return res.status(404).json({ error: "No students found for the selected grades" });
    }

    // Update the symposium document to remove the students
    await Symposium.findByIdAndUpdate(
      id,
      {
        $pull: { students: { $in: studentIdsToRemove } },
      },
      { session: session }
    );

    // Update each class associated with the symposium to remove the students
    // This ensures students are also removed from the classes' students arrays
    const upd = await mongoose.model("Class").updateMany(
      {
        symposium_id: id,
      },
      {
        $pull: { students: { student_id: { $in: studentIdsToRemove } } },
      },
      { session: session }
    );

    const updatedSymposium = await Symposium.findById(id).session(session);

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      symposium: updatedSymposium,
      removedStudents: studentsToRemove,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(`Failed to remove students by grade: ${error}`);
    res.status(500).json({ error: error.message });
  }
};

const getSymposiums = async (req, res) => {
  const symposiums = await Symposium.find().sort({ date: -1 }); // Sort by date in ascending order
  res.status(200).json(symposiums);
};

const getMySymposiums = async (req, res) => {
  let symposiums = [];

  try {
    if (req.user.userType === "presenter") {
      symposiums = await Symposium.find({ presenters: req.user._id });
    } else if (req.user.userType === "student") {
      symposiums = await Symposium.find({ students: req.user._id });
    }

    res.status(200).json(symposiums);
  } catch (error) {
    console.error("Failed to fetch symposiums:", error);
    res.status(500).json({ message: "Failed to fetch symposiums." });
  }
};

const getSymposium = async (req, res) => {
  const { id } = req.params;
  try {
    const symposium = await Symposium.findById(id);
    res.status(200).json(symposium);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

const getSymposiumClasses = async (req, res) => {
  const { id } = req.params;
  try {
    const symposium = await Symposium.findById(id)
      .populate({
        path: "classes",
        populate: {
          path: "presenter_id",
          select: "firstName lastName", // Only fetch the fields you need
        },
      })
      .lean();

    if (!symposium) {
      return res.status(404).json({ error: "Symposium not found" });
    }

    // Now each class in symposium.classes already includes the presenter's first and last name.
    // Transform the data to include presenterFirstName and presenterLastName in the root of each class object.
    const symposiumClasses = symposium.classes.map((c) => {
      if (c.presenter_id) {
        c.presenterFirstName = c.presenter_id.firstName;
        c.presenterLastName = c.presenter_id.lastName;
        c.presenter_id = c.presenter_id;
      }
      return c;
    });

    res.status(200).json(symposiumClasses);
  } catch (error) {
    res.status(400).json({ error: error.message });
    console.error(error);
  }
};

const deleteSymposium = async (req, res) => {
  try {
    const deletedSymposium = await Symposium.deleteSymposiumAndClasses(req.params.id);
    res.status(200).json(deletedSymposium);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const fillAvailableSpaces = async (req, res) => {
  try {
    const filledSymposium = await Symposium.fillAvailableSpaces(req.params.symposium_id);
    res.status(200).json(filledSymposium);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSymposiumPresenters = async (req, res) => {
  try {
    const symposium = await Symposium.findById(req.params.id);
    const presenterPromises = symposium.presenters.map((presenter_id) =>
      mongoose.model("User").findById(presenter_id).lean()
    );
    const presenters = await Promise.all(presenterPromises);

    presenters.forEach((presenter) => (presenter.password = decrypt(presenter.password)));
    res.status(200).json(presenters);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getSymposiumStudents = async (req, res) => {
  try {
    const symposium = await Symposium.findById(req.params.id);
    const studentPromises = symposium.students.map((student_id) =>
      mongoose.model("User").findById(student_id).lean()
    );
    const students = await Promise.all(studentPromises);
    students.forEach((student) => (student.password = decrypt(student.password)));

    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendScheduleToPresenters = async (req, res) => {
  try {
    const symposium = await Symposium.findById(req.params.id);
    const presenterPromises = symposium.presenters.map((presenter_id) =>
      mongoose.model("User").findById(presenter_id).lean()
    );
    const presenters = await Promise.all(presenterPromises);

    for (const presenter of presenters) {
      await transporter.sendMail(
        {
          from: "info@symposiumday.com",
          to: presenter.email,
          subject: `Symposium on ${symposium.date}`,
          html: `
            <h1>Hello ${presenter.firstName}!</h1>
            <h2>You are scheduled for a symposium called '${symposium.name}' on ${
            symposium.date
          }.</h2>
            <p>To see your schedule go to <a href="https://symposiumday.com/presenter/my-classes" target="_blank">symposiumday.com/presenter/my-classes</a>.</p>
            <br />
            <hr/ >
            <br />
            <h2>If you are not logged in or forgot your account credentials, here they are:</h2>
            <p><strong>Email:</strong> ${presenter.email}</p>
            <p><strong>Password:</strong> ${decrypt(presenter.password)}</p>
            <br />
            <hr/ >
            <br />
            <h1>Common Questions:</h1>
            <h2>What is this?</h2>
            <p><a href="https://symposiumday.com" target="_blank">SymposiumDay.com</a> is a website used by raha school to have days where students can choose what classes they will have.</p>
            <h2>How to use SymposiumDay.com?</h2>
            <p>To learn how to use <a href='https://symposiumday.com' target='_blank'>SymposiumDay.com</a> as a presenter watch this <a href='https://www.youtube.com/watch?v=8wXBCJ7rPnU' target='_blank'>youtube video</a>.</p>
            <h2>Other Questions?</h2>
            <p>If you have any other questions, suggestions, or issues with <a href="https://symposiumday.com" target="_blank">SymposiumDay.com</a> feel free to message Riyad Rzayev on teams or email riyad.rzayev@ris.ae.</p>
            `,
        },
        function (error, info) {
          if (error) {
            return console.log(error);
            throw Error("Failed to send one or more emails.");
          }
          console.log("Message sent: " + info.response);
        }
      );
    }
    res.status(200).json({ message: "Emails sent successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const sendScheduleToStudents = async (req, res) => {
  try {
    const symposium = await Symposium.findById(req.params.id)
      .populate({
        path: "students",
        select: "firstName lastName email password",
      })
      .populate({
        path: "classes",
        populate: {
          path: "presenter_id",
          select: "firstName lastName",
        },
      });

    if (!symposium) {
      return res.status(404).json({ error: "Symposium not found" });
    }

    // Define time slots for each session
    const sessionTimes = {
      1: "9:45 - 10:10 AM",
      2: "10:45 - 11:10 AM",
      3: "12:10 - 12:35 PM",
      4: "1:00 - 1:25 PM",
    };

    for (const student of symposium.students) {
      // Find classes the student is enrolled in
      const studentClasses = symposium.classes.filter((c) =>
        c.students.some((s) => s.student_id.equals(student._id))
      );

      // Construct email body
      let emailBody = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px; }
          h1, h2 { color: #2c3e50; }
          .container { max-width: 600px; background: white; padding: 20px; margin: auto; border-radius: 8px; box-shadow: 0px 4px 6px rgba(0,0,0,0.1); }
          .class-box { padding: 10px; border-left: 5px solid #3498db; margin-bottom: 15px; background: #ecf0f1; border-radius: 5px; }
          .keynote { border-left-color: #e74c3c; }
          .footer { margin-top: 20px; font-size: 12px; color: #7f8c8d; }
          a { color: #2980b9; text-decoration: none; }
          h1 {font-size: 24px;}
          h2 {font-size: 18px;}
          h3 {font-size: 16px;}
          p {font-size: 14px;}
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Hello ${student.firstName}!</h1>
          <h2>Here is your current schedule for '${symposium.name}' tomorrow on Wednesday, March 19th:</h2>
          <hr>
      `;

      // Add Keynote (if any)
      emailBody += `
        <div class="class-box keynote">
          <h3>Keynote: Charlene Nawar</h3>
          <p><strong>Time:</strong> 9:10 - 9:35 AM</p>
          <p><strong>Room:</strong> Auditorium</p>
        </div>
      `;

      // Add Student's Classes with Correct Times
      studentClasses.forEach((thisClass) => {
        const sessionTime = sessionTimes[thisClass.block] || "Time Unavailable";

        emailBody += `
        <div class="class-box">
          <h3>${thisClass.name} by ${thisClass.presenter_id.firstName} ${thisClass.presenter_id.lastName}</h3>
          <p><strong>Session:</strong> ${thisClass.block}</p>
          <p><strong>Time:</strong> ${sessionTime}</p>
          <p><strong>Room:</strong> ${thisClass.room}</p>
          <p><strong>Description:</strong> ${thisClass.shortDescription}</p>
        </div>
        `;
      });

      emailBody += `
          <hr>
          <p>To see your schedule online or change your classes, visit <a href="https://symposiumday.com/student/my-classes" target="_blank">https://symposiumday.com/student/my-classes</a>.</p>
          <h2>Here is your login information if you forgot!</h2>
          <p><strong>Email:</strong> ${student.email}</p>
          <p><strong>Password:</strong> ${decrypt(student.password)}</p>
          <p class="footer">If you have any questions, contact Mr. Ashley.</p>
        </div>
      </body>
      </html>
      `;

      // Send the email
      await transporter.sendMail({
        from: "info@symposiumday.com",
        to: student.email,
        subject: `Your Symposium Schedule - ${symposium.date}`,
        html: emailBody,
      });

      console.log(`Schedule sent to: ${student.email}`);
    }

    res.status(200).json({ message: "Schedules sent successfully!" });
  } catch (error) {
    console.error("Error sending schedules:", error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  createSymposium,
  addClassesToSymposium,
  updateSymposium,
  addUsersToSymposiumWithEmails,
  removeUsersFromSymposiumWithEmails,
  removeUserFromSymposium,
  getSymposiums,
  getMySymposiums,
  getSymposium,
  getSymposiumClasses,
  deleteSymposium,
  getSymposiumPresenters,
  getSymposiumStudents,
  addStudentsToSymposiumByGrade,
  removeStudentsFromSymposiumByGrade,
  fillAvailableSpaces,
  sendScheduleToPresenters,
  sendScheduleToStudents,
};
