import forms from "../../../../CSS/Components/Forms.module.css";
import sidebar from "../../../../CSS/Components/Sidebar.module.css";
import styles from "../../../../CSS/Admin/Views/Student/FullStudentView.module.css";
import { useAuthContext } from "../../../../hooks/useAuthContext.js";
import { useLogout } from "../../../../hooks/useLogout.js";
import { useState, useEffect } from "react";
import { generate } from "random-words";
import { useParams } from "react-router-dom";

import Navbar from "../../../../components/Navbar.js";

const FullStudentView = () => {
  const { id } = useParams();
  const { user } = useAuthContext();
  const { logout } = useLogout();

  const gradeOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState("");
  const [grade, setGrade] = useState(0);
  const [section, setSection] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(true);

  const handleFirstNameChange = (event) => {
    setFirstName(event.target.value);
    // setEmail(event.target.value.toLowerCase() + "." + lastName.toLowerCase() + "@ris.ae");
  };

  const handleLastNameChange = (event) => {
    setLastName(event.target.value);
    // setEmail(firstName.toLowerCase() + "." + event.target.value.toLowerCase() + "@ris.ae");
  };

  const handleGenderChange = (event) => {
    setGender(event.target.value);
  };

  const handleGradeChange = (event) => {
    setGrade(event.target.value);
  };

  const handleSectionChange = (event) => {
    setSection(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const generatePassword = () => {
    setPassword(generate({ minLength: 5, maxLength: 7 }) + Math.floor(Math.random() * 100));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const editUser = async () => {
      setError(null);
      setIsLoading(true);

      const response = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          gender,
          grade,
          section,
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
        setError(null);
        alert("Successfully edited the student!");
      }
      setIsLoading(false);
    };
    editUser();
  };

  useEffect(() => {
    setIsFetching(true);
    const fetchUsers = async () => {
      const response = await fetch(`/api/admin/users/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();

      if (response.ok) {
        setFirstName(json.firstName);
        setLastName(json.lastName);
        setGrade(json.grade);
        setSection(json.section);
        setGender(json.gender);
        setEmail(json.email);
        setPassword(json.password);
        setIsFetching(false);
      }
      if (!response.ok) {
        setError(json.error);
      }
      if (response.status === 401) {
        logout();
      }
    };
    fetchUsers();
  }, [id]);

  return (
    <div>
      <Navbar />
      <div className={`${styles.fullStudentView}`}>
        <div className={`${styles.container} ${sidebar.box}`}>
          <h2 className={forms.h2}>Edit Student Info: {isFetching ? "(Loading...)" : ""}</h2>
          <form onSubmit={handleSubmit}>
            <label className={forms.inputLabel}>First Name:</label>
            <input
              type="text"
              onChange={handleFirstNameChange}
              value={firstName}
              placeholder="Enter student's first name"
              className={forms.textInput}
            />
            <label className={forms.inputLabel}>Last Name:</label>
            <input
              type="text"
              onChange={handleLastNameChange}
              value={lastName}
              placeholder="Enter student's last name"
              className={forms.textInput}
            />
            <label className={forms.inputLabel}>Gender:</label>
            <div className={forms.radioGroup}>
              <input
                id="maleRadio"
                className={forms.radioInput}
                type="radio"
                name="gender"
                value="male"
                checked={gender === "male"}
                onChange={handleGenderChange}
              />
              <label className={forms.radioLabel} htmlFor="maleRadio">
                Male
              </label>
              <input
                id="femaleRadio"
                className={forms.radioInput}
                type="radio"
                name="gender"
                value="female"
                checked={gender === "female"}
                onChange={handleGenderChange}
              />
              <label className={forms.radioLabel} htmlFor="femaleRadio">
                Female
              </label>
            </div>
            <label className={forms.inputLabel}>Grade:</label>
            <select className={forms.selectInput} onChange={handleGradeChange} value={grade}>
              <option value={0} disabled>
                Select student's grade
              </option>
              {gradeOptions.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
            <label className={forms.inputLabel}>Class/Section:</label>
            <input
              type="text"
              className={forms.textInput}
              onChange={handleSectionChange}
              value={section}
              placeholder="Enter students class section like A, B, C, or -6"
            />
            <label className={forms.inputLabel}>Email:</label>
            <input
              type="email"
              onChange={handleEmailChange}
              value={email}
              placeholder="Enter student's email"
              className={forms.textInput}
            />
            <label className={forms.inputLabel}>Password:</label>
            <div className={forms.textInputGroup}>
              <input
                type={showPassword ? "text" : "password"}
                onChange={handlePasswordChange}
                value={password}
                placeholder="Enter student's password"
                className={`${forms.textInput} ${forms.textInputWithIcon} `}
              />
              <div className={forms.textInputIcon} onClick={togglePasswordVisibility}>
                <span className="material-icons">
                  {showPassword ? "visibility" : "visibility_off"}
                </span>
              </div>
            </div>
            <button onClick={generatePassword} type="button" className={forms.smallButton}>
              Generate Password
            </button>

            <button disabled={isLoading} className={forms.button}>
              {isLoading ? <div className={forms.spinner}></div> : "EDIT STUDENT"}
            </button>
            {error && <div className={forms.error}>{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default FullStudentView;
