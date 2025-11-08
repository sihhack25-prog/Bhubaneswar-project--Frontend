const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

mongoose.connect('mongodb+srv://knowissues1234_db_user:knowissuses@cluster0.iyh6ukd.mongodb.net/digitalTA', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], required: true },
  createdAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)

async function createTestUsers() {
  try {
    const testUsers = [
      { username: 'Test Student', email: 'student@test.com', password: 'password', role: 'student' },
      { username: 'Test Instructor', email: 'instructor@test.com', password: 'password', role: 'instructor' },
      { username: 'John Doe', email: 'john@student.com', password: 'password', role: 'student' },
      { username: 'Jane Smith', email: 'jane@instructor.com', password: 'password', role: 'instructor' }
    ]

    for (const userData of testUsers) {
      const existingUser = await User.findOne({ email: userData.email })
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(userData.password, 10)
        const user = new User({
          ...userData,
          password: hashedPassword
        })
        await user.save()
        console.log(`✅ Created ${userData.role}: ${userData.email}`)
      } else {
        console.log(`⚠️  User already exists: ${userData.email}`)
      }
    }

    console.log('\n📝 Test Credentials:')
    console.log('Student: student@test.com / password')
    console.log('Instructor: instructor@test.com / password')
    console.log('Admin: admin@digitalTA.com / SecureAdmin2024!')
    
    process.exit(0)
  } catch (error) {
    console.error('Error creating test users:', error)
    process.exit(1)
  }
}

createTestUsers()