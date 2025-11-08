import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts'
import { TrendingUp, Users, Clock, Award, Target, CheckCircle, XCircle } from 'lucide-react'

const Analytics = ({ user }) => {
  const [anonymousMode, setAnonymousMode] = useState(false)
  const [submissions, setSubmissions] = useState([])
  const [assignments, setAssignments] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAllData()
  }, [])

  const fetchAllData = async () => {
    try {
      // Fetch assignments first
      const assignmentsRes = await fetch('http://localhost:3001/api/assignments')
      const assignmentsData = await assignmentsRes.json()
      
      let fetchedAssignments = []
      if (Array.isArray(assignmentsData)) {
        fetchedAssignments = assignmentsData
      } else if (assignmentsData.success && assignmentsData.assignments) {
        fetchedAssignments = assignmentsData.assignments
      }
      setAssignments(fetchedAssignments)
      
      // Fetch submissions for each assignment
      const allSubmissions = []
      for (const assignment of fetchedAssignments) {
        try {
          const response = await fetch(`http://localhost:3001/api/assignments/${assignment._id}/submissions`)
          if (response.ok) {
            const data = await response.json()
            if (data.success && data.submissions) {
              allSubmissions.push(...data.submissions)
            }
          }
        } catch (error) {
          console.error(`Error fetching submissions for assignment ${assignment._id}:`, error)
        }
      }
      setSubmissions(allSubmissions)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getAnalytics = () => {
    const totalSubmissions = submissions.length
    const avgScore = totalSubmissions > 0 
      ? Math.round(submissions.reduce((sum, s) => sum + (s.finalScore || s.score || 0), 0) / totalSubmissions)
      : 0
    
    const uniqueStudents = [...new Set(submissions.map(s => s.userId))].length
    const passedSubmissions = submissions.filter(s => s.status === 'Passed').length
    const failedSubmissions = submissions.filter(s => s.status === 'Failed').length
    const partialSubmissions = submissions.filter(s => s.status === 'Partial').length
    
    const languageStats = submissions.reduce((acc, s) => {
      acc[s.language] = (acc[s.language] || 0) + 1
      return acc
    }, {})
    
    const assignmentStats = assignments.map(a => {
      const assignmentSubs = submissions.filter(s => String(s.assignmentId) === String(a._id))
      return {
        name: (a.main?.name || a.name || 'Untitled').substring(0, 15),
        submissions: assignmentSubs.length,
        avgScore: assignmentSubs.length > 0 
          ? Math.round(assignmentSubs.reduce((sum, s) => sum + (s.finalScore || 0), 0) / assignmentSubs.length)
          : 0
      }
    })
    
    return {
      totalSubmissions,
      avgScore,
      uniqueStudents,
      totalAssignments: assignments.length,
      passedSubmissions,
      failedSubmissions,
      partialSubmissions,
      languageStats,
      assignmentStats
    }
  }

  const analytics = getAnalytics()
  const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6']

  if (loading) {
    return (
      <div className="text-center" style={{ padding: '60px' }}>
        <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
        <p style={{ marginTop: '16px' }}>Loading analytics...</p>
      </div>
    )
  }

  const statusData = [
    { name: 'Passed', value: analytics.passedSubmissions, color: '#10b981' },
    { name: 'Failed', value: analytics.failedSubmissions, color: '#ef4444' },
    { name: 'Partial', value: analytics.partialSubmissions, color: '#f59e0b' }
  ]

  const languageData = Object.entries(analytics.languageStats).map(([lang, count]) => ({
    name: lang.charAt(0).toUpperCase() + lang.slice(1),
    value: count
  }))

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
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
      <div className="grid grid-4 mb-8" style={{ gap: '30px', marginTop: '30px' }}>
        <div className="metric-card ">
          <TrendingUp size={24} style={{ margin: '0 auto 8px' }} />
          <div className="metric-value">{analytics.avgScore}%</div>
          <div className="metric-label">Avg Score</div>
        </div>
        <div className="metric-card ">
          <Users size={24} style={{ margin: '0 auto 8px' }} />
          <div className="metric-value">{analytics.totalSubmissions}</div>
          <div className="metric-label">Submissions</div>
        </div>
        <div className="metric-card ">
          <Target size={24} style={{ margin: '0 auto 8px' }} />
          <div className="metric-value">{analytics.uniqueStudents}</div>
          <div className="metric-label">Students</div>
        </div>
        <div className="metric-card ">
          <Award size={24} style={{ margin: '0 auto 8px' }} />
          <div className="metric-value">{analytics.totalAssignments}</div>
          <div className="metric-label">Assignments</div>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: '30px' }}>
        {/* Submission Status Distribution */}
        <div className="card">
          <h2 className="mb-4">Submission Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={statusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-3 gap-3 mt-4">
            <div className="text-center">
              <CheckCircle size={20} style={{ margin: '0 auto 4px', color: '#10b981' }} />
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{analytics.passedSubmissions}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Passed</div>
            </div>
            <div className="text-center">
              <XCircle size={20} style={{ margin: '0 auto 4px', color: '#ef4444' }} />
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{analytics.failedSubmissions}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Failed</div>
            </div>
            <div className="text-center">
              <Clock size={20} style={{ margin: '0 auto 4px', color: '#f59e0b' }} />
              <div style={{ fontSize: '20px', fontWeight: '700' }}>{analytics.partialSubmissions}</div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Partial</div>
            </div>
          </div>
        </div>

        {/* Language Usage */}
        <div className="card">
          <h2 className="mb-4">Language Usage</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={languageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Assignment Performance */}
      <div className="card mt-6">
        <h2 className="mb-4">Assignment Performance Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.assignmentStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="submissions" fill="#10b981" name="Submissions" />
            <Bar yAxisId="right" dataKey="avgScore" fill="#3b82f6" name="Avg Score (%)" />
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
              <strong>{analytics.uniqueStudents}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Assignments:</span>
              <strong>{analytics.totalAssignments}</strong>
            </div>
            <div className="flex justify-between">
              <span>Total Submissions:</span>
              <strong>{analytics.totalSubmissions}</strong>
            </div>
            <div className="flex justify-between">
              <span>Average Score:</span>
              <strong>{analytics.avgScore}%</strong>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="mb-4">Performance Insights</h3>
          <div className="grid gap-3">
            <div className="flex justify-between">
              <span>Success Rate:</span>
              <strong>{analytics.totalSubmissions > 0 ? Math.round((analytics.passedSubmissions / analytics.totalSubmissions) * 100) : 0}%</strong>
            </div>
            <div className="flex justify-between">
              <span>Avg Submissions/Assignment:</span>
              <strong>{analytics.totalAssignments > 0 ? Math.round(analytics.totalSubmissions / analytics.totalAssignments) : 0}</strong>
            </div>
            <div className="flex justify-between">
              <span>Most Used Language:</span>
              <strong>{languageData[0]?.name || 'N/A'}</strong>
            </div>
            <div className="flex justify-between">
              <span>Completion Rate:</span>
              <strong>{analytics.totalSubmissions > 0 ? Math.round(((analytics.passedSubmissions + analytics.partialSubmissions) / analytics.totalSubmissions) * 100) : 0}%</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Analytics