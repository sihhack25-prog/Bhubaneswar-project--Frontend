# 🤖 Digital TA - Automated Lab Grading Platform

A comprehensive, real-time automated lab grading platform that serves as your "Digital Teaching Assistant" providing instant feedback to students and objective, data-driven grading for instructors.

## 🚀 Core Features

### 🧑🏫 Instructor Dashboard
- **Assignment Management**: Create, edit, and manage assignments with comprehensive test cases
- **Real-time Analytics**: Track student performance with interactive charts and metrics
- **Automated Grading**: Instant, objective grading with detailed feedback
- **Student Progress Tracking**: Monitor individual and class-wide performance
- **Plagiarism Detection**: Advanced code similarity detection (coming soon)
- **Deadline Management**: Automated deadline tracking and notifications

### 🧑💻 Student Dashboard
- **Assignment Portal**: View all assignments with status indicators and deadlines
- **Live Code Editor**: In-browser IDE with Monaco Editor (VS Code engine)
- **Instant Feedback**: Real-time test case results and performance metrics
- **Progress Tracking**: Personal analytics and improvement insights
- **Leaderboard**: Competitive ranking system with achievements
- **Submission History**: Complete history of all submissions with detailed results

### 💻 Live Coding Environment
- **Multi-language Support**: Python, JavaScript, Java, C++
- **Real-time Execution**: Instant code testing and feedback
- **Syntax Highlighting**: Advanced code editing with auto-completion
- **Theme Support**: Dark/Light mode with customizable settings
- **Code Templates**: Language-specific starter templates
- **Performance Metrics**: Execution time and memory usage tracking

### 📊 Advanced Analytics
- **Performance Dashboards**: Comprehensive metrics and visualizations
- **Submission Trends**: Time-based analysis of student activity
- **Language Statistics**: Popular languages and usage patterns
- **Success Rates**: Assignment difficulty and completion analysis
- **Leaderboard System**: Competitive rankings with achievements
- **Progress Tracking**: Individual and class-wide improvement metrics

## Tech Stack

- **Framework**: React 18 with Vite
- **Editor**: Monaco Editor (@monaco-editor/react)
- **Routing**: React Router DOM
- **Charts**: Recharts
- **File Upload**: React Dropzone
- **Icons**: Lucide React
- **Styling**: Custom CSS with modern design

## Setup Instructions

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm run dev
   ```

3. **Access the Application**
   - Open http://localhost:3000 in your browser
   - Use the login page to select role (Student/Instructor)

## Project Structure

```
src/
├── components/
│   ├── Navbar.jsx
│   └── CreateAssignmentModal.jsx
├── pages/
│   ├── Login.jsx
│   ├── InstructorDashboard.jsx
│   ├── StudentDashboard.jsx
│   ├── AssignmentDetails.jsx
│   ├── LiveEditor.jsx
│   └── Analytics.jsx
├── App.jsx
├── main.jsx
└── index.css
```

## Key Components

### Monaco Editor Integration
- Full VS Code editing experience
- Multi-language syntax highlighting
- Customizable themes and settings
- Auto-completion and IntelliSense

### File Upload System
- Drag-and-drop interface using React Dropzone
- Support for multiple file formats
- Test case management for assignments

### Analytics & Visualization
- Interactive charts using Recharts
- Real-time performance metrics
- Student progress tracking

## Usage

### For Instructors
1. Login with "Instructor" role
2. Create assignments with test cases
3. Monitor student submissions
4. View analytics and performance data

### For Students
1. Login with "Student" role
2. Browse available assignments
3. Use live editor or upload code files
4. View submission results and feedback

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Adding New Features
1. Create components in `src/components/`
2. Add pages in `src/pages/`
3. Update routing in `App.jsx`
4. Add styles in `index.css`

## Future Enhancements

- Backend API integration
- Real-time WebSocket connections
- Plagiarism detection
- AI-powered code feedback
- Mobile responsive design improvements
- Advanced code execution environment

## Monaco Editor Configuration

The Monaco Editor is configured with:
- Custom themes (dark/light)
- Language-specific syntax highlighting
- Auto-completion and IntelliSense
- Minimap disabled for better UX
- Word wrap enabled
- Automatic layout adjustment

Note: Monaco Editor loads its language services and syntax highlighting automatically. No additional API keys are required for basic functionality.