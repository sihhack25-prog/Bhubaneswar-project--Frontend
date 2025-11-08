# Digital TA Testing Instructions

## Quick Setup & Testing Guide

### 1. Start the System
```bash
# Terminal 1: Start MongoDB
mongod

# Terminal 2: Start Backend
node backend-example.cjs

# Terminal 3: Start Frontend  
npm run dev
```

### 2. Create Test Users
1. Go to http://localhost:3000
2. Register as **Instructor**:
   - Username: instructor1
   - Email: instructor@test.com
   - Password: password123
   - Role: Instructor

3. Register as **Student**:
   - Username: student1
   - Email: student@test.com
   - Password: password123
   - Role: Student

### 3. Create Sample Assignments (Instructor)
1. Login as instructor
2. Click "Create Assignment"
3. Use sample data from `sample-assignments.js`:

**Easy Assignment:**
- Title: Hello World Program
- Description: Write a program that prints 'Hello, World!' to the console.
- Difficulty: Easy
- Language: python
- Test Case Input: (empty)
- Test Case Output: Hello, World!
- Deadline: (any future date)

**Medium Assignment:**
- Title: Sum of Two Numbers
- Description: Write a program that reads two integers and prints their sum.
- Difficulty: Easy
- Language: python
- Test Case Input: 5 3
- Test Case Output: 8
- Deadline: (any future date)

### 4. Test Student Workflow
1. Login as student
2. View assignments in dashboard
3. Click on an assignment
4. Write code in the live editor:

**For Hello World:**
```python
print("Hello, World!")
```

**For Sum of Two Numbers:**
```python
a, b = map(int, input().split())
print(a + b)
```

5. Click "Run Code" to test
6. Click "Submit" to submit solution

### 5. Verify Real Data
- **Student Count**: Dashboard shows actual registered students from MongoDB
- **Assignment Count**: Shows real assignments created by instructors
- **Submissions**: All submissions stored in database
- **Analytics**: Real-time data from MongoDB

### 6. Instructor Evaluation
- View all registered users: GET http://localhost:3001/api/users
- Check analytics: GET http://localhost:3001/api/analytics
- All student data stored in MongoDB for easy evaluation

## Sample Assignment Solutions

### Hello World
```python
print("Hello, World!")
```

### Sum of Two Numbers
```python
a, b = map(int, input().split())
print(a + b)
```

### Factorial
```python
def factorial(n):
    if n == 0 or n == 1:
        return 1
    else:
        return n * factorial(n - 1)

n = int(input())
print(factorial(n))
```

### Even or Odd
```python
n = int(input())
if n % 2 == 0:
    print("Even")
else:
    print("Odd")
```

## Features Working:
✅ Real MongoDB authentication
✅ Dynamic student count
✅ Assignment creation & management
✅ Live code editor with compiler
✅ Real-time submission tracking
✅ Instructor analytics dashboard
✅ Student progress tracking