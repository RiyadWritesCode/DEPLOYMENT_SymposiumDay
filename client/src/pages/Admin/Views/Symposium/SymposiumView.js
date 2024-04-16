import forms from "../../../../CSS/Components/Forms.module.css";
import sidebar from "../../../../CSS/Components/Sidebar.module.css";
import styles from "../../../../CSS/Admin/Views/Symposium/SymposiumView.module.css";
import { useAuthContext } from "../../../../hooks/useAuthContext.js";
import { useLogout } from "../../../../hooks/useLogout.js";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FixedSizeList as List } from "react-window";

const SymposiumView = () => {
  const { user } = useAuthContext();
  const { logout } = useLogout();
  const [symposiums, setSymposiums] = useState([]);

  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [presentersCreatingClasses, setPresentersCreatingClasses] = useState(false);
  const [presentersDeletingClasses, setPresentersDeletingClasses] = useState(false);
  const [studentsJoiningClasses, setStudentsJoiningClasses] = useState(false);
  const [studentsLeavingClasses, setStudentsLeavingClasses] = useState(false);

  const [searchDate, setSearchDate] = useState("");

  const handleSearchDateChange = (event) => {
    setSearchDate(event.target.value.toLowerCase());
  };

  const filteredSymposiums = symposiums.filter((symposium) => symposium.date.includes(searchDate));

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

  const Row = ({ index, style, data }) => {
    const symposium = data[index];
    return (
      <div style={style} key={symposium._id}>
        <div className={styles.symposium}>
          <div className={styles.symposiumHeader}>
            <Link
              to={`/admin/symposiums/${symposium._id}`}
              className={styles.symposiumName}
              target="_blank"
            >{`${symposium.name}\u00A0\u00A0|\u00A0\u00A0${symposium.date}`}</Link>

            <button
              className={forms.deleteIcon}
              onClick={async () => {
                setIsFetching(true);
                const response = await fetch("/api/admin/symposiums/" + symposium._id, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${user.token}`,
                  },
                });

                const json = await response.json();
                if (response.ok) {
                  setSymposiums(symposiums.filter((s) => s._id !== json._id));
                  setIsFetching(false);
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
          </div>
          <p>
            <strong>Presenters creating classes:</strong>{" "}
            {symposium.permissions.presentersCreatingClasses ? "Enabled" : "Disabled"}
          </p>
          <p>
            <strong>Presenters deleting classes:</strong>{" "}
            {symposium.permissions.presentersDeletingClasses ? "Enabled" : "Disabled"}
          </p>
          <p>
            <strong>Students joining classes:</strong>{" "}
            {symposium.permissions.studentsJoiningClasses ? "Enabled" : "Disabled"}
          </p>
          <p>
            <strong>Students leaving classes:</strong>{" "}
            {symposium.permissions.studentsLeavingClasses ? "Enabled" : "Disabled"}
          </p>
        </div>
      </div>
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const addSymposium = async () => {
      setError(null);
      setIsLoading(true);

      const response = await fetch("/api/admin/symposiums/create", {
        method: "POST",
        body: JSON.stringify({
          name,
          date,
          permissions: {
            presentersCreatingClasses,
            presentersDeletingClasses,
            studentsJoiningClasses,
            studentsLeavingClasses,
          },
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
        setSymposiums([json, ...symposiums]);
        setName("");
        setDate("");
        setPresentersCreatingClasses(false);
        setPresentersDeletingClasses(false);
        setStudentsJoiningClasses(false);
        setStudentsLeavingClasses(false);
      }
      setIsLoading(false);
    };
    addSymposium();
  };

  useEffect(() => {
    setIsFetching(true);
    const fetchSymposiums = async () => {
      const response = await fetch("/api/admin/symposiums/all", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();

      if (response.ok) {
        setSymposiums(json);
        setIsFetching(false);
      }
      if (response.status === 401) {
        logout();
      }
    };
    fetchSymposiums();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className={styles.container}>
      <div className={`${styles.leftSymposiumView} ${sidebar.box}`}>
        <h2 className={forms.h2}>
          All Symposiums ({isFetching ? "Loading..." : filteredSymposiums.length}):
        </h2>
        <label className={forms.inputLabelInline}>Select Date:</label>
        <input
          type="date"
          onChange={handleSearchDateChange}
          value={searchDate}
          className={forms.dateInput}
        />

        <List
          height={835}
          itemCount={filteredSymposiums.length}
          itemSize={150}
          width={"100%"}
          itemData={filteredSymposiums}
        >
          {Row}
        </List>
      </div>
      <div className={`${styles.rightSymposiumView} ${sidebar.box}`}>
        <form onSubmit={handleSubmit}>
          <h2 className={forms.h2}>Create a New Symposium</h2>
          <label className={forms.inputLabel}>Name:</label>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            placeholder="Enter symposium name like 'Grade 5,6,10'"
            className={forms.textInput}
          />

          <label className={forms.inputLabelInline}>Date:</label>
          <input type="date" onChange={handleDateChange} value={date} className={forms.dateInput} />

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

          <button disabled={isLoading} className={forms.button}>
            {isLoading ? <div className={forms.spinner}></div> : "CREATE SYMPOSIUM"}
          </button>
          {error && <div className={forms.error}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default SymposiumView;
