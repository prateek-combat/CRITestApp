const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Creating HTML Demo Test...');

    // Get or create admin user
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          email: 'admin@testplatform.com',
          passwordHash: 'admin',
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
        },
      });
      console.log('✅ Admin user created');
    } else {
      console.log('✅ Admin user found');
    }

    // Create a test to demonstrate HTML capabilities
    const test = await prisma.test.create({
      data: {
        title: 'HTML Formatting Demo Test',
        description: 'Demonstrates HTML formatting options for questions',
        overallTimeLimitSeconds: 1800, // 30 minutes
        lockOrder: false,
        allowReview: true,
        createdById: adminUser.id,
        includeAnalytics: true,
        emailNotificationsEnabled: true,
      },
    });

    console.log(`Created test: ${test.title} (ID: ${test.id})`);

    // Sample questions with HTML formatting
    const questions = [
      {
        promptText: `<h1>JavaScript Array Methods</h1>

<p>Which of the following code snippets correctly filters an array to get only even numbers?</p>

<pre><code class="language-javascript">const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
// Your solution here
</code></pre>

<p><strong>Requirements:</strong></p>
<ul>
  <li>Use the <code>filter()</code> method</li>
  <li>Return only even numbers</li>
  <li>Maintain original array order</li>
</ul>`,
        category: 'LOGICAL',
        timerSeconds: 60,
        answerOptions: [
          'numbers.filter(n => n % 2 === 0)',
          'numbers.filter(n => n % 2 === 1)',
          'numbers.map(n => n % 2 === 0)',
          'numbers.reduce((acc, n) => n % 2 === 0 ? [...acc, n] : acc, [])',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'JavaScript Fundamentals',
      },
      {
        promptText: `<h2>Database Schema Analysis</h2>

<p>You're designing a database for an e-commerce platform:</p>

<table>
  <thead>
    <tr>
      <th>Table</th>
      <th>Primary Key</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>users</td>
      <td>user_id</td>
      <td>Customer information</td>
    </tr>
    <tr>
      <td>products</td>
      <td>product_id</td>
      <td>Product catalog</td>
    </tr>
    <tr>
      <td>orders</td>
      <td>order_id</td>
      <td>Customer orders</td>
    </tr>
    <tr>
      <td>order_items</td>
      <td>(order_id, product_id)</td>
      <td>Items in each order</td>
    </tr>
  </tbody>
</table>

<p><strong>Relationships:</strong></p>
<ul>
  <li>One user can have many orders</li>
  <li>One order can have many products</li>
  <li>One product can be in many orders</li>
</ul>

<p>Which SQL query finds the <strong>top 5 customers</strong> by total order value?</p>`,
        category: 'LOGICAL',
        timerSeconds: 90,
        answerOptions: [
          `SELECT u.user_id, u.name, SUM(oi.price * oi.quantity) as total_value FROM users u JOIN orders o ON u.user_id = o.user_id JOIN order_items oi ON o.order_id = oi.order_id GROUP BY u.user_id, u.name ORDER BY total_value DESC LIMIT 5`,
          `SELECT user_id, COUNT(*) as order_count FROM orders GROUP BY user_id ORDER BY order_count DESC LIMIT 5`,
          `SELECT * FROM users ORDER BY user_id LIMIT 5`,
          `SELECT u.name, AVG(oi.price) FROM users u JOIN orders o ON u.user_id = o.user_id JOIN order_items oi ON o.order_id = oi.order_id GROUP BY u.name LIMIT 5`,
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Database Design',
      },
      {
        promptText: `<h3>Algorithm Complexity</h3>

<p>Analyze the following sorting algorithm:</p>

<pre><code class="language-python">def mystery_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr
</code></pre>

<blockquote>
  <p><strong>Hint:</strong> Look at the nested loop structure and how elements are compared.</p>
</blockquote>

<p><strong>Analysis Questions:</strong></p>
<ol>
  <li>What sorting algorithm is this?</li>
  <li>What is the time complexity?</li>
  <li>Is it stable?</li>
</ol>

<p><strong>Given:</strong> Array of integers with length n where 1 ≤ n ≤ 1000</p>

<p>What is the <em>worst-case time complexity</em> of this algorithm?</p>`,
        category: 'LOGICAL',
        timerSeconds: 75,
        answerOptions: [
          'O(n²) - Quadratic time',
          'O(n log n) - Linearithmic time',
          'O(n) - Linear time',
          'O(1) - Constant time',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'Algorithm Analysis',
      },
      {
        promptText: `<h2>React Component Debugging</h2>

<p>Review this React component and identify the issue:</p>

<pre><code class="language-jsx">import React, { useState, useEffect } from 'react';

function UserProfile({ userId }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser(userId);
  }, []); // ⚠️ Potential issue here

  const fetchUser = async (id) => {
    setLoading(true);
    try {
      const response = await fetch(\`/api/users/\${id}\`);
      const userData = await response.json();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return &lt;div&gt;Loading...&lt;/div&gt;;
  if (!user) return &lt;div&gt;User not found&lt;/div&gt;;

  return (
    &lt;div&gt;
      &lt;h1&gt;{user.name}&lt;/h1&gt;
      &lt;p&gt;Email: {user.email}&lt;/p&gt;
    &lt;/div&gt;
  );
}
</code></pre>

<p><strong>What is the main issue with this component?</strong></p>`,
        category: 'ATTENTION_TO_DETAIL',
        timerSeconds: 60,
        answerOptions: [
          "Missing userId in useEffect dependency array - component won't update when userId changes",
          'useState should be useReducer for complex state',
          'Missing error state handling in the UI',
          'fetchUser function should be memoized with useCallback',
        ],
        correctAnswerIndex: 0,
        sectionTag: 'React Code Review',
      },
    ];

    // Add questions to the test
    for (let i = 0; i < questions.length; i++) {
      const questionData = {
        ...questions[i],
        testId: test.id,
      };

      const question = await prisma.question.create({
        data: questionData,
      });

      console.log(
        `Added question ${i + 1}: ${question.promptText.substring(0, 50).replace(/<[^>]*>/g, '')}...`
      );
    }

    console.log(
      `\n✅ Successfully created test with ${questions.length} HTML-formatted questions!`
    );
    console.log(`Test ID: ${test.id}`);
    console.log(`\n🎯 This test demonstrates:`);
    console.log(`   • HTML headers and structure`);
    console.log(`   • Code blocks with syntax highlighting`);
    console.log(`   • Tables for structured data`);
    console.log(`   • Lists and bullet points`);
    console.log(`   • Bold, italic, and inline code`);
    console.log(`   • Blockquotes for hints`);
  } catch (error) {
    console.error('Error creating test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
