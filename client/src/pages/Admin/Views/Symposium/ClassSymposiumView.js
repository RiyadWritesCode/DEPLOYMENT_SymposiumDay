import forms from "../../../../CSS/Components/Forms.module.css";
import sidebar from "../../../../CSS/Components/Sidebar.module.css";
import styles from "../../../../CSS/Admin/Views/Symposium/ClassSymposiumView.module.css";
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAuthContext } from "../../../../hooks/useAuthContext";
import Navbar from "../../../../components/Navbar";

const ClassSymposiumView = () => {
  const { symposium_id, class_id } = useParams();
  const { user } = useAuthContext();

  const [isFetching, setIsFetching] = useState(true);

  const [symposium, setSymposium] = useState(null);
  const [cls, setCls] = useState(null);

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

        const classResponse = await fetch(
          `/api/admin/symposiums/${symposium_id}/classes/${class_id}`,
          {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }
        );
        const classJson = await classResponse.json();
        if (!classResponse.ok) throw new Error(classJson.error);

        setSymposium(symposiumJson);
        setCls(classJson);
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
            {isFetching ? "Loading..." : `${symposium?.name}  |  ${symposium.date}`}
          </h2>
        </div>
        {cls ? (
          <div className={`${styles.classContainer} ${sidebar.box}`}>
            <h2 className={`${styles.h2}`}>Class:</h2>
            <div className={styles.class}>
              <div className={styles.classHeader}>
                <h3>
                  <span className={styles.classColor}>{cls.name}</span> by{" "}
                  <span className={styles.presenterColor}>
                    {cls.presenter_id.firstName} {cls.presenterLastName}
                  </span>
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
                            setIsFetching(true);
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
                                (st) => st._id !== student._id
                              );
                              setCls((prevCls) => ({
                                ...prevCls,
                                students: updatedStudents,
                              }));
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
          </div>
        ) : (
          ""
        )}
      </div>
    </div>
  );
};

export default ClassSymposiumView;
