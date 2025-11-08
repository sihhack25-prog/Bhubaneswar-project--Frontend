import { useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import './LandingPage.css'

function LandingPage() {
  const navigate = useNavigate()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const config = {
      one: { hue: 114, saturation: 1.4, brightness: 1.2 },
      two: { hue: 0, saturation: 0, brightness: 1.4 },
      three: { hue: 0, saturation: 0, brightness: 0.4 }
    }

    const ids = ['one', 'two', 'three']
    ids.forEach(id => {
      const element = document.querySelector(`#${id}`)
      if (element) {
        element.style.setProperty('--hue', config[id].hue)
        element.style.setProperty('--saturate', config[id].saturation)
        element.style.setProperty('--brightness', config[id].brightness)
      }
    })

    const clickAudio = new Audio('https://cdn.freesound.org/previews/378/378085_6260145-lq.mp3')
    
    ids.forEach(id => {
      const element = document.querySelector(`#${id}`)
      if (element) {
        element.addEventListener('pointerdown', () => {
          clickAudio.currentTime = 0
          clickAudio.play().catch(() => {})
        })
      }
    })

    const handleScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{ width: '100%', minHeight: '200vh' }}>
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
        <div style={{ 
          fontSize: '1.5rem', 
          fontWeight: '700', 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
          WebkitBackgroundClip: 'text', 
          WebkitTextFillColor: 'transparent' 
        }}>
          🤖 Digital TA
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            onClick={() => navigate('/login')} 
            style={{ 
              padding: '0.5rem 1rem', 
              background: 'transparent', 
              border: '1px solid #667eea', 
              color: '#667eea', 
              borderRadius: '6px', 
              cursor: 'pointer' 
            }}
          >
            Login
          </button>
          <button 
            onClick={() => navigate('/login')} 
            style={{ 
              padding: '0.5rem 1rem', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white', 
              border: 'none', 
              borderRadius: '6px', 
              cursor: 'pointer' 
            }}
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ paddingTop: '80px' }}>
        <section>
          <div>
            <h1 style={{
              fontSize: '3.5rem', 
              fontWeight: '800', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              WebkitBackgroundClip: 'text', 
              WebkitTextFillColor: 'transparent', 
              textAlign: 'center', 
              marginBottom: '1.5rem'
            }}>
              Automated Lab Grader<br />
              <span style={{fontSize: '2.5rem', fontWeight: '600'}}>Digital TA Platform</span>
            </h1>
            <p style={{
              fontSize: '1.2rem', 
              lineHeight: '1.6', 
              textAlign: 'center', 
              maxWidth: '600px', 
              margin: '0 auto 2rem'
            }}>
              AI-powered web platform for automatic evaluation of programming assignments.<br/>
              <strong>Real-time grading</strong> • <strong>Instant feedback</strong> • <strong>Comprehensive analytics</strong>
            </p>
            <form onSubmit={(e) => e.preventDefault()} style={{
              display: 'flex', 
              gap: '0.75rem', 
              maxWidth: '400px', 
              margin: '0 auto'
            }}>
              <input 
                type="text" 
                required 
                placeholder="Search problems or students..." 
                style={{
                  flex: 1, 
                  padding: '0.75rem 1rem', 
                  fontSize: '1rem', 
                  borderRadius: '8px', 
                  border: '2px solid #e2e8f0', 
                  outline: 'none', 
                  transition: 'border-color 0.2s'
                }} 
              />
              <button 
                type="submit" 
                style={{
                  padding: '0.75rem 1.5rem', 
                  fontSize: '1rem', 
                  fontWeight: '600', 
                  color: 'white', 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                  border: 'none', 
                  borderRadius: '8px', 
                  cursor: 'pointer', 
                  transition: 'transform 0.2s'
                }}
              >
                Search
              </button>
            </form>
          </div>
        </section>

        {/* Interactive Keypad */}
        <div className="keypad">
          <div className="keypad__base">
            <img src="https://assets.codepen.io/605876/keypad-base.png?format=auto&quality=86" alt="" />
          </div>
          <button 
            id="one" 
            className="key keypad__single keypad__single--left"
            // onClick={() => navigate('/login')}
          >
            <span className="key__mask">
              <span className="key__content">
                <span className="key__text">solve</span>
                <img src="https://assets.codepen.io/605876/keypad-single.png?format=auto&quality=86" alt="" />
              </span>
            </span>
          </button>
          <button 
            id="two" 
            className="key keypad__single"
            // onClick={() => navigate('/login')}
          >
            <span className="key__mask">
              <span className="key__content">
                <span className="key__text">grade</span>
                <img src="https://assets.codepen.io/605876/keypad-single.png?format=auto&quality=86" alt="" />
              </span>
            </span>
          </button>
          <button 
            id="three" 
            className="key keypad__double"
            onClick={() => navigate('/login')}
          >
            <span className="key__mask">
              <span className="key__content">
                <span className="key__text">analytics</span>
                <img src="https://assets.codepen.io/605876/keypad-double.png?format=auto&quality=86" alt="" />
              </span>
            </span>
          </button>
        </div>
      </main>
      
      {/* Animated Features Section */}
      <div style={{ background: 'rgba(245, 247, 250, 0.3)', margin: 0, padding: 0 }}>
        {/* Feature 1 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4rem 0',
          maxWidth: '1200px',
          margin: '0 auto',
          transform: `translateX(${scrollY * 0.1}px)`,
          transition: 'transform 0.1s ease-out'
        }}>
          <div style={{ flex: '1', paddingRight: '4rem', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=400&fit=crop&crop=center" 
              alt="Code Editor" 
              style={{ 
                width: '300px', 
                height: '300px', 
                borderRadius: '12px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
                objectFit: 'cover' 
              }} 
            />
          </div>
          <div style={{ flex: '1', paddingLeft: '2rem' }}>
            <h3 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#2d3748' }}>
              Interactive Code Editor
            </h3>
            <p style={{ color: '#718096', lineHeight: '1.8', fontSize: '1.2rem' }}>
              Write, compile, and test your code in real-time with our advanced in-browser editor supporting multiple programming languages including Python, Java, C++, and JavaScript.
            </p>
          </div>
        </div>

        {/* Feature 2 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4rem 0',
          maxWidth: '1200px',
          margin: '0 auto',
          transform: `translateX(${scrollY * -0.1}px)`,
          transition: 'transform 0.1s ease-out'
        }}>
          <div style={{ flex: '1', paddingRight: '4rem' }}>
            <h3 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#2d3748' }}>
              AI-Powered Grading
            </h3>
            <p style={{ color: '#718096', lineHeight: '1.8', fontSize: '1.2rem' }}>
              Instant automated evaluation with detailed feedback, test case validation, and performance analysis for every submission. Get results in seconds, not hours.
            </p>
          </div>
          <div style={{ flex: '1', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=400&h=400&fit=crop&crop=center" 
              alt="AI Grading" 
              style={{ 
                width: '300px', 
                height: '300px', 
                borderRadius: '12px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
                objectFit: 'cover' 
              }} 
            />
          </div>
        </div>

        {/* Feature 3 */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4rem 0',
          maxWidth: '1200px',
          margin: '0 auto',
          transform: `translateX(${scrollY * 0.15}px)`,
          transition: 'transform 0.1s ease-out'
        }}>
          <div style={{ flex: '1', paddingRight: '4rem', display: 'flex', justifyContent: 'center' }}>
            <img 
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=400&fit=crop&crop=center" 
              alt="Analytics" 
              style={{ 
                width: '300px', 
                height: '300px', 
                borderRadius: '12px', 
                boxShadow: '0 10px 30px rgba(0,0,0,0.1)', 
                objectFit: 'cover' 
              }} 
            />
          </div>
          <div style={{ flex: '1', paddingLeft: '2rem' }}>
            <h3 style={{ fontSize: '2.5rem', fontWeight: '700', marginBottom: '1.5rem', color: '#2d3748' }}>
              Comprehensive Analytics
            </h3>
            <p style={{ color: '#718096', lineHeight: '1.8', fontSize: '1.2rem' }}>
              Track progress, view performance trends, and access detailed reports with interactive charts and leaderboards. Monitor student engagement and success rates.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LandingPage