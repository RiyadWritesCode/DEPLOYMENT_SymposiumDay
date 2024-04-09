import forms from "../../../../CSS/Components/Forms.module.css";
import sidebar from "../../../../CSS/Components/Sidebar.module.css";
import styles from "../../../../CSS/Admin/Views/Presenter/FullPresenterView.module.css";
import { useAuthContext } from "../../../../hooks/useAuthContext.js";
import { useLogout } from "../../../../hooks/useLogout.js";
import { useState, useEffect } from "react";
import { generate } from "random-words";
import { useParams } from "react-router-dom";

import Navbar from "../../../../components/Navbar.js";

const FullPresenterView = () => {
  const { id } = useParams();
  const { user } = useAuthContext();
  const { logout } = useLogout();

  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
        alert("Successfully edited the presenter!");
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
      <div className={`${styles.fullPresenterView}`}>
        <div className={`${styles.container} ${sidebar.box}`}>
          <h2 className={forms.h2}>Edit Presenter Info: {isFetching ? "(Loading...)" : ""}</h2>
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
              {isLoading ? <div className={forms.spinner}></div> : "EDIT PRESENTER"}
            </button>
            {error && <div className={forms.error}>{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default FullPresenterView;
