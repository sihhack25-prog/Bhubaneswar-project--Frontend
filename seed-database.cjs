const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Connect to MongoDB
mongoose.connect('mongodb+srv://knowissues1234_db_user:knowissuses@cluster0.iyh6ukd.mongodb.net/digitalTA')

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], required: true },
  createdAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)

const seedUsers = async () => {
  try {
    console.log('Seeding database with test users...')
    
    // Clear existing users
    await User.deleteMany({})
    
    // Create test users
    const users = [
      {
        username: 'student',
        email: 'student@test.com',
        password: await bcrypt.hash('password', 10),
        role: 'student'
      },
      {
        username: 'instructor',
        email: 'instructor@test.com',
        password: await bcrypt.hash('password', 10),
        role: 'instructor'
      },
      {
        username: 'admin',
        email: 'admin@digitalTA.com',
        password: await bcrypt.hash('SecureAdmin2024!', 10),
        role: 'admin'
      }
    ]
    
    await User.insertMany(users)
    console.log('✅ Test users created successfully!')
    console.log('Available credentials:')
    console.log('  Student: student@test.com / password')
    console.log('  Instructor: instructor@test.com / password')
    console.log('  Admin: admin@digitalTA.com / SecureAdmin2024!')
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message)
  } finally {
    await mongoose.disconnect()
  }
}

seedUsers()