import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Save, Download, Settings, AlertCircle, Eye, EyeOff, Flag } from 'lucide-react'
import BasicProctor from '../components/BasicProctor'
import ReportModal from '../components/ReportModal'

const LiveEditor = () => {
  const [code, setCode] = useState(`# Welcome to the Live Code Editor
# Write your code here and click Run to execute

def hello_world():
    print("Hello, World!")
    return "Success"

if __name__ == "__main__":
    result = hello_world()
    print(f"Result: {result}")`)
  
  const [language, setLanguage] = useState('python')
  const [output, setOutput] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [theme, setTheme] = useState('vs-dark')
  const [proctorActive, setProctorActive] = useState(false)
  const [violations, setViolations] = useState([])
  const [terminated, setTerminated] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [submissionCount, setSubmissionCount] = useState(0)
  const editorRef = useRef(null)

  const languageMap = {
    python: 'python',
    javascript: 'javascript',
    java: 'java',
    cpp: 'cpp'
  }

  const defaultCode = {
    python: `# Python Code
def hello_world():
    print("Hello, World!")
    return "Success"

if __name__ == "__main__":
    result = hello_world()
    print(f"Result: {result}")`,
    javascript: `// JavaScript Code
function main() {
    console.log("Hello, JavaScript!");
}

main();`,
    java: `// Java Code
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`,
    cpp: `// C++ Code
#include <iostream>
using namespace std;

int main() {
    cout << "Hello, C++!" << endl;
    return 0;
}`
  }

  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor
    
    // Configure Monaco Editor
    monaco.editor.defineTheme('custom-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#1e1e1e',
      }
    })
  }

  const runCode = async () => {
    setIsRunning(true)
    setOutput('Running code...')
    
    const pistonLanguageMap = {
      python: 'python',
      javascript: 'javascript', 
      java: 'java',
      cpp: 'cpp'
    }
    
    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          language: pistonLanguageMap[language],
          version: '*',
          files: [{
            content: code
          }]
        })
      })
      
      const result = await response.json()
      
      if (result.run) {
        const output = result.run.stdout || result.run.stderr || 'No output'
        setOutput(output)
      } else {
        setOutput('Execution failed: ' + (result.message || 'Unknown error'))
      }
    } catch (error) {
      setOutput(`Network Error: ${error.message}\n\nFailed to connect to Piston API. Please check your internet connection.`)
    }
    
    setIsRunning(false)
  }

  const saveCode = () => {
    localStorage.setItem('savedCode', JSON.stringify({ code, language }))
    alert('Code saved locally!')
  }

  const downloadCode = () => {
    const extensions = { python: 'py', javascript: 'js', java: 'java', cpp: 'cpp' }
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `code.${extensions[language]}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage)
    setCode(defaultCode[newLanguage])
  }

  const handleViolation = (type, message) => {
    if (terminated || violations.length >= 3) {
      return
    }
    
    const violation = { type, message, timestamp: new Date().toISOString() }
    setViolations(prev => {
      const newViolations = [...prev, violation]
      if (newViolations.length >= 3) {
        setTerminated(true)
        setTimeout(() => {
          const shouldReport = confirm('Maximum violations reached! Test terminated.\n\nIf you believe this was wrongful termination due to system malfunction, would you like to report it?')
          if (shouldReport) {
            setShowReportModal(true)
          }
          setProctorActive(false)
        }, 100)
      }
      return newViolations.slice(0, 3)
    })
  }

  const toggleProctor = async () => {
    if (!proctorActive) {
      try {
        await document.documentElement.requestFullscreen?.()
        setProctorActive(true)
      } catch (error) {
        alert('Please allow fullscreen access to enable proctoring')
      }
    } else {
      setProctorActive(false)
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {})
      }
    }
  }

  useEffect(() => {
    if (proctorActive) {
      // Disable right-click, copy-paste, dev tools
      const preventActions = (e) => {
        if (e.ctrlKey && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
          e.preventDefault()
          handleViolation('COPY_PASTE', 'Copy/paste attempt detected')
        }
        if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
          e.preventDefault()
        }
      }
      
      document.addEventListener('keydown', preventActions)
      document.addEventListener('contextmenu', (e) => e.preventDefault())
      
      return () => {
        document.removeEventListener('keydown', preventActions)
        document.removeEventListener('contextmenu', (e) => e.preventDefault())
      }
    }
  }, [proctorActive])

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
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
          💻 Live Code Editor {proctorActive && <span style={{color: '#ef4444', fontSize: '1rem'}}>(PROCTORED)</span>}
        </h1>
        <p style={{ color: '#6b7280' }}>Write, test, and execute code in real-time</p>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={toggleProctor}
            style={{
              background: proctorActive ? '#ef4444' : '#10b981',
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
            {proctorActive ? <EyeOff size={16} /> : <Eye size={16} />}
            {proctorActive ? 'Stop Proctor' : 'Start Proctor'}
          </button>
        </div>
        
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '16px',
              minWidth: '120px'
            }}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          
          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: '2px solid #e5e7eb',
              fontSize: '16px',
              minWidth: '120px'
            }}
          >
            <option value="vs-dark">Dark Theme</option>
            <option value="light">Light Theme</option>
            <option value="vs">VS Theme</option>
          </select>
        </div>
      </div>

      {proctorActive && (
        <div style={{
          backgroundColor: '#fef3c7',
          border: '1px solid #f59e0b',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{color: '#92400e', fontSize: '1.1rem', fontWeight: '600', marginBottom: '0.5rem'}}>⚠️ Proctoring Active</h4>
              <p style={{color: '#92400e', margin: '0 0 0.5rem 0'}}>Full-screen mode enforced • Tab switching monitored • Copy/paste disabled</p>
              <p style={{color: '#92400e', fontSize: '0.875rem', margin: 0}}>Violations: {violations.length}/3 • Submissions: {submissionCount}</p>
            </div>
            <button
              onClick={() => setShowReportModal(true)}
              style={{
                background: '#f59e0b',
                color: 'white',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '6px',
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Flag size={14} />
              Report Issue
            </button>
          </div>
        </div>
      )}

      <BasicProctor 
        isActive={proctorActive && !terminated} 
        onViolation={handleViolation}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: '70vh', gap: '1.5rem' }}>
        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            padding: '1rem 1.5rem', 
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>Code Editor</h3>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={saveCode} 
                title="Save Code"
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Save size={16} />
              </button>
              <button 
                onClick={downloadCode} 
                title="Download Code"
                style={{
                  background: '#6b7280',
                  color: 'white',
                  border: 'none',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                <Download size={16} />
              </button>
              <button
                onClick={runCode}
                disabled={isRunning}
                style={{
                  background: isRunning ? '#9ca3af' : '#3b82f6',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  cursor: isRunning ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Play size={16} />
                {isRunning ? 'Running...' : 'Run Code'}
              </button>
            </div>
          </div>
          
          <Editor
            height="calc(100% - 60px)"
            language={languageMap[language]}
            theme={theme}
            value={code}
            onChange={(value) => setCode(value || '')}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
              wordWrap: 'on'
            }}
          />
        </div>

        <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ 
            padding: '1rem 1.5rem', 
            borderBottom: '1px solid #e5e7eb', 
            background: '#f9fafb'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600', margin: 0 }}>Output Console</h3>
          </div>
          <div style={{ 
            padding: '1rem', 
            height: 'calc(100% - 60px)', 
            overflow: 'auto',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '14px',
            whiteSpace: 'pre-wrap'
          }}>
            {output || `Click "Run Code" to execute your ${language} code...`}
          </div>
        </div>
      </div>

      <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', padding: '1.5rem', marginTop: '2rem' }}>
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '1rem' }}>Editor Features</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', color: '#374151' }}>
            <li style={{ marginBottom: '0.5rem' }}>Multi-language support (Python, JavaScript, Java, C++)</li>
            <li style={{ marginBottom: '0.5rem' }}>Syntax highlighting and auto-completion</li>
            <li style={{ marginBottom: '0.5rem' }}>Dark/Light theme toggle</li>
            <li style={{ marginBottom: '0.5rem' }}>Local code saving</li>
          </ul>
          <ul style={{ listStyle: 'disc', paddingLeft: '1.25rem', color: '#374151' }}>
            <li style={{ marginBottom: '0.5rem' }}>Code execution with output display</li>
            <li style={{ marginBottom: '0.5rem' }}>Download code files</li>
            <li style={{ marginBottom: '0.5rem' }}>Real-time execution feedback</li>
            <li style={{ marginBottom: '0.5rem' }}>Proctoring and monitoring support</li>
          </ul>
        </div>
      </div>
      
      {showReportModal && (
        <ReportModal
          onClose={() => setShowReportModal(false)}
          assignmentId="current-assignment"
          assignmentName="Live Editor Session"
        />
      )}
    </div>
  )
}

export default LiveEditor