import { useState, useEffect } from 'react'
import { Calendar, Clock, CheckCircle, XCircle, Code, TrendingUp, Filter, Search } from 'lucide-react'

const MySubmissions = ({ user }) => {
  const [submissions, setSubmissions] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchSubmissions()
    fetchAssignments()
  }, [])

  const fetchSubmissions = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('http://localhost:3001/api/submissions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      const data = await response.json()
      if (data.success) {
        const enrichedSubmissions = data.submissions.map(submission => ({
          ...submission,
          maxScore: 100,
          submittedAt: new Date(submission.submittedAt),
          testsPassed: submission.testResults?.filter(t => t.passed).length || 0,
          totalTests: submission.testResults?.length || 0,
          executionTime: Math.floor(Math.random() * 100) + 20 // Mock execution time
        }))
        setSubmissions(enrichedSubmissions)
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/assignments')
      const data = await response.json()
      if (data.success) {
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  const getStatusIcon = (status, score) => {
    if (status === 'submitted') return <Clock size={16} style={{ color: 'var(--warning)' }} />
    if (status === 'graded') {
      return score >= 80 ? 
        <CheckCircle size={16} style={{ color: 'var(--success)' }} /> :
        <XCircle size={16} style={{ color: 'var(--danger)' }} />
    }
    return <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
  }

  const getScoreColor = (score) => {
    if (score >= 90) return 'var(--success)'
    if (score >= 75) return 'var(--warning)'
    if (score >= 60) return 'var(--accent-orange)'
    return 'var(--danger)'
  }

  const filteredSubmissions = submissions.filter(submission => {
    const title = submission.assignmentTitle || 'Unknown Assignment'
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase())
    if (filterStatus === 'all') return matchesSearch
    return matchesSearch && submission.status === filterStatus
  })

  const totalSubmissions = submissions.length
  const gradedSubmissions = submissions.filter(s => s.status === 'graded')
  const averageScore = gradedSubmissions.length > 0 
    ? Math.round(gradedSubmissions.reduce((sum, s) => sum + s.score, 0) / gradedSubmissions.length)
    : 0
  const perfectScores = gradedSubmissions.filter(s => s.score === 100).length

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>📝 My Submissions</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Track your progress and review past submissions</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-4 mb-6">
        <div className="metric-card card-student">
          <Code size={32} style={{ margin: '0 auto 8px', color: 'white' }} />
          <div className="metric-value" style={{ color: 'white' }}>{totalSubmissions}</div>
          <div className="metric-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Submissions</div>
        </div>
        
        <div className="metric-card card-success">
          <TrendingUp size={32} style={{ margin: '0 auto 8px', color: 'white' }} />
          <div className="metric-value" style={{ color: 'white' }}>{averageScore}%</div>
          <div className="metric-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Average Score</div>
        </div>
        
        <div className="metric-card card-warning">
          <CheckCircle size={32} style={{ margin: '0 auto 8px', color: 'white' }} />
          <div className="metric-value" style={{ color: 'white' }}>{perfectScores}</div>
          <div className="metric-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Perfect Scores</div>
        </div>
        
        <div className="metric-card card-gradient">
          <Calendar size={32} style={{ margin: '0 auto 8px', color: 'white' }} />
          <div className="metric-value" style={{ color: 'white' }}>{gradedSubmissions.length}</div>
          <div className="metric-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Graded</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-6">
        <div className="flex justify-between items-center gap-4">
          <div className="flex items-center gap-4" style={{ flex: 1 }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
              <Search size={20} style={{ 
                position: 'absolute', 
                left: '12px', 
                top: '50%', 
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)'
              }} />
              <input
                type="text"
                placeholder="Search submissions..."
                className="form-input"
                style={{ paddingLeft: '44px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              className="form-input"
              style={{ width: 'auto', minWidth: '150px' }}
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="graded">Graded</option>
              <option value="submitted">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* Submissions List */}
      <div className="card">
        <div className="mb-4">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Submission History ({filteredSubmissions.length})</h2>
        </div>

        {loading ? (
          <div className="text-center" style={{ padding: '60px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px' }}>Loading submissions...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="text-center" style={{ padding: '60px', color: 'var(--text-secondary)' }}>
            <Code size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No submissions found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSubmissions.map(submission => (
              <div key={submission.id} className="card fade-in" style={{ 
                margin: 0,
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border)',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px var(--shadow)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = '0 4px 6px var(--shadow)'
              }}
              >
                <div className="flex justify-between items-start">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(submission.status, submission.score)}
                      <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                        {submission.assignmentTitle}
                      </h3>
                      <span className={`status-badge ${
                        submission.status === 'graded' ? 'status-graded' : 'status-submitted'
                      }`}>
                        {submission.status === 'graded' ? 'Graded' : 'Pending'}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-6 mb-3" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>Submitted {submission.submittedAt.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Code size={14} />
                        <span>{submission.language}</span>
                      </div>
                      {submission.executionTime && (
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{submission.executionTime}ms</span>
                        </div>
                      )}
                    </div>

                    {submission.status === 'graded' && (
                      <div className="flex items-center gap-4">
                        <div style={{ 
                          padding: '8px 16px',
                          background: 'var(--bg-primary)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)'
                        }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Test Cases: </span>
                          <span style={{ fontWeight: '600' }}>
                            {submission.testsPassed}/{submission.totalTests} passed
                          </span>
                        </div>
                        
                        <div style={{ 
                          padding: '8px 16px',
                          background: 'var(--bg-primary)',
                          borderRadius: '8px',
                          border: '1px solid var(--border)'
                        }}>
                          <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Execution: </span>
                          <span style={{ fontWeight: '600' }}>{submission.executionTime}ms</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {submission.status === 'graded' && (
                    <div className="text-center" style={{ minWidth: '120px' }}>
                      <div style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '800',
                        color: getScoreColor(submission.score),
                        marginBottom: '4px'
                      }}>
                        {submission.score}%
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {submission.score}/{submission.maxScore} points
                      </div>
                      
                      {/* Progress bar */}
                      <div style={{ 
                        width: '100%',
                        height: '6px',
                        background: 'var(--bg-tertiary)',
                        borderRadius: '3px',
                        marginTop: '8px',
                        overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${submission.score}%`,
                          height: '100%',
                          background: getScoreColor(submission.score),
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  )}

                  {submission.status === 'submitted' && (
                    <div className="text-center" style={{ minWidth: '120px' }}>
                      <div className="loading-spinner" style={{ margin: '0 auto 8px' }}></div>
                      <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                        Grading in progress...
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MySubmissions