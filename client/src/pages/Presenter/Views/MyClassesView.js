import forms from "../../../CSS/Components/Forms.module.css";
import sidebar from "../../../CSS/Components/Sidebar.module.css";
import styles from "../../../CSS/Presenter/Views/MyClassesView.module.css";
import { useAuthContext } from "../../../hooks/useAuthContext";
import { useLogout } from "../../../hooks/useLogout";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const MyClassesView = ({ filterBlock }) => {
  const { user } = useAuthContext();
  const { logout } = useLogout();

  const [attendance, setAttendance] = useState({});
  const [isLoadingAttendance, setIsLoadingAttendance] = useState(false);
  const [isFetchingAttendance, setIsFetchingAttendance] = useState(true);

  const [symposiums, setSymposiums] = useState([]);
  const [myClasses, setMyClasses] = useState([]);

  const [isFetching, setIsFetching] = useState(true);
  const [symposiumFilter, setSymposiumFilter] = useState("");

  const handleSymposiumFilterChange = (event) => {
    setSymposiumFilter(event.target.value);
  };

  // Filtered list based on search query, selected block, and symposium filter
  const filteredClasses = myClasses.filter((c) => {
    const matchesBlockFilter = !filterBlock || c.block === filterBlock;
    const matchesSymposiumFilter = c.symposium_id === symposiumFilter;
    return matchesBlockFilter && matchesSymposiumFilter;
  });

  const blocksToShow = filterBlock
    ? [parseInt(filterBlock)]
    : Array.from({ length: 6 }, (_, i) => i + 1);

  const classesByBlock = blocksToShow.map((blockNumber) => {
    return {
      blockNumber,
      class: myClasses.find((c) => c.block === blockNumber) || null,
    };
  });

  // Handle attendance selection
  const handleAttendanceChange = (studentId, status) => {
    setAttendance((prevAttendance) => ({
      ...prevAttendance,
      [studentId]: status,
    }));
  };

  // Update attendance
  const updateAttendance = async (classId) => {
    setIsLoadingAttendance(true);
    const attendanceUpdates = Object.keys(attendance).map((studentId) => ({
      student_id: studentId,
      attendance: attendance[studentId],
    }));

    const response = await fetch(`/api/presenter/classes/${classId}/update-attendance`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify({ students: attendanceUpdates }),
    });
    const json = await response.json();

    if (response.ok) {
      alert("Attendance updated successfully!");
      // Optionally reset attendance state or navigate away
    } else {
      alert(json.error);
    }
    setIsLoadingAttendance(false);
  };

  useEffect(() => {
    setIsFetching(true);
    const fetchSymposiums = async () => {
      const response = await fetch("/api/global/symposiums", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();

      if (response.ok) {
        setSymposiums(json);
        if (json.length > 0) {
          (json[0]._id); // Automatically select the first symposium
        }
      }  else if (response.status === 429) {
        alert(json.message);
      } else if (response.status === 401) {
        logout();
      } else {
        alert(json.error || "An unexpected error occurred");
      }
      setIsFetching(false);
    };
    fetchSymposiums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    if (!symposiumFilter) return;
    setIsFetching(true);
    setIsFetchingAttendance(true);

    const fetchClasses = async () => {
      const response = await fetch(
        `/api/presenter/symposiums/${symposiumFilter}/classes/presenter/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      const json = await response.json();

      if (response.ok) {
        setMyClasses(json);
        // Initialize an object to hold attendance state for all students in all fetched classes
        const initialAttendanceState = {};
        json.forEach((cls) => {
          cls.students.forEach((student) => {
            // Assuming `student` object has an `id` and `attendance` field
            // Adjust the properties as necessary to match your actual data structure
            initialAttendanceState[student._id] = student.attendance;
          });
        });

        // Update the attendance state with the newly constructed object
        setAttendance(initialAttendanceState);
      } else if (response.status === 429) {
        alert(json.message);
      } else if (response.status === 401) {
        logout();
      } else {
        alert(json.error || "An unexpected error occurred");
      }
      setIsFetchingAttendance(false);
      setIsFetching(false);
    };
    fetchClasses();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symposiumFilter, user._id, user.token]);

  return (
    <div className={`${styles.container} ${sidebar.box}`}>
      <div className={styles.headerContainer}>
        <h2 className={forms.h2}>
          My Classes ({isFetching ? "Loading..." : filteredClasses.length}):
        </h2>
        {filterBlock && <p>Filtering by Block #{filterBlock}</p>}
        {!filterBlock && <p>Not Filtering</p>}
      </div>
      <select
        value={symposiumFilter || ""}
        onChange={handleSymposiumFilterChange}
        className={forms.selectInput}
        style={{ marginBottom: 0, marginTop: 4 }}
      >
        <option value={""} disabled>
          {isFetching
            ? "Loading..."
            : symposiums.length === 0
            ? "You are not enrolled in any symposiums..."
            : "Select a symposium..."}
        </option>
        {symposiums.map((s) => (
          <option key={s._id} value={s._id}>
            {s.name} {"\u00A0\u00A0"}|{"\u00A0\u00A0"} {s.date}
          </option>
        ))}
      </select>

      {symposiumFilter
        ? classesByBlock.map(({ blockNumber, class: thisClass }) =>
            isFetching ? (
              <div key={blockNumber}>
                <h2 className={forms.h3} style={{ marginBottom: 12, marginTop: 12 }}>
                  Block #{blockNumber}
                </h2>
                <p>Loading...</p>
              </div>
            ) : thisClass ? (
              <div key={blockNumber}>
                <h2 className={forms.h3} style={{ marginBottom: 12, marginTop: 12 }}>
                  Block #{blockNumber}
                </h2>

                <div key={thisClass._id}>
                  <div className={styles.class}>
                    <div className={styles.classHeader}>
                      <h3>
                        <Link to={`/presenter/${thisClass._id}/edit`} className={styles.className}>
                          <span className={styles.classColor}>{thisClass.name}</span> by{" "}
                          <span className={styles.presenterColor}>
                            {thisClass.presenter_id.firstName} {thisClass.presenterLastName}
                          </span>
                        </Link>
                      </h3>
                      {/* <button
                        className={forms.deleteIcon}
                        onClick={async () => {
                          const isConfirmed = window.confirm(
                            "Are you sure you want to delete this class?"
                          );
                          if (isConfirmed) {
                            setIsFetching(true);
                            const response = await fetch(
                              "/api/presenter/classes/" + thisClass._id,
                              {
                                method: "DELETE",
                                headers: {
                                  Authorization: `Bearer ${user.token}`,
                                },
                              }
                            );

                            const json = await response.json();
                            if (response.ok) {
                              setMyClasses(myClasses.filter((c) => c._id !== json._id));
                              setIsFetching(false);
                            }
                            if (!response.ok) {
                              alert(json.error);
                              setIsFetching(false);
                            }
                          }
                        }}
                        disabled={isFetching}
                      >
                        {isFetching ? (
                          <div className={forms.smallRedSpinner}></div>
                        ) : (
                          <span className="material-symbols-outlined">delete</span>
                        )}{" "}
                      </button> */}
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
                      <strong>Gender:</strong> {thisClass.gender}
                    </p>
                    <p>
                      <strong>Students:</strong> {thisClass.students.length}/{thisClass.maxStudents}
                    </p>
                    <p>
                      <strong>Student List:</strong>
                    </p>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        updateAttendance(thisClass._id);
                      }}
                    >
                      <ul>
                        {thisClass.students.map((student) => (
                          <div key={student._id} className={styles.studentNameContainer}>
                            <li>
                              {student.studentFirstName} {student.studentLastName}
                            </li>
                            <div className={forms.attendanceRadioGroup}>
                              <input
                                className={forms.absentRadioInput}
                                type="radio"
                                name={`attendance-${student._id}`}
                                checked={attendance[student._id] === "absent"}
                                id={`${student._id}-absent`}
                                value="absent"
                                onChange={() => handleAttendanceChange(student._id, "absent")}
                              />
                              <label
                                htmlFor={`${student._id}-absent`}
                                className={forms.absentRadioLabel}
                              >
                                ABSENT
                              </label>
                              <input
                                className={forms.presentRadioInput}
                                type="radio"
                                name={`attendance-${student._id}`}
                                checked={attendance[student._id] === "present"}
                                id={`${student._id}-present`}
                                value="present"
                                onChange={() => handleAttendanceChange(student._id, "present")}
                              />
                              <label
                                htmlFor={`${student._id}-present`}
                                className={forms.presentRadioLabel}
                              >
                                PRESENT
                              </label>
                            </div>
                          </div>
                        ))}

                        {thisClass.students.length === 0 && <li>No students</li>}
                      </ul>
                      <button
                        disabled={isFetchingAttendance || isLoadingAttendance}
                        className={forms.button}
                        style={{ marginTop: 12 }}
                      >
                        {isFetchingAttendance || isLoadingAttendance ? (
                          <div className={forms.spinner}></div>
                        ) : (
                          "UPDATE ATTENDANCE"
                        )}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ) : (
              ""
            )
          )
        : ""}
    </div>
  );
};

export default MyClassesView;
