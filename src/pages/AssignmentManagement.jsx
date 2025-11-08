import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Edit, Trash2, Eye, Calendar, Users, BarChart3 } from 'lucide-react'
import CreateAssignmentModal from '../components/CreateAssignmentModal'

const AssignmentManagement = () => {
  const [assignments, setAssignments] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAssignments()
  }, [])

  const fetchAssignments = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/assignments')
      const data = await response.json()
      if (data.success) {
        setAssignments(data.assignments)
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAssignment = (newAssignment) => {
    // Assignment creation is handled in the modal
    setAssignments([newAssignment, ...assignments])
    setShowModal(false)
  }

  const getStatusBadge = (deadline) => {
    if (!deadline) return { text: 'Active', class: 'status-open' }
    
    const now = new Date()
    const dueDate = new Date(deadline)
    
    if (dueDate > now) {
      const daysLeft = Math.ceil((dueDate - now) / (1000 * 60 * 60 * 24))
      if (daysLeft <= 1) return { text: 'Due Soon', class: 'status-submitted' }
      return { text: 'Active', class: 'status-open' }
    }
    return { text: 'Closed', class: 'status-graded' }
  }

  const filteredAssignments = assignments.filter(assignment => {
    const title = assignment.title || assignment.main?.name || ''
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase())
    const status = getStatusBadge(assignment.deadline)
    
    if (filterStatus === 'all') return matchesSearch
    if (filterStatus === 'active') return matchesSearch && status.text !== 'Closed'
    if (filterStatus === 'closed') return matchesSearch && status.text === 'Closed'
    return matchesSearch
  })

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Assignment Management</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Create, manage, and track all assignments</p>
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

      {/* Filters and Search */}
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
                placeholder="Search assignments..."
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
              <option value="active">Active</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary">
              <Filter size={16} />
              More Filters
            </button>
          </div>
        </div>
      </div>

      {/* Assignment Table */}
      <div className="card">
        <div className="mb-4">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>All Assignments ({filteredAssignments.length})</h2>
        </div>

        {loading ? (
          <div className="text-center" style={{ padding: '60px' }}>
            <div className="loading-spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '16px' }}>Loading assignments...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="text-center" style={{ padding: '60px', color: 'var(--text-secondary)' }}>
            <BarChart3 size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <p>No assignments found matching your criteria.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Title</th>
                  <th style={{ padding: '16px', textAlign: 'left', fontWeight: '600', color: 'var(--text-secondary)' }}>Deadline</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Submissions</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Avg Score</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Status</th>
                  <th style={{ padding: '16px', textAlign: 'center', fontWeight: '600', color: 'var(--text-secondary)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map(assignment => {
                  const status = getStatusBadge(assignment.deadline)
                  return (
                    <tr key={assignment._id} style={{ 
                      borderBottom: '1px solid var(--border)',
                      transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => e.target.closest('tr').style.backgroundColor = 'var(--bg-secondary)'}
                    onMouseLeave={(e) => e.target.closest('tr').style.backgroundColor = 'transparent'}
                    >
                      <td style={{ padding: '16px' }}>
                        <div>
                          <h3 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{assignment.main?.name || assignment.title || 'Untitled Assignment'}</h3>
                          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>
                            {assignment.main?.code_default_language || 'javascript'} • {assignment.testCases?.length || 0} test cases
                          </p>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div className="flex items-center gap-2">
                          <Calendar size={16} style={{ color: 'var(--text-secondary)' }} />
                          <span style={{ fontSize: '14px' }}>{assignment.deadline ? new Date(assignment.deadline).toLocaleDateString() : 'No deadline'}</span>
                        </div>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '2px 0 0 22px' }}>
                          {assignment.deadline ? new Date(assignment.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div className="flex items-center justify-center gap-1">
                          <Users size={16} style={{ color: 'var(--text-secondary)' }} />
                          <span style={{ fontSize: '16px', fontWeight: '600' }}>{assignment.submissions || 0}</span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span style={{ 
                          fontSize: '16px', 
                          fontWeight: '700',
                          color: assignment.avgScore >= 80 ? 'var(--success)' : 
                                assignment.avgScore >= 60 ? 'var(--warning)' : 'var(--danger)'
                        }}>
                          {assignment.avgScore || 0}%
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <span className={`status-badge ${status.class}`}>
                          {status.text}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'center' }}>
                        <div className="flex items-center justify-center gap-2">
                          <button className="btn btn-secondary" style={{ padding: '8px' }} title="View Details">
                            <Eye size={16} />
                          </button>
                          <button className="btn btn-secondary" style={{ padding: '8px' }} title="Edit Assignment">
                            <Edit size={16} />
                          </button>
                          <button className="btn btn-danger" style={{ padding: '8px' }} title="Delete Assignment">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <CreateAssignmentModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateAssignment}
        />
      )}
    </div>
  )
}

export default AssignmentManagement