import { useState, useEffect } from 'react'
import { Users, CheckCircle, XCircle, Clock, Shield, FileText } from 'lucide-react'

const AdminDashboard = ({ user }) => {
  const [pendingInstructors, setPendingInstructors] = useState([])
  
  const [approvedInstructors, setApprovedInstructors] = useState([])
  const [rejectedInstructors, setRejectedInstructors] = useState([])

  useEffect(() => {
    fetchPendingInstructors()
    fetchApprovedInstructors()
  }, [])

  const fetchPendingInstructors = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/admin/pending-instructors', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setPendingInstructors(data.instructors)
      }
    } catch (error) {
      console.error('Failed to fetch pending instructors:', error)
    }
  }

  const fetchApprovedInstructors = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/admin/approved-instructors', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success) {
        setApprovedInstructors(data.instructors)
      }
    } catch (error) {
      console.error('Failed to fetch approved instructors:', error)
    }
  }

  const handleApprove = async (instructorId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/admin/approve-instructor/${instructorId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.success) {
        // Refresh the lists
        fetchPendingInstructors()
        fetchApprovedInstructors()
        alert('Instructor approved successfully!')
      }
    } catch (error) {
      console.error('Failed to approve instructor:', error)
      alert('Failed to approve instructor')
    }
  }

  const handleReject = async (instructorId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:3001/api/admin/reject-instructor/${instructorId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      
      if (data.success) {
        // Refresh the lists
        fetchPendingInstructors()
        alert('Instructor request rejected.')
      }
    } catch (error) {
      console.error('Failed to reject instructor:', error)
      alert('Failed to reject instructor')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative'
    }}>
      <div style={{ padding: '2rem', position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div className="flex justify-between items-center">
          <div>
            <h1 style={{ fontSize: '2.5rem', fontWeight: '800', marginBottom: '8px' }}>Admin Dashboard</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>Manage instructor approvals and system oversight</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Shield size={24} style={{ color: 'var(--danger)' }} />
            <span style={{ fontWeight: '600' }}>Administrator</span>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-4">
          <div className="metric-card card-warning" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.3 }}>
              <Clock size={40} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="metric-value" style={{ color: 'white', fontSize: '2.5rem' }}>{pendingInstructors.length}</div>
              <div className="metric-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Pending Approvals</div>
            </div>
          </div>
          
          <div className="metric-card card-success" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.3 }}>
              <CheckCircle size={40} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="metric-value" style={{ color: 'white', fontSize: '2.5rem' }}>{approvedInstructors.length}</div>
              <div className="metric-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Approved Instructors</div>
            </div>
          </div>
          
          <div className="metric-card card-danger" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.3 }}>
              <XCircle size={40} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="metric-value" style={{ color: 'white', fontSize: '2.5rem' }}>{rejectedInstructors.length}</div>
              <div className="metric-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Rejected Applications</div>
            </div>
          </div>
          
          <div className="metric-card card-instructor" style={{ position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: '16px', right: '16px', opacity: 0.3 }}>
              <Users size={40} />
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="metric-value" style={{ color: 'white', fontSize: '2.5rem' }}>{approvedInstructors.length + pendingInstructors.length}</div>
              <div className="metric-label" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Applications</div>
            </div>
          </div>
        </div>

        {/* Pending Instructor Approvals */}
        <div className="card">
          <div className="flex justify-between items-center mb-4">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Pending Instructor Approvals</h2>
            <span className="status-badge" style={{ background: 'var(--warning)', color: 'white' }}>
              {pendingInstructors.length} Pending
            </span>
          </div>
          
          {pendingInstructors.length === 0 ? (
            <div className="text-center" style={{ padding: '40px', color: 'var(--text-secondary)' }}>
              <CheckCircle size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
              <p>No pending instructor applications</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pendingInstructors.map(instructor => (
                <div key={instructor.id} className="card fade-in" style={{ 
                  margin: 0,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border)'
                }}>
                  <div className="flex justify-between items-start">
                    <div style={{ flex: 1 }}>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>{instructor.name}</h3>
                        <span className="status-badge" style={{ background: 'var(--warning)', color: 'white', fontSize: '10px' }}>
                          Pending
                        </span>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', margin: '4px 0', fontSize: '14px' }}>
                        {instructor.email}
                      </p>
                      <div className="grid grid-2 gap-4" style={{ marginTop: '12px' }}>
                        <div>
                          <strong>Department:</strong> {instructor.department || 'Not specified'}
                        </div>
                        <div>
                          <strong>Experience:</strong> {instructor.experience || 'Not specified'}
                        </div>
                      </div>
                      <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Applied: {new Date(instructor.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginLeft: '16px' }}>
                      <button
                        onClick={() => handleApprove(instructor._id)}
                        className="btn btn-success"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                      >
                        <CheckCircle size={16} />
                        Approve
                      </button>
                      <button
                        onClick={() => handleReject(instructor._id)}
                        className="btn btn-danger"
                        style={{ padding: '8px 16px', fontSize: '14px' }}
                      >
                        <XCircle size={16} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Approved Instructors */}
        {approvedInstructors.length > 0 && (
          <div className="card">
            <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '16px' }}>Approved Instructors</h2>
            <div className="grid gap-3">
              {approvedInstructors.map(instructor => (
                <div key={instructor.id} className="card fade-in" style={{ 
                  margin: 0,
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--success)'
                }}>
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>{instructor.name}</h4>
                      <p style={{ color: 'var(--text-secondary)', margin: '2px 0', fontSize: '14px' }}>
                        {instructor.email} • {instructor.department}
                      </p>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Approved: {new Date(instructor.approvedAt).toLocaleString()}
                      </div>
                    </div>
                    <span className="status-badge" style={{ background: 'var(--success)', color: 'white' }}>
                      <CheckCircle size={14} />
                      Approved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminDashboard