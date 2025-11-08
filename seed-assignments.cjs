const mongoose = require('mongoose')

mongoose.connect('mongodb+srv://knowissues1234_db_user:knowissuses@cluster0.iyh6ukd.mongodb.net/digitalTA')

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], required: true },
  createdAt: { type: Date, default: Date.now }
})

const assignmentSchema = new mongoose.Schema({
  main: {
    id: { type: Number, required: true },
    name: { type: String, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    description_body: { type: String, required: true },
    submission_count: { type: Number, default: 0 },
    accept_count: { type: Number, default: 0 },
    code_body: {
      javascript: String,
      python: String,
      java: String,
      cpp: String
    }
  },
  deadline: { type: Date, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)
const Assignment = mongoose.model('Assignment', assignmentSchema)

const seedAssignments = async () => {
  try {
    console.log('Seeding assignments...')
    
    // Get instructor user
    const instructor = await User.findOne({ role: 'instructor' })
    
    if (!instructor) {
      console.log('No instructor found. Please run seed-database.cjs first.')
      return
    }
    
    const assignments = [
      {
        main: {
          id: 1,
          name: 'Two Sum Problem',
          difficulty: 'easy',
          description_body: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
          submission_count: 0,
          accept_count: 0,
          code_body: {
            javascript: 'function twoSum(nums, target) {\n    // Your code here\n}',
            python: 'def two_sum(nums, target):\n    # Your code here\n    pass'
          }
        },
        deadline: new Date('2025-11-15T06:36:00Z'),
        createdBy: instructor._id
      }
    ]
    
    await Assignment.deleteMany({})
    await Assignment.insertMany(assignments)
    
    console.log('✅ Test assignments created!')
    
  } catch (error) {
    console.error('❌ Error seeding assignments:', error.message)
  } finally {
    await mongoose.disconnect()
  }
}

seedAssignments()