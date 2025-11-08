import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { AlertTriangle, Users, Code, Shield, ChevronDown } from 'lucide-react'

const PlagiarismDetection = () => {
  const { assignmentId } = useParams()
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalSubmissions, setTotalSubmissions] = useState(0)
  const [metrics, setMetrics] = useState(null)
  const [algorithm, setAlgorithm] = useState('')
  const [assignments, setAssignments] = useState([])
  const [selectedAssignmentId, setSelectedAssignmentId] = useState(assignmentId || '')

  useEffect(() => {
    fetchAssignments()
  }, [])

  useEffect(() => {
    if (selectedAssignmentId) {
      fetchPlagiarismResults(selectedAssignmentId)
    }
  }, [selectedAssignmentId])

  const fetchAssignments = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/assignments')
      const data = await response.json()
      if (data.success) {
        setAssignments(data.assignments)
        if (!selectedAssignmentId && data.assignments.length > 0) {
          setSelectedAssignmentId(data.assignments[0]._id)
        }
      }
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  const fetchPlagiarismResults = async (id) => {
    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/plagiarism/${id}`)
      const data = await response.json()
      
      if (data.success) {
        setResults(data.results)
        setTotalSubmissions(data.totalSubmissions)
        setMetrics(data.metrics)
        setAlgorithm(data.algorithm || 'Advanced Analysis')
      }
    } catch (error) {
      console.error('Error fetching plagiarism results:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRiskColor = (level) => {
    switch (level) {
      case 'High': return '#dc2626'
      case 'Medium': return '#f59e0b'
      case 'Low': return '#10b981'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1.2rem' }}>Analyzing submissions for plagiarism...</div>
      </div>
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ 
          fontSize: '2rem', 
          fontWeight: 'bold', 
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Shield size={32} color="#dc2626" />
          Plagiarism Detection Report
        </h1>
        <p style={{ color: '#6b7280' }}>
          {algorithm} • {totalSubmissions} submissions • {metrics?.totalComparisons || 0} comparisons
        </p>
        
        {/* Assignment Selector */}
        <div style={{ marginTop: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600' }}>Select Assignment:</label>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <select
              value={selectedAssignmentId}
              onChange={(e) => setSelectedAssignmentId(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: '8px',
                border: '2px solid #e5e7eb',
                fontSize: '16px',
                background: 'white',
                cursor: 'pointer',
                appearance: 'none'
              }}
            >
              <option value="">Choose an assignment...</option>
              {assignments.map(assignment => (
                <option key={assignment._id} value={assignment._id}>
                  {assignment.main?.name || assignment.title || 'Untitled Assignment'}
                </option>
              ))}
            </select>
            <ChevronDown 
              size={20} 
              style={{
                position: 'absolute',
                right: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                pointerEvents: 'none',
                color: '#6b7280'
              }}
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Users size={20} color="#3b82f6" />
            <span style={{ fontWeight: '600' }}>Total Submissions</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
            {totalSubmissions}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <AlertTriangle size={20} color="#dc2626" />
            <span style={{ fontWeight: '600' }}>Suspicious Pairs</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>
            {results.length}
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <Shield size={20} color="#10b981" />
            <span style={{ fontWeight: '600' }}>Avg Similarity</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
            {metrics?.averageSimilarity || 0}%
          </div>
        </div>
        
        {metrics && (
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Code size={20} color="#8b5cf6" />
              <span style={{ fontWeight: '600' }}>Risk Distribution</span>
            </div>
            <div style={{ fontSize: '0.9rem', color: '#6b7280' }}>
              High: {metrics.highRiskPairs} • Medium: {metrics.mediumRiskPairs} • Low: {metrics.lowRiskPairs}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '8px',
          textAlign: 'center',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Shield size={48} color="#10b981" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem', color: '#10b981' }}>
            No Plagiarism Detected
          </h3>
          <p style={{ color: '#6b7280' }}>
            {totalSubmissions > 0 ? 
              `All ${totalSubmissions} submissions appear to be original work. Great job maintaining academic integrity!` :
              'No submissions found for this assignment.'}
          </p>
          {metrics && (
            <div style={{ marginTop: '1rem', fontSize: '0.9rem', color: '#6b7280' }}>
              Analyzed {metrics.totalComparisons} code pairs using Winnowing algorithm with AST tokenization.
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {results.map((result, index) => (
            <div key={index} style={{
              background: 'white',
              border: `2px solid ${getRiskColor(result.riskLevel)}`,
              borderRadius: '8px',
              padding: '1.5rem',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: '1rem'
              }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                    {result.student1} ↔ {result.student2}
                  </h3>
                  <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
                    Language: {result.language.toUpperCase()} • Confidence: {result.confidence} • Length Match: {result.lengthRatio}%
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ 
                    fontSize: '1.5rem', 
                    fontWeight: 'bold', 
                    color: getRiskColor(result.riskLevel)
                  }}>
                    {result.similarity}%
                  </div>
                  <div style={{
                    background: getRiskColor(result.riskLevel),
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    fontWeight: '600'
                  }}>
                    {result.riskLevel} Risk
                  </div>
                </div>
              </div>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '1fr 1fr', 
                gap: '1rem',
                marginTop: '1rem'
              }}>
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Code size={16} />
                    {result.student1}'s Code
                  </h4>
                  <pre style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    overflow: 'auto',
                    maxHeight: '200px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {result.code1}
                  </pre>
                </div>
                <div>
                  <h4 style={{ 
                    fontSize: '1rem', 
                    fontWeight: '600', 
                    marginBottom: '0.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <Code size={16} />
                    {result.student2}'s Code
                  </h4>
                  <pre style={{
                    background: '#f8fafc',
                    padding: '1rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    overflow: 'auto',
                    maxHeight: '200px',
                    border: '1px solid #e2e8f0'
                  }}>
                    {result.code2}
                  </pre>
                </div>
              </div>

              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#fef3c7',
                borderRadius: '4px',
                border: '1px solid #f59e0b'
              }}>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>Winnowing Analysis:</strong> {result.similarity}% structural similarity detected.
                </div>
                <div style={{ fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                  <strong>Confidence:</strong> {result.confidence} • 
                  <strong>Length Ratio:</strong> {result.lengthRatio}% • 
                  <strong>Time Gap:</strong> {Math.round(result.timeDifference || 0)} min
                </div>
                <div style={{ fontSize: '0.9rem' }}>
                  <strong>Patterns:</strong> {result.analysis?.suspiciousPatterns?.join(', ') || 'Standard analysis'}
                </div>
                <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', fontWeight: '600' }}>
                  <strong>Recommendation:</strong> {result.analysis?.recommendation || 'Review recommended'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PlagiarismDetection