import { useState, useEffect } from 'react'
import { Users, Mail, Calendar, Award, Search, UserPlus, Edit, Trash2 } from 'lucide-react'

const ManageStudents = () => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      // Fetch all assignments and their submissions to get real data
      const assignmentsRes = await fetch('http://localhost:3001/api/assignments')
      let allSubmissions = []
      
      if (assignmentsRes.ok) {
        const assignmentsData = await assignmentsRes.json()
        const assignments = Array.isArray(assignmentsData) ? assignmentsData : assignmentsData.assignments || []
        
        // Fetch submissions for each assignment
        for (const assignment of assignments) {
          try {
            const subRes = await fetch(`http://localhost:3001/api/assignments/${assignment._id}/submissions`)
            if (subRes.ok) {
              const subData = await subRes.json()
              if (subData.success && subData.submissions) {
                allSubmissions.push(...subData.submissions)
              }
            }
          } catch (err) {
            console.error(`Error fetching submissions for ${assignment._id}:`, err)
          }
        }
      }
      
      // Group submissions by user to calculate stats
      const studentStats = {}
      allSubmissions.forEach(sub => {
        const userId = sub.userId?._id || sub.userId || 'unknown'
        const username = sub.userId?.username || sub.username || `Student_${userId}`
        const email = sub.userId?.email || sub.email || `${username}@example.com`
        
        if (!studentStats[userId]) {
          studentStats[userId] = {
            _id: userId,
            username: username,
            email: email,
            joinedAt: new Date(),
            submissions: 0,
            totalScore: 0,
            avgScore: 0
          }
        }
        studentStats[userId].submissions++
        studentStats[userId].totalScore += (sub.finalScore || sub.score || 0)
        studentStats[userId].avgScore = Math.round(studentStats[userId].totalScore / studentStats[userId].submissions)
      })
      
      setStudents(Object.values(studentStats))
    } catch (error) {
      console.error('Error fetching students:', error)
      setStudents([])
    } finally {
      setLoading(false)
    }
  }

  const filteredStudents = students.filter(student =>
    student.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem' }}>Loading students...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={32} color="#3b82f6" />
          Manage Students
        </h1>
        <p style={{ color: '#6b7280' }}>View and manage student accounts and performance</p>
      </div>

      {/* Search and Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6b7280' }} />
          <input
            type="text"
            placeholder="Search students..."
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
        <button
          onClick={() => setShowAddModal(true)}
          style={{
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <UserPlus size={20} />
          Add Student
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Users size={20} color="#3b82f6" />
            <span style={{ fontWeight: '600' }}>Total Students</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>{students.length}</div>
        </div>
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Award size={20} color="#10b981" />
            <span style={{ fontWeight: '600' }}>Avg Performance</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {students.length > 0 ? Math.round(students.reduce((sum, s) => sum + (s.avgScore || 0), 0) / students.length) : 0}%
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid #e5e7eb' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '600', margin: 0 }}>Students ({filteredStudents.length})</h2>
        </div>
        
        {filteredStudents.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
            <Users size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
            <p>No students found</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead style={{ background: '#f9fafb' }}>
                <tr>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Student</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Email</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Joined</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Submissions</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Avg Score</th>
                  <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600', color: '#374151' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student, index) => (
                  <tr key={student._id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          background: '#3b82f6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          fontWeight: 'bold'
                        }}>
                          {student.username?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div>
                          <div style={{ fontWeight: '600' }}>{student.username || 'Unknown'}</div>
                          <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Student</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Mail size={16} color="#6b7280" />
                        {student.email || 'No email'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Calendar size={16} color="#6b7280" />
                        {new Date(student.joinedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: '#dbeafe',
                        color: '#1e40af',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {student.submissions || 0}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{
                        background: student.avgScore >= 80 ? '#dcfce7' : student.avgScore >= 60 ? '#fef3c7' : '#fee2e2',
                        color: student.avgScore >= 80 ? '#166534' : student.avgScore >= 60 ? '#92400e' : '#991b1b',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        {student.avgScore || 0}%
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          style={{
                            background: '#10b981',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          title="Edit Student"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          style={{
                            background: '#ef4444',
                            color: 'white',
                            border: 'none',
                            padding: '0.5rem',
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          title="Remove Student"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default ManageStudents