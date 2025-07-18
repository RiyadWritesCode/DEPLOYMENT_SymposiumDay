import forms from "../../../CSS/Components/Forms.module.css";
import sidebar from "../../../CSS/Components/Sidebar.module.css";
import styles from "../../../CSS/Student/Views/MyClassesView.module.css";
import { useAuthContext } from "../../../hooks/useAuthContext";
import { useLogout } from "../../../hooks/useLogout";
import { useState, useEffect } from "react";

const MyClassesView = ({ filterBlock }) => {
  const { user } = useAuthContext();
  const { logout } = useLogout();

  const [symposiums, setSymposiums] = useState([]);
  const [myClasses, setMyClasses] = useState([]);

  const [isFetching, setIsFetching] = useState(true);
  const [symposium, setSymposium] = useState("");
  const [symposiumFilter, setSymposiumFilter] = useState("");

  const handleSymposiumFilterChange = (event) => {
    setSymposiumFilter(event.target.value);
  };

  const classesByBlock = Array.from({ length: 4 }, (_, i) => i + 1).map((blockNumber) => {
    return {
      blockNumber,
      class: myClasses.find((c) => c.block === blockNumber) || null,
    };
  });

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
          setSymposiumFilter(json[0]._id); // Automatically select the first symposium
        }
      } else if (response.status === 429) {
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
    const fetchClasses = async () => {
      const response = await fetch(
        `/api/student/symposiums/${symposiumFilter}/classes/student/${user._id}`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      const json = await response.json();

      if (response.ok) {
        setMyClasses(json);
        setSymposium(symposiums.find((s) => s._id === symposiumFilter));
      } else if (response.status === 429) {
        alert(json.message);
      } else if (response.status === 401) {
        logout();
      } else {
        alert(json.error || "An unexpected error occurred");
      }

      setIsFetching(false);
    };
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symposiumFilter, user._id, user.token]);

  return (
    <div className={`${styles.container} ${sidebar.box}`}>
      <div className={styles.headerContainer}>
        <h2 className={forms.h2}>
          All Classes ({isFetching ? "Loading..." : myClasses.length}):{" "}
          {/* Changed from filteredClasses to myClasses */}
        </h2>
        <p>Cannot filter in MyClasses page.</p>
        {/* {filterBlock && <p>Filtering by Block #{filterBlock}</p>} */}
        {/* {!filterBlock && <p>Not Filtering</p>} */}
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


      <div>
              <h2 className={forms.h3} style={{ marginBottom: 12, marginTop: 12 }}>
                Keynote from 9:10 to 9:35:
              </h2>
              
                  <div className={styles.class}>
                    <div className={styles.classHeader}>
                      <h3>
                        <span className={styles.classColor}>Keynote</span> by{" "}
                        <span className={styles.presenterColor}>
                          Charlene Nawar
                        </span>
                      </h3>
                      
                    </div>
                    <p>
                      <strong>Session:</strong> 0 | <strong>Room:</strong>{" "}
                      Auditorium
                    </p>
                    
                </div>
              
            </div>


      {symposiumFilter
        ? classesByBlock.map(({ blockNumber, class: thisClass }) => (
            <div key={blockNumber}>
              <h2 className={forms.h3} style={{ marginBottom: 12, marginTop: 12 }}>
                Session #{blockNumber}
              </h2>
              {isFetching ? (
                <p>Loading...</p>
              ) : thisClass ? (
                <div key={thisClass._id}>
                  <div className={styles.class}>
                    <div className={styles.classHeader}>
                      <h3>
                        <span className={styles.classColor}>{thisClass.name}</span> by{" "}
                        <span className={styles.presenterColor}>
                          {thisClass.presenter_id.firstName} {thisClass.presenterLastName}
                        </span>
                      </h3>
                      <button
                        className={`${forms.ghostButton} ${forms.ghostButtonRed}`}
                        onClick={async () => {
                          const isConfirmed = window.confirm(
                            "Are you sure you want to leave this class?"
                          );
                          if (isConfirmed) {
                            setIsFetching(true);
                            const response = await fetch(
                              `/api/student/classes/${thisClass._id}/${user._id}/leave`,
                              {
                                method: "DELETE",
                                headers: {
                                  Authorization: `Bearer ${user.token}`,
                                },
                              }
                            );

                            const json = await response.json();
                            if (response.ok) {
                              setMyClasses((prevClasses) =>
                                prevClasses.filter((cls) => cls._id !== json._id)
                              );
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
                        {isFetching ? <div className={forms.redSpinner}></div> : "LEAVE"}
                      </button>
                    </div>
                    <p>
                      <strong>Session:</strong> {thisClass.block} | <strong>Room:</strong>{" "}
                      {thisClass.room}
                    </p>
                    <p>
                      <strong>Short description:</strong>
                    </p>
                    <p>{thisClass.shortDescription}</p>
                    <p>
                      <strong>Students:</strong> {thisClass.students.length}/{thisClass.maxStudents}
                    </p>
                    {symposium.settings.studentsSeeingClassmates ? (
                      <div>
                        <p>
                          <strong>Student List:</strong>
                        </p>
                        <ul>
                          {thisClass.students.map((student) => (
                            <li>
                              {student.studentFirstName} {student.studentLastName}
                            </li>
                          ))}
                          {thisClass.students.length === 0 && <li>No students</li>}
                        </ul>
                      </div>
                    ) : (
                      ""
                    )}

                    {symposium?.settings?.studentsSeeingClassGender ? (
                      <p>
                        <strong>Gender:</strong> {thisClass.gender}
                      </p>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
              ) : (
                <p className={styles.notEnrolled}>Not enrolled.</p>
              )}
            </div>
          ))
        : ""}
    </div>
  );
};

export default MyClassesView;
