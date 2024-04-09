import { React } from "react";

import { Link } from "react-router-dom";
import { useAuthContext } from "../hooks/useAuthContext";
import { useLogout } from "../hooks/useLogout";
import forms from "../CSS/Components/Forms.module.css";
import styles from "../CSS/Components/Navbar.module.css";

const Navbar = () => {
  const { isLoading } = useAuthContext(); // Destructure isLoading from the context
  const { logout } = useLogout();
  const { user } = useAuthContext();

  const handleClick = () => {
    logout();
  };

  return (
    <header>
      <nav>
        <Link to="/">
          <img src="/images/raha.png" alt="User" className={styles.logo} />
          SymposiumDay
        </Link>

        <div className={styles.container}>
          {user && (
            <>
              <span>{user.email}</span>
              <button onClick={handleClick}>
                {isLoading ? <div className={forms.spinner}></div> : "Log out"}
              </button>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
