import { useState, useRef, useEffect } from 'react'
import Editor from '@monaco-editor/react'
import { Play, Save, Download, Settings, AlertCircle, Eye, EyeOff } from 'lucide-react'
import BasicProctor from '../components/BasicProctor'

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
    
    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code,
          language
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setOutput(result.output)
      } else {
        setOutput(`Error: ${result.error}`)
      }
    } catch (error) {
      setOutput(`Network Error: ${error.message}\n\nNote: Backend API not available. Please set up code execution service.`)
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
    const violation = { type, message, timestamp: new Date().toISOString() }
    setViolations(prev => [...prev, violation])
    
    if (type === 'CAMERA_VIOLATION' || violations.length >= 5) {
      alert('Test terminated due to proctoring violations!')
      setProctorActive(false)
    }
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
    <div>
      <div className="flex justify-between items-center mb-4">
        <h1>Live Code Editor {proctorActive && <span style={{color: 'red'}}>(PROCTORED)</span>}</h1>
        <div className="flex gap-2">
          <button
            onClick={toggleProctor}
            className={`btn ${proctorActive ? 'btn-danger' : 'btn-success'} flex items-center gap-2`}
          >
            {proctorActive ? <EyeOff size={16} /> : <Eye size={16} />}
            {proctorActive ? 'Stop Proctor' : 'Start Proctor'}
          </button>
          <select
            className="form-input"
            value={language}
            onChange={(e) => changeLanguage(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="python">Python</option>
            <option value="javascript">JavaScript</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          
          <select
            className="form-input"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="vs-dark">Dark Theme</option>
            <option value="light">Light Theme</option>
            <option value="vs">VS Theme</option>
          </select>
        </div>
      </div>

      {proctorActive && (
        <div className="card mb-4" style={{backgroundColor: '#fff3cd', border: '1px solid #ffeaa7'}}>
          <h4 style={{color: '#856404'}}>⚠️ Proctoring Active</h4>
          <p style={{color: '#856404', margin: '5px 0'}}>Full-screen mode enforced • Tab switching monitored • Copy/paste disabled</p>
          <p style={{color: '#856404', fontSize: '12px'}}>Violations: {violations.length}/5</p>
        </div>
      )}

      <BasicProctor 
        isActive={proctorActive} 
        onViolation={handleViolation}
      />

      <div className="grid grid-2" style={{ height: '70vh', gap: '20px' }}>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="flex justify-between items-center" style={{ padding: '12px 16px', borderBottom: '1px solid #ddd' }}>
            <h3>Code Editor</h3>
            <div className="flex gap-2">
              <button onClick={saveCode} className="btn btn-secondary" title="Save Code">
                <Save size={16} />
              </button>
              <button onClick={downloadCode} className="btn btn-secondary" title="Download Code">
                <Download size={16} />
              </button>
              <button
                onClick={runCode}
                disabled={isRunning}
                className="btn btn-primary flex items-center gap-2"
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

        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #ddd', backgroundColor: '#f8f9fa' }}>
            <h3>Output Console</h3>
          </div>
          <div style={{ 
            padding: '16px', 
            height: 'calc(100% - 60px)', 
            overflow: 'auto',
            backgroundColor: '#1e1e1e',
            color: '#d4d4d4',
            fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
            fontSize: '14px',
            whiteSpace: 'pre-wrap'
          }}>
            {output || 'Click "Run Code" to see output here...'}
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="mb-2">Editor Features</h3>
        <div className="grid grid-2">
          <ul style={{ listStyle: 'disc', paddingLeft: '20px' }}>
            <li>Multi-language support (Python, JavaScript, Java, C++)</li>
            <li>Syntax highlighting and auto-completion</li>
            <li>Dark/Light theme toggle</li>
            <li>Local code saving</li>
          </ul>
          <ul style={{ listStyle: 'disc', paddingLeft: '20px' }}>
            <li>Code execution with output display</li>
            <li>Download code files</li>
            <li>Real-time execution feedback</li>
            <li>Memory and time usage statistics</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LiveEditor