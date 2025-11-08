import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, CheckCircle, AlertCircle, Code, TrendingUp } from 'lucide-react'
import { useAssignments } from '../contexts/AssignmentContext'

const StudentDashboard = ({ user }) => {
  const { assignments: contextAssignments, submissions, getSubmissionsByUser, getStats } = useAssignments()
  const [filter, setFilter] = useState('all')
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/assignments')
      const data = await response.json()
      if (data.success && data.assignments.length > 0) {
        setAssignments(data.assignments)
      } else {
        setAssignments(contextAssignments)
      }
    } catch (error) {
      console.log('Backend not available, using context data')
      setAssignments(contextAssignments)
    } finally {
      setLoading(false)
    }
  }

  const userSubmissions = user ? getSubmissionsByUser(user.id) : []

  const getAssignmentStatus = (assignment) => {
    const submission = userSubmissions.find(s => s.assignmentId === assignment.id)
    if (submission) {
      return { status: 'completed', score: submission.score || 0 }
    }
    return { status: 'open', score: null }
  }

  const enrichedAssignments = assignments.map(assignment => ({
    ...assignment,
    ...getAssignmentStatus(assignment)
  }))

  const filteredAssignments = enrichedAssignments.filter(assignment => {
    if (filter === 'all') return true
    return assignment.status === filter
  })

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open': return <Clock size={16} />
      case 'completed': return <CheckCircle size={16} />
      case 'graded': return <CheckCircle size={16} />
      default: return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#007bff'
      case 'completed': return '#28a745'
      case 'graded': return '#28a745'
      default: return '#6c757d'
    }
  }

  const isOverdue = (deadline) => {
    return new Date(deadline) < new Date()
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative'
    }}>
      <div style={{ padding: '2rem', position: 'relative', zIndex: 1 }}>
        <div className="flex justify-between items-center mb-4">
          <h1>Student Dashboard</h1>
          <Link to="/editor" className="btn btn-primary">
            Open Live Editor
          </Link>
        </div>

      <div className="grid grid-3 mb-4">
        <div className="metric-card card-gradient">
          <Code size={32} style={{ margin: '0 auto 8px' }} />
          <div className="metric-value">
            {enrichedAssignments.filter(a => a.status === 'open').length}
          </div>
          <div className="metric-label">Open Assignments</div>
        </div>
        <div className="metric-card card-warning">
          <Clock size={32} style={{ margin: '0 auto 8px' }} />
          <div className="metric-value">
            {enrichedAssignments.filter(a => a.status === 'completed').length}
          </div>
          <div className="metric-label">Completed</div>
        </div>
        <div className="metric-card card-success">
          <TrendingUp size={32} style={{ margin: '0 auto 8px' }} />
          <div className="metric-value">
            {Math.round(enrichedAssignments.filter(a => a.score).reduce((sum, a) => sum + a.score, 0) / 
             enrichedAssignments.filter(a => a.score).length) || 0}%
          </div>
          <div className="metric-label">Average Score</div>
        </div>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2>Assignments</h2>
          <select
            className="form-input"
            style={{ width: 'auto' }}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All</option>
            <option value="open">Open</option>
            <option value="completed">Completed</option>
            <option value="graded">Graded</option>
          </select>
        </div>

        {loading ? (
          <div className="text-center" style={{ padding: '40px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px' }}>Loading assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
            <Code size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No assignments found for the selected filter.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredAssignments.map(assignment => (
              <Link
                key={assignment.id || assignment._id}
                to={`/assignment/${assignment.id || assignment._id}`}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className="card fade-in" style={{ margin: 0, cursor: 'pointer' }}>
                  <div className="flex justify-between items-center">
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3>{assignment.name || assignment.main?.name || 'Untitled Assignment'}</h3>
                        <span className={`status-badge status-${assignment.status}`}>
                          {getStatusIcon(assignment.status)}
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0', fontSize: '14px' }}>
                        {(assignment.description || assignment.main?.description_body || 'No description').substring(0, 80)}...
                      </p>
                      <div className="flex items-center gap-4" style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '12px' }}>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>Created: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <span>Language: {assignment.supportedLanguages?.[0] || assignment.main?.code_default_language || 'javascript'}</span>
                        <span>Difficulty: {assignment.difficulty || assignment.main?.difficulty || 'easy'}</span>
                      </div>
                    </div>
                    {assignment.score !== null && (
                      <div className="text-center">
                        <div className="metric-value" style={{ fontSize: '28px', marginBottom: '4px' }}>
                          {assignment.score}%
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Score</div>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

export default StudentDashboard