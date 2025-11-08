import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, GraduationCap, Code, Mail, Lock, UserPlus, LogIn } from 'lucide-react'

const EnhancedLogin = ({ setUser }) => {
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
      // Admin authentication
      if (formData.role === 'admin') {
        try {
          const response = await fetch('http://localhost:3002/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: formData.email, password: formData.password })
          })
          
          const data = await response.json()
          
          if (data.success) {
            const adminUser = {
              id: data.user.id,
              name: data.user.name,
              email: data.user.email,
              role: 'admin'
            }
            setUser(adminUser)
            localStorage.setItem('token', data.token)
            navigate('/admin')
            return
          } else {
            setError(data.message || 'Invalid admin credentials')
            setLoading(false)
            return
          }
        } catch (error) {
          console.error('Admin login error:', error)
          setError('Admin login failed. Please check your credentials.')
          setLoading(false)
          return
        }
      }
      
      // Regular user authentication
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Handle all user authentication via MongoDB
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register'
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : {
            name: formData.username || formData.email.split('@')[0],
            email: formData.email,
            password: formData.password,
            role: formData.role,
            department: 'Computer Science',
            experience: '1 year'
          }
      
      const response = await fetch(`http://localhost:3002${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      
      const data = await response.json()
      
      if (data.success) {
        if (data.token) {
          localStorage.setItem('token', data.token)
          setUser(data.user)
          navigate(data.user.role === 'instructor' ? '/instructor' : '/student')
        } else {
          setError(data.message)
          setLoading(false)
        }
      } else {
        setError(data.error || data.message)
        setLoading(false)
        return
      }

    } catch (error) {
      console.error('Login error:', error)
      setError('Login failed. Please check your credentials and try again.')
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  useEffect(() => {
    const normalFace = document.querySelector("#normal")
    const closeFace = document.querySelector("#closed")
    const openFace = document.querySelector("#open")
    const clickFace = document.querySelector("#click")
    const emailInput = document.querySelector("input[name='email']")
    const passwordInput = document.querySelector("input[name='password']")
    const loginButton = document.querySelector("button[type='submit']")

    const showFace = (face) => {
      [normalFace, closeFace, openFace, clickFace].forEach(f => f && (f.style.display = 'none'))
      face && (face.style.display = 'block')
    }

    if (emailInput) {
      emailInput.addEventListener('focus', () => showFace(openFace))
      emailInput.addEventListener('blur', () => showFace(normalFace))
    }

    if (passwordInput) {
      passwordInput.addEventListener('focus', () => showFace(closeFace))
      passwordInput.addEventListener('blur', () => showFace(normalFace))
    }

    if (loginButton) {
      loginButton.addEventListener('mouseenter', () => showFace(clickFace))
      loginButton.addEventListener('mouseleave', () => showFace(normalFace))
    }
  }, [])

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative'
    }}>
      {/* Header */}
      <header style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid #e2e8f0',
        padding: '1rem 2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div onClick={() => navigate('/')} style={{ 
          fontSize: '1.5rem', 
          fontWeight: '700', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent', 
          cursor: 'pointer' 
        }}>
          🤖 Digital TA
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              padding: '0.5rem 1rem', 
              background: 'transparent', 
              border: '1px solid #667eea', 
              color: '#667eea', 
              borderRadius: '6px', 
              cursor: 'pointer' 
            }}
          >
            Home
          </button>
          <button 
            onClick={() => setFormData({...formData, role: 'admin', email: '', password: ''})}
            style={{ 
              padding: '0.5rem 1rem', 
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Admin Login
          </button>
        </div>
      </header>
      
      <div style={{ 
        width: '100%', 
        maxWidth: '420px', 
        textAlign: 'center',
        backdropFilter: 'blur(10px)',
        borderRadius: '16px',
        padding: '2rem',
        boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        marginTop: '80px',
        background: 'var(--bg-primary)'
      }}>
        {/* Header */}
        <div style={{ marginBottom: '40px' }}>
          <div style={{ 
            fontSize: '5rem',
            margin: '0 auto 24px',
            textAlign: 'center',
            cursor: 'pointer',
            userSelect: 'none'
          }}>
            <div id="normal" style={{ display: 'block' }}>🐵</div>
            <div id="closed" style={{ display: 'none' }}>🙈</div>
            <div id="open" style={{ display: 'none' }}>🙉</div>
            <div id="click" style={{ display: 'none' }}>🙊</div>
          </div>
          <h1 style={{ 
            fontSize: '2.5rem', 
            fontWeight: '800', 
            marginBottom: '8px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>Digital TA</h1>
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
            <div className="grid" style={{ gridTemplateColumns: formData.role === 'admin' ? '1fr' : 'repeat(2, 1fr)', gap: '12px' }}>
              {formData.role !== 'admin' && (
                <>
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
                </>
              )}
              {formData.role === 'admin' && (
                <button
                  type="button"
                  className="btn"
                  style={{ 
                    padding: '24px 16px', 
                    flexDirection: 'column', 
                    gap: '12px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
                    color: 'white',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 8px 25px rgba(220,38,38,0.3)'
                  }}
                >
                  <User size={28} />
                  <span style={{ fontSize: '16px', fontWeight: '600' }}>Administrator</span>
                  <span style={{ fontSize: '12px', opacity: 0.8 }}>Manage System</span>
                </button>
              )}
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
        </div>
      </div>
    </div>
  )
}

export default EnhancedLogin