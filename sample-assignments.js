// Sample Assignment Data for Testing
// Copy and paste these into the Create Assignment form

export const sampleAssignments = [
  {
    title: "Hello World Program",
    description: "Write a program that prints 'Hello, World!' to the console. This is a basic introduction to programming syntax.",
    difficulty: "Easy",
    language: "python",
    testCases: [
      {
        input: "",
        expectedOutput: "Hello, World!"
      }
    ],
    sampleCode: `print("Hello, World!")`,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },
  
  {
    title: "Sum of Two Numbers",
    description: "Write a program that reads two integers from input and prints their sum. Input will be given as two space-separated integers.",
    difficulty: "Easy", 
    language: "python",
    testCases: [
      {
        input: "5 3",
        expectedOutput: "8"
      },
      {
        input: "10 20",
        expectedOutput: "30"
      }
    ],
    sampleCode: `# Read two numbers
a, b = map(int, input().split())
# Print their sum
print(a + b)`,
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },

  {
    title: "Factorial Calculator",
    description: "Write a program that calculates the factorial of a given number. The input will be a single positive integer n, and you should output n! (n factorial).",
    difficulty: "Medium",
    language: "python", 
    testCases: [
      {
        input: "5",
        expectedOutput: "120"
      },
      {
        input: "0",
        expectedOutput: "1"
      },
      {
        input: "3",
        expectedOutput: "6"
      }
    ],
    sampleCode: `def factorial(n):
    if n == 0 or n == 1:
        return 1
    else:
        return n * factorial(n - 1)

n = int(input())
print(factorial(n))`,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },

  {
    title: "Even or Odd Checker",
    description: "Write a program that checks if a given number is even or odd. Print 'Even' if the number is even, 'Odd' if it's odd.",
    difficulty: "Easy",
    language: "python",
    testCases: [
      {
        input: "4",
        expectedOutput: "Even"
      },
      {
        input: "7",
        expectedOutput: "Odd"
      }
    ],
    sampleCode: `n = int(input())
if n % 2 == 0:
    print("Even")
else:
    print("Odd")`,
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },

  {
    title: "Maximum of Three Numbers",
    description: "Write a program that finds the maximum of three given numbers. Input will be three space-separated integers.",
    difficulty: "Easy",
    language: "python",
    testCases: [
      {
        input: "10 5 8",
        expectedOutput: "10"
      },
      {
        input: "3 9 6",
        expectedOutput: "9"
      }
    ],
    sampleCode: `a, b, c = map(int, input().split())
print(max(a, b, c))`,
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  },

  {
    title: "Fibonacci Sequence",
    description: "Write a program that prints the first n numbers in the Fibonacci sequence. The input will be a positive integer n.",
    difficulty: "Medium",
    language: "python",
    testCases: [
      {
        input: "5",
        expectedOutput: "0 1 1 2 3"
      },
      {
        input: "3",
        expectedOutput: "0 1 1"
      }
    ],
    sampleCode: `n = int(input())
if n <= 0:
    print("")
elif n == 1:
    print("0")
else:
    fib = [0, 1]
    for i in range(2, n):
        fib.append(fib[i-1] + fib[i-2])
    print(" ".join(map(str, fib)))`,
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
];

// Instructions for Instructors:
// 1. Copy the assignment data from above
// 2. Click "Create Assignment" in the dashboard
// 3. Fill in the form with the sample data
// 4. Students can then solve these problems in the live editor
// 5. The system will automatically test their solutions against the test cases