import forms from "../../../../CSS/Components/Forms.module.css";
import sidebar from "../../../../CSS/Components/Sidebar.module.css";
import styles from "../../../../CSS/Admin/Views/Symposium/ClassSymposiumView.module.css";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuthContext } from "../../../../hooks/useAuthContext";
import Navbar from "../../../../components/Navbar";
import { FixedSizeList as List } from "react-window";
import { Link } from "react-router-dom";

const ClassSymposiumView = () => {
  const { symposium_id, class_id } = useParams();
  const { user } = useAuthContext();

  const [isFetching, setIsFetching] = useState(true);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);

  const [symposium, setSymposium] = useState({});
  const [cls, setCls] = useState(null);
  const [students, setStudents] = useState([]);

  const StudentRow = ({ index, style, data }) => {
    const student = data[index];
    return (
      <div style={style} key={student._id}>
        <div className={styles.student}>
          <div className={styles.studentHeader}>
            <h2 className={styles.studentName}>
              {student.firstName} {student.lastName}
            </h2>
            <button
              className={`${forms.ghostButton} ${forms.ghostButtonGreen}`}
              onClick={async () => {
                setIsLoadingStudents(true);
                const response = await fetch(
                  `/api/student/classes/${class_id}/${student._id}/join`,
                  {
                    method: "PATCH",
                    headers: {
                      Authorization: `Bearer ${user.token}`,
                    },
                  }
                );

                const json = await response.json();
                if (response.ok) {
                  setCls((prevCls) => ({
                    ...prevCls,
                    students: [
                      ...prevCls.students,
                      {
                        student_id: { _id: student._id },
                        _id: student._id,
                        studentFirstName: student.firstName,
                        studentLastName: student.lastName,
                      },
                    ],
                  }));
                  setStudents(students.filter((s) => s._id !== student?._id));
                }
                if (!response.ok) {
                  alert(json.error);
                }
                setIsLoadingStudents(false);
              }}
              style={{ fontSize: 16 }}
              disabled={isLoadingStudents}
            >
              {isLoadingStudents ? <div className={forms.spinner}></div> : "ADD TO CLASS"}
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
        </div>
      </div>
    );
  };

  useEffect(() => {
    const fetchData = async () => {
      setIsFetching(true);
      try {
        const symposiumResponse = await fetch(`/api/global/symposiums/${symposium_id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const symposiumJson = await symposiumResponse.json();
        if (!symposiumResponse.ok) throw new Error(symposiumJson.error);

        const classResponse = await fetch(`/api/presenter/classes/${class_id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const classJson = await classResponse.json();
        if (!classResponse.ok) throw new Error(classJson.error);

        const studentResponse = await fetch(`/api/admin/symposiums/${symposium_id}/students`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const studentJson = await studentResponse.json();
        if (!studentResponse.ok) throw new Error(studentJson.error);

        setSymposium(symposiumJson);
        setCls(classJson);
        setStudents(
          studentJson.filter(
            (student) =>
              !classJson.students.some((clsStudent) => clsStudent.student_id._id === student._id)
          )
        );
      } catch (error) {
        alert(error.message);
      } finally {
        setIsFetching(false);
      }
    };

    fetchData();
  }, [symposium_id, class_id, user.token]); // Assuming `symposium_id` and `class_id` are stable values.

  return (
    <div className={styles.ClassSymposiumView}>
      <Navbar />
      <div className={styles.container}>
        <div className={`${styles.header} ${sidebar.box}`}>
          <h2 className={`${styles.h2}`}>
            {isFetching
              ? "Loading..."
              : symposium
              ? `${symposium.name}  |  ${symposium.date}`
              : "Data not available"}
          </h2>
        </div>
        <div className={`${styles.classContainer} ${sidebar.box} `}>
          <h2 className={`${styles.h2}`}>Class{isFetching ? " (Loading...)" : ""}:</h2>
          <br />

          {!isFetching ? (
            <div className={styles.class}>
              <div className={styles.classHeader}>
                <h3>
                  <Link to={`/admin/${cls._id}/edit`} className={styles.className}>
                    <span className={styles.classColor}>{cls.name}</span> by{" "}
                    <span className={styles.presenterColor}>
                      {cls.presenter_id.firstName} {cls.presenterLastName}
                    </span>
                  </Link>
                </h3>
              </div>
              <p>
                <strong>Block:</strong> {cls.block} | <strong>Room:</strong> {cls.room}
              </p>
              <p>
                <strong>Short description:</strong>
              </p>
              <p>{cls.shortDescription}</p>
              <p>
                <strong>Gender:</strong> {cls.gender}
              </p>
              <p>
                <strong>Students:</strong> {cls.students.length}/{cls.maxStudents}
              </p>
              <p>
                <strong>Student List:</strong>
              </p>
              <ul>
                {cls.students.map((student) => (
                  <div key={student._id} className={styles.studentNameContainer}>
                    <li>
                      {student.studentFirstName} {student.studentLastName}
                    </li>
                    <div className={forms.attendanceRadioGroup}>
                      <button
                        className={`${styles.absent} ${
                          student.attendance === "absent" ? styles.absentSelected : ""
                        }`}
                      >
                        ABSENT
                      </button>
                      <button
                        className={`${styles.present} ${
                          student.attendance === "present" ? styles.presentSelected : ""
                        }`}
                      >
                        PRESENT
                      </button>
                      <button
                        className={`${forms.ghostButton} ${forms.ghostButtonRed}  ${forms.ghostButtonNormal} ${forms.ghostButtonSmall}`}
                        onClick={async () => {
                          // const isConfirmed = window.confirm(
                          //   `Are you sure you want to remove ${student.studentFirstName} from this class?`
                          // );
                          const isConfirmed = true;
                          if (isConfirmed) {
                            setIsLoadingStudents(true);
                            const response = await fetch(
                              `/api/student/classes/${cls._id}/${student.student_id._id}/leave`,
                              {
                                method: "DELETE",
                                headers: {
                                  Authorization: `Bearer ${user.token}`,
                                },
                              }
                            );

                            const json = await response.json();
                            if (response.ok) {
                              const updatedStudents = cls.students.filter(
                                (s) => s._id !== student._id
                              );
                              setCls((prevCls) => ({
                                ...prevCls,
                                students: updatedStudents,
                              }));
                              // Add removed student back to the list of available students
                              setStudents([
                                ...students,
                                {
                                  _id: student.student_id._id,
                                  firstName: student.student_id.firstName,
                                  lastName: student.student_id.lastName,
                                  grade: student.student_id.grade,
                                  gender: student.student_id.gender,
                                  email: student.student_id.email,
                                },
                              ]);
                            }
                            if (!response.ok) {
                              alert(json.error);
                            }
                            setIsLoadingStudents(false);
                          }
                        }}
                        disabled={isLoadingStudents}
                      >
                        {isLoadingStudents ? (
                          <div className={forms.redSpinner} style={{ marginBottom: 0 }}></div>
                        ) : (
                          "REMOVE"
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                {cls.students.length === 0 && <li>No students</li>}
              </ul>
            </div>
          ) : (
            ""
          )}
        </div>

        <div className={`${styles.studentContainer} ${sidebar.box}`}>
          <h2 className={`${styles.h2}`}>
            Students ({isFetching ? "Loading..." : students?.length}):
          </h2>
          <br />
          <List
            height={students.length === 0 ? 100 : 400} // Adjust based on your layout
            itemCount={students.length}
            itemSize={125}
            width={"100%"}
            itemData={students} // Pass filteredUsers as itemData
          >
            {StudentRow}
          </List>
        </div>
      </div>
    </div>
  );
};

export default ClassSymposiumView;
