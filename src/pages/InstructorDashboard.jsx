import { useState, useEffect } from 'react'
import { Plus, Calendar, Users, FileText, TrendingUp, Clock, CheckCircle, AlertTriangle, BarChart3, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import CreateAssignmentModal from '../components/CreateAssignmentModal'
import { useAssignments } from '../contexts/AssignmentContext'

const InstructorDashboard = () => {
  const navigate = useNavigate()
  const { assignments: contextAssignments, submissions, participants, getStats, getSubmissionsByAssignment } = useAssignments()
  const [showModal, setShowModal] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [showSubmissions, setShowSubmissions] = useState(false)
  const [assignmentSubmissions, setAssignmentSubmissions] = useState([])
  const [assignments, setAssignments] = useState([])
  const [analytics, setAnalytics] = useState({
    totalStudents: 0,
    totalInstructors: 1,
    totalAssignments: 0,
    totalSubmissions: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignments()
    fetchAnalytics()
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

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setAnalytics(data.analytics)
      } else {
        const stats = getStats()
        setAnalytics({
          totalStudents: participants.length,
          totalInstructors: 1,
          totalAssignments: stats.totalAssignments,
          totalSubmissions: stats.totalSubmissions
        })
      }
    } catch (error) {
      const stats = getStats()
      setAnalytics({
        totalStudents: participants.length,
        totalInstructors: 1,
        totalAssignments: stats.totalAssignments,
        totalSubmissions: stats.totalSubmissions
      })
    }
  }

  const handleViewSubmissions = async (assignment) => {
    try {
      const response = await fetch(`http://localhost:3001/api/assignments/${assignment._id || assignment.id}/submissions`)
      const data = await response.json()
      if (data.success) {
        setAssignmentSubmissions(data.submissions)
      } else {
        setAssignmentSubmissions([])
      }
    } catch (error) {
      console.error('Error fetching submissions:', error)
      const subs = getSubmissionsByAssignment(assignment.id)
      setAssignmentSubmissions(subs)
    }
    setSelectedAssignment(assignment)
    setShowSubmissions(true)
  }

  const handleCreateAssignment = (newAssignment) => {
    // Assignment creation is handled in the modal via context
    setShowModal(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative'
    }}>
      <div style={{ padding: '2rem', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Instructor Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Manage assignments and track student progress</p>
          </div>
        <button
          onClick={() => setShowModal(true)}
          className="btn btn-primary flex items-center gap-2"
          style={{ padding: '16px 24px', fontSize: '16px' }}
        >
          <Plus size={20} />
          Create Assignment
        </button>
      </div>

      {/* Quick Overview Cards */}
      <div className="grid grid-4">
        <div className="metric-card card-instructor" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.3 }}>
            <FileText size={40} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="metric-value" style={{ color: 'white', fontSize: '2.5rem' }}>{analytics.totalAssignments}</div>
            <div className="metric-label" style={{ color: 'rgba(0, 0, 0, 0.9)' }}>Total Assignments</div>
          </div>
        </div>
        
        <div className="metric-card card-student" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.3 }}>
            <Users size={40} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="metric-value" style={{ color: 'white', fontSize: '2.5rem' }}>{analytics.totalStudents}</div>
            <div className="metric-label" style={{ color: 'rgba(0,0,0,0.9)' }}>Active Students</div>
          </div>
        </div>
        
        <div className="metric-card card-success" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.3 }}>
            <TrendingUp size={40} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="metric-value" style={{ color: 'white', fontSize: '2.5rem' }}>{analytics.totalSubmissions}</div>
            <div className="metric-label" style={{ color: 'rgba(0,0,0,0.9)' }}>Total Submissions</div>
          </div>
        </div>
        
        <div className="metric-card card-warning" style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.3 }}>
            <Clock size={40} />
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div className="metric-value" style={{ color: 'white', fontSize: '2.5rem' }}>{analytics.totalInstructors}</div>
            <div className="metric-label" style={{ color: 'rgba(0,0,0,0.9)' }}> Total Instructors</div>
          </div>
        </div>
      </div>

      {/* Assignment Management Section */}
      <div className="grid grid-2" style={{ gap: '24px' }}>
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Recent Assignments</h2>
            <button className="btn btn-secondary" style={{ fontSize: '14px' }}>
              <BarChart3 size={16} />
              View All
            </button>
          </div>
          
          {loading ? (
            <div className="text-center" style={{ padding: '40px' }}>
              <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
              <p style={{ marginTop: '16px' }}>Loading assignments...</p>
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
              <FileText size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No assignments created yet. Create your first assignment!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {assignments.slice(0, 3).map(assignment => (
                <div key={assignment.id || assignment._id} className="card fade-in" style={{ 
                  margin: 0, 
                  cursor: 'pointer',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => handleViewSubmissions(assignment)}>
                  <div className="flex justify-between items-center">
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 style={{ marginBottom: '0', fontSize: '16px', fontWeight: '600' }}>{assignment.name || assignment.main?.name || 'Untitled'}</h3>
                        <span className={`status-badge status-open`} style={{ fontSize: '10px' }}>
                          {assignment.difficulty || assignment.main?.difficulty || 'easy'}
                        </span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            navigate(`/plagiarism/${assignment._id || assignment.id}`)
                          }}
                          style={{
                            background: '#dc2626',
                            color: 'white',
                            border: 'none',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          <Shield size={12} />
                          Check Plagiarism
                        </button>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0', fontSize: '13px', lineHeight: '1.4' }}>
                        {(assignment.description || assignment.main?.description_body || 'No description').substring(0, 80)}...
                      </p>
                      <div className="flex gap-3" style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        <span>Created: {new Date(assignment.createdAt).toLocaleDateString()}</span>
                        <span>Language: {assignment.supportedLanguages?.[0] || assignment.main?.code_default_language || 'javascript'}</span>
                        <span>Submissions: {assignment.submissions || assignment.main?.submission_count || 0}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div style={{ fontSize: '24px', fontWeight: '700', color: 'var(--accent-primary)' }}>
                        {assignment.test?.length || 0}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Test Cases</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Quick Actions & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>Quick Actions</h3>
            <div className="grid gap-3">
              <button className="btn btn-primary" style={{ justifyContent: 'flex-start', padding: '16px' }}>
                <Plus size={20} />
                Create New Assignment
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '16px' }}>
                <Users size={20} />
                Manage Students
              </button>
              <button className="btn btn-secondary" style={{ justifyContent: 'flex-start', padding: '16px' }}>
                <BarChart3 size={20} />
                View Analytics
              </button>
              <button 
                onClick={() => {
                  if (assignments.length > 0) {
                    navigate(`/plagiarism/${assignments[0]._id || assignments[0].id}`)
                  } else {
                    navigate('/plagiarism')
                  }
                }}
                className="btn" 
                style={{ 
                  justifyContent: 'flex-start', 
                  padding: '16px',
                  background: '#dc2626',
                  color: 'white',
                  border: 'none'
                }}
              >
                <Shield size={20} />
                Plagiarism Detection
              </button>
            </div>
          </div>
          
          <div className="card">
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>Recent Activity</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <CheckCircle size={16} style={{ color: 'var(--success)' }} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>New submission received</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Binary Search - Student A</p>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'right' }}>2m ago</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <AlertTriangle size={16} style={{ color: 'var(--warning)' }} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>Assignment deadline approaching</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>Two Sum Problem - 2 days left</p>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'right' }}>1h ago</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
                <Users size={16} style={{ color: 'var(--student-primary)' }} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <p style={{ fontSize: '14px', margin: 0, fontWeight: '500' }}>3 new students enrolled</p>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0 }}>CS101 Data Structures</p>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '40px', textAlign: 'right' }}>3h ago</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <CreateAssignmentModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateAssignment}
        />
      )}

      {showSubmissions && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '1000px', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="flex justify-between items-center mb-6">
              <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                Submissions: {selectedAssignment?.name || selectedAssignment?.main?.name}
              </h2>
              <button onClick={() => setShowSubmissions(false)} className="btn-icon">
                ×
              </button>
            </div>

            {assignmentSubmissions.length === 0 ? (
              <div className="text-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
                <p>No submissions yet for this assignment.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {assignmentSubmissions.map((submission, index) => (
                  <div key={submission._id} className="card" style={{ margin: 0 }}>
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '4px' }}>
                          {submission.userId?.username || 'Unknown Student'}
                        </h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                          {submission.userId?.email}
                        </p>
                      </div>
                      <div className="text-right">
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: '700',
                          color: submission.status === 'Passed' ? 'var(--success)' : 
                                submission.status === 'Partial' ? 'var(--warning)' : 'var(--danger)'
                        }}>
                          {submission.score}%
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {submission.status}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-3 gap-4 mb-3">
                      <div>
                        <strong>Language:</strong> {submission.language}
                      </div>
                      <div>
                        <strong>Tests:</strong> {submission.passedTests}/{submission.totalTests}
                      </div>
                      <div>
                        <strong>Time:</strong> {Math.floor(submission.timeTaken / 60)}m {submission.timeTaken % 60}s
                      </div>
                    </div>

                    <div style={{ marginBottom: '12px' }}>
                      <strong>Submitted:</strong> {new Date(submission.submittedAt).toLocaleString()}
                    </div>

                    <details style={{ marginTop: '12px' }}>
                      <summary style={{ cursor: 'pointer', fontWeight: '600', marginBottom: '8px' }}>
                        View Code & Test Results
                      </summary>
                      
                      <div style={{ 
                        background: 'var(--bg-tertiary)', 
                        padding: '12px', 
                        borderRadius: '8px',
                        marginBottom: '12px'
                      }}>
                        <strong>Code:</strong>
                        <pre style={{ 
                          background: 'var(--bg-primary)', 
                          padding: '12px', 
                          borderRadius: '4px',
                          fontSize: '14px',
                          fontFamily: 'monospace',
                          overflow: 'auto',
                          marginTop: '8px'
                        }}>
                          {submission.code}
                        </pre>
                      </div>

                      <div>
                        <strong>Test Results:</strong>
                        <div className="grid gap-2" style={{ marginTop: '8px' }}>
                          {submission.testResults?.map((test, testIndex) => (
                            <div key={testIndex} style={{
                              padding: '8px',
                              border: `1px solid ${test.passed ? 'var(--success)' : 'var(--danger)'}`,
                              borderRadius: '4px',
                              fontSize: '14px'
                            }}>
                              <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                                Test {test.testCase}: {test.passed ? '✅ PASSED' : '❌ FAILED'}
                              </div>
                              <div>Input: {JSON.stringify(test.input)}</div>
                              <div>Expected: {test.expected}</div>
                              <div>Got: {test.actual}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default InstructorDashboard