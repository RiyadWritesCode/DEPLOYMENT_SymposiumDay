import { React } from "react";
import { useState, useEffect } from "react";
import { useLogin } from "../hooks/useLogin";
import Navbar from "../components/Navbar";
import forms from "../CSS/Components/Forms.module.css";
import styles from "../CSS/Login.module.css";

const Login = () => {
  const [userType, setUserType] = useState("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, isLoading } = useLogin();

  const handleUserTypeChange = (event) => {
    setUserType(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    await login(email, password, userType);
  };

  useEffect(() => {
    setUserType("student");
  }, []);

  return (
    <div className={styles.login}>
      <Navbar />
      <div className={styles.container}>
        <form className={styles.loginForm} onSubmit={handleSubmit}>
          <div className={styles.userIconContainer}>
            <img src="/images/user.png" alt="User" className={styles.userIcon} />
          </div>
          <h1>{userType.charAt(0).toUpperCase() + userType.slice(1)} Login</h1>

          <div className={forms.radioGroup}>
            <input
              id="studentRadio"
              type="radio"
              name="userType"
              value="student"
              checked={userType === "student"}
              onChange={handleUserTypeChange}
              className={forms.radioInput}
            />
            <label htmlFor="studentRadio" className={forms.radioLabel}>
              Student
            </label>
            <input
              id="presenterRadio"
              type="radio"
              name="userType"
              value="presenter"
              checked={userType === "presenter"}
              onChange={handleUserTypeChange}
              className={forms.radioInput}
            />
            <label htmlFor="presenterRadio" className={forms.radioLabel}>
              Presenter
            </label>
            <input
              id="adminRadio"
              type="radio"
              name="userType"
              value="admin"
              checked={userType === "admin"}
              onChange={handleUserTypeChange}
              className={forms.radioInput}
            />
            <label htmlFor="adminRadio" className={forms.radioLabel}>
              Admin
            </label>
          </div>

          <div className={forms.textInputGroup}>
            <input
              type="email"
              onChange={handleEmailChange}
              value={email}
              placeholder="Enter your email"
              className={`${forms.textInput} ${forms.textInputWithIcon}`}
            />
            <div className={`${forms.textInputIcon} ${forms.defaultCursor}`}>
              <span className="material-icons">email</span>
            </div>
          </div>
          <div className={forms.textInputGroup}>
            <input
              type={showPassword ? "text" : "password"}
              onChange={handlePasswordChange}
              value={password}
              placeholder="Enter your password"
              className={`${forms.textInput} ${forms.textInputWithIcon}`}
            />
            <div className={forms.textInputIcon} onClick={togglePasswordVisibility}>
              <span className="material-icons">
                {showPassword ? "visibility" : "visibility_off"}
              </span>
            </div>
          </div>
          <button disabled={isLoading} className={forms.button}>
            {isLoading ? <div className={forms.spinner}></div> : "LOGIN"}
          </button>
          {error && <div className={forms.error}>{error}</div>}
        </form>
      </div>
    </div>
  );
};

export default Login;
