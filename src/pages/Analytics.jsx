import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, ComposedChart } from 'recharts'
import { TrendingUp, Users, Clock, Award } from 'lucide-react'

const Analytics = ({ user }) => {
  const [anonymousMode, setAnonymousMode] = useState(false)
  const [analyticsData, setAnalyticsData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:3001/api/analytics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAnalyticsData(data)
      }
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center" style={{ padding: '60px' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '16px' }}>Loading analytics...</p>
      </div>
    )
  }

  if (!analyticsData) {
    return (
      <div className="text-center" style={{ padding: '60px', color: 'var(--text-secondary)' }}>
        <TrendingUp size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
        <p>No analytics data available.</p>
      </div>
    )
  }

  const { metrics, leaderboard } = analyticsData
  const leaderboardData = leaderboard.slice(0, 5).map((student, index) => ({
    ...student,
    id: index + 1,
    name: student.studentId,
    score: student.avgScore,
    rank: index + 1
  }))

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Analytics Dashboard</h1>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={anonymousMode}
            onChange={(e) => setAnonymousMode(e.target.checked)}
          />
          Anonymous Mode
        </label>
      </div>

      {/* Overall Metrics */}
      <div className="grid grid-4 mb-6">
        <div className="card text-center">
          <TrendingUp size={32} style={{ margin: '0 auto 8px', color: '#007bff' }} />
          <h3>{metrics.avgScore}%</h3>
          <p>Average Score</p>
        </div>
        <div className="card text-center">
          <Users size={32} style={{ margin: '0 auto 8px', color: '#28a745' }} />
          <h3>{metrics.totalSubmissions}</h3>
          <p>Total Submissions</p>
        </div>
        <div className="card text-center">
          <Clock size={32} style={{ margin: '0 auto 8px', color: '#ffc107' }} />
          <h3>{metrics.totalStudents}</h3>
          <p>Total Students</p>
        </div>
        <div className="card text-center">
          <Award size={32} style={{ margin: '0 auto 8px', color: '#dc3545' }} />
          <h3>{metrics.totalAssignments}</h3>
          <p>Total Assignments</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: '20px' }}>
        {/* Leaderboard */}
        <div className="card">
          <h2 className="mb-4">Student Leaderboard</h2>
          <div className="grid gap-2">
            {leaderboardData.map(student => (
              <div key={student.id} className="flex justify-between items-center"
                   style={{ 
                     padding: '12px', 
                     backgroundColor: student.rank <= 3 ? '#f8f9fa' : 'transparent',
                     borderRadius: '4px',
                     border: student.rank <= 3 ? '1px solid #dee2e6' : 'none'
                   }}>
                <div className="flex items-center gap-3">
                  <div style={{ 
                    width: '24px', 
                    height: '24px', 
                    borderRadius: '50%', 
                    backgroundColor: student.rank <= 3 ? '#007bff' : '#6c757d',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold'
                  }}>
                    {student.rank}
                  </div>
                  <div>
                    <div style={{ fontWeight: '500' }}>
                      {anonymousMode ? `Student ${student.id}` : student.name}
                    </div>
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      {student.submissions} submissions
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#007bff' }}>
                  {student.score}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Performance */}
        <div className="card">
          <h2 className="mb-4">Student Performance Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={leaderboard.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="studentId" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgScore" fill="#007bff" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Submission Overview */}
      <div className="card mt-6">
        <h2 className="mb-4">Submission Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={leaderboard}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="studentId" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="submissions" fill="#28a745" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-2 mt-6" style={{ gap: '20px' }}>
        <div className="card">
          <h3 className="mb-4">Submission Statistics</h3>
          <div className="grid gap-3">
            <div className="flex justify-between">
              <span>Total Students:</span>
              <strong>{metrics.totalStudents}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Assignments:</span>
              <strong>{metrics.totalAssignments}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Submissions:</span>
              <strong>{metrics.totalSubmissions}</strong>
            </div>
            <div className="flex justify-between">
              <span>Average Score:</span>
              <strong>{metrics.avgScore}%</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4">Performance Insights</h3>
          <div className="grid gap-3">
            <div className="flex justify-between">
              <span>Top Score:</span>
              <strong>{leaderboard[0]?.avgScore || 0}%</strong>
            </div>
            <div className="flex justify-between">
              <span>Active Students:</span>
              <strong>{leaderboard.length}</strong>
            </div>
            <div className="flex justify-between">
              <span>Avg Submissions per Student:</span>
              <strong>{leaderboard.length > 0 ? Math.round(leaderboard.reduce((sum, s) => sum + s.submissions, 0) / leaderboard.length) : 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>Students Above 80%:</span>
              <strong>{leaderboard.filter(s => s.avgScore >= 80).length}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics