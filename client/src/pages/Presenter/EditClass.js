import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../hooks/useAuthContext"; // Adjust path as needed
import Navbar from "../../components/Navbar"; // Adjust path as needed
import forms from "../../CSS/Components/Forms.module.css";
import sidebar from "../../CSS/Components/Sidebar.module.css";
import styles from "../../CSS/Presenter/EditClass.module.css";

const EditClass = () => {
  const { id } = useParams();
  const { user } = useAuthContext();

  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [name, setName] = useState("");
  const [room, setRoom] = useState("");
  const [block, setBlock] = useState(0); // No block selected initially
  const [maxStudents, setMaxStudents] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [gender, setGender] = useState("all");

  const maxStudentsOptions = Array.from({ length: 200 }, (_, i) => i + 1);

  const maxClassNameChars = 100;
  const maxClassroomChars = 20;
  const maxShortDescriptionChars = 1500;
  const [classNameChars, setClassNameChars] = useState(0);
  const [classroomChars, setClassroomChars] = useState(0);
  const [shortDescriptionChars, setShortDescriptionChars] = useState(0);

  const handleNameChange = (event) => {
    setName(event.target.value);
    setClassNameChars(event.target.value.length);
  };

  const handleRoomChange = (event) => {
    setRoom(event.target.value);
    setClassroomChars(event.target.value.length);
  };

  const handleShortDescriptionChange = (event) => {
    setShortDescription(event.target.value);
    setShortDescriptionChars(event.target.value.length);
  };

  const handleGenderChange = (event) => {
    setGender(event.target.value);
  };

  useEffect(() => {
    const fetchClassDetails = async () => {
      setError(null);
      setIsFetching(true);
      try {
        const response = await fetch(`/api/presenter/classes/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const json = await response.json();
        if (!response.ok) throw new Error(json.error);

        setName(json.name);
        setRoom(json.room);
        setBlock(json.block);
        setMaxStudents(json.maxStudents);
        setShortDescription(json.shortDescription);
        setGender(json.gender);
        setShortDescriptionChars(json.shortDescription.length);
        setClassNameChars(json.name.length);
        setClassroomChars(json.room.length);
      } catch (error) {
        setError(error.message);
      }
      setIsFetching(false);
    };

    fetchClassDetails();
  }, [id, user.token]);

  const handleSubmit = async (event) => {
    setError("");
    event.preventDefault();
    const editClass = async () => {
      setIsLoading(true);

      const response = await fetch(`/api/presenter/classes/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          name,
          block,
          maxStudents,
          shortDescription,
          room,
          gender,
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
        alert("Successfully edited the class!");
      }
      setIsLoading(false);
    };
    editClass();
  };

  return (
    <div>
      <Navbar />
      <div className={styles.editClassView}>
        <div className={`${styles.container} ${sidebar.box}`}>
          <h2 className={forms.h2}>Edit Class Details: {isFetching ? "(Loading...)" : ""}</h2>
          <form onSubmit={handleSubmit}>
            <label className={forms.inputLabel}>Name:</label>
            <div className={forms.textInputGroup}>
              <input
                type="text"
                value={name}
                onChange={handleNameChange}
                className={forms.textInput}
                required
                placeholder="Enter class name..."
              />
              <p className={forms.textInputChars}>
                {classNameChars}/{maxClassNameChars}
              </p>
            </div>
            <label className={forms.inputLabel}>Room:</label>
            <div className={forms.textInputGroup}>
              <input
                type="text"
                value={room}
                onChange={handleRoomChange}
                className={forms.textInput}
                required
                placeholder="Enter class room..."
              />
              <p className={forms.textInputChars}>
                {classroomChars}/{maxClassroomChars}
              </p>
            </div>

            <label className={forms.inputLabel}>Block:</label>
            <div className={forms.radioGroup}>
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <React.Fragment key={num}>
                  <input
                    id={"block" + num}
                    className={forms.radioInput}
                    type="radio"
                    value={num}
                    checked={block === num}
                    onChange={(e) => setBlock(Number(e.target.value))}
                  />
                  <label htmlFor={"block" + num} className={forms.radioLabel}>
                    {num}
                  </label>
                </React.Fragment>
              ))}
            </div>

            <label className={forms.inputLabel}>Max Students:</label>
            <select
              value={maxStudents}
              onChange={(e) => setMaxStudents(Number(e.target.value))}
              className={forms.selectInput}
              required
            >
              <option value="">Select maximum students</option>
              {maxStudentsOptions.map((num) => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>

            <label className={forms.inputLabel}>Short Description:</label>
            <div className={forms.textInputGroup}>
              <textarea
                value={shortDescription}
                onChange={handleShortDescriptionChange}
                className={forms.textareaInput}
                rows={10}
                required
                placeholder="Enter a short description..."
              />
              <p className={forms.textareaInputChars}>
                {shortDescriptionChars}/{maxShortDescriptionChars}
              </p>
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

            <button type="submit" className={forms.button} disabled={isLoading}>
              {isLoading ? <div className={forms.spinner}></div> : "EDIT CLASS"}
            </button>

            {error && <div className={forms.error}>{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditClass;
