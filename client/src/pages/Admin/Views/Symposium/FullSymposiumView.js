import forms from "../../../../CSS/Components/Forms.module.css";
import sidebar from "../../../../CSS/Components/Sidebar.module.css";
import styles from "../../../../CSS/Admin/Views/Symposium/FullSymposiumView.module.css";
import { useAuthContext } from "../../../../hooks/useAuthContext.js";
import { useLogout } from "../../../../hooks/useLogout.js";
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { FixedSizeList as List } from "react-window";

import * as XLSX from "xlsx/xlsx";

import Navbar from "../../../../components/Navbar.js";

const FullSymposiumView = () => {
  const { id } = useParams();

  const { user } = useAuthContext();
  const { logout } = useLogout();
  const [symposium, setSymposium] = useState(null);

  const [classQuery, setClassQuery] = useState("");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [presenters, setPresenters] = useState([]);

  const [addClassesWithExcelFile, setAddClassesWithExcelFile] = useState(null);
  const [addClassesWithExcelHelp, setAddClassesWithExcelHelp] = useState(false);
  const [addClassesWithExcelInputKey, setAddClassesWithExcelInputKey] = useState(Date.now());

  const [isFetchingSymposium, setIsFetchingSymposium] = useState(true);
  const [isFetchingSymposiumStudents, setIsFetchingSymposiumStudents] = useState(true);
  const [isFetchingSymposiumPresenters, setIsFetchingSymposiumPresenters] = useState(true);
  const [isFetchingSymposiumClasses, setIsFetchingSymposiumClasses] = useState(true);

  const [isLoadingAddClassesWithExcel, setIsLoadingAddClassesWithExcel] = useState(false);
  const [isLoadingFillAvailableSpaces, setIsLoadingFillAvailableSpaces] = useState(false);
  const [isLoadingSendScheduleToPresenters, setIsLoadingSendScheduleToPresenters] = useState(false);
  const [isLoadingSendScheduleToStudents, setIsLoadingSendScheduleToStudents] = useState(false);
  const [isLoadingSymposiumEdits, setIsLoadingSymposiumEdits] = useState(false);
  const [isLoadingAddPresentersWithExcel, setIsLoadingAddPresentersWithExcel] = useState(false);
  const [isLoadingRemovePresentersWithExcel, setIsLoadingRemovePresentersWithExcel] =
    useState(false);
  const [isLoadingAddStudentsWithExcel, setIsLoadingAddStudentsWithExcel] = useState(false);
  const [isLoadingRemoveStudentsWithExcel, setIsLoadingRemoveStudentsWithExcel] = useState(false);
  const [isLoadingAddOrRemoveStudentsByGrade, setIsLoadingAddOrRemoveStudentsByGrade] =
    useState(false);

  const [addClassesWithExcelError, setAddClassesWithExcelError] = useState(null);
  const [symposiumEditsError, setSymposiumEditsError] = useState(null);
  // const [fillAvailableSpacesError, setFillAvailableSpacesError] = useState(null);
  // const [sendScheduleToStudentsError, setSendScheduleToStudentsError] = useState(null);
  // const [sendScheduleToPresentersError, setSendScheduleToPresentersError] = useState(null);
  const [addPresentersWithExcelError, setAddPresentersWithExcelError] = useState(null);
  const [removePresentersWithExcelError, setRemovePresentersWithExcelError] = useState(null);
  const [addStudentsWithExcelError, setAddStudentsWithExcelError] = useState(null);
  const [removeStudentsWithExcelError, setRemoveStudentsWithExcelError] = useState(null);
  const [addOrRemoveStudentsByGradeError, setAddOrRemoveStudentsByGradeError] = useState("");

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [presentersCreatingClasses, setPresentersCreatingClasses] = useState(null);
  const [presentersDeletingClasses, setPresentersDeletingClasses] = useState(null);
  const [studentsJoiningClasses, setStudentsJoiningClasses] = useState(null);
  const [studentsLeavingClasses, setStudentsLeavingClasses] = useState(null);
  const [studentsSeeingClassmates, setStudentsSeeingClassmates] = useState(false);
  const [studentsSeeingClassGender, setStudentsSeeingClassGender] = useState(false);

  const [presenterQuery, setPresenterQuery] = useState("");
  const [addPresentersWithExcelFile, setAddPresentersWithExcelFile] = useState(null);
  const [addPresentersWithExcelFileHelp, setAddPresentersWithExcelFileHelp] = useState(false);
  const [addPresentersWithExcelInputKey, setAddPresentersWithExcelInputKey] = useState(Date.now());
  const [removePresentersWithExcelFile, setRemovePresentersWithExcelFile] = useState(null);
  const [removePresentersWithExcelFileHelp, setRemovePresentersWithExcelFileHelp] = useState(false);
  const [removePresentersWithExcelInputKey, setRemovePresentersWithExcelInputKey] = useState(
    Date.now()
  );

  const [studentQuery, setStudentQuery] = useState("");
  const [addStudentsWithExcelFile, setAddStudentsWithExcelFile] = useState(null);
  const [addStudentsWithExcelFileHelp, setAddStudentsWithExcelFileHelp] = useState(false);
  const [addStudentsWithExcelInputKey, setAddStudentsWithExcelInputKey] = useState(Date.now());
  const [removeStudentsWithExcelFile, setRemoveStudentsWithExcelFile] = useState(null);
  const [removeStudentsWithExcelFileHelp, setRemoveStudentsWithExcelFileHelp] = useState(false);
  const [removeStudentsWithExcelInputKey, setRemoveStudentsWithExcelInputKey] = useState(
    Date.now()
  );
  const [grades, setGrades] = useState([]);
  const [addOrRemoveStudentsByGrade, setAddOrRemoveStudentsByGrade] = useState("add");
  const [addOrRemoveStudentsByGradeHelp, setAddOrRemoveStudentsByGradeHelp] = useState(false);

  const calculateClassesInBlocks = (blocks) => {
    let classesInBlocks = 0;
    blocks.forEach((b) => {
      classesInBlocks += classes.filter((c) => c.block === b).length;
    });
    return classesInBlocks;
  };

  const calculateAvailableSpacesInBlocks = (blocks) => {
    let spacesInBlocks = 0;
    blocks.forEach((b) => {
      classes
        .filter((c) => c.block === b)
        .forEach((c) => {
          // Calculate available spaces by subtracting the number of enrolled students from maxStudents
          const availableSpacesInClass = c.maxStudents - c.students.length;
          spacesInBlocks += availableSpacesInClass;
        });
    });
    return spacesInBlocks;
  };

  const calculateRequiredSpacesInBlocks = (blocks) => {
    let filledSpacesInBlocks = 0;
    let requiredSpacesInBlocks = 0;

    // Ensure symposium.students and classes exist and are arrays before proceeding
    if (Array.isArray(blocks) && symposium?.students && Array.isArray(classes)) {
      requiredSpacesInBlocks = symposium.students.length * blocks.length;

      blocks.forEach((b) => {
        symposium.students.forEach((student_id) => {
          classes.forEach((classItem) => {
            // Ensure we're working with the correct block and that the class has a students array
            if (classItem.block === b && Array.isArray(classItem.students)) {
              classItem.students.forEach((s) => {
                if (s.student_id === student_id) {
                  filledSpacesInBlocks++;
                }
              });
            }
          });
        });
      });
    }

    return requiredSpacesInBlocks - filledSpacesInBlocks;
  };

  const toggleAddClassesWithExcelHelp = () => {
    setAddClassesWithExcelHelp(!addClassesWithExcelHelp);
  };

  const handleAddClassesWithExcelReset = () => {
    setAddClassesWithExcelFile(null);
    setAddClassesWithExcelInputKey(Date.now());
  };

  const handleAddClassesWithExcel = (event) => {
    event.preventDefault();
    setAddClassesWithExcelError(null);
    setIsLoadingAddClassesWithExcel(true);

    if (!addClassesWithExcelFile) {
      setAddClassesWithExcelError("Please select a file before submitting.");
      setIsLoadingAddClassesWithExcel(false);
      return;
    }

    const reader = new FileReader();
    reader.readAsBinaryString(addClassesWithExcelFile);

    reader.onload = async (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let parsedData = XLSX.utils.sheet_to_json(sheet);

        parsedData.map((thisClass, index) => {
          parsedData[index].rowNum = thisClass.__rowNum__ + 1;
          if (!thisClass.presenterEmail) {
            throw new Error(
              "You did not provide a presenterEmail for the class on row " + thisClass.rowNum
            );
          }
          if (!thisClass.name) {
            throw new Error("You did not provide a name for the class on row " + thisClass.rowNum);
          }
          if (!thisClass.shortDescription) {
            throw new Error(
              "You did not provide a shortDescription for the class on row " + thisClass.rowNum
            );
          }
          if (!thisClass.block) {
            throw new Error("You did not provide a block for the class on row " + thisClass.rowNum);
          }
          if (!thisClass.room) {
            throw new Error("You did not provide a room for the class on row " + thisClass.rowNum);
          }
          if (!thisClass.maxStudents) {
            throw new Error(
              "You did not provide maxStudents for the class on row " + thisClass.rowNum
            );
          }
          if (!thisClass.gender) {
            throw new Error(
              "You did not provide a gender for the class on row " + thisClass.rowNum
            );
          }
        });

        const response = await fetch(`/api/admin/symposiums/${id}/classes/create`, {
          method: "POST",
          body: JSON.stringify({
            classes: parsedData,
          }),
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        });

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error);
        }
        if (response.ok) {
          setClasses([...json.addedClasses.flat(), ...classes]);
          console.log([...json.addedClasses.flat()]);
          setSymposium(json.symposium);
        }

        handleAddClassesWithExcelReset();
      } catch (error) {
        setAddClassesWithExcelError(error.toString());
        setIsLoadingAddClassesWithExcel(false);
      } finally {
        setIsLoadingAddClassesWithExcel(false);
        handleAddClassesWithExcelReset();
      }
    };

    reader.onerror = (error) => {
      setAddClassesWithExcelError("Failed to read file: " + error.message);
      setIsLoadingAddClassesWithExcel(false);
      return;
    };
  };

  const handleClassSearchChange = (event) => {
    setClassQuery(event.target.value.toLowerCase());
  };
  const filteredClasses = classes.filter((thisClass) =>
    thisClass.name.toLowerCase().includes(classQuery.toLowerCase())
  );

  const handleNameChange = (event) => {
    setName(event.target.value);
  };

  const handleDateChange = (event) => {
    setDate(event.target.value);
  };

  const handlePresentersCreatingClassesChange = (event) => {
    setPresentersCreatingClasses(event.target.value);
  };

  const handlePresentersDeletingClassesChange = (event) => {
    setPresentersDeletingClasses(event.target.value);
  };

  const handleStudentsJoiningClassesChange = (event) => {
    setStudentsJoiningClasses(event.target.value);
  };

  const handleStudentsLeavingClassesChange = (event) => {
    setStudentsLeavingClasses(event.target.value);
  };

  const handleStudentsSeeingClassmatesChange = (event) => {
    setStudentsSeeingClassmates(event.target.value);
  };

  const handleStudentsSeeingClassGenderChange = (event) => {
    setStudentsSeeingClassGender(event.target.value);
  };

  const handleSymposiumEdit = (event) => {
    event.preventDefault();
    const editUser = async () => {
      setSymposiumEditsError("");
      setIsLoadingSymposiumEdits(true);

      const response = await fetch(`/api/admin/symposiums/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          date,
          permissions: {
            presentersCreatingClasses,
            presentersDeletingClasses,
            studentsJoiningClasses,
            studentsLeavingClasses,
          },
          settings: {
            studentsSeeingClassmates,
            studentsSeeingClassGender,
          },
        }),
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();

      if (!response.ok) {
        setSymposiumEditsError(json.error);
      }
      if (response.ok) {
        setSymposiumEditsError(null);
        alert("Successfully edited the symposium!");
      }
      setIsLoadingSymposiumEdits(false);
    };
    editUser();
  };

  // ADD AND REMOVE USERS HELP
  const toggleAddPresentersWithExcelFileHelp = () => {
    setAddPresentersWithExcelFileHelp(!addPresentersWithExcelFileHelp);
  };

  const toggleRemovePresentersWithExcelFileHelp = () => {
    setRemovePresentersWithExcelFileHelp(!removePresentersWithExcelFileHelp);
  };

  const toggleAddStudentsWithExcelFileHelp = () => {
    setAddStudentsWithExcelFileHelp(!addStudentsWithExcelFileHelp);
  };

  const toggleRemoveStudentsWithExcelFileHelp = () => {
    setRemoveStudentsWithExcelFileHelp(!removeStudentsWithExcelFileHelp);
  };

  const toggleAddOrRemoveStudentsByGradeHelp = () => {
    setAddOrRemoveStudentsByGradeHelp(!addOrRemoveStudentsByGradeHelp);
  };

  const handleAddPresentersWithExcelReset = () => {
    setAddPresentersWithExcelFile(null);
    setAddPresentersWithExcelInputKey(Date.now());
  };
  const handleAddStudentsWithExcelReset = () => {
    setAddStudentsWithExcelFile(null);
    setAddStudentsWithExcelInputKey(Date.now());
  };

  const handleAddUsersWithExcel = async (userType, event) => {
    event.preventDefault();
    const reader = new FileReader();

    if (userType === "presenter") {
      setAddPresentersWithExcelError("");
      setIsLoadingAddPresentersWithExcel(true);
      if (!addPresentersWithExcelFile) {
        setAddPresentersWithExcelError("Please choose a file before submitting.");
        setIsLoadingAddPresentersWithExcel(false);
        return;
      }
      reader.readAsBinaryString(addPresentersWithExcelFile);
      reader.onerror = (error) => {
        setAddPresentersWithExcelError("Failed to read file: " + error.message);
        setIsLoadingAddPresentersWithExcel(false);
        return;
      };
    } else if (userType === "student") {
      setAddStudentsWithExcelError("");
      setIsLoadingAddStudentsWithExcel(true);
      if (!addStudentsWithExcelFile) {
        setAddStudentsWithExcelError("Please choose a file before submitting.");
        setIsLoadingAddStudentsWithExcel(false);
        return;
      }
      reader.readAsBinaryString(addStudentsWithExcelFile);
      reader.onerror = (error) => {
        setAddStudentsWithExcelError("Failed to read file: " + error.message);
        setIsLoadingAddStudentsWithExcel(false);
        return;
      };
    }

    reader.onload = async (event) => {
      const data = event.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);
      parsedData.forEach((user, index) => {
        parsedData[index].rowNum = user.__rowNum__ + 1;
      });
      const response = await fetch(`/api/admin/symposiums/${id}/users/addWithEmails`, {
        method: "POST",
        body: JSON.stringify({
          users: parsedData,
          userType,
        }),
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();
      if (!response.ok) {
        if (userType === "presenter") {
          setAddPresentersWithExcelError(json.error);
          setIsLoadingAddPresentersWithExcel(false);
        } else if (userType === "student") {
          setAddStudentsWithExcelError(json.error);
          setIsLoadingAddStudentsWithExcel(false);
        }
      }
      if (response.ok) {
        setSymposium(json.symposium);

        if (userType === "presenter") {
          setPresenters([...json.addedUsers, ...presenters]);
          setIsLoadingAddPresentersWithExcel(false);
        } else if (userType === "student") {
          setStudents([...json.addedUsers, ...students]);
          setIsLoadingAddStudentsWithExcel(false);
        }
      }

      if (userType === "presenter") {
        handleAddPresentersWithExcelReset();
      }
      if (userType === "student") {
        handleAddStudentsWithExcelReset();
      }
    };
  };

  const handleRemovePresentersWithExcelReset = () => {
    setRemovePresentersWithExcelFile(null);
    setRemovePresentersWithExcelInputKey(Date.now());
  };
  const handleRemoveStudentsWithExcelReset = () => {
    setRemoveStudentsWithExcelFile(null);
    setRemoveStudentsWithExcelInputKey(Date.now());
  };

  const handleRemoveUsersWithExcel = async (userType, event) => {
    event.preventDefault();
    const reader = new FileReader();

    if (userType === "presenter") {
      setRemovePresentersWithExcelError(null);
      setIsLoadingRemovePresentersWithExcel(true);
      if (!removePresentersWithExcelFile) {
        setRemovePresentersWithExcelError("Please choose a file before submitting.");
        setIsLoadingRemovePresentersWithExcel(false);
        return;
      }
      reader.readAsBinaryString(removePresentersWithExcelFile);
      reader.onerror = (error) => {
        setRemoveStudentsWithExcelError("Failed to read file: " + error.message);
        setIsLoadingRemoveStudentsWithExcel(false);
        return;
      };
    } else if (userType === "student") {
      setRemoveStudentsWithExcelError("");
      setIsLoadingRemoveStudentsWithExcel(true);
      if (!removeStudentsWithExcelFile) {
        setRemoveStudentsWithExcelError("Please choose a file before submitting.");
        setIsLoadingRemoveStudentsWithExcel(false);
        return;
      }
      reader.readAsBinaryString(removeStudentsWithExcelFile);
      reader.onerror = (error) => {
        setRemoveStudentsWithExcelError("Failed to read file: " + error.message);
        setIsLoadingRemoveStudentsWithExcel(false);
        return;
      };
    }

    reader.onload = async (event) => {
      const data = event.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const parsedData = XLSX.utils.sheet_to_json(sheet);
      parsedData.forEach((user, index) => {
        parsedData[index].rowNum = user.__rowNum__ + 1;
      });
      const response = await fetch(`/api/admin/symposiums/${id}/users/removeWithEmails`, {
        method: "DELETE",
        body: JSON.stringify({
          users: parsedData,
          userType,
        }),
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();
      if (!response.ok) {
        if (userType === "presenter") {
          setRemovePresentersWithExcelError(json.error);
          setIsLoadingRemovePresentersWithExcel(false);
        } else if (userType === "student") {
          setRemoveStudentsWithExcelError(json.error);
          setIsLoadingRemoveStudentsWithExcel(false);
        }
      }
      if (response.ok) {
        setSymposium(json.symposium);
        const deletedClassIds = json.deletedClasses.map((deletedClass) => deletedClass._id);

        if (userType === "presenter") {
          const idsToRemoveArray = json.removedUsers.map((removedUser) => removedUser.id);
          setPresenters(presenters.filter((presenter) => idsToRemoveArray.includes(presenter.id)));
          setClasses(classes.filter((classItem) => !deletedClassIds.includes(classItem._id)));
          setIsLoadingRemovePresentersWithExcel(false);
        } else if (userType === "student") {
          const idsToRemoveArray = json.removedUsers.map((removedUser) => removedUser.id);
          setStudents(students.filter((student) => idsToRemoveArray.includes(student.id)));
          setIsLoadingRemoveStudentsWithExcel(false);
        }
      }

      if (userType === "presenter") {
        handleRemovePresentersWithExcelReset();
      }
      if (userType === "student") {
        handleRemoveStudentsWithExcelReset();
      }
    };
  };

  const handlePresenterSearchChange = (event) => {
    setPresenterQuery(event.target.value.toLowerCase());
  };
  const filteredPresenters = presenters.filter(
    (presenter) =>
      presenter.firstName.toLowerCase().includes(presenterQuery) ||
      presenter.lastName.toLowerCase().includes(presenterQuery)
  );
  const PresenterRow = ({ index, style, data }) => {
    const presenter = data[index];
    return (
      <div style={style} key={presenter._id}>
        <div className={styles.user}>
          <div className={styles.userHeader}>
            <Link
              to={`/admin/symposiums/${symposium._id}/presenter/${presenter._id}`}
              className={styles.userName}
            >
              {presenter.firstName} {presenter.lastName}
            </Link>

            <button
              className={`${forms.ghostButton} ${forms.ghostButtonRed}`}
              onClick={async () => {
                setIsFetchingSymposiumPresenters(true);
                const response = await fetch(
                  `/api/admin/symposiums/${symposium._id}/users/${presenter._id}`,
                  {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${user.token}`,
                    },
                  }
                );

                const json = await response.json();
                if (!response.ok) {
                  alert(json.error.toString());
                }

                if (response.ok) {
                  setSymposium(json.symposium);
                  const deletedClassIds = json.deletedClasses.map(
                    (deletedClass) => deletedClass._id
                  );
                  setPresenters(
                    presenters.filter((presenter) => presenter._id !== json.removedUser._id)
                  );
                  setClasses(
                    classes.filter((classItem) => !deletedClassIds.includes(classItem._id))
                  );

                  setIsFetchingSymposiumPresenters(false);
                }
              }}
              style={{ fontSize: 16 }}
              disabled={isFetchingSymposiumPresenters}
            >
              {isFetchingSymposiumPresenters ? <div className={forms.redSpinner}></div> : "REMOVE"}
            </button>
          </div>
          <p>
            Email: <strong>{presenter.email}</strong>
          </p>
          <p>
            Created Classes:{" "}
            <strong>{classes.filter((c) => c.presenter_id._id === presenter._id).length}</strong>
          </p>
        </div>
      </div>
    );
  };

  const handleStudentSearchChange = (event) => {
    setStudentQuery(event.target.value.toLowerCase());
  };
  const filteredStudents = students.filter(
    (student) =>
      student.firstName.toLowerCase().includes(studentQuery) ||
      student.lastName.toLowerCase().includes(studentQuery)
  );

  const handleGradesChange = (event) => {
    const gradeNum = Number(event.target.value);
    if (grades.includes(gradeNum)) {
      setGrades(grades.filter((num) => num !== gradeNum));
    } else {
      setGrades([...grades, gradeNum]);
    }
  };

  const handleAddOrRemoveStudentsByGradeChange = (event) => {
    setAddOrRemoveStudentsByGrade(event.target.value);
  };

  const handleAddOrRemoveStudentsByGrade = async (event) => {
    event.preventDefault();
    setAddOrRemoveStudentsByGradeError("");
    setIsLoadingAddOrRemoveStudentsByGrade(true);

    if (addOrRemoveStudentsByGrade === "add") {
      const response = await fetch(`/api/admin/symposiums/${symposium._id}/students/addByGrade`, {
        method: "POST",
        body: JSON.stringify({
          grades,
        }),
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();

      if (!response.ok) {
        setAddOrRemoveStudentsByGradeError(json.error);
      }
      if (response.ok) {
        setAddOrRemoveStudentsByGradeError("");
        setSymposium(json.symposium);
        setStudents([...json.addedStudents, ...students]);
        setGrades([]);
        setAddOrRemoveStudentsByGrade("add");
      }
    } else if (addOrRemoveStudentsByGrade === "remove") {
      const response = await fetch(
        `/api/admin/symposiums/${symposium._id}/students/removeByGrade`,
        {
          method: "DELETE",
          body: JSON.stringify({ grades }),
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const json = await response.json();

      if (!response.ok) {
        setAddOrRemoveStudentsByGradeError(json.error);
      }
      if (response.ok) {
        setAddOrRemoveStudentsByGradeError("");
        setSymposium(json.symposium);
        const idsToRemoveArray = json.removedStudents.map((removedUser) => removedUser.id);
        setStudents(students.filter((student) => idsToRemoveArray.includes(student.id)));
        setGrades([]);
        setAddOrRemoveStudentsByGrade("add");
      }
    }

    setIsLoadingAddOrRemoveStudentsByGrade(false);
  };

  const StudentRow = ({ index, style, data }) => {
    const student = data[index];
    return (
      <div style={style} key={student._id}>
        <div className={styles.user}>
          <div className={styles.userHeader}>
            <Link
              to={`/admin/symposiums/${symposium._id}/student/${student._id}`}
              className={styles.userName}
            >
              {student.firstName} {student.lastName}
            </Link>

            <button
              className={`${forms.ghostButton} ${forms.ghostButtonRed}`}
              onClick={async () => {
                setIsFetchingSymposiumStudents(true);
                const response = await fetch(
                  `/api/admin/symposiums/${symposium._id}/users/${student._id}`,
                  {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${user.token}`,
                    },
                  }
                );

                const json = await response.json();
                if (!response.ok) {
                  setIsFetchingSymposiumStudents(false);
                  alert(json.error.toString());
                }

                if (response.ok) {
                  setSymposium(json.symposium);
                  setStudents(students.filter((student) => student._id !== json.removedUser._id));
                  setIsFetchingSymposiumStudents(false);
                }
              }}
              style={{ fontSize: 16 }}
              disabled={isFetchingSymposiumStudents}
            >
              {isFetchingSymposiumStudents ? <div className={forms.redSpinner}></div> : "REMOVE"}
            </button>
          </div>

          <p>
            Email: <strong>{student.email}</strong>
          </p>
          <p>
            Grade: <strong>{student.grade}</strong>
          </p>
          <p>
            Gender: <strong>{student.gender}</strong>
          </p>
          <p>
            Joined Classes:{" "}
            <strong>
              {classes.filter((c) => c.students.some((s) => s.student_id === student._id)).length}
              /6{" "}
            </strong>
          </p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    setIsFetchingSymposium(true);

    const fetchSymposium = async () => {
      const response = await fetch(`/api/global/symposiums/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();
      if (response.ok) {
        setSymposium(json);
        setName(json.name);
        setDate(json.date);
        setPresentersCreatingClasses(json.permissions.presentersCreatingClasses.toString());
        setPresentersDeletingClasses(json.permissions.presentersDeletingClasses.toString());
        setStudentsJoiningClasses(json.permissions.studentsJoiningClasses.toString());
        setStudentsLeavingClasses(json.permissions.studentsLeavingClasses.toString());
        setStudentsSeeingClassmates(json.settings.studentsSeeingClassmates.toString());
        setStudentsSeeingClassGender(json.settings.studentsSeeingClassGender.toString());
        setIsFetchingSymposium(false);
      }
      if (response.status === 401) {
        logout();
      }
    };

    fetchSymposium();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user.token]);

  // Fetch classes data after symposium is fetched
  useEffect(() => {
    setIsFetchingSymposiumClasses(true);

    if (!symposium || !symposium.classes) return;

    const fetchClass = async () => {
      const response = await fetch(`/api/global/symposiums/${symposium._id}/classes`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();

      if (response.ok) {
        setClasses([...json]);
        setIsFetchingSymposiumClasses(false);
      }
      if (response.status === 401) {
        logout();
      }
    };

    fetchClass();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symposium, user.token]);

  useEffect(() => {
    setIsFetchingSymposiumPresenters(true);
    setIsFetchingSymposiumStudents(true);
    if (!symposium) return;

    const fetchPresenters = async () => {
      const response = await fetch(`/api/admin/symposiums/${symposium._id}/presenters`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();

      if (response.ok) {
        setPresenters([...json]);
        setIsFetchingSymposiumPresenters(false);
      }
      if (response.status === 401) {
        logout();
      }
    };
    fetchPresenters();

    const fetchStudents = async () => {
      const response = await fetch(`/api/admin/symposiums/${symposium._id}/students`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();

      if (response.ok) {
        setStudents([...json]);
        setIsFetchingSymposiumStudents(false);
      }
      if (response.status === 401) {
        logout();
      }
    };
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symposium, user.token]);

  return (
    <div className={styles.fullSymposiumView}>
      <Navbar />
      <div className={styles.container}>
        <div className={`${styles.header} ${sidebar.box}`}>
          <h2 className={`${styles.h2}`}>
            {isFetchingSymposiumClasses
              ? "Loading..."
              : symposium.name + "\u00A0\u00A0|\u00A0\u00A0" + symposium.date}
          </h2>
        </div>
        <div className={`${styles.header} ${sidebar.box}`}>
          <h2 className={`${styles.h2}`}>Overview:</h2>
        </div>
        <div className={`${styles.overview}`}>
          <div className={`${styles.leftOverview}  ${sidebar.box}`}>
            <h3 className={`${styles.h3}`}>
              Total Classes:{" "}
              {isFetchingSymposiumClasses
                ? "(Loading...)"
                : calculateClassesInBlocks([1, 2, 3, 4, 5, 6])}
            </h3>
            <ul>
              <li>
                Block 1:{" "}
                {isFetchingSymposiumClasses ? "(Loading...)" : calculateClassesInBlocks([1])}
              </li>
              <li>
                Block 2:{" "}
                {isFetchingSymposiumClasses ? "(Loading...)" : calculateClassesInBlocks([2])}
              </li>
              <li>
                Block 3:{" "}
                {isFetchingSymposiumClasses ? "(Loading...)" : calculateClassesInBlocks([3])}
              </li>
              <li>
                Block 4:{" "}
                {isFetchingSymposiumClasses ? "(Loading...)" : calculateClassesInBlocks([4])}
              </li>
              <li>
                Block 5:{" "}
                {isFetchingSymposiumClasses ? "(Loading...)" : calculateClassesInBlocks([5])}
              </li>
              <li>
                Block 6:{" "}
                {isFetchingSymposiumClasses ? "(Loading...)" : calculateClassesInBlocks([6])}
              </li>
            </ul>
          </div>
          <div className={`${styles.middleOverview}  ${sidebar.box}`}>
            <h3 className={`${styles.h3}`}>
              Available Spaces:{" "}
              {isFetchingSymposiumClasses
                ? "(Loading...)"
                : calculateAvailableSpacesInBlocks([1, 2, 3, 4, 5, 6])}
            </h3>
            <ul>
              <li>
                Block 1:{" "}
                {isFetchingSymposiumClasses
                  ? "(Loading...)"
                  : calculateAvailableSpacesInBlocks([1])}
              </li>
              <li>
                Block 2:{" "}
                {isFetchingSymposiumClasses
                  ? "(Loading...)"
                  : calculateAvailableSpacesInBlocks([2])}
              </li>
              <li>
                Block 3:{" "}
                {isFetchingSymposiumClasses
                  ? "(Loading...)"
                  : calculateAvailableSpacesInBlocks([3])}
              </li>
              <li>
                Block 4:{" "}
                {isFetchingSymposiumClasses
                  ? "(Loading...)"
                  : calculateAvailableSpacesInBlocks([4])}
              </li>
              <li>
                Block 5:{" "}
                {isFetchingSymposiumClasses
                  ? "(Loading...)"
                  : calculateAvailableSpacesInBlocks([5])}
              </li>
              <li>
                Block 6:{" "}
                {isFetchingSymposiumClasses
                  ? "(Loading...)"
                  : calculateAvailableSpacesInBlocks([6])}
              </li>
            </ul>
          </div>
          <div className={`${styles.rightOverview}  ${sidebar.box}`}>
            <h3 className={`${styles.h3}`}>
              Spaces To Fill:{" "}
              {isFetchingSymposiumClasses
                ? "(Loading...)"
                : calculateRequiredSpacesInBlocks([1, 2, 3, 4, 5, 6])}
            </h3>
            <ul>
              <li>
                Block 1:{" "}
                {isFetchingSymposiumClasses || isFetchingSymposiumStudents
                  ? "(Loading...)"
                  : calculateRequiredSpacesInBlocks([1])}
              </li>
              <li>
                Block 2:{" "}
                {isFetchingSymposiumClasses || isFetchingSymposiumStudents
                  ? "(Loading...)"
                  : calculateRequiredSpacesInBlocks([2])}
              </li>
              <li>
                Block 3:{" "}
                {isFetchingSymposiumClasses || isFetchingSymposiumStudents
                  ? "(Loading...)"
                  : calculateRequiredSpacesInBlocks([3])}
              </li>
              <li>
                Block 4:{" "}
                {isFetchingSymposiumClasses || isFetchingSymposiumStudents
                  ? "(Loading...)"
                  : calculateRequiredSpacesInBlocks([4])}
              </li>
              <li>
                Block 5:{" "}
                {isFetchingSymposiumClasses || isFetchingSymposiumStudents
                  ? "(Loading...)"
                  : calculateRequiredSpacesInBlocks([5])}
              </li>
              <li>
                Block 6:{" "}
                {isFetchingSymposiumClasses || isFetchingSymposiumStudents
                  ? "(Loading...)"
                  : calculateRequiredSpacesInBlocks([6])}
              </li>
            </ul>
          </div>
        </div>
        <div className={`${styles.addClasses} ${sidebar.box}`}>
          <h2 className={styles.h2}>Add Classes Using Excel:</h2>
          <form onSubmit={handleAddClassesWithExcel}>
            <input
              key={addClassesWithExcelInputKey}
              type="file"
              accept=".xlsx,.xls"
              className={forms.fileInput} // Assuming you have CSS for this
              onChange={(e) => setAddClassesWithExcelFile(e.target.files[0])}
              onClick={(e) => (e.target.value = null)}
            />
            <button disabled={isLoadingAddClassesWithExcel} className={forms.button}>
              {isLoadingAddClassesWithExcel ? (
                <div className={forms.spinner}></div>
              ) : (
                "ADD STUDENTS"
              )}
            </button>
            {addClassesWithExcelError && (
              <div className={forms.error}>{addClassesWithExcelError}</div>
            )}
          </form>
          <div className={forms.fileInputHelpContainer} style={{ textAlign: "left" }}>
            <p className={forms.fileInputHelp} onClick={toggleAddClassesWithExcelHelp}>
              Help {addClassesWithExcelHelp ? "(hide)" : "(show)"}
            </p>
            <div
              className={forms.fileInputText}
              style={{ display: addClassesWithExcelHelp ? "block" : "none" }}
            >
              <strong>Requirements:</strong>
              <ul>
                <li>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1PDlovLHYNgsyJiT4gjEsXOFnhVWxSrQv0APQsXNUlsw/edit?usp=sharing"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Follow this exact format
                  </a>
                </li>
                <li>All classes are new (are not added to the symposium already)</li>
              </ul>
              <strong>Steps:</strong>
              <ol>
                <li>Follow the format of the example above</li>
                <li>Choose and upload your excel file</li>
                <li>Click add classes</li>
                <li>If there is an error with one of the classes, none will be added</li>
                <li>If all classes have no errors, all will be added</li>
              </ol>
            </div>
          </div>
        </div>

        <div className={`${styles.classes} ${sidebar.box}`}>
          <h2 className={styles.h2}>
            Classes in Symposium: ({isFetchingSymposiumClasses ? "Loading..." : classes.length}):
          </h2>
          <div className={forms.textInputGroup}>
            <input
              type="text"
              placeholder="Search for a class..."
              onChange={handleClassSearchChange}
              value={classQuery.bindings}
              className={forms.textInput}
            />
            <div className={`${forms.textInputIcon} ${forms.defaultCursor}`}>
              <span className="material-icons">search</span>
            </div>
          </div>
          <div
            className={styles.classContainer}
            style={filteredClasses.length === 0 ? { height: 0 } : {}}
          >
            {filteredClasses.map((thisClass) => {
              return (
                <div className={styles.class} key={thisClass._id}>
                  <div className={styles.classHeader}>
                    <Link
                      to={`/admin/symposiums/${symposium._id}/class/${thisClass._id}`}
                      className={styles.className}
                    >
                      <span className={styles.classColor}>{thisClass.name}</span> by{" "}
                      <span className={styles.presenterColor}>
                        {thisClass.presenterFirstName} {thisClass.presenterLastName}
                      </span>{" "}
                    </Link>
                    <button
                      className={forms.deleteIcon}
                      onClick={async () => {
                        setIsFetchingSymposiumClasses(true);
                        const response = await fetch("/api/presenter/classes/" + thisClass._id, {
                          method: "DELETE",
                          headers: {
                            Authorization: `Bearer ${user.token}`,
                          },
                        });

                        const json = await response.json();
                        if (response.ok) {
                          setClasses(classes.filter((c) => c._id !== json._id));
                          setIsFetchingSymposiumClasses(false);
                        }
                      }}
                      disabled={isFetchingSymposiumClasses}
                    >
                      {isFetchingSymposiumClasses ? (
                        <div className={forms.smallRedSpinner}></div>
                      ) : (
                        <span className="material-symbols-outlined">delete</span>
                      )}{" "}
                    </button>
                  </div>
                  <p>
                    <strong>Block:</strong> {thisClass.block} | <strong>Room:</strong>{" "}
                    {thisClass.room}
                  </p>
                  <p>
                    <strong>Short description:</strong>
                  </p>
                  <p>{thisClass.shortDescription}</p>
                  <p>
                    <strong>Students:</strong> {thisClass.students.length}/{thisClass.maxStudents}
                  </p>
                  <p>
                    <strong>Gender:</strong> {thisClass.gender}
                  </p>
                </div>
              );
            })}{" "}
          </div>
        </div>

        <div className={`${styles.header} ${sidebar.box}`}>
          <h2 className={`${styles.h2}`}>Functions:</h2>
        </div>
        <div className={`${styles.functions}`}>
          <div className={`${styles.leftFunctions}  ${sidebar.box}`}>
            <h3 className={`${styles.h3}`}>Fill Available Spaces Randomly:</h3>

            <button
              disabled={isLoadingFillAvailableSpaces}
              className={forms.button}
              onClick={async () => {
                const isConfirm = window.confirm(
                  "Are you sure you want to fill all the available spaces in the symposium? The algorithm prioritizes filling classes that have more students."
                );
                if (!isConfirm) return;
                setIsLoadingFillAvailableSpaces(true);
                const response = await fetch(`/api/admin/symposiums/${id}/fill`, {
                  method: "PATCH",
                  headers: {
                    Authorization: `Bearer ${user.token}`,
                  },
                });

                const json = await response.json();
                if (response.ok) {
                  alert("All available spaces have been filled.");
                  setSymposium(json);
                }
                if (!response.ok) {
                  alert(json.error);
                }
                setIsLoadingFillAvailableSpaces(false);
              }}
            >
              {isLoadingFillAvailableSpaces ? <div className={forms.spinner}></div> : "FILL"}
            </button>
          </div>
          <div className={`${styles.middleFunctions}  ${sidebar.box}`}>
            <h3 className={`${styles.h3}`}>Send Symposium Schedule to Presenters:</h3>
            <button
              onClick={async () => {
                const isConfirm = window.confirm(
                  "Are you sure you want to send the symposium schedule to all presenters in the symposium?"
                );
                if (!isConfirm) return;
                setIsLoadingSendScheduleToPresenters(true);
                const response = await fetch(
                  `/api/admin/symposiums/${id}/send-schedule-to-presenters`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${user.token}`,
                    },
                  }
                );

                const json = await response.json();
                if (response.ok) {
                  alert("Emails have been successfully sent!");
                }
                if (!response.ok) {
                  alert(json.error);
                }
                setIsLoadingSendScheduleToPresenters(false);
              }}
              disabled={isLoadingSendScheduleToPresenters}
              className={forms.button}
            >
              {isLoadingSendScheduleToPresenters ? <div className={forms.spinner}></div> : "SEND"}
            </button>
          </div>
          <div className={`${styles.rightFunctions}  ${sidebar.box}`}>
            <h3 className={`${styles.h3}`}>Send Symposium Schedule to Students:</h3>
            <button
              onClick={async () => {
                const isConfirm = window.confirm(
                  "Are you sure you want to send the symposium schedule to all students in the symposium?"
                );
                if (!isConfirm) return;
                setIsLoadingSendScheduleToStudents(true);
                const response = await fetch(
                  `/api/admin/symposiums/${id}/send-schedule-to-students`,
                  {
                    method: "GET",
                    headers: {
                      Authorization: `Bearer ${user.token}`,
                    },
                  }
                );

                const json = await response.json();
                if (response.ok) {
                  alert("Emails have been successfully sent!");
                }
                if (!response.ok) {
                  alert(json.error);
                }
                setIsLoadingSendScheduleToStudents(false);
              }}
              disabled={isLoadingSendScheduleToStudents}
              className={forms.button}
            >
              {isLoadingSendScheduleToStudents ? <div className={forms.spinner}></div> : "SEND"}
            </button>
          </div>
        </div>

        <div className={`${styles.header} ${sidebar.box}`}>
          <h2 className={`${styles.h2}`}>Setup:</h2>
        </div>
        <div className={`${styles.setup}`}>
          <div className={`${styles.leftSetup}  ${sidebar.box}`}>
            <h3 className={`${styles.h3}`}>
              Edit Info: {isFetchingSymposium ? "(Loading...)" : ""}
            </h3>
            <form onSubmit={handleSymposiumEdit}>
              <label className={forms.inputLabel}>Name:</label>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                placeholder="Enter symposium name like 'Grade 5,6,10'"
                className={forms.textInput}
              />

              <label className={forms.inputLabelInline}>Date:</label>
              <input
                type="date"
                onChange={handleDateChange}
                value={date}
                className={forms.dateInput}
              />
              <h3 className={forms.h3}>Permissions:</h3>

              <label className={forms.inputLabel}>Presenters creating classes:</label>
              <div className={forms.radioGroup}>
                <input
                  id="disablePresentersCreatingClasses"
                  className={forms.radioInput}
                  type="radio"
                  name="presentersCreatingClasses"
                  value="false"
                  checked={presentersCreatingClasses === "false"}
                  onChange={handlePresentersCreatingClassesChange}
                />
                <label className={forms.radioLabel} htmlFor="disablePresentersCreatingClasses">
                  Disable
                </label>
                <input
                  id="enablePresentersCreatingClasses"
                  className={forms.radioInput}
                  type="radio"
                  name="presentersCreatingClasses"
                  value="true"
                  checked={presentersCreatingClasses === "true"}
                  onChange={handlePresentersCreatingClassesChange}
                />
                <label className={forms.radioLabel} htmlFor="enablePresentersCreatingClasses">
                  Enable
                </label>
              </div>

              <label className={forms.inputLabel}>Presenters deleting classes:</label>
              <div className={forms.radioGroup}>
                <input
                  id="disablePresentersDeletingClasses"
                  className={forms.radioInput}
                  type="radio"
                  name="presentersDeletingClasses"
                  value="false"
                  checked={presentersDeletingClasses === "false"}
                  onChange={handlePresentersDeletingClassesChange}
                />
                <label className={forms.radioLabel} htmlFor="disablePresentersDeletingClasses">
                  Disable
                </label>
                <input
                  id="enablePresentersDeletingClasses"
                  className={forms.radioInput}
                  type="radio"
                  name="presentersDeletingClasses"
                  value="true"
                  checked={presentersDeletingClasses === "true"}
                  onChange={handlePresentersDeletingClassesChange}
                />
                <label className={forms.radioLabel} htmlFor="enablePresentersDeletingClasses">
                  Enable
                </label>
              </div>

              <label className={forms.inputLabel}>Students joining classes:</label>
              <div className={forms.radioGroup}>
                <input
                  id="disableStudentsJoiningClasses"
                  className={forms.radioInput}
                  type="radio"
                  name="studentsJoiningClasses"
                  value="false"
                  checked={studentsJoiningClasses === "false"}
                  onChange={handleStudentsJoiningClassesChange}
                />
                <label className={forms.radioLabel} htmlFor="disableStudentsJoiningClasses">
                  Disable
                </label>
                <input
                  id="enableStudentsJoiningClasses"
                  className={forms.radioInput}
                  type="radio"
                  name="studentsJoiningClasses"
                  value="true"
                  checked={studentsJoiningClasses === "true"}
                  onChange={handleStudentsJoiningClassesChange}
                />
                <label className={forms.radioLabel} htmlFor="enableStudentsJoiningClasses">
                  Enable
                </label>
              </div>

              <label className={forms.inputLabel}>Students leaving classes:</label>
              <div className={forms.radioGroup}>
                <input
                  id="disableStudentsLeavingClasses"
                  className={forms.radioInput}
                  type="radio"
                  name="studentsLeavingClasses"
                  value="false"
                  checked={studentsLeavingClasses === "false"}
                  onChange={handleStudentsLeavingClassesChange}
                />
                <label className={forms.radioLabel} htmlFor="disableStudentsLeavingClasses">
                  Disable
                </label>
                <input
                  id="enableStudentsLeavingClasses"
                  className={forms.radioInput}
                  type="radio"
                  name="studentsLeavingClasses"
                  value="true"
                  checked={studentsLeavingClasses === "true"}
                  onChange={handleStudentsLeavingClassesChange}
                />
                <label className={forms.radioLabel} htmlFor="enableStudentsLeavingClasses">
                  Enable
                </label>
              </div>

              <h3 className={forms.h3}>Settings:</h3>
              <label className={forms.inputLabel}>Students seeing classmates:</label>
              <div className={forms.radioGroup}>
                <input
                  id="disableStudentsSeeingClassmates"
                  className={forms.radioInput}
                  type="radio"
                  name="studentsSeeingClassmates"
                  value="false"
                  checked={studentsSeeingClassmates === "false"}
                  onChange={handleStudentsSeeingClassmatesChange}
                />
                <label className={forms.radioLabel} htmlFor="disableStudentsSeeingClassmates">
                  Disable
                </label>
                <input
                  id="enableStudentsSeeingClassmates"
                  className={forms.radioInput}
                  type="radio"
                  name="studentsSeeingClassmates"
                  value="true"
                  checked={studentsSeeingClassmates === "true"}
                  onChange={handleStudentsSeeingClassmatesChange}
                />
                <label className={forms.radioLabel} htmlFor="enableStudentsSeeingClassmates">
                  Enable
                </label>
              </div>
              <label className={forms.inputLabel}>Students seeing class gender:</label>
              <div className={forms.radioGroup}>
                <input
                  id="disableStudentsSeeingClassGender"
                  className={forms.radioInput}
                  type="radio"
                  name="studentsSeeingClassGender"
                  value="false"
                  checked={studentsSeeingClassGender === "false"}
                  onChange={handleStudentsSeeingClassGenderChange}
                />
                <label className={forms.radioLabel} htmlFor="disableStudentsSeeingClassGender">
                  Disable
                </label>
                <input
                  id="enableStudentsSeeingClassGender"
                  className={forms.radioInput}
                  type="radio"
                  name="studentsSeeingClassGender"
                  value="true"
                  checked={studentsSeeingClassGender === "true"}
                  onChange={handleStudentsSeeingClassGenderChange}
                />
                <label className={forms.radioLabel} htmlFor="enableStudentsSeeingClassGender">
                  Enable
                </label>
              </div>

              <button
                disabled={isFetchingSymposium || isLoadingSymposiumEdits}
                className={forms.button}
              >
                {isFetchingSymposium || isLoadingSymposiumEdits ? (
                  <div className={forms.spinner}></div>
                ) : (
                  "APPLY EDITS"
                )}
              </button>
              {symposiumEditsError && <div className={forms.error}>{symposiumEditsError}</div>}
            </form>
          </div>
          <div className={`${styles.middleSetup}  ${sidebar.box}`}>
            <h3 className={`${styles.h3}`}>Add Presenters Using Excel:</h3>
            <form onSubmit={(e) => handleAddUsersWithExcel("presenter", e)}>
              <input
                key={addPresentersWithExcelInputKey}
                type="file"
                accept=".xlsx,.xls"
                className={forms.fileInput} // Assuming you have CSS for this
                onChange={(e) => setAddPresentersWithExcelFile(e.target.files[0])}
                onClick={(e) => (e.target.value = null)}
              />
              <button disabled={isLoadingAddPresentersWithExcel} className={forms.button}>
                {isLoadingAddPresentersWithExcel ? (
                  <div className={forms.spinner}></div>
                ) : (
                  "ADD PRESENTERS"
                )}
              </button>
              {addPresentersWithExcelError && (
                <div className={forms.error}>{addPresentersWithExcelError}</div>
              )}
            </form>
            <div className={forms.fileInputHelpContainer}>
              <p className={forms.fileInputHelp} onClick={toggleAddPresentersWithExcelFileHelp}>
                Help {addPresentersWithExcelFileHelp ? "(hide)" : "(show)"}
              </p>
              <div
                className={forms.fileInputText}
                style={{ display: addPresentersWithExcelFileHelp ? "block" : "none" }}
              >
                <strong>Requirements:</strong>
                <ul>
                  <li>
                    <a
                      href="https://docs.google.com/spreadsheets/d/1-brMvgqolKPuV6IsmTaTxZCMSEat-hdKMUNUlITtGMM/edit?usp=sharing"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Follow this exact format
                    </a>
                  </li>
                  <li>All presenters are new (are not added to the symposium already)</li>
                </ul>
                <strong>Steps:</strong>
                <ol>
                  <li>Follow the format of the example above</li>
                  <li>
                    Add the emails of the presenters you want to add to the symposium to the excel
                    file
                  </li>
                  <li>Choose and upload your excel file</li>
                  <li>Click add presenters</li>
                  <li>If there is an error with one of the presenters, none will be added</li>
                  <li>If all presenters have no errors, all will be added</li>
                </ol>
              </div>
            </div>

            <h3 className={`${styles.h3}`}>Remove Presenters Using Excel:</h3>
            <form onSubmit={(e) => handleRemoveUsersWithExcel("presenter", e)}>
              <input
                key={removePresentersWithExcelInputKey}
                type="file"
                accept=".xlsx,.xls"
                className={forms.fileInput} // Assuming you have CSS for this
                onChange={(e) => setRemovePresentersWithExcelFile(e.target.files[0])}
                onClick={(e) => (e.target.value = null)}
              />
              <button disabled={isLoadingRemovePresentersWithExcel} className={forms.button}>
                {isLoadingRemovePresentersWithExcel ? (
                  <div className={forms.spinner}></div>
                ) : (
                  "REMOVE PRESENTERS"
                )}
              </button>
              {removePresentersWithExcelError && (
                <div className={forms.error}>{removePresentersWithExcelError}</div>
              )}
            </form>
            <div className={forms.fileInputHelpContainer}>
              <p className={forms.fileInputHelp} onClick={toggleRemovePresentersWithExcelFileHelp}>
                Help {removePresentersWithExcelFileHelp ? "(hide)" : "(show)"}
              </p>
              <div
                className={forms.fileInputText}
                style={{ display: removePresentersWithExcelFileHelp ? "block" : "none" }}
              >
                <strong>Requirements:</strong>
                <ul>
                  <li>
                    <a
                      href="https://docs.google.com/spreadsheets/d/1sbs4sFosUzBkwN21oeu4zLCflCgHy9iII91qdup-zIY/edit?usp=sharing"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Follow this exact format
                    </a>
                  </li>
                  <li>All presenters are in the symposium already</li>
                </ul>
                <strong>Steps:</strong>
                <ol>
                  <li>Follow the format of the example above</li>
                  <li>
                    Add the emails of the presenters you want to remove from the symposium to the
                    excel file
                  </li>
                  <li>Choose and upload your excel file</li>
                  <li>Click remove presenters</li>
                  <li>If there is an error with one of the presenters, none will be removed</li>
                  <li>If all presenters have no errors, all will be removed</li>
                </ol>
              </div>
            </div>
            <h3 className={styles.h3}>
              Presenters in Symposium (
              {isFetchingSymposiumPresenters ? "Loading..." : filteredPresenters.length}):
            </h3>
            <div className={forms.textInputGroup}>
              <input
                type="text"
                placeholder="Search for a presenter..."
                onChange={handlePresenterSearchChange}
                class
                value={presenterQuery}
                className={forms.textInput}
              />
              <div className={`${forms.textInputIcon} ${forms.defaultCursor}`}>
                <span className="material-icons">search</span>
              </div>
            </div>

            <List
              height={filteredPresenters.length === 0 ? 100 : 500} // Adjust based on your layout
              itemCount={filteredPresenters.length}
              itemSize={100}
              width={"100%"}
              itemData={filteredPresenters} // Pass filteredUsers as itemData
            >
              {PresenterRow}
            </List>
          </div>

          <div className={`${styles.rightSetup}  ${sidebar.box}`}>
            <h3 className={`${styles.h3}`}>Add Students Using Excel:</h3>
            <form onSubmit={(e) => handleAddUsersWithExcel("student", e)}>
              <input
                key={addStudentsWithExcelInputKey}
                type="file"
                accept=".xlsx,.xls"
                className={forms.fileInput} // Assuming you have CSS for this
                onChange={(e) => setAddStudentsWithExcelFile(e.target.files[0])}
                onClick={(e) => (e.target.value = null)}
              />
              <button disabled={isLoadingAddStudentsWithExcel} className={forms.button}>
                {isLoadingAddStudentsWithExcel ? (
                  <div className={forms.spinner}></div>
                ) : (
                  "ADD STUDENTS"
                )}
              </button>
              {addStudentsWithExcelError && (
                <div className={forms.error}>{addStudentsWithExcelError}</div>
              )}
            </form>
            <div className={forms.fileInputHelpContainer}>
              <p className={forms.fileInputHelp} onClick={toggleAddStudentsWithExcelFileHelp}>
                Help {addStudentsWithExcelFileHelp ? "(hide)" : "(show)"}
              </p>
              <div
                className={forms.fileInputText}
                style={{ display: addStudentsWithExcelFileHelp ? "block" : "none" }}
              >
                <strong>Requirements:</strong>
                <ul>
                  <li>
                    <a
                      href="https://docs.google.com/spreadsheets/d/1hcXGZ8Iu0dW1VYENH8gGOfq9s1YGB1heLPOAHRhVupk/edit?usp=sharing"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Follow this exact format
                    </a>
                  </li>
                  <li>All students are new (are not added to the symposium already)</li>
                </ul>
                <strong>Steps:</strong>
                <ol>
                  <li>Follow the format of the example above</li>
                  <li>
                    Add the emails of the students you want to add to the symposium to the excel
                    file
                  </li>
                  <li>Choose and upload your excel file</li>
                  <li>Click add students</li>
                  <li>If there is an error with one of the students, none will be added</li>
                  <li>If all students have no errors, all will be added</li>
                </ol>
              </div>
              <h3 className={`${styles.h3}`}>Remove Students Using Excel:</h3>
              <form onSubmit={(e) => handleRemoveUsersWithExcel("student", e)}>
                <input
                  key={removeStudentsWithExcelInputKey}
                  type="file"
                  accept=".xlsx,.xls"
                  className={forms.fileInput} // Assuming you have CSS for this
                  onChange={(e) => setRemoveStudentsWithExcelFile(e.target.files[0])}
                  onClick={(e) => (e.target.value = null)}
                />{" "}
                <button disabled={isLoadingRemoveStudentsWithExcel} className={forms.button}>
                  {isLoadingRemoveStudentsWithExcel ? (
                    <div className={forms.spinner}></div>
                  ) : (
                    "REMOVE STUDENTS"
                  )}
                </button>
                {removeStudentsWithExcelError && (
                  <div className={forms.error}>{removeStudentsWithExcelError}</div>
                )}
              </form>
              <div className={forms.fileInputHelpContainer}>
                <p className={forms.fileInputHelp} onClick={toggleRemoveStudentsWithExcelFileHelp}>
                  Help {removeStudentsWithExcelFileHelp ? "(hide)" : "(show)"}
                </p>
                <div
                  className={forms.fileInputText}
                  style={{ display: removeStudentsWithExcelFileHelp ? "block" : "none" }}
                >
                  <strong>Requirements:</strong>
                  <ul>
                    <li>
                      <a
                        href="https://docs.google.com/spreadsheets/d/12Jjhvr7VRskv1TIqXZgh1yrCqRsfgNIp0vKhrDfpcyY/edit?usp=sharing"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Follow this exact format
                      </a>
                    </li>
                    <li>All students are in the symposium already</li>
                  </ul>
                  <strong>Steps:</strong>
                  <ol>
                    <li>Follow the format of the example above</li>
                    <li>
                      Add the emails of the students you want to remove from the symposium to the
                      excel file
                    </li>
                    <li>Choose and upload your excel file</li>
                    <li>Click remove students</li>
                    <li>If there is an error with one of the students, none will be removed</li>
                    <li>If all presenters have no students, all will be removed</li>
                  </ol>
                </div>
              </div>
              <h3 className={`${styles.h3}`}>Add or Remove Students By Grade:</h3>
              <form onSubmit={handleAddOrRemoveStudentsByGrade}>
                <div className={forms.radioGroup} style={{ marginTop: 0 }}>
                  <input
                    type="radio"
                    id="add"
                    name="addOrRemoveStudentsByGrade"
                    value="add"
                    checked={addOrRemoveStudentsByGrade === "add"}
                    onChange={handleAddOrRemoveStudentsByGradeChange}
                    className={forms.radioInput}
                  />
                  <label htmlFor="add" className={forms.radioLabel}>
                    ADD STUDENTS
                  </label>
                  <input
                    type="radio"
                    id="remove"
                    name="addOrRemoveStudentsByGrade"
                    value="remove"
                    checked={addOrRemoveStudentsByGrade === "remove"}
                    onChange={handleAddOrRemoveStudentsByGradeChange}
                    className={forms.radioInput}
                  />
                  <label htmlFor="remove" className={forms.radioLabel}>
                    REMOVE STUDENTS
                  </label>
                </div>
                <div className={forms.radioGroup} style={{ marginBottom: 0 }}>
                  {[1, 2, 3, 4, 5, 6].map((num) => (
                    <React.Fragment key={num}>
                      <input
                        id={"grade" + num}
                        className={forms.radioInput}
                        type="checkbox"
                        name={"grade"}
                        value={num}
                        checked={grades.includes(num)}
                        onChange={handleGradesChange}
                      />

                      <label htmlFor={"grade" + num} className={forms.radioLabel}>
                        {num}
                      </label>
                    </React.Fragment>
                  ))}
                </div>
                <div className={forms.radioGroup} style={{ marginTop: 0 }}>
                  {[7, 8, 9, 10, 11, 12].map((num) => (
                    <React.Fragment key={num}>
                      <input
                        id={"grade" + num}
                        className={forms.radioInput}
                        type="checkbox"
                        name={"grade"}
                        value={num}
                        checked={grades.includes(num)}
                        onChange={handleGradesChange}
                      />

                      <label htmlFor={"grade" + num} className={forms.radioLabel}>
                        {num}
                      </label>
                    </React.Fragment>
                  ))}
                </div>
                <button disabled={isLoadingAddOrRemoveStudentsByGrade} className={forms.button}>
                  {isLoadingAddOrRemoveStudentsByGrade ? (
                    <div className={forms.spinner}></div>
                  ) : (
                    `${addOrRemoveStudentsByGrade.toUpperCase()} STUDENTS`
                  )}
                </button>
                {addOrRemoveStudentsByGradeError && (
                  <div className={forms.error}>{addOrRemoveStudentsByGradeError}</div>
                )}
              </form>
              <div className={forms.fileInputHelpContainer}>
                <p className={forms.fileInputHelp} onClick={toggleAddOrRemoveStudentsByGradeHelp}>
                  Help {addOrRemoveStudentsByGradeHelp ? "(hide)" : "(show)"}
                </p>
                <div
                  className={forms.fileInputText}
                  style={{ display: addOrRemoveStudentsByGradeHelp ? "block" : "none" }}
                >
                  <strong>Steps:</strong>
                  <ol>
                    <li>Choose the grade(s) you want to add or remove all students by</li>
                    <li>Choose add or remove</li>
                    <li>Click add or remove students</li>
                  </ol>
                </div>
              </div>
              <h3 className={styles.h3}>
                Students in Symposium (
                {isFetchingSymposiumStudents ? "Loading..." : filteredStudents.length}):
              </h3>
              <div className={forms.textInputGroup}>
                <input
                  type="text"
                  placeholder="Search for a student..."
                  onChange={handleStudentSearchChange}
                  value={studentQuery}
                  className={forms.textInput}
                />
                <div className={`${forms.textInputIcon} ${forms.defaultCursor}`}>
                  <span className="material-icons">search</span>
                </div>
              </div>

              <List
                height={filteredStudents.length === 0 ? 100 : 400} // Adjust based on your layout
                itemCount={filteredStudents.length}
                itemSize={150}
                width={"100%"}
                itemData={filteredStudents} // Pass filteredUsers as itemData
              >
                {StudentRow}
              </List>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullSymposiumView;
