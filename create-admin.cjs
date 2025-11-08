const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Connect to MongoDB
mongoose.connect('mongodb+srv://knowissues1234_db_user:knowissuses@cluster0.iyh6ukd.mongodb.net/digitalTA', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// User Schema
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['student', 'instructor', 'admin'], required: true },
  createdAt: { type: Date, default: Date.now }
})

const User = mongoose.model('User', userSchema)

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@digitalTA.com' })
    if (existingAdmin) {
      console.log('Admin user already exists!')
      process.exit(0)
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('SecureAdmin2024!', 10)
    const admin = new User({
      username: 'Administrator',
      email: 'admin@digitalTA.com',
      password: hashedPassword,
      role: 'admin'
    })

    await admin.save()
    console.log('✅ Admin user created successfully!')
    console.log('Email: admin@digitalTA.com')
    console.log('Password: SecureAdmin2024!')
    
    process.exit(0)
  } catch (error) {
    console.error('Error creating admin:', error)
    process.exit(1)
  }
}

createAdmin()