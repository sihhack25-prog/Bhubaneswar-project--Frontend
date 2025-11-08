import { Link, useNavigate } from 'react-router-dom'
import { User, LogOut, Sun, Moon } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const Navbar = ({ user, setUser }) => {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  
  const handleLogout = () => {
    setUser(null)
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-content">
          <Link to="/" className="navbar-brand">
            🤖 Digital TA
          </Link>
          
          {user && (
            <ul className="navbar-nav">
              {user.role === 'instructor' ? (
                <>
                  <li><Link to="/instructor">Dashboard</Link></li>
                  <li><Link to="/assignments">Assignments</Link></li>
                  <li><Link to="/analytics">Analytics</Link></li>
                  <li><Link to="/plagiarism">Plagiarism</Link></li>
                </>
              ) : (
                <>
                  <li><Link to="/student">Dashboard</Link></li>
                  <li><Link to="/submissions">My Submissions</Link></li>
                  <li><Link to="/leaderboard">Leaderboard</Link></li>
                  <li><Link to="/editor">Live Editor</Link></li>
                </>
              )}
              <li className="flex items-center gap-3">
                <button onClick={toggleTheme} className="theme-toggle">
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                <div className="flex items-center gap-2">
                  <User size={16} />
                  <span>{user.name}</span>
                </div>
                <button onClick={handleLogout} className="btn btn-secondary">
                  <LogOut size={16} />
                </button>
              </li>
            </ul>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar