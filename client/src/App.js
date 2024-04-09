import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthContext } from "./hooks/useAuthContext.js";
import forms from "./CSS/Components/Forms.module.css";
// pages
import Login from "./pages/Login.js";
import Home from "./pages/Home.js";
import Admin from "./pages/Admin/Admin.js";

import FullSymposiumView from "./pages/Admin/Views/Symposium/FullSymposiumView.js";
import PresenterSymposiumView from "./pages/Admin/Views/Symposium/PresenterSymposiumView.js";
import StudentSymposiumView from "./pages/Admin/Views/Symposium/StudentSymposiumView.js";
import ClassSymposiumView from "./pages/Admin/Views/Symposium/ClassSymposiumView.js";
import FullPresenterView from "./pages/Admin/Views/Presenter/FullPresenterView.js";
import FullStudentView from "./pages/Admin/Views/Student/FullStudentView.js";

import Presenter from "./pages/Presenter/Presenter.js";

import Student from "./pages/Student/Student.js";

function App() {
  const { user, isLoading } = useAuthContext(); // Destructure isLoading from the context

  if (isLoading) {
    return <div className={forms.bigSpinner}></div>; // Display a loading indicator while the auth state is initializing
  }

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Home /> : <Navigate to="/login" />} />

          {/* ADMIN ROUTES */}
          {/* SYMPOSIUM VIEW */}
          <Route
            path="/admin/symposiums/:id"
            element={user ? <FullSymposiumView /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/symposiums/:id/presenter/:presenter"
            element={user ? <PresenterSymposiumView /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/symposiums/:id/student/:student_id"
            element={user ? <StudentSymposiumView /> : <Navigate to="/login" />}
          />
          <Route
            path="/admin/symposiums/:symposium_id/class/:class_id"
            element={user ? <ClassSymposiumView /> : <Navigate to="/login" />}
          />
          {/* STUDENT VIEW */}
          <Route
            path="/admin/students/:id"
            element={user ? <FullStudentView /> : <Navigate to="/login" />}
          />
          {/* PRESENTER VIEW */}
          <Route
            path="/admin/presenters/:id"
            element={user ? <FullPresenterView /> : <Navigate to="/login" />}
          />
          <Route path="/admin/*" element={user ? <Admin /> : <Navigate to="/login" />} />

          {/* PRESENTER ROUTES */}
          <Route path="/presenter/*" element={user ? <Presenter /> : <Navigate to="/login" />} />

          {/* STUDENT ROUTES */}
          <Route path="/student/*" element={user ? <Student /> : <Navigate to="/login" />} />

          <Route path="*" element={user ? <Home /> : <Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
