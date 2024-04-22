import forms from "../../../CSS/Components/Forms.module.css";
import sidebar from "../../../CSS/Components/Sidebar.module.css";
import styles from "../../../CSS/Presenter/Views/AllClassesView.module.css";
import React, { useState, useEffect } from "react";
import { useAuthContext } from "../../../hooks/useAuthContext";
import { useLogout } from "../../../hooks/useLogout";

const AllClassesView = ({ filterBlock }) => {
  const { user } = useAuthContext();
  const { logout } = useLogout();
  const [symposiums, setSymposiums] = useState([]);
  const [allClasses, setAllClasses] = useState([]);

  const maxStudentsOptions = Array.from({ length: 200 }, (_, i) => i + 1);

  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  const [symposiumIdForFetch, setSymposiumIdForFetch] = useState(null);
  const [symposiumFilter, setSymposiumFilter] = useState("");
  const [symposium, setSymposium] = useState("");
  const [className, setClassName] = useState("");
  const [classroom, setClassroom] = useState("");
  const [blocks, setBlocks] = useState([]);
  const [gender, setGender] = useState("all");
  const [maxStudents, setMaxStudents] = useState(0);
  const [shortDescription, setShortDescription] = useState("");

  const maxClassNameChars = 25;
  const maxClassroomChars = 10;
  const maxShortDescriptionChars = 150;
  const [classNameChars, setClassNameChars] = useState(0);
  const [classroomChars, setClassroomChars] = useState(0);
  const [shortDescriptionChars, setShortDescriptionChars] = useState(0);

  const handleSymposiumFilterChange = (event) => {
    setSymposiumFilter(event.target.value);
  };

  const handleSymposiumChange = (event) => {
    setSymposiumIdForFetch(event.target.value);
  };
  const handleClassNameChange = (event) => {
    setClassName(event.target.value);
    setClassNameChars(event.target.value.length);
  };

  const handleClassroomChange = (event) => {
    setClassroom(event.target.value);
    setClassroomChars(event.target.value.length);
  };

  const handleBlocksChange = (event) => {
    const blockNum = Number(event.target.value);
    if (blocks.includes(blockNum)) {
      setBlocks(blocks.filter((num) => num !== blockNum));
    } else {
      setBlocks([...blocks, blockNum]);
    }
  };

  const handleGenderChange = (event) => {
    setGender(event.target.value);
  };

  const handleMaxStudentsChange = (event) => {
    setMaxStudents(Number(event.target.value));
  };

  const handleShortDescriptionChange = (event) => {
    setShortDescription(event.target.value);
    setShortDescriptionChars(event.target.value.length);
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

  const handleSubmit = (event) => {
    event.preventDefault();

    const addClass = async () => {
      setError(null);
      setIsLoading(true);
      const response = await fetch("/api/presenter/classes/create", {
        method: "POST",
        body: JSON.stringify({
          name: className,
          blocks,
          maxStudents,
          shortDescription,
          room: classroom,
          gender,
          symposium_id: symposium._id,
        }),
        headers: {
          Authorization: `Bearer ${user.token}`,
          "Content-Type": "application/json",
        },
      });

      const json = await response.json();

      if (!response.ok) {
        setError(json.error);
      }
      if (response.ok) {
        setAllClasses([...json, ...allClasses]);
        setClassName("");
        setClassroom("");
        setMaxStudents(0);
        setBlocks([]);
        setShortDescription("");
        setSymposium("");
        setSymposiumIdForFetch("");
        setGender("all");
      }
      setIsLoading(false);
    };
    addClass();
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
    if (!symposiumIdForFetch) return;
    setIsFetching(true);
    const fetchSymposium = async () => {
      const response = await fetch(`/api/global/symposiums/${symposiumIdForFetch}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();
      if (response.ok) {
        setSymposium(json);
      } else if (response.status === 429) {
        alert(json.message);
      } else if (response.status === 401) {
        logout();
      } else {
        alert(json.error || "An unexpected error occurred");
      }

      setIsFetching(false);
    };
    fetchSymposium();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symposiumIdForFetch, user.token]);

  useEffect(() => {
    if (!symposiumFilter) return;
    setIsFetching(true);
    const fetchClasses = async () => {
      const response = await fetch(`/api/global/symposiums/${symposiumFilter}/classes`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();

      if (response.ok) {
        setAllClasses(json);
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
  }, [symposiumFilter, user.token]);

  return (
    <div className={styles.container}>
      <div className={`${styles.leftAllClassesView} ${sidebar.box}`}>
        <div className={styles.headerContainer}>
          <h2 className={forms.h2}>
            All Classes ({isFetching ? "Loading..." : filteredClasses.length}):
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
                  {thisClass.presenter_id._id === user._id && (
                    <button
                      className={forms.deleteIcon}
                      onClick={async () => {
                        const isConfirmed = window.confirm(
                          "Are you sure you want to delete this class?"
                        );
                        if (isConfirmed) {
                          setIsFetching(true);
                          const response = await fetch("/api/presenter/classes/" + thisClass._id, {
                            method: "DELETE",
                            headers: {
                              Authorization: `Bearer ${user.token}`,
                            },
                          });

                          const json = await response.json();
                          if (response.ok) {
                            setAllClasses(allClasses.filter((c) => c._id !== json._id));
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
                    </button>
                  )}
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
          })}
        </div>
      </div>
      <div className={`${styles.rightAllClassesView} ${sidebar.box}`}>
        <h2 className={forms.h2}>Create a New Class</h2>

        <form onSubmit={handleSubmit}>
          <label className={forms.inputLabel}>Symposium:</label>
          <select
            value={symposium._id || ""}
            onChange={handleSymposiumChange}
            className={forms.selectInput}
          >
            <option value="" disabled>
              {symposiums.length === 0
                ? "You are not enrolled in any symposiums..."
                : "Select symposium..."}{" "}
            </option>
            {symposiums.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} {"\u00A0\u00A0"}|{"\u00A0\u00A0"} {s.date}
              </option>
            ))}
          </select>
          {symposium?.permissions?.presentersCreatingClasses === false && (
            <div className={forms.error} style={{ marginTop: 0, marginBottom: 12 }}>
              The admin has currently locked presenters from creating classes for this symposium.
            </div>
          )}
          <label className={forms.inputLabel}>Class name:</label>
          <div className={forms.textInputGroup}>
            <input
              className={`${forms.textInput} ${forms.textInputWithIcon} ${
                classNameChars > maxClassNameChars ? forms.textInputError : ""
              }`}
              type="text"
              value={className}
              onChange={handleClassNameChange}
              placeholder=""
            />
            <p className={forms.textInputChars}>
              {classNameChars}/{maxClassNameChars}
            </p>
          </div>
          <label className={forms.inputLabel}>Classroom:</label>
          <div className={forms.textInputGroup}>
            <input
              className={`${forms.textInput} ${forms.textInputWithIcon} ${
                classroomChars > maxClassroomChars ? forms.textInputError : ""
              }`}
              type="text"
              value={classroom}
              onChange={handleClassroomChange}
            />
            <p className={forms.textInputChars}>
              {classroomChars}/{maxClassroomChars}
            </p>
          </div>
          <label className={forms.inputLabel}>Blocks:</label>
          <div className={forms.radioGroup}>
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <React.Fragment key={num}>
                <input
                  id={"block" + num}
                  className={forms.radioInput}
                  type="checkbox"
                  name={"block" + num}
                  value={num}
                  checked={blocks.includes(num)}
                  onChange={handleBlocksChange}
                />

                <label htmlFor={"block" + num} className={forms.radioLabel} key={num}>
                  {num}
                </label>
              </React.Fragment>
            ))}
          </div>
          <label className={forms.inputLabel}>Gender:</label>
          <div className={forms.radioGroup}>
            <input
              className={forms.radioInput}
              type="radio"
              name="gender"
              checked={gender === "all"}
              id="all"
              value="all"
              onChange={handleGenderChange}
            />
            <label htmlFor="all" className={forms.radioLabel}>
              All
            </label>
            <input
              className={forms.radioInput}
              type="radio"
              name="gender"
              checked={gender === "male"}
              id="male"
              value="male"
              onChange={handleGenderChange}
            />
            <label htmlFor="male" className={forms.radioLabel}>
              Male
            </label>
            <input
              className={forms.radioInput}
              type="radio"
              name="gender"
              checked={gender === "female"}
              id="female"
              value="female"
              onChange={handleGenderChange}
            />
            <label htmlFor="female" className={forms.radioLabel}>
              Female
            </label>
          </div>
          <label className={forms.inputLabel}>Maximum Students:</label>
          <select
            value={maxStudents}
            onChange={handleMaxStudentsChange}
            className={forms.selectInput}
          >
            <option value="0" disabled>
              Select maximum students
            </option>
            {maxStudentsOptions.map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
          <label className={forms.inputLabel}>Short Description:</label>
          <div className={forms.textInputGroup}>
            <textarea
              className={`${forms.textareaInput} ${forms.textInputWithIcon} ${
                shortDescriptionChars > maxShortDescriptionChars ? forms.textInputError : ""
              }`}
              type="text"
              value={shortDescription}
              onChange={handleShortDescriptionChange}
              rows="3"
            />
            <p className={forms.textareaInputChars}>
              {shortDescriptionChars}/{maxShortDescriptionChars}
            </p>
          </div>
          <button disabled={isLoading} className={forms.button}>
            {isLoading ? <div className={forms.spinner}></div> : "CREATE CLASS"}
          </button>

          {error && <div className={forms.error}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default AllClassesView;
