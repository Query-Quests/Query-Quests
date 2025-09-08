// Socket.io server for database connections
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();

class DatabaseSocketServer {
  constructor(port = 3001) {
    this.port = port;
    this.io = null;
    this.server = null;
    this.prisma = new PrismaClient();
    this.databaseConnections = new Map(); // Store database connections by challenge ID
    this.databaseConfigs = new Map(); // Store database configurations
  }

  start() {
    // Create HTTP server
    this.server = http.createServer();
    
    // Create Socket.io server
    this.io = new Server(this.server, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });
    
    this.setupEventHandlers();
    
    this.server.listen(this.port, () => {
      console.log(`Socket.io server running on port ${this.port}`);
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Handle joining a challenge room
      socket.on('join_challenge', async (data) => {
        const { challengeId } = data;
        console.log(`Client ${socket.id} joining challenge ${challengeId}`);
        
        // Join the challenge room
        socket.join(`challenge_${challengeId}`);
        
        try {
          // Load challenge data from database
          const challenge = await this.loadChallengeData(challengeId);
          if (challenge) {
            socket.emit('database_ready', { 
              challengeId,
              challenge: {
                id: challenge.id,
                statement: challenge.statement,
                level: challenge.level,
                score: challenge.score
              }
            });
          } else {
            socket.emit('database_error', { 
              error: 'Challenge not found',
              details: `Challenge ${challengeId} does not exist`
            });
          }
        } catch (error) {
          console.error('Error loading challenge:', error);
          socket.emit('database_error', { 
            error: 'Failed to load challenge',
            details: error.message 
          });
        }
      });

      // Handle query execution
      socket.on('execute_query', async (data) => {
        const { sql, challengeId } = data;
        console.log(`Executing query for challenge ${challengeId}: ${sql}`);
        
        try {
          const result = await this.executePrismaQuery(sql, challengeId);
          socket.emit('query_result', result);
        } catch (error) {
          socket.emit('query_error', {
            type: 'query_error',
            error: error.message,
            sql: sql
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  async loadChallengeData(challengeId) {
    try {
      const challenge = await this.prisma.challenge.findUnique({
        where: { id: parseInt(challengeId) },
        include: {
          institution: true
        }
      });
      return challenge;
    } catch (error) {
      console.error('Error loading challenge:', error);
      return null;
    }
  }

  async loadChallengeSchema(dbProcess, challengeId) {
    // Define schemas for different challenges
    const schemas = {
      '1': `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        INSERT INTO users (name, email) VALUES 
          ('John Doe', 'john@example.com'),
          ('Jane Smith', 'jane@example.com'),
          ('Bob Johnson', 'bob@example.com'),
          ('Alice Brown', 'alice@example.com');
      `,
      '2': `
        CREATE TABLE products (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          price REAL NOT NULL,
          category TEXT,
          stock INTEGER DEFAULT 0
        );
        
        INSERT INTO products (name, price, category, stock) VALUES 
          ('Laptop', 999.99, 'Electronics', 10),
          ('Mouse', 29.99, 'Electronics', 50),
          ('Keyboard', 79.99, 'Electronics', 25),
          ('Monitor', 299.99, 'Electronics', 15);
      `,
      '3': `
        CREATE TABLE orders (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          product_id INTEGER,
          quantity INTEGER,
          total REAL,
          order_date DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE TABLE users (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL
        );
        
        CREATE TABLE products (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          price REAL NOT NULL
        );
        
        INSERT INTO users (name, email) VALUES 
          ('John Doe', 'john@example.com'),
          ('Jane Smith', 'jane@example.com');
        
        INSERT INTO products (name, price) VALUES 
          ('Laptop', 999.99),
          ('Mouse', 29.99);
        
        INSERT INTO orders (user_id, product_id, quantity, total) VALUES 
          (1, 1, 1, 999.99),
          (1, 2, 2, 59.98),
          (2, 1, 1, 999.99);
      `
    };

    const schema = schemas[challengeId] || schemas['1'];
    
    return new Promise((resolve, reject) => {
      dbProcess.stdin.write(schema);
      dbProcess.stdin.end();
      
      dbProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Failed to initialize database for challenge ${challengeId}`));
        }
      });

      dbProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  async executeQuery(sql, challengeId) {
    const dbProcess = this.dbProcesses.get(challengeId);
    
    if (!dbProcess) {
      throw new Error(`No database process found for challenge ${challengeId}`);
    }

    return new Promise((resolve, reject) => {
      let output = '';
      let error = '';

      // Create a new process for this query to avoid conflicts
      const queryProcess = spawn('sqlite3', ['-header', '-csv', ':memory:'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Load the same schema
      this.loadChallengeSchema(queryProcess, challengeId).then(() => {
        // Send the query
        queryProcess.stdin.write(sql + '\n');
        queryProcess.stdin.end();

        // Handle output
        queryProcess.stdout.on('data', (data) => {
          output += data.toString();
        });

        queryProcess.stderr.on('data', (data) => {
          error += data.toString();
        });

        // Handle process completion
        queryProcess.on('close', (code) => {
          if (code === 0) {
            const result = this.parseQueryResult(output);
            
            // Check if this completes the challenge
            const isChallengeCompleted = this.checkChallengeCompletion(sql, challengeId);
            
            if (isChallengeCompleted) {
              resolve({
                type: 'challenge_completed',
                success: true,
                score: 100,
                attempts: 1,
                message: 'Challenge completed!',
                data: result
              });
            } else {
              resolve({
                type: 'query_result',
                success: true,
                data: result,
                message: 'Query executed successfully'
              });
            }
          } else {
            reject(new Error(error || 'Query execution failed'));
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          queryProcess.kill();
          reject(new Error('Query timeout'));
        }, 10000);

      }).catch(reject);
    });
  }

  parseQueryResult(output) {
    // Parse CSV output from SQLite
    const lines = output.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      
      headers.forEach((header, index) => {
        row[header] = values[index] || null;
      });
      
      data.push(row);
    }

    return data;
  }

  checkChallengeCompletion(sql, challengeId) {
    // Define expected solutions for each challenge
    const solutions = {
      '1': [
        'select * from users',
        'select * from users;',
        'select id, name, email from users',
        'select id, name, email from users;'
      ],
      '2': [
        'select * from products',
        'select * from products;',
        'select name, price from products',
        'select name, price from products;'
      ],
      '3': [
        'select u.name, p.name, o.quantity from users u join orders o on u.id = o.user_id join products p on p.id = o.product_id',
        'select u.name, p.name, o.quantity from users u join orders o on u.id = o.user_id join products p on p.id = o.product_id;'
      ]
    };

    const normalizedSql = sql.toLowerCase().trim();
    const challengeSolutions = solutions[challengeId] || [];
    
    return challengeSolutions.some(solution => 
      normalizedSql === solution.toLowerCase()
    );
  }

  cleanupDatabaseProcess(challengeId) {
    const dbProcess = this.dbProcesses.get(challengeId);
    if (dbProcess) {
      dbProcess.kill();
      this.dbProcesses.delete(challengeId);
      console.log(`Cleaned up database process for challenge ${challengeId}`);
    }
  }

  stop() {
    if (this.io) {
      this.io.close();
    }
    
    if (this.server) {
      this.server.close();
    }
    
    // Clean up all database processes
    this.dbProcesses.forEach((process, challengeId) => {
      process.kill();
    });
    this.dbProcesses.clear();
  }
}

// Export for use in server
module.exports = DatabaseSocketServer;

// If running directly, start the server
if (require.main === module) {
  const server = new DatabaseSocketServer();
  server.start();
  
  process.on('SIGINT', () => {
    console.log('Shutting down Socket.io server...');
    server.stop();
    process.exit(0);
  });
}
