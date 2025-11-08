import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { useState } from 'react'
import { ThemeProvider } from './contexts/ThemeContext'
import { AssignmentProvider } from './contexts/AssignmentContext'
import Navbar from './components/Navbar'
import InstructorDashboard from './pages/InstructorDashboard'
import StudentDashboard from './pages/StudentDashboard'
import AssignmentDetails from './pages/AssignmentDetails'
import AssignmentManagement from './pages/AssignmentManagement'
import LiveEditor from './pages/LiveEditor'
import Analytics from './pages/Analytics'
import Leaderboard from './pages/Leaderboard'
import MySubmissions from './pages/MySubmissions'
import Login from './pages/Login'
import LandingPage from './pages/LandingPage'
import EnhancedLogin from './pages/EnhancedLogin'
import AdminDashboard from './pages/AdminDashboard'
import PlagiarismDetection from './pages/PlagiarismDetection'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  const [user, setUser] = useState(null)

  return (
    <ThemeProvider>
      <AssignmentProvider>
        <Router>
          <div className="App">
            {user && <Navbar user={user} setUser={setUser} />}
            <div className="container">
              <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<EnhancedLogin setUser={setUser} />} />
              <Route path="/signup" element={<EnhancedLogin setUser={setUser} />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute user={user} allowedRoles={['admin']}>
                  <AdminDashboard user={user} />
                </ProtectedRoute>
              } />
              
              {/* Instructor Routes */}
              <Route path="/instructor" element={
                <ProtectedRoute user={user} allowedRoles={['instructor']}>
                  <InstructorDashboard user={user} />
                </ProtectedRoute>
              } />
              <Route path="/assignments" element={
                <ProtectedRoute user={user} allowedRoles={['instructor']}>
                  <AssignmentManagement user={user} />
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute user={user} allowedRoles={['instructor']}>
                  <Analytics user={user} />
                </ProtectedRoute>
              } />
              <Route path="/plagiarism/:assignmentId" element={
                <ProtectedRoute user={user} allowedRoles={['instructor']}>
                  <PlagiarismDetection user={user} />
                </ProtectedRoute>
              } />
              <Route path="/plagiarism" element={
                <ProtectedRoute user={user} allowedRoles={['instructor']}>
                  <PlagiarismDetection user={user} />
                </ProtectedRoute>
              } />
              
              {/* Student Routes */}
              <Route path="/student" element={
                <ProtectedRoute user={user} allowedRoles={['student']}>
                  <StudentDashboard user={user} />
                </ProtectedRoute>
              } />
              <Route path="/submissions" element={
                <ProtectedRoute user={user} allowedRoles={['student']}>
                  <MySubmissions user={user} />
                </ProtectedRoute>
              } />
              <Route path="/leaderboard" element={
                <ProtectedRoute user={user} allowedRoles={['student']}>
                  <Leaderboard user={user} />
                </ProtectedRoute>
              } />
              <Route path="/editor" element={
                <ProtectedRoute user={user} allowedRoles={['student']}>
                  <LiveEditor user={user} />
                </ProtectedRoute>
              } />
              
              {/* Shared Routes */}
              <Route path="/assignment/:id" element={<AssignmentDetails user={user} />} />
              </Routes>
            </div>
          </div>
        </Router>
      </AssignmentProvider>
    </ThemeProvider>
  )
}

export default App