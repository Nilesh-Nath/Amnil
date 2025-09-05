import { Route, Routes } from "react-router-dom"
import Income from "./Pages/Income"
import Dashboard from "./Pages/Dashboard"
import AuthRedirect from "./Pages/AuthRedirect"

function App() {

  return (
    <Routes>

      <Route path='/' element={<AuthRedirect />} />

      <Route path='/Income' element={<Income />} />

      <Route path='/Dashboard' element={<Dashboard />} />

    </Routes>
  )
}

export default App
