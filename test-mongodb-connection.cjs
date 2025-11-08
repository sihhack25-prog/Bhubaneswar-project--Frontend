const mongoose = require('mongoose')

const testConnection = async () => {
  try {
    console.log('Testing MongoDB connection...')
    
    await mongoose.connect('mongodb+srv://knowissues1234_db_user:knowissuses@cluster0.iyh6ukd.mongodb.net/digitalTA', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    
    console.log('✅ MongoDB connection successful!')
    console.log('Database:', mongoose.connection.name)
    console.log('Host:', mongoose.connection.host)
    
    await mongoose.disconnect()
    console.log('✅ Connection test completed')
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message)
  }
}

testConnection()