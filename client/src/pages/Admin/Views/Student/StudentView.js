import forms from "../../../../CSS/Components/Forms.module.css";
import sidebar from "../../../../CSS/Components/Sidebar.module.css";
import styles from "../../../../CSS/Admin/Views/Student/StudentView.module.css";
import { useAuthContext } from "../../../../hooks/useAuthContext.js";
import { useLogout } from "../../../../hooks/useLogout.js";
import { useState, useEffect } from "react";
import { generate } from "random-words";
import { Link } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import * as XLSX from "xlsx/xlsx";

const StudentView = () => {
  const { user } = useAuthContext();
  const { logout } = useLogout();
  const [users, setUsers] = useState([]);

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
  const [searchQuery, setSearchQuery] = useState("");

  const [file, setFile] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [fileUploadHelp, setFileUploadHelp] = useState(false);

  const handleFirstNameChange = (event) => {
    setFirstName(event.target.value);
    setEmail(event.target.value.toLowerCase() + "." + lastName.toLowerCase() + "@ris.ae");
  };

  const handleLastNameChange = (event) => {
    setLastName(event.target.value);
    setEmail(firstName.toLowerCase() + "." + event.target.value.toLowerCase() + "@ris.ae");
  };

  const handleGenderChange = (event) => {
    setGender(event.target.value);
    console.log(gender);
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

  const toggleFileUploadHelp = () => {
    setFileUploadHelp(!fileUploadHelp);
  };

  const handleFileReset = () => {
    setFile(null);
    setFileInputKey(Date.now());
  };

  const handleExcelExport = async () => {
    // Filter and map users data to only include specific fields
    const dataToExport = users.map((user) => ({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      password: user.password,
      gender: user.gender,
      grade: user.grade,
      section: user.section,
    }));

    // Create worksheet from filtered data
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Define column headers
    const headers = ["firstName", "lastName", "email", "password", "gender", "grade", "section"];

    // Write workbook to binary string
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

    // Adjust column widths (optional, for better readability)
    worksheet["!cols"] = headers.map(() => ({ wch: 20 }));

    const wbout = XLSX.write(workbook, { bookType: "xlsx", type: "binary" });

    // Convert binary string to Blob
    const blob = new Blob([s2ab(wbout)], { type: "application/octet-stream" });

    // Create a URL for the blob
    const url = URL.createObjectURL(blob);

    // Create a temporary anchor to trigger download
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "students.xlsx";
    document.body.appendChild(anchor); // Append anchor to body
    anchor.click(); // Trigger download
    document.body.removeChild(anchor); // Clean up

    // Helper function to convert binary string to array buffer
    function s2ab(s) {
      const buf = new ArrayBuffer(s.length);
      const view = new Uint8Array(buf);
      for (let i = 0; i < s.length; i++) view[i] = s.charCodeAt(i) & 0xff;
      return buf;
    }
  };

  const handleFileUpload = async (event) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    if (!file) {
      setError("Please select a file before submitting.");
      setIsLoading(false);
      return;
    }

    const reader = new FileReader();
    reader.readAsBinaryString(file);

    reader.onload = async (event) => {
      try {
        const data = event.target.result;
        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        let parsedData = XLSX.utils.sheet_to_json(sheet);

        parsedData.map((user, index) => {
          parsedData[index].rowNum = user.__rowNum__ + 1;
          if (!user.firstName) {
            throw new Error(
              "You did not provide a first name for the student on row " + user.rowNum
            );
          }
          if (!user.lastName) {
            throw new Error(
              "You did not provide a last name for the student on row " + user.rowNum
            );
          }
          if (!user.email) {
            throw new Error("You did not provide an email for the student on row " + user.rowNum);
          }
          if (!user.grade) {
            throw new Error("You did not provide a grade for the student on row " + user.rowNum);
          }
          if (!user.section) {
            throw new Error(
              "You did not provide a class section for the student on row " + user.rowNum
            );
          }
          if (!user.gender) {
            throw new Error("You did not provide a gender for the student on row " + user.rowNum);
          }
          if (!user.password) {
            user.password =
              generate({ minLength: 5, maxLength: 7 }) + Math.floor(Math.random() * 100);
          } else {
            user.password = user.password.toString();
          }
        });

        const response = await fetch("/api/admin/users/createBatch", {
          method: "POST",
          body: JSON.stringify({
            users: parsedData,
            type: "student",
          }),
          headers: {
            Authorization: `Bearer ${user.token}`,
            "Content-Type": "application/json",
          },
        });

        const json = await response.json();

        if (!response.ok) {
          throw new Error(json.error);
        }
        if (response.ok) {
          setUsers([...json, ...users]);
        }

        handleFileReset();
      } catch (error) {
        setError(error.toString());
        setIsLoading(false);
      } finally {
        setIsLoading(false);
        handleFileReset();
      }
    };

    reader.onerror = (error) => {
      setError("Failed to read file: " + error.message);
      setIsLoading(false);
      return;
    };
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const addUser = async () => {
      setError(null);
      setIsLoading(true);

      const response = await fetch("/api/admin/users/create", {
        method: "POST",
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          userType: "student",
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
        setUsers([json, ...users]);
        setFirstName("");
        setLastName("");
        setGrade(0);
        setSection("");
        setGender("");
        setEmail("");
        generatePassword();
      }
      setIsLoading(false);
    };
    addUser();
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  // Filtered list based on search query
  const filteredUsers = users.filter(
    (student) =>
      student.firstName.toLowerCase().includes(searchQuery) ||
      student.lastName.toLowerCase().includes(searchQuery) ||
      student.email.toLowerCase().includes(searchQuery) ||
      student.gender.toLowerCase().includes(searchQuery) ||
      student.grade.toString().toLowerCase().includes(searchQuery)
  );

  const Row = ({ index, style, data }) => {
    const student = data[index]; // Accessing the student from data passed to the List
    // Add some bottom margin to each row for spacing
    return (
      <div style={style} key={student._id}>
        <div className={styles.student}>
          <div className={styles.studentHeader}>
            <Link to={`/admin/students/${student._id}`} className={styles.studentName}>
              {student.firstName} {student.lastName}
            </Link>
            <button
              className={forms.deleteIcon}
              onClick={async () => {
                if (user.userType !== "admin") {
                  return;
                }
                setIsFetching(true);
                const response = await fetch("/api/admin/users/" + student._id, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${user.token}`,
                  },
                });

                const json = await response.json();
                if (response.ok) {
                  setUsers(users.filter((u) => u._id !== json._id));
                  setIsFetching(false);
                }
              }}
              disabled={isFetching}
            >
              {isFetching ? (
                <div className={forms.smallRedSpinner}></div>
              ) : (
                <span className="material-symbols-outlined">delete</span>
              )}
            </button>
          </div>
          <p>
            <strong>Email:</strong> {student.email}
          </p>
          <p>
            <strong>Password:</strong> {student.password}
          </p>
          <p>
            <strong>Gender:</strong> {student.gender}
          </p>
          <p>
            <strong>Grade:</strong> {student.grade}
          </p>
          <p>
            <strong>Class/Section:</strong> {student.section}
          </p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    generatePassword();
    setIsFetching(true);
    const fetchUsers = async () => {
      const response = await fetch("/api/admin/users/students", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();

      if (response.ok) {
        setUsers(json);
        setIsFetching(false);
      }
      if (response.status === 401) {
        logout();
      }
    };
    fetchUsers();
  }, [user]);

  return (
    <div className={styles.container}>
      <div className={`${styles.leftStudentView} ${sidebar.box}`}>
        <h2 className={forms.h2}>
          All Students ({isFetching ? "Loading..." : filteredUsers.length}):
        </h2>
        <button className={forms.smallButton} onClick={handleExcelExport}>
          Export to Excel
        </button>
        <div className={forms.textInputGroup}>
          <input
            type="text"
            placeholder="Search for a student..."
            onChange={handleSearchChange}
            value={searchQuery}
            className={forms.textInput}
          />
          <div className={`${forms.textInputIcon} ${forms.defaultCursor}`}>
            <span className="material-icons">search</span>
          </div>
        </div>

        <List
          height={835}
          itemCount={filteredUsers.length}
          itemSize={175}
          width={"100%"}
          itemData={filteredUsers} // Pass filteredUsers as itemData
        >
          {Row}
        </List>
      </div>
      <div className={`${styles.rightStudentView} ${sidebar.box}`}>
        <form onSubmit={handleSubmit}>
          <h2 className={forms.h2}>Add a New Student</h2>
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
            {isLoading ? <div className={forms.spinner}></div> : "ADD STUDENT"}
          </button>
          {error && <div className={forms.error}>{error}</div>}
        </form>
        <hr className={forms.formBreak} />

        <div className={forms.fileInputGroup}>
          <h2 className={forms.h2}>Add New Students with Excel</h2>
          <form onSubmit={handleFileUpload}>
            <input
              key={fileInputKey}
              type="file"
              accept=".xlsx,.xls"
              className={forms.fileInput} // Assuming you have CSS for this
              onChange={(e) => setFile(e.target.files[0])}
              onClick={(e) => (e.target.value = null)}
            />
            <button disabled={isLoading} className={forms.button}>
              {isLoading ? <div className={forms.spinner}></div> : "ADD STUDENTS"}
            </button>
          </form>
          <div className={forms.fileInputHelpContainer}>
            <p className={forms.fileInputHelp} onClick={toggleFileUploadHelp}>
              Help {fileUploadHelp ? "(hide)" : "(show)"}
            </p>
            <div
              className={forms.fileInputText}
              style={{ display: fileUploadHelp ? "block" : "none" }}
            >
              <strong>Requirements:</strong>
              <ul>
                <li>
                  <a
                    href="https://docs.google.com/spreadsheets/d/1xYRMBC4Ckq0QoNdjh2HFp8f9liqnu9ZjQtWo7XcXy9w/edit?usp=sharing"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Follow this exact format
                  </a>
                  <ul>
                    <li>Password column is optional</li>
                  </ul>
                </li>

                <li>All students are new (do not exist in database already)</li>
              </ul>
              <strong>Steps:</strong>
              <ol>
                <li>Follow the format of the example above</li>
                <li>Add students to the excel file</li>
                <li>Choose and upload your excel file</li>
                <li>Click add students</li>
                <li>If there is an error with one of the students, none will be added</li>
                <li>If all students have no errors, all will be added</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentView;
