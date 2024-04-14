import { Routes, Route, Navigate, NavLink } from "react-router-dom";
import { useState } from "react";

import sidebar from "../../CSS/Components/Sidebar.module.css";
import styles from "../../CSS/Student/Student.module.css";

import AllClassesView from "./Views/AllClassesView";
import MyClassesView from "./Views/MyClassesView";

import Navbar from "../../components/Navbar";

const Student = () => {
  const [filterBlock, setFilterBlock] = useState("");
  const handleSetFilterBlock = (blockName) => {
    setFilterBlock(blockName);
  };

  return (
    <div className={styles.student}>
      <Navbar />
      <div className={styles.container}>
        <div className={`${styles.leftMenu}`}>
          <div className={`${sidebar.box} ${styles.topSidebar}`}>
            <ul className={sidebar.sidebar}>
              <li>
                <NavLink
                  to="all-classes"
                  className={({ isActive }) =>
                    isActive ? `${sidebar.link} ${sidebar.selected}` : sidebar.link
                  }
                >
                  All Classes
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="my-classes"
                  className={({ isActive }) =>
                    isActive ? `${sidebar.link} ${sidebar.selected}` : sidebar.link
                  }
                >
                  My Classes
                </NavLink>
              </li>
            </ul>
          </div>
          <div className={`${sidebar.box} ${styles.bottomSidebar}`}>
            <ul className={sidebar.sidebar}>
              <p>Filter by Class Block:</p>

              <li
                onClick={() => handleSetFilterBlock("")}
                className={filterBlock === "" ? sidebar.selected : ""}
              >
                All Blocks
              </li>
              <li
                onClick={() => handleSetFilterBlock(1)}
                className={filterBlock === 1 ? sidebar.selected : ""}
              >
                Block 1: 8:00-9:00
              </li>
              <li
                onClick={() => handleSetFilterBlock(2)}
                className={filterBlock === 2 ? sidebar.selected : ""}
              >
                Block 2: 9:00-10:00
              </li>
              <li
                onClick={() => handleSetFilterBlock(3)}
                className={filterBlock === 3 ? sidebar.selected : ""}
              >
                Block 3: 10:20-11:20
              </li>
              <li
                onClick={() => handleSetFilterBlock(4)}
                className={filterBlock === 4 ? sidebar.selected : ""}
              >
                Block 4: 11:20-12:20
              </li>
              <li
                onClick={() => handleSetFilterBlock(5)}
                className={filterBlock === 5 ? sidebar.selected : ""}
              >
                Block 5: 13:00-14:00
              </li>
              <li
                onClick={() => handleSetFilterBlock(6)}
                className={filterBlock === 6 ? sidebar.selected : ""}
              >
                Block 6: 12:00-15:00
              </li>
            </ul>
          </div>
        </div>
        <div className={styles.rightMenu}>
          <Routes>
            <Route path="all-classes" element={<AllClassesView filterBlock={filterBlock} />} />
            <Route path="my-classes" element={<MyClassesView filterBlock={filterBlock} />} />
            <Route path="*" element={<Navigate to="/all-classes" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default Student;
