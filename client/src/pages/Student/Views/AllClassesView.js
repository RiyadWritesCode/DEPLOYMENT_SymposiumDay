import forms from "../../../CSS/Components/Forms.module.css";
import sidebar from "../../../CSS/Components/Sidebar.module.css";
import styles from "../../../CSS/Student/Views/AllClassesView.module.css";
import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../../hooks/useAuthContext";
import { useLogout } from "../../../hooks/useLogout";

const AllClassesView = ({ filterBlock }) => {
  const { user } = useAuthContext();
  const { logout } = useLogout();
  // const [enrolledBlocks, setEnrolledBlocks] = useState([]);

  const [symposiums, setSymposiums] = useState([]);
  const [allClasses, setAllClasses] = useState([]);

  const [isFetching, setIsFetching] = useState(true);
  // const [isLoading, setIsLoading] = useState(false);
  // const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [symposium, setSymposium] = useState("");
  const [symposiumFilter, setSymposiumFilter] = useState("");

  const handleSymposiumFilterChange = (event) => {
    setSymposiumFilter(event.target.value);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  // Filtered list based on search query, selected block, and symposium filter
  const filteredClasses = allClasses.filter((c) => {
    const matchesSearchQuery =
      searchQuery.length === 0 || c.name.toLowerCase().includes(searchQuery);
    const matchesBlockFilter = !filterBlock || c.block === filterBlock;
    const matchesSymposiumFilter = c.symposium_id === symposiumFilter;
    return matchesSearchQuery && matchesBlockFilter && matchesSymposiumFilter;
  });

  const fetchClasses = async () => {
    if (!symposiumFilter) return;
    setIsFetching(true);
    const response = await fetch(`/api/global/symposiums/${symposiumFilter}/classes`, {
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });
    const json = await response.json();

    if (response.ok) {
      setAllClasses(json);
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
      } else if (response.status === 429) {
        alert(json.message); // Set rate limit error message
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
    fetchClasses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symposiumFilter, symposiums, user.token]);

  return (
    <div className={`${styles.container} ${sidebar.box}`}>
      <div className={styles.headerContainer}>
        <h2 className={forms.h2}>
          All Classes ({isFetching ? "Loading..." : filteredClasses.length}):
        </h2>

        {filterBlock && <p>Filtering by Block #{filterBlock}</p>}
        {!filterBlock && <p>Not Filtering</p>}
      </div>
      <button onClick={fetchClasses} disabled={isFetching} className={forms.smallButton}>
        {isFetching ? <div className={forms.spinner}></div> : "Refresh Classes"}
      </button>
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

      <div className={forms.textInputGroup}>
        <input
          type="text"
          placeholder="Search for a class..."
          onChange={handleSearchChange}
          value={searchQuery}
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
                <h3>
                  <span className={styles.classColor}>{thisClass.name}</span> by{" "}
                  <span className={styles.presenterColor}>
                    {thisClass.presenterFirstName} {thisClass.presenterLastName}
                  </span>
                </h3>
                {thisClass.students.some((student) => student.student_id === user._id) ? (
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
                          setAllClasses((prevClasses) =>
                            prevClasses.map((cls) => (cls._id === json._id ? json : cls))
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
                ) : thisClass.students.length < thisClass.maxStudents ? (
                  <button
                    className={`${forms.ghostButton} ${forms.ghostButtonGreen}`}
                    onClick={async () => {
                      setIsFetching(true);
                      const response = await fetch(
                        `/api/student/classes/${thisClass._id}/${user._id}/join`,
                        {
                          method: "PATCH",
                          headers: {
                            Authorization: `Bearer ${user.token}`,
                          },
                        }
                      );

                      const json = await response.json();
                      if (response.ok) {
                        setAllClasses((prevClasses) =>
                          prevClasses.map((cls) => (cls._id === json._id ? json : cls))
                        );
                        setIsFetching(false);
                      }
                      if (!response.ok) {
                        alert(json.error);
                        setIsFetching(false);
                      }
                    }}
                    disabled={isFetching}
                  >
                    {isFetching ? <div className={forms.spinner}></div> : "JOIN"}
                  </button>
                ) : (
                  <div className={`${forms.ghostButtonOrange} ${forms.ghostButton}`}>FULL</div>
                )}
              </div>
              <p>
                <strong>Block:</strong> {thisClass.block} | <strong>Room:</strong> {thisClass.room}
              </p>
              <p>
                <strong>Short description:</strong>
              </p>
              <p>{thisClass.shortDescription}</p>
              <p>
                <strong>Students:</strong> {thisClass.students.length}/{thisClass.maxStudents}
              </p>
              {symposium?.settings?.studentsSeeingClassGender ? (
                <p>
                  <strong>Gender:</strong> {thisClass.gender}
                </p>
              ) : (
                ""
              )}
            </div>
          );
        })}{" "}
      </div>
    </div>
  );
};

export default AllClassesView;
