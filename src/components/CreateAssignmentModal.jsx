import { useState } from 'react'
import { X, Upload, Code, FileText, Zap } from 'lucide-react'
import { useAssignments } from '../contexts/AssignmentContext'

const CreateAssignmentModal = ({ onClose, onSubmit }) => {
  const { addAssignment } = useAssignments()
  
  const getTemplatePlaceholder = (lang, functionName) => {
    const fname = functionName || 'solution'
    switch (lang) {
      case 'javascript':
        return `function ${fname}() {\n    // Your code here\n}`
      case 'python':
        return `def ${fname}():\n    # Your code here\n    pass`
      case 'java':
        return `public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}`
      case 'cpp':
        return `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}`
      default:
        return '// Your code here'
    }
  }
  const [formData, setFormData] = useState({
    name: '',
    difficulty: 'easy',
    description: '',
    functionName: '',
    codeTemplates: {
      javascript: '',
      python: '',
      java: '',
      cpp: ''
    },
    editorial: '',
    timeLimit: 60,
    deadline: ''
  })
  const [supportedLanguages, setSupportedLanguages] = useState(['javascript'])
  const [testFile, setTestFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const assignmentData = {
        main: {
          id: Date.now(),
          name: formData.name,
          difficulty: formData.difficulty,
          description_body: formData.description,
          like_count: 0,
          dislike_count: 0,
          accept_count: 0,
          submission_count: 0,
          acceptance_rate_count: 0,
          discussion_count: 0,
          related_topics: [],
          similar_questions: [],
          solution_count: 0,
          code_default_language: supportedLanguages[0],
          code_body: {
            javascript: supportedLanguages.includes('javascript') ? (formData.codeTemplates.javascript || `function ${formData.functionName}() {\n    // Your code here\n}`) : '',
            python: supportedLanguages.includes('python') ? (formData.codeTemplates.python || `def ${formData.functionName}():\n    # Your code here\n    pass`) : '',
            java: supportedLanguages.includes('java') ? (formData.codeTemplates.java || `public class Main {\n    public static void main(String[] args) {\n        // Your code here\n    }\n}`) : '',
            cpp: supportedLanguages.includes('cpp') ? (formData.codeTemplates.cpp || `#include <iostream>\nusing namespace std;\n\nint main() {\n    // Your code here\n    return 0;\n}`) : ''
          },
          supported_languages: supportedLanguages
        },
        timeLimit: formData.timeLimit,
        deadline: new Date(formData.deadline),
        editorial: {
          editorial_body: formData.editorial
        },
        function_name: formData.functionName,
        test: []
      }

      // Create mock user token if not exists
      if (!localStorage.getItem('token')) {
        localStorage.setItem('token', 'mock-instructor-token')
      }

      const formDataToSend = new FormData()
      formDataToSend.append('assignmentData', JSON.stringify(assignmentData))
      
      if (testFile) {
        formDataToSend.append('testFile', testFile)
      }

      // Try backend first, fallback to mock
      try {
        const token = localStorage.getItem('token')
        const response = await fetch('http://localhost:3001/api/assignments', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataToSend
        })

        const result = await response.json()
        if (result.success) {
          onSubmit(result.assignment)
          onClose()
          return
        }
      } catch (backendError) {
        console.log('Backend not available, using mock data')
      }

      // Fallback to mock - use context
      const newAssignment = addAssignment(assignmentData)
      onSubmit(newAssignment)
      onClose()
    } catch (error) {
      console.error('Error creating assignment:', error)
      alert('Error creating assignment')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleFileChange = (e) => {
    setTestFile(e.target.files[0])
  }

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '800px', maxHeight: '90vh', overflow: 'auto' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Code size={24} style={{ color: 'var(--accent-primary)' }} />
            Create New Assignment
          </h2>
          <button onClick={onClose} className="btn-icon">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4">
          {/* Problem Name */}
          <div className="form-group">
            <label className="form-label">Problem Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., Two Sum, Binary Search"
              required
            />
          </div>

          {/* Difficulty */}
          <div className="form-group">
            <label className="form-label">Difficulty</label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleInputChange}
              className="form-input"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label">Problem Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className="form-input"
              rows="4"
              placeholder="Describe the problem statement, constraints, and examples..."
              required
            />
          </div>

          {/* Function Name */}
          <div className="form-group">
            <label className="form-label">Function Name</label>
            <input
              type="text"
              name="functionName"
              value={formData.functionName}
              onChange={handleInputChange}
              className="form-input"
              placeholder="e.g., twoSum, binarySearch"
              required
            />
          </div>

          {/* Code Template */}
          {/* Supported Languages */}
          <div className="form-group">
            <label className="form-label">Supported Languages</label>
            <div className="grid grid-2" style={{ gap: '12px' }}>
              {['javascript', 'python', 'java', 'cpp'].map(lang => (
                <label key={lang} className="flex items-center gap-2" style={{ cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={supportedLanguages.includes(lang)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSupportedLanguages([...supportedLanguages, lang])
                      } else {
                        setSupportedLanguages(supportedLanguages.filter(l => l !== lang))
                      }
                    }}
                  />
                  <span style={{ textTransform: 'capitalize' }}>{lang === 'cpp' ? 'C++' : lang}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Code Templates for each language */}
          {supportedLanguages.map(lang => (
            <div key={lang} className="form-group">
              <label className="form-label">Code Template ({lang === 'cpp' ? 'C++' : lang.charAt(0).toUpperCase() + lang.slice(1)})</label>
              <textarea
                value={formData.codeTemplates[lang]}
                onChange={(e) => setFormData({
                  ...formData,
                  codeTemplates: {
                    ...formData.codeTemplates,
                    [lang]: e.target.value
                  }
                })}
                className="form-input"
                rows="4"
                placeholder={getTemplatePlaceholder(lang, formData.functionName)}
                style={{ fontFamily: 'monospace', fontSize: '14px' }}
              />
            </div>
          ))}

          {/* Time Limit */}
          <div className="form-group">
            <label className="form-label">Time Limit (minutes)</label>
            <input
              type="number"
              name="timeLimit"
              value={formData.timeLimit}
              onChange={handleInputChange}
              className="form-input"
              min="5"
              max="180"
              required
            />
          </div>

          {/* Deadline */}
          <div className="form-group">
            <label className="form-label">Deadline</label>
            <input
              type="datetime-local"
              name="deadline"
              value={formData.deadline}
              onChange={handleInputChange}
              className="form-input"
              required
            />
          </div>

          {/* Editorial */}
          <div className="form-group">
            <label className="form-label">Editorial (Optional)</label>
            <textarea
              name="editorial"
              value={formData.editorial}
              onChange={handleInputChange}
              className="form-input"
              rows="3"
              placeholder="Explain the solution approach, time/space complexity..."
            />
          </div>

          {/* Test Cases File Upload */}
          <div className="form-group">
            <label className="form-label">
              <Upload size={16} style={{ display: 'inline', marginRight: '8px' }} />
              Test Cases File
            </label>
            <input
              type="file"
              accept=".txt,.json"
              onChange={handleFileChange}
              className="form-input"
              style={{ padding: '12px' }}
            />
            <div style={{ 
              background: 'var(--bg-secondary)', 
              padding: '12px', 
              borderRadius: '8px', 
              marginTop: '8px',
              fontSize: '14px',
              color: 'var(--text-secondary)'
            }}>
              <p style={{ fontWeight: '600', marginBottom: '8px' }}>📝 Test Case Format:</p>
              <p>Each line should be a JSON array: <code>[[input1, input2], expected_output]</code></p>
              <p style={{ marginTop: '4px' }}>Example:</p>
              <code style={{ 
                display: 'block', 
                background: 'var(--bg-primary)', 
                padding: '8px', 
                borderRadius: '4px',
                marginTop: '4px',
                fontFamily: 'monospace'
              }}>
                [[2, 7, 11, 15], 9, [0, 1]]<br/>
                [[3, 2, 4], 6, [1, 2]]<br/>
                [[3, 3], 6, [0, 1]]
              </code>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3" style={{ marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" style={{ width: '16px', height: '16px' }}></div>
                  Creating...
                </>
              ) : (
                <>
                  <Zap size={16} />
                  Create Assignment
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateAssignmentModal