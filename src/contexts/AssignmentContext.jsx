import { createContext, useContext, useState, useEffect } from 'react'

const AssignmentContext = createContext()

export const useAssignments = () => {
  const context = useContext(AssignmentContext)
  if (!context) {
    throw new Error('useAssignments must be used within AssignmentProvider')
  }
  return context
}

export const AssignmentProvider = ({ children }) => {
  const [assignments, setAssignments] = useState([])
  const [submissions, setSubmissions] = useState([])
  const [participants, setParticipants] = useState(new Set())

  // Load data from backend first, then localStorage
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      // Try to fetch from backend first
      const response = await fetch('http://localhost:3001/api/assignments')
      const data = await response.json()
      if (data && Array.isArray(data)) {
        setAssignments(data)
        return
      }
    } catch (error) {
      console.log('Backend not available, loading from localStorage')
    }
    
    // Fallback to localStorage
    const savedAssignments = localStorage.getItem('assignments')
    const savedSubmissions = localStorage.getItem('submissions')
    const savedParticipants = localStorage.getItem('participants')
    
    if (savedAssignments) {
      setAssignments(JSON.parse(savedAssignments))
    }
    if (savedSubmissions) {
      setSubmissions(JSON.parse(savedSubmissions))
    }
    if (savedParticipants) {
      setParticipants(new Set(JSON.parse(savedParticipants)))
    }
  }

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('assignments', JSON.stringify(assignments))
  }, [assignments])

  useEffect(() => {
    localStorage.setItem('submissions', JSON.stringify(submissions))
  }, [submissions])

  useEffect(() => {
    localStorage.setItem('participants', JSON.stringify([...participants]))
  }, [participants])

  const addAssignment = async (assignment) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:3001/api/assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(assignment)
      })
      
      const data = await response.json()
      if (data && data._id) {
        setAssignments(prev => [data, ...prev])
        return data
      }
    } catch (error) {
      console.log('Backend not available, saving locally')
    }
    
    // Fallback to localStorage
    const newAssignment = {
      ...assignment,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      status: 'active',
      submissions: 0,
      participants: 0
    }
    setAssignments(prev => [...prev, newAssignment])
    return newAssignment
  }

  const updateAssignment = (id, updates) => {
    setAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
  }

  const deleteAssignment = (id) => {
    setAssignments(prev => prev.filter(a => a.id !== id))
    setSubmissions(prev => prev.filter(s => s.assignmentId !== id))
  }

  const addSubmission = (submission) => {
    const newSubmission = {
      ...submission,
      id: Date.now(),
      submittedAt: new Date().toISOString()
    }
    setSubmissions(prev => [...prev, newSubmission])
    
    // Update assignment stats
    const assignmentId = submission.assignmentId
    setAssignments(prev => prev.map(a => {
      if (a.id === assignmentId) {
        const assignmentSubmissions = submissions.filter(s => s.assignmentId === assignmentId).length + 1
        const uniqueParticipants = new Set(submissions.filter(s => s.assignmentId === assignmentId).map(s => s.userId))
        uniqueParticipants.add(submission.userId)
        
        return {
          ...a,
          submissions: assignmentSubmissions,
          participants: uniqueParticipants.size
        }
      }
      return a
    }))
    
    // Add to global participants
    setParticipants(prev => new Set([...prev, submission.userId]))
    
    return newSubmission
  }

  const getAssignmentById = (id) => {
    return assignments.find(a => a.id === parseInt(id))
  }

  const getSubmissionsByAssignment = (assignmentId) => {
    return submissions.filter(s => s.assignmentId === assignmentId)
  }

  const getSubmissionsByUser = (userId) => {
    return submissions.filter(s => s.userId === userId)
  }

  const getStats = () => {
    return {
      totalAssignments: assignments.length,
      totalSubmissions: submissions.length,
      totalParticipants: participants.size,
      activeAssignments: assignments.filter(a => a.status === 'active').length
    }
  }

  return (
    <AssignmentContext.Provider value={{
      assignments,
      submissions,
      participants: [...participants],
      addAssignment,
      updateAssignment,
      deleteAssignment,
      addSubmission,
      getAssignmentById,
      getSubmissionsByAssignment,
      getSubmissionsByUser,
      getStats
    }}>
      {children}
    </AssignmentContext.Provider>
  )
}