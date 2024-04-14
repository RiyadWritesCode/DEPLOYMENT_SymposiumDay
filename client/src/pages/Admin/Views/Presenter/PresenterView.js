import forms from "../../../../CSS/Components/Forms.module.css";
import sidebar from "../../../../CSS/Components/Sidebar.module.css";
import styles from "../../../../CSS/Admin/Views/Presenter/PresenterView.module.css";
import { useAuthContext } from "../../../../hooks/useAuthContext.js";
import { useState, useEffect } from "react";
import { generate } from "random-words";
import { Link } from "react-router-dom";
import { FixedSizeList as List } from "react-window";
import * as XLSX from "xlsx/xlsx";

const PresenterView = () => {
  const { user } = useAuthContext();
  const [users, setUsers] = useState([]);

  const [isFetching, setIsFetching] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
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
    }));

    // Create worksheet from filtered data
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);

    // Define column headers
    const headers = ["firstName", "lastName", "email", "password"];

    // Write workbook to binary string
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Presenters");

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
    anchor.download = "presenters.xlsx";
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

        parsedData.forEach((user, index) => {
          parsedData[index].rowNum = user.__rowNum__ + 1;
          if (!user.firstName) {
            throw new Error(
              "You did not provide a first name for the presenter on row " + user.rowNum
            );
          }
          if (!user.lastName) {
            throw new Error(
              "You did not provide a last name for the presenter on row " + user.rowNum
            );
          }
          if (!user.email) {
            throw new Error("You did not provide an email for the presenter on row " + user.rowNum);
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
            type: "presenter",
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
        setIsLoading(false);
        setError(error.toString());
      } finally {
        setIsLoading(false);
      }

      reader.onerror = (error) => {
        setError("Failed to read file: " + error.message);
        setIsLoading(false);
        return;
      };
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
          userType: "presenter",
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
        setEmail("");
        generatePassword();
      }
      setIsLoading(false);
    };
    addUser();
  };

  // Handler for search input change
  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value.toLowerCase());
  };

  // Filtered list based on search query
  const filteredUsers = users.filter(
    (presenter) =>
      presenter.firstName.toLowerCase().includes(searchQuery) ||
      presenter.lastName.toLowerCase().includes(searchQuery) ||
      presenter.email.toLowerCase().includes(searchQuery)
  );

  const Row = ({ index, style, data }) => {
    const presenter = data[index]; // Accessing the teacher from data passed to the List
    // Add some bottom margin to each row for spacing
    return (
      <div style={style} key={presenter._id}>
        <div className={styles.presenter}>
          <div className={styles.presenterHeader}>
            <Link to={`/admin/presenters/${presenter._id}`} className={styles.presenterName}>
              {presenter.firstName} {presenter.lastName}
            </Link>
            <button
              className={forms.deleteIcon}
              onClick={async () => {
                if (user.userType !== "admin") {
                  return;
                }
                setIsFetching(true);
                const response = await fetch("/api/admin/users/" + users[index]._id, {
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
            <strong>Email:</strong> {presenter.email}
          </p>
          <p>
            <strong>Password:</strong> {presenter.password}
          </p>
        </div>
      </div>
    );
  };

  useEffect(() => {
    setIsFetching(true);
    generatePassword();
    const fetchUsers = async () => {
      const response = await fetch("/api/admin/users/presenters", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const json = await response.json();

      if (response.ok) {
        setUsers(json);
        setIsFetching(false);
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [user]);

  return (
    <div>
      <div className={styles.container}>
        <div className={`${styles.leftPresenterView} ${sidebar.box}`}>
          <h2 className={forms.h2}>
            All Presenters ({isFetching ? "Loading..." : filteredUsers.length}):
          </h2>
          <button className={forms.smallButton} onClick={handleExcelExport}>
            Export to Excel
          </button>
          <div className={forms.textInputGroup}>
            <input
              type="text"
              placeholder="Search for a presenter..."
              onChange={handleSearchChange}
              value={searchQuery}
              className={forms.textInput}
            />
            <div
              className={`${forms.textInputIcon} ${forms.defaultCursor}`}
              onClick={togglePasswordVisibility}
            >
              <span className="material-icons">search</span>
            </div>
          </div>

          <List
            height={632}
            itemCount={filteredUsers.length}
            itemSize={105}
            width={"100%"}
            itemData={filteredUsers} // Pass filteredUsers as itemData
          >
            {Row}
          </List>
        </div>
        <div className={`${styles.rightPresenterView} ${sidebar.box}`}>
          <form onSubmit={handleSubmit}>
            <h2 className={forms.h2}>Add a New Presenter</h2>
            <label className={forms.inputLabel}>First Name:</label>
            <input
              type="text"
              onChange={handleFirstNameChange}
              value={firstName}
              placeholder="Enter presenter's first name"
              className={forms.textInput}
            />
            <label className={forms.inputLabel}>Last Name:</label>
            <input
              type="text"
              onChange={handleLastNameChange}
              value={lastName}
              placeholder="Enter presenter's last name"
              className={forms.textInput}
            />
            <label className={forms.inputLabel}>Email:</label>
            <input
              type="email"
              onChange={handleEmailChange}
              value={email}
              placeholder="Enter presenter's email"
              className={forms.textInput}
            />
            <label className={forms.inputLabel}>Password:</label>
            <div className={forms.textInputGroup}>
              <input
                type={showPassword ? "text" : "password"}
                onChange={handlePasswordChange}
                value={password}
                placeholder="Enter presenter's password"
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
              {isLoading ? <div className={forms.spinner}></div> : "ADD PRESENTER"}
            </button>

            {error && <div className={forms.error}>{error}</div>}
          </form>

          <hr className={forms.formBreak} />

          <div className={forms.fileInputGroup}>
            <h2 className={forms.h2}>Add New Presenters with Excel</h2>
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
                {isLoading ? <div className={forms.spinner}></div> : "ADD PRESENTERS"}
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
                      href="https://docs.google.com/spreadsheets/d/1rHapmo1gl8JjVZSjxvyYLiIbnh6DpEw8t4BJQCrlJ80/edit?usp=sharing"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Follow this exact format
                    </a>
                    <ul>
                      <li>Password column is optional</li>
                    </ul>{" "}
                  </li>

                  <li>All presenters are new (do not exist in database already)</li>
                </ul>
                <strong>Steps:</strong>
                <ol>
                  <li>Follow the format of the example above</li>
                  <li>Add presenters to the excel file</li>
                  <li>Choose and upload your excel file</li>
                  <li>Click add presenters</li>
                  <li>If there is an error with one of the presenters, none will be added</li>
                  <li>If all presenters have no errors, all will be added</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PresenterView;
