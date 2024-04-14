import { useAuthContext } from "../hooks/useAuthContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const { user } = useAuthContext();
  const navigate = useNavigate();

  useEffect(() => {
    // Immediately navigate based on user type
    switch (user?.userType) {
      case "student":
        navigate("/student/all-classes");
        break;
      case "presenter":
        navigate("/presenter/all-classes");
        break;
      case "admin":
        navigate("/admin/students");
        break;
      default:
        navigate(".login");
    }
  }, [user, navigate]); // Ensure useEffect is dependent on `user` and `navigate`

  // Optionally render something while the redirect is happening
  // This can be a loading spinner, a simple message, or even just null if you prefer not to render anything.
  return null; // Or, return <LoadingSpinner /> for example;
};

export default Home;
