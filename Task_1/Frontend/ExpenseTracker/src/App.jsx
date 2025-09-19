import { Navigate, Route, Routes } from "react-router-dom"
import Income from "./Pages/Income"
import Dashboard from "./Pages/Dashboard"
import AuthRedirect from "./Pages/AuthRedirect"
import Signup from "./Pages/Signup"
import Login from "./Pages/Login"
import ProtectedRoutes from "./ProtectedRoutes"
import Profile from "./Pages/Profile"
import ForgetPassword from "./Pages/ForgetPassword"
import ResetPassword from "./Pages/ResetPassword"

function App() {

  return (
    <Routes>
      <Route path="/" element={<ProtectedRoutes><Dashboard /></ProtectedRoutes>} />
      <Route path="/dashboard" element={<ProtectedRoutes><Dashboard /></ProtectedRoutes>} />
      <Route path="/income" element={<ProtectedRoutes><Income /></ProtectedRoutes>} />
      <Route path="/signup" element={<AuthRedirect><Signup /></AuthRedirect>} />
      <Route path="/login" element={<AuthRedirect><Login /></AuthRedirect>} />
      <Route path="/Profile" element={<ProtectedRoutes><Profile /></ProtectedRoutes>} />
      <Route path="/forget-password" element={<ForgetPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>

  )
}

export default App
