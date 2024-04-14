// Admin.js or wherever your Admin component is located
import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import styles from "../../CSS/Admin/Admin.module.css";
import sidebar from "../../CSS/Components/Sidebar.module.css";
import Navbar from "../../components/Navbar";
import StudentView from "./Views/Student/StudentView";
import PresenterView from "./Views/Presenter/PresenterView";
import SymposiumView from "./Views/Symposium/SymposiumView";

const Admin = () => {
  return (
    <div className={styles.admin}>
      <Navbar />
      <div className={styles.container}>
        <div className={`${styles.leftMenu} ${sidebar.box}`}>
          <ul className={sidebar.sidebar}>
            <li>
              <NavLink
                to="students"
                className={({ isActive }) =>
                  isActive ? `${sidebar.link} ${sidebar.selected}` : sidebar.link
                }
              >
                Students
              </NavLink>
            </li>
            <li>
              <NavLink
                to="presenters"
                className={({ isActive }) =>
                  isActive ? `${sidebar.link} ${sidebar.selected}` : sidebar.link
                }
              >
                Presenters
              </NavLink>
            </li>
            <li>
              <NavLink
                to="symposiums"
                className={({ isActive }) =>
                  isActive ? `${sidebar.link} ${sidebar.selected}` : sidebar.link
                }
              >
                Symposiums
              </NavLink>
            </li>
            {/* Repeat for other links as needed */}
          </ul>
        </div>
        <div className={styles.rightMenu}>
          <Routes>
            <Route path="students" element={<StudentView />} />
            <Route path="presenters" element={<PresenterView />} />
            <Route path="symposiums" element={<SymposiumView />} />
            {/* Add more nested routes as needed */}
            <Route path="*" element={<Navigate to="/students" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Admin;
