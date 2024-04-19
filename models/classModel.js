const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const classSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    block: {
      type: Number,
      required: true,
      enum: [1, 2, 3, 4, 5, 6],
    },

    students: [
      {
        student_id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        attendance: {
          type: String,
          default: false,
          enum: ["present", "absent", null],
        },
      },
    ],
    maxStudents: {
      type: Number,
      required: true,
      min: 1,
    },
    shortDescription: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },
    room: {
      type: String,
      required: true,
      trim: true,
    },
    presenter_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User schema assuming presenters are users
      required: true,
    },
    gender: {
      type: String,
      required: true,
      enum: ["male", "female", "all"],
    },
    symposium_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Symposium", // Reference to Symposium schema, assuming a class belongs to a symposium
      required: true,
    },
  },
  { timestamps: true }
);

classSchema.statics.createClass = async function (
  name,
  blocks,
  maxStudents,
  shortDescription,
  room,
  presenter_id,
  gender,
  symposium_id,
  session = null // Optional session parameter for transactions
) {
  // Ensure all fields are provided
  if (
    !name ||
    !blocks ||
    blocks.length === 0 ||
    !maxStudents ||
    !shortDescription ||
    !room ||
    !presenter_id ||
    !gender ||
    !symposium_id
  ) {
    throw new Error("All fields must be filled");
  }

  // Ensure maximum students is within allowed range
  if (maxStudents <= 0 || maxStudents > 50) {
    throw new Error("Maximum students must be between 1 and 50");
  }

  // Validate name and description lengths
  if (name.length < 4 || name.length > 25) {
    throw new Error("Class name must be between 4 and 25 characters long");
  }
  if (shortDescription.length < 20 || shortDescription.length > 150) {
    throw new Error("Short description must be between 20 and 150 characters long");
  }

  // Validate room length
  if (room.length < 3 || room.length > 10) {
    throw new Error("Classroom must be between 3 and 10 characters long");
  }

  if (!["all", "male", "female"].includes(gender)) {
    throw Error("Gender must be all, male, or female.");
  }

  // Check if the presenter is listed in the symposium
  const symposium = await mongoose.model("Symposium").findById(symposium_id);
  if (!symposium) {
    throw new Error("Specified symposium not found");
  }
  if (!symposium.presenters.some((presenterObjectId) => presenterObjectId.equals(presenter_id))) {
    throw new Error("Presenter is not listed in the specified symposium");
  }
  if (symposium.permissions.presentersCreatingClasses === false) {
    throw new Error("The admin has locked presenters from creating classes for this symposium.");
  }

  let isExternalSession = !!session;
  if (!session) {
    session = await mongoose.startSession();
    await session.startTransaction();
  }

  let createdClasses = [];

  try {
    // Fetch all symposiums happening on the same date to ensure no block overlaps for the presenter
    const symposiumsOnSameDate = await mongoose
      .model("Symposium")
      .find({ date: symposium.date })
      .session(session);

    for (const block of blocks) {
      for (const otherSymposium of symposiumsOnSameDate) {
        const existingClassInBlock = await this.findOne({
          block,
          symposium_id: otherSymposium._id, // Checking against each symposium found
          presenter_id,
        }).session(session);

        if (existingClassInBlock) {
          const presenter = await mongoose.model("User").findById(presenter_id).session(session);
          throw new Error(
            `Presenter with email ${presenter.email} already has a class in block ${block} for a symposium on ${symposium.date}`
          );
        }
      }

      // Check for class name uniqueness within the symposium and block
      const existingClass = await this.findOne({
        name,
        block,
        symposium_id,
      }).session(session);

      if (existingClass) {
        throw new Error(`Class "${name}" already exists in block ${block} for this symposium.`);
      }
    }

    for (const block of blocks) {
      const newClass = await this.create(
        [
          {
            name,
            block,
            maxStudents,
            shortDescription,
            room,
            presenter_id,
            gender,
            symposium_id,
          },
        ],

        { session: session }
      );
      symposium.classes.push(newClass[0]._id);
      createdClasses.push(newClass[0]);
    }

    await symposium.save({ session });

    if (!isExternalSession) {
      await session.commitTransaction();
    }
    return createdClasses;
  } catch (error) {
    if (!isExternalSession) {
      await session.abortTransaction();
    }
    throw error;
  } finally {
    if (!isExternalSession) {
      await session.endSession();
    }
  }
};
classSchema.statics.deleteClass = async function (class_id, user, session = null) {
  let deletedClass = null;

  // Check if a session was passed in, if not, create a new session for this operation.
  const isExternalSession = !!session;
  if (!isExternalSession) {
    session = await mongoose.startSession();
    await session.startTransaction();
  }

  try {
    // Fetch and check if the class exists and if the teacher owns it
    const queryOptions = session ? { session } : {};
    const classInstance = await this.findById(class_id, null, queryOptions);
    if (!classInstance) throw new Error("No such class");

    // Fetch the corresponding symposium to check locks
    const symposium = await mongoose
      .model("Symposium")
      .findById(classInstance.symposium_id, null, queryOptions);

    if (!symposium) throw new Error("Symposium not found");

    // Check if presenters are locked from deleting classes and if the user is not an admin
    if (symposium.permissions.presentersDeletingClasses === false && user.userType !== "admin") {
      throw new Error("The admin has locked presenters from deleting classes in this symposium.");
    }

    // If the user is not an admin, check if they own the class to delete
    if (
      user.userType !== "admin" &&
      user._id.toString() !== classInstance.presenter_id.toString()
    ) {
      throw new Error("You cannot delete a class that is not yours");
    }

    // Perform the deletion
    deletedClass = await this.findOneAndDelete({ _id: class_id }, queryOptions);

    // Removing the class id from symposium
    if (deletedClass) {
      await mongoose
        .model("Symposium")
        .updateOne(
          { _id: deletedClass.symposium_id },
          { $pull: { classes: class_id } },
          queryOptions
        );
    }

    // Only commit the transaction if this operation created it.
    if (!isExternalSession) {
      await session.commitTransaction();
    }
  } catch (error) {
    // Only abort the transaction if this operation created it.
    if (!isExternalSession) {
      await session.abortTransaction();
    }
    throw error; // Rethrow the error for the caller to handle
  } finally {
    // Only end the session if this operation created it.
    if (!isExternalSession) {
      session.endSession();
    }
  }

  return deletedClass;
};

module.exports = mongoose.model("Class", classSchema);
