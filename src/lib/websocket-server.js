// WebSocket server for database connections
// This would typically be run as a separate server process

const WebSocket = require('ws');
const { spawn } = require('child_process');

class DatabaseWebSocketServer {
  constructor(port = 3001) {
    this.port = port;
    this.wss = null;
    this.dbProcesses = new Map(); // Store database processes by challenge ID
  }

  start() {
    this.wss = new WebSocket.Server({ port: this.port });
    
    console.log(`WebSocket server running on port ${this.port}`);
    
    this.wss.on('connection', (ws, req) => {
      const url = new URL(req.url, `http://${req.headers.host}`);
      const challengeId = url.pathname.split('/')[2]; // Extract challenge ID from /database/{challengeId}
      
      console.log(`New connection for challenge ${challengeId}`);
      
      // Store challenge ID with the connection
      ws.challengeId = challengeId;
      
      // Handle incoming messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(ws, message);
        } catch (error) {
          console.error('Error parsing message:', error);
          ws.send(JSON.stringify({
            type: 'error',
            error: 'Invalid message format'
          }));
        }
      });
      
      // Handle connection close
      ws.on('close', () => {
        console.log(`Connection closed for challenge ${challengeId}`);
        this.cleanupDatabaseProcess(challengeId);
      });
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Connected to database terminal'
      }));
    });
  }

  async handleMessage(ws, message) {
    const { type, sql, challengeId } = message;
    
    if (type === 'query') {
      try {
        const result = await this.executeQuery(sql, challengeId);
        ws.send(JSON.stringify(result));
      } catch (error) {
        ws.send(JSON.stringify({
          type: 'query_error',
          error: error.message
        }));
      }
    }
  }

  async executeQuery(sql, challengeId) {
    // Get or create database process for this challenge
    let dbProcess = this.dbProcesses.get(challengeId);
    
    if (!dbProcess) {
      dbProcess = await this.createDatabaseProcess(challengeId);
      this.dbProcesses.set(challengeId, dbProcess);
    }

    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';

      // Send SQL query to database process
      dbProcess.stdin.write(sql + '\n');

      // Handle output
      dbProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      dbProcess.stderr.on('data', (data) => {
        error += data.toString();
      });

      // Handle process completion
      dbProcess.on('close', (code) => {
        if (code === 0) {
          resolve({
            type: 'query_result',
            success: true,
            data: this.parseQueryResult(output),
            message: 'Query executed successfully'
          });
        } else {
          reject(new Error(error || 'Query execution failed'));
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        dbProcess.kill();
        reject(new Error('Query timeout'));
      }, 10000);
    });
  }

  async createDatabaseProcess(challengeId) {
    // Create a new SQLite database process for this challenge
    // In a real implementation, you might use different databases per challenge
    const dbProcess = spawn('sqlite3', ['-header', '-csv', ':memory:'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // Initialize the database with challenge-specific schema
    await this.initializeChallengeDatabase(dbProcess, challengeId);

    return dbProcess;
  }

  async initializeChallengeDatabase(dbProcess, challengeId) {
    // This would load the challenge-specific database schema
    // For now, we'll create a simple schema
    const schema = `
      CREATE TABLE users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      
      INSERT INTO users (name, email) VALUES 
        ('John Doe', 'john@example.com'),
        ('Jane Smith', 'jane@example.com'),
        ('Bob Johnson', 'bob@example.com');
      
      CREATE TABLE challenges (
        id INTEGER PRIMARY KEY,
        title TEXT NOT NULL,
        level INTEGER DEFAULT 1,
        points INTEGER DEFAULT 100
      );
      
      INSERT INTO challenges (title, level, points) VALUES 
        ('Basic SELECT', 1, 100),
        ('JOIN Queries', 2, 200),
        ('Complex Queries', 3, 300);
    `;

    return new Promise((resolve, reject) => {
      dbProcess.stdin.write(schema);
      dbProcess.stdin.end();
      
      dbProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('Failed to initialize database'));
        }
      });
    });
  }

  parseQueryResult(output) {
    // Parse CSV output from SQLite
    const lines = output.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',');
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      const row = {};
      
      headers.forEach((header, index) => {
        row[header.trim()] = values[index] ? values[index].trim() : null;
      });
      
      data.push(row);
    }

    return data;
  }

  cleanupDatabaseProcess(challengeId) {
    const dbProcess = this.dbProcesses.get(challengeId);
    if (dbProcess) {
      dbProcess.kill();
      this.dbProcesses.delete(challengeId);
    }
  }

  stop() {
    if (this.wss) {
      this.wss.close();
    }
    
    // Clean up all database processes
    this.dbProcesses.forEach((process, challengeId) => {
      process.kill();
    });
    this.dbProcesses.clear();
  }
}

// Export for use in server
module.exports = DatabaseWebSocketServer;

// If running directly, start the server
if (require.main === module) {
  const server = new DatabaseWebSocketServer();
  server.start();
  
  process.on('SIGINT', () => {
    console.log('Shutting down WebSocket server...');
    server.stop();
    process.exit(0);
  });
}
