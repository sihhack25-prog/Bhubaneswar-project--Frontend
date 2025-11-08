import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, GraduationCap, Code, Mail, Lock, UserPlus, LogIn } from 'lucide-react'

const Login = ({ setUser }) => {
  const [isLogin, setIsLogin] = useState(true)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'student'
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch('http://localhost:3001/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.email, // Using email as username
          password: formData.password,
          role: formData.role
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        localStorage.setItem('token', data.token)
        setUser(data.user)
        navigate(data.user.role === 'instructor' ? '/instructor' : '/student')
      } else {
        setError(data.error || 'Login failed')
      }
    } catch (error) {
      setError('Connection error. Please check if the backend server is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div className="card slide-up" style={{ 
        width: '100%', 
        maxWidth: '420px', 
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        border: 'none'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 24px',
            boxShadow: '0 8px 25px rgba(0,123,255,0.3)'
          }}>
            <Code size={36} style={{ color: 'white' }} />
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>🤖 Digital TA</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Your Automated Lab Grading Assistant</p>
        </div>
        
        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
          {error && (
            <div style={{ 
              background: '#fee', 
              color: '#c33', 
              padding: '12px', 
              borderRadius: '8px', 
              marginBottom: '20px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          
          {!isLogin && (
            <div className="form-group" style={{ marginBottom: '20px' }}>
              <input
                type="text"
                name="username"
                className="form-input"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="Username"
                style={{ 
                  fontSize: '16px',
                  padding: '16px 20px',
                  borderRadius: '12px',
                  border: '2px solid var(--border)',
                  transition: 'all 0.3s ease'
                }}
                required
              />
            </div>
          )}
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Email"
              style={{ 
                fontSize: '16px',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '2px solid var(--border)',
                transition: 'all 0.3s ease'
              }}
              required
            />
          </div>
          
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Password"
              style={{ 
                fontSize: '16px',
                padding: '16px 20px',
                borderRadius: '12px',
                border: '2px solid var(--border)',
                transition: 'all 0.3s ease'
              }}
              required
            />
          </div>
          
          {/* Role Selection */}
          <div style={{ marginBottom: '32px' }}>
            <p style={{ 
              color: 'var(--text-secondary)', 
              fontSize: '14px', 
              marginBottom: '16px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              fontWeight: '600'
            }}>Select Your Role</p>
            <div className="grid grid-2" style={{ gap: '12px' }}>
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'student'})}
                className={`btn ${formData.role === 'student' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  padding: '24px 16px', 
                  flexDirection: 'column', 
                  gap: '12px',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  transform: formData.role === 'student' ? 'translateY(-2px)' : 'none',
                  boxShadow: formData.role === 'student' ? '0 8px 25px rgba(0,123,255,0.3)' : 'none'
                }}
              >
                <GraduationCap size={28} />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>Student</span>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>Learn & Practice</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({...formData, role: 'instructor'})}
                className={`btn ${formData.role === 'instructor' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ 
                  padding: '24px 16px', 
                  flexDirection: 'column', 
                  gap: '12px',
                  borderRadius: '12px',
                  transition: 'all 0.3s ease',
                  transform: formData.role === 'instructor' ? 'translateY(-2px)' : 'none',
                  boxShadow: formData.role === 'instructor' ? '0 8px 25px rgba(0,123,255,0.3)' : 'none'
                }}
              >
                <User size={28} />
                <span style={{ fontSize: '16px', fontWeight: '600' }}>Instructor</span>
                <span style={{ fontSize: '12px', opacity: 0.8 }}>Teach & Evaluate</span>
              </button>
            </div>
          </div>
          
          {/* Submit Button */}
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
            style={{ 
              width: '100%', 
              padding: '18px', 
              fontSize: '16px',
              fontWeight: '600',
              borderRadius: '12px',
              background: loading ? '#ccc' : 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))',
              border: 'none',
              boxShadow: '0 8px 25px rgba(0,123,255,0.4)',
              transition: 'all 0.3s ease',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
          
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--accent-primary)',
              fontSize: '14px',
              marginTop: '16px',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            {isLogin ? 'Need an account? Register' : 'Already have an account? Login'}
          </button>
        </form>
        
        {/* Footer */}
        <div style={{ 
          marginTop: '32px', 
          paddingTop: '24px', 
          borderTop: '1px solid var(--border)',
          color: 'var(--text-secondary)',
          fontSize: '14px'
        }}>
          <p>Secure • Fast • Reliable</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>Make sure backend server is running on port 3001</p>
        </div>
      </div>
    </div>
  )
}

export default Login