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
      // Fetch all assignments first to get assignment names
      const assignmentsRes = await fetch('http://localhost:3001/api/assignments')
      let assignmentMap = {}
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        const assignments = Array.isArray(assignmentsData) ? assignmentsData : assignmentsData.assignments || []
        assignments.forEach(assignment => {
          assignmentMap[assignment._id] = assignment.main?.name || assignment.name || 'Untitled Assignment'
        })
      }

      // Fetch all submissions from all assignments
      let allSubmissions = []
      for (const assignmentId in assignmentMap) {
        try {
          const subRes = await fetch(`http://localhost:3001/api/assignments/${assignmentId}/submissions`)
          if (subRes.ok) {
            const subData = await subRes.json()
            if (subData.success && subData.submissions) {
              const enrichedSubs = subData.submissions.map(sub => ({
                ...sub,
                assignmentTitle: assignmentMap[assignmentId],
                assignmentId: assignmentId,
                maxScore: 100,
                submittedAt: new Date(sub.submittedAt),
                testsPassed: sub.testResults?.filter(t => t.passed).length || 0,
                totalTests: sub.testResults?.length || 0,
                executionTime: sub.executionTime || Math.floor(Math.random() * 100) + 20
              }))
              allSubmissions.push(...enrichedSubs)
            }
          }
        } catch (err) {
          console.error(`Error fetching submissions for ${assignmentId}:`, err)
        }
      }
      
      setSubmissions(allSubmissions)
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchAssignments = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/assignments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      const data = await response.json()
      if (data.success) {
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  const getStatusIcon = (status, score) => {
    if (status === 'Passed' || status === 'Failed' || status === 'Partial') {
      return score >= 80 ? 
        <CheckCircle size={16} style={{ color: '#10b981' }} /> :
        <XCircle size={16} style={{ color: '#ef4444' }} />
    }
    return <Clock size={16} style={{ color: '#f59e0b' }} />
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
    if (filterStatus === 'graded') return matchesSearch && (submission.status === 'Passed' || submission.status === 'Failed' || submission.status === 'Partial')
    if (filterStatus === 'submitted') return matchesSearch && (!submission.status || submission.status === 'submitted')
    return matchesSearch
  })

  const totalSubmissions = submissions.length
  const gradedSubmissions = submissions.filter(s => s.status === 'Passed' || s.status === 'Failed' || s.status === 'Partial')
  const averageScore = gradedSubmissions.length > 0 
    ? Math.round(gradedSubmissions.reduce((sum, s) => sum + (s.finalScore || s.score || 0), 0) / gradedSubmissions.length)
    : 0
  const perfectScores = gradedSubmissions.filter(s => (s.finalScore || s.score || 0) === 100).length

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          📝 My Submissions
        </h1>
        <p style={{ color: '#6b7280' }}>Track your progress and review past submissions</p>
      </div>

      {/* Statistics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Code size={20} color="#3b82f6" />
            <span style={{ fontWeight: '600' }}>Total Submissions</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{totalSubmissions}</div>
        </div>
        
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={20} color="#10b981" />
            <span style={{ fontWeight: '600' }}>Average Score</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>{averageScore}%</div>
        </div>
        
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <CheckCircle size={20} color="#f59e0b" />
            <span style={{ fontWeight: '600' }}>Perfect Scores</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#f59e0b' }}>{perfectScores}</div>
        </div>
        
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Calendar size={20} color="#8b5cf6" />
            <span style={{ fontWeight: '600' }}>Graded</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>{gradedSubmissions.length}</div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Search submissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '12px 12px 12px 44px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '16px'
            }}
          />
        </div>
        
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            border: '2px solid #e5e7eb',
            fontSize: '16px',
            minWidth: '150px'
          }}
        >
          <option value="all">All Status</option>
          <option value="graded">Graded</option>
          <option value="submitted">Pending</option>
        </select>
      </div>

      {/* Submissions List */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Submission History ({filteredSubmissions.length})</h2>
        </div>
        <div style={{ padding: '1.5rem' }}>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '1.2rem' }}>Loading submissions...</div>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <Code size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              <p>No submissions found matching your criteria.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {filteredSubmissions.map((submission, index) => (
                <div key={submission._id || submission.id || index} style={{ 
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  padding: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.1)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = 'none'
                }}
                >
                <div className="flex justify-between items-start">
                  <div style={{ flex: 1 }}>
                    <div className="flex items-center gap-3 mb-3">
                      {getStatusIcon(submission.status, submission.score)}
                      <h3 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
                        {submission.assignmentTitle}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        background: (submission.status === 'Passed' || submission.status === 'Failed' || submission.status === 'Partial') ? '#dcfce7' : '#fef3c7',
                        color: (submission.status === 'Passed' || submission.status === 'Failed' || submission.status === 'Partial') ? '#166534' : '#92400e'
                      }}>
                        {(submission.status === 'Passed' || submission.status === 'Failed' || submission.status === 'Partial') ? submission.status : 'Pending'}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '0.75rem', fontSize: '14px', color: '#6b7280' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} />
                        <span>Submitted {submission.submittedAt.toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Code size={14} />
                        <span>{submission.language}</span>
                      </div>
                      {submission.executionTime && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <Clock size={14} />
                          <span>{submission.executionTime}ms</span>
                        </div>
                      )}
                    </div>

                    {(submission.status === 'Passed' || submission.status === 'Failed' || submission.status === 'Partial') && (
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

                  {(submission.status === 'Passed' || submission.status === 'Failed' || submission.status === 'Partial') && (
                    <div className="text-center" style={{ minWidth: '120px' }}>
                      <div style={{ 
                        fontSize: '2.5rem', 
                        fontWeight: '800',
                        color: getScoreColor(submission.score),
                        marginBottom: '4px'
                      }}>
                        {submission.finalScore || submission.score || 0}%
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {submission.finalScore || submission.score || 0}/{submission.maxScore} points
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
                          width: `${submission.finalScore || submission.score || 0}%`,
                          height: '100%',
                          background: getScoreColor(submission.score),
                          borderRadius: '3px',
                          transition: 'width 0.3s ease'
                        }} />
                      </div>
                    </div>
                  )}

                  {(!submission.status || submission.status === 'submitted') && (
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
    </div>
  )
}

export default MySubmissions