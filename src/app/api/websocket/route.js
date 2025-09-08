import { NextRequest } from 'next/server';

// This is a fallback API for Socket.io connections
// The main Socket.io server runs on port 3001
export async function GET(request) {
  return new Response('Socket.io server running on port 3001', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
    },
  });
}

// For development, we'll create a simple WebSocket server
// In production, you'd want to use a proper WebSocket server
export async function POST(request) {
  const { type, sql, challengeId } = await request.json();
  
  // Simulate database query execution
  if (type === 'query') {
    // This would connect to your actual database
    // For now, we'll simulate responses
    
    const mockResponses = {
      'SELECT * FROM users': {
        type: 'query_result',
        success: true,
        data: [
          { id: 1, name: 'John Doe', email: 'john@example.com' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com' }
        ],
        message: 'Query executed successfully'
      },
      'SELECT * FROM challenges': {
        type: 'query_result',
        success: true,
        data: [
          { id: 1, title: 'Basic SELECT', level: 1, points: 100 },
          { id: 2, title: 'JOIN Queries', level: 2, points: 200 }
        ],
        message: 'Query executed successfully'
      }
    };

    // Check if this matches a challenge solution
    const isCorrect = checkChallengeSolution(sql, challengeId);
    
    if (isCorrect) {
      return Response.json({
        type: 'challenge_completed',
        success: true,
        score: 100,
        attempts: 1,
        message: 'Challenge completed!'
      });
    }

    // Return mock data or actual query result
    const response = mockResponses[sql] || {
      type: 'query_result',
      success: true,
      data: [],
      message: 'Query executed successfully'
    };

    return Response.json(response);
  }

  return Response.json({ error: 'Invalid request type' }, { status: 400 });
}

function checkChallengeSolution(sql, challengeId) {
  // This would check against the actual challenge solution
  // For now, we'll use a simple check
  const normalizedSql = sql.toLowerCase().trim();
  
  // Example challenge solutions
  const solutions = {
    '1': 'select * from users where id = 1',
    '2': 'select name, email from users order by name',
    // Add more challenge solutions as needed
  };

  return solutions[challengeId] === normalizedSql;
}
