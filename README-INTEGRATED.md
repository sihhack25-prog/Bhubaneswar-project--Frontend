# 🤖 Digital TA - Integrated Enhanced Platform

A comprehensive, real-time automated lab grading platform with advanced features including Redis queue management, enhanced analytics, proctoring system, and file upload capabilities.

## 🚀 New Integrated Features

### 🔄 Redis Queue System
- **High-Performance Execution**: Handles thousands of concurrent code execution requests
- **Job Queue Management**: Separate queues for code execution and submissions
- **Automatic Retry**: 3 attempts with exponential backoff
- **Rate Limiting**: 20 code executions and 10 submissions per minute per user
- **Fallback Mode**: Direct execution when Redis is unavailable

### 📊 Enhanced Analytics Dashboard
- **Real-time Metrics**: Live submission statistics and performance tracking
- **Advanced Visualizations**: Pie charts, bar charts, and trend analysis
- **Anonymous Mode**: Privacy-focused analytics viewing
- **Language Usage Statistics**: Track popular programming languages
- **Assignment Performance Overview**: Detailed per-assignment analytics
- **Success Rate Tracking**: Comprehensive performance insights

### 🏆 Advanced Leaderboard System
- **Dynamic Rankings**: Real-time student performance tracking
- **Badge System**: Crown, Trophy, Medal badges for top performers
- **Streak Tracking**: Daily submission streaks and improvement trends
- **User Rank Cards**: Personalized performance summaries
- **Time-based Filtering**: All-time, monthly, and weekly rankings
- **Interactive UI**: Hover effects and responsive design

### 📁 File Upload & Management
- **Drag & Drop Interface**: Easy file upload for code submissions
- **Multi-format Support**: .js, .py, .java, .cpp, .txt files
- **Auto Language Detection**: Automatic language selection from file extension
- **File Preview**: View uploaded files before submission
- **Template Downloads**: Sample input and code templates

### 🛡️ Enhanced Proctoring System
- **Camera Monitoring**: Real-time video surveillance during assignments
- **Violation Tracking**: Tab switching, fullscreen exit, copy/paste detection
- **Automatic Termination**: Assignment termination after 3 violations
- **Secure Mode**: Fullscreen enforcement and keyboard restrictions
- **Visual Indicators**: Real-time violation counter and status display

### ⚡ Performance Optimizations
- **Loading Spinners**: Enhanced user feedback during operations
- **Metric Cards**: Beautiful gradient cards for key statistics
- **Responsive Design**: Mobile-optimized interface
- **Smooth Animations**: Fade-in, slide-up, and pulse effects
- **Status Indicators**: Color-coded status badges for submissions

## 🛠️ Technical Stack

### Frontend
- **React 18** with Vite for fast development
- **Monaco Editor** for advanced code editing
- **Recharts** for data visualization
- **React Dropzone** for file uploads
- **Lucide React** for modern icons
- **Custom CSS** with CSS Grid and Flexbox

### Backend
- **Express.js** with enhanced middleware
- **Redis & Bull** for job queue management
- **Express Rate Limit** for API protection
- **JWT Authentication** with bcrypt hashing
- **Multer** for file upload handling
- **Child Process** for secure code execution

### Dependencies
```json
{
  "bull": "^4.16.5",
  "express-rate-limit": "^8.2.1",
  "ioredis": "^5.8.2"
}
```

## 🚀 Setup Instructions

### 1. Install Redis (Required for Queue System)

#### Windows
```bash
# Download from: https://github.com/microsoftarchive/redis/releases
# Install and start Redis server
redis-server
```

#### Linux/Mac
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# macOS
brew install redis
brew services start redis
```

### 2. Verify Redis Installation
```bash
redis-cli ping
# Should return: PONG
```

### 3. Install Dependencies
```bash
# Use enhanced setup script
./setup-enhanced.bat

# Or manually
npm install
npm install bull express-rate-limit ioredis
```

### 4. Start the Application
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Enhanced Backend
node backend-enhanced.cjs

# Terminal 3: Start Frontend
npm run dev
```

## 📋 Feature Comparison

| Feature | Basic Version | Enhanced Version |
|---------|---------------|------------------|
| Code Execution | Direct execution | Redis queue + fallback |
| Analytics | Basic metrics | Advanced visualizations |
| Leaderboard | Simple ranking | Badge system + streaks |
| File Upload | None | Drag & drop + auto-detect |
| Proctoring | Basic monitoring | Advanced violation tracking |
| Performance | Standard | Optimized with queues |
| Rate Limiting | None | 20/10 requests per minute |
| UI/UX | Basic styling | Enhanced animations |

## 🔧 Configuration Options

### Redis Queue Settings
```javascript
// Code execution queue: 5 concurrent jobs
// Submission queue: 10 concurrent jobs
// Timeout: 30 seconds per job
// Retry: 3 attempts with exponential backoff
```

### Rate Limiting
```javascript
// Code execution: 20 requests/minute/user
// Submissions: 10 requests/minute/user
```

### Proctoring Thresholds
```javascript
// Tab switches: 3 violations max
// Copy/paste attempts: 5 violations max
// Fullscreen exits: 2 violations max
```

## 📊 Monitoring & Health Check

### Health Check Endpoint
```bash
GET http://localhost:3001/api/health
```

### Redis Queue Monitoring
```bash
redis-cli
> KEYS bull:*
> LLEN bull:code-execution:waiting
> LLEN bull:submission-processing:active
```

## 🎯 Usage Examples

### For Instructors
1. **Create Enhanced Assignments**: Upload test files and set proctoring requirements
2. **Monitor Real-time Analytics**: View submission trends and language usage
3. **Track Student Performance**: Access detailed leaderboards and progress metrics
4. **Review Proctoring Violations**: Monitor security incidents and violations

### For Students
1. **Secure Assignment Taking**: Enable proctoring for secure submissions
2. **File Upload Submissions**: Drag and drop code files for easy submission
3. **Real-time Feedback**: Get instant test results and performance metrics
4. **Track Progress**: View personal rankings and improvement trends

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Rate Limiting** to prevent abuse
- **Proctoring System** with violation tracking
- **Secure Code Execution** in isolated environments
- **File Upload Validation** with type checking

## 🚀 Performance Benefits

- **Queue System**: Handle 1000+ concurrent requests
- **Redis Caching**: Sub-second response times
- **Optimized UI**: Smooth animations and transitions
- **Responsive Design**: Works on all device sizes
- **Efficient Resource Usage**: Minimal server load

## 📈 Future Enhancements

- **AI-Powered Code Analysis**: Automated code quality assessment
- **Advanced Plagiarism Detection**: Cross-submission similarity analysis
- **Real-time Collaboration**: Live coding sessions
- **Mobile App**: Native iOS/Android applications
- **Advanced Reporting**: PDF export and detailed analytics

## 🐛 Troubleshooting

### Redis Connection Issues
```bash
# Check Redis status
redis-cli ping

# Restart Redis service
sudo systemctl restart redis
```

### Queue Processing Issues
```bash
# Clear stuck jobs
redis-cli FLUSHALL

# Restart backend server
node backend-enhanced.cjs
```

### File Upload Problems
- Check file size limits (default: 10MB)
- Verify supported file extensions
- Ensure proper MIME type detection

## 📞 Support

For technical support or feature requests:
- Check the troubleshooting guide
- Review Redis setup documentation
- Monitor health check endpoint
- Check browser console for errors

---

**Note**: This enhanced version requires Redis for optimal performance. The system will fall back to direct execution if Redis is unavailable, but queue-based features will be disabled.