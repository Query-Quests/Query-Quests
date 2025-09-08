// Flexible Socket.io server for multiple database connections
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const http = require('http');
const mysql = require('mysql2/promise');
const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();

class FlexibleDatabaseSocketServer {
  constructor(port = 3001) {
    this.port = port;
    this.io = null;
    this.server = null;
    this.prisma = new PrismaClient();
    this.databaseConnection = null; // Single general database connection
    this.databaseType = null;
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
      console.log(`Flexible Database Socket.io server running on port ${this.port}`);
    });
  }

  setupEventHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);
      
      // Handle database connection setup
      socket.on('setup_database', async (data) => {
        const { databaseType, connectionConfig } = data;
        console.log(`[${socket.id}] Setting up ${databaseType} database connection`);
        console.log(`[${socket.id}] Connection config:`, connectionConfig);
        
        try {
          console.log(`[${socket.id}] Creating database connection...`);
          const connection = await this.createDatabaseConnection(databaseType, connectionConfig);
          console.log(`[${socket.id}] Database connection created successfully`);
          
          this.databaseConnection = {
            type: databaseType,
            connection: connection,
            config: connectionConfig
          };
          this.databaseType = databaseType;
          
          console.log(`[${socket.id}] Database connection stored, emitting database_connected`);
          socket.emit('database_connected', { 
            databaseType,
            message: `Connected to ${databaseType} database`
          });
          
          // Test the connection immediately
          try {
            console.log(`[${socket.id}] Testing database connection...`);
            const testResult = await this.executeQuery('SELECT 1 as test', this.databaseConnection);
            console.log(`[${socket.id}] Database test successful:`, testResult);
          } catch (testError) {
            console.error(`[${socket.id}] Database test failed:`, testError);
          }
          
        } catch (error) {
          console.error(`[${socket.id}] Database connection error:`, error);
          socket.emit('database_error', { 
            error: 'Failed to connect to database',
            details: error.message 
          });
        }
      });

      // Handle joining a challenge room
      socket.on('join_challenge', async (data) => {
        const { challengeId } = data;
        console.log(`Client ${socket.id} joining challenge ${challengeId}`);
        
        socket.join(`challenge_${challengeId}`);
        
        try {
          // Load challenge data from Prisma database
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
        const { sql } = data;
        console.log(`[${socket.id}] Executing query: ${sql}`);
        console.log(`[${socket.id}] Database connection status:`, !!this.databaseConnection);
        
        try {
          if (!this.databaseConnection) {
            console.error(`[${socket.id}] No database connection established`);
            throw new Error('No database connection established');
          }
          
          console.log(`[${socket.id}] Using ${this.databaseConnection.type} connection`);
          console.log(`[${socket.id}] Connection object:`, {
            type: this.databaseConnection.type,
            hasConnection: !!this.databaseConnection.connection,
            config: this.databaseConnection.config
          });
          
          const result = await this.executeQuery(sql, this.databaseConnection);
          console.log(`[${socket.id}] Query result:`, result);
          socket.emit('query_result', result);
        } catch (error) {
          console.error(`[${socket.id}] Query execution error:`, error);
          socket.emit('query_error', {
            type: 'query_error',
            error: error.message,
            sql: sql
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`[${socket.id}] Client disconnected: ${reason}`);
        console.log(`[${socket.id}] Database connection at disconnect:`, !!this.databaseConnection);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  async createDatabaseConnection(databaseType, config) {
    switch (databaseType.toLowerCase()) {
      case 'mysql':
        return await mysql.createConnection({
          host: config.host || 'localhost',
          port: config.port || 3306,
          user: config.user || 'root',
          password: config.password || '',
          database: config.database || 'test',
          ...config.extra
        });

      case 'postgresql':
      case 'postgres':
        return new Pool({
          host: config.host || 'localhost',
          port: config.port || 5432,
          user: config.user || 'postgres',
          password: config.password || '',
          database: config.database || 'test',
          ...config.extra
        });

      case 'sqlite':
        return new Promise((resolve, reject) => {
          const db = new sqlite3.Database(config.path || ':memory:', (err) => {
            if (err) {
              reject(err);
            } else {
              resolve(db);
            }
          });
        });

      case 'prisma':
        // Use existing Prisma connection
        return this.prisma;

      default:
        throw new Error(`Unsupported database type: ${databaseType}`);
    }
  }

  async executeQuery(sql, dbConnection) {
    const { type, connection } = dbConnection;
    
    try {
      switch (type.toLowerCase()) {
        case 'mysql':
          const [rows] = await connection.execute(sql);
          return {
            type: 'query_result',
            success: true,
            data: rows,
            message: 'Query executed successfully'
          };

        case 'postgresql':
        case 'postgres':
          const result = await connection.query(sql);
          return {
            type: 'query_result',
            success: true,
            data: result.rows,
            message: 'Query executed successfully'
          };

        case 'sqlite':
          return new Promise((resolve, reject) => {
            if (sql.trim().toLowerCase().startsWith('select')) {
              connection.all(sql, (err, rows) => {
                if (err) {
                  reject(err);
                } else {
                  resolve({
                    type: 'query_result',
                    success: true,
                    data: rows,
                    message: 'Query executed successfully'
                  });
                }
              });
            } else {
              connection.run(sql, (err) => {
                if (err) {
                  reject(err);
                } else {
                  resolve({
                    type: 'query_result',
                    success: true,
                    data: [],
                    message: 'Query executed successfully'
                  });
                }
              });
            }
          });

        case 'prisma':
          // For Prisma, we need to use raw queries
          const prismaResult = await connection.$queryRawUnsafe(sql);
          return {
            type: 'query_result',
            success: true,
            data: prismaResult,
            message: 'Query executed successfully'
          };

        default:
          throw new Error(`Unsupported database type: ${type}`);
      }
    } catch (error) {
      throw new Error(`Query execution failed: ${error.message}`);
    }
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

  async cleanupDatabaseConnection(challengeId) {
    const dbConnection = this.databaseConnections.get(challengeId);
    if (dbConnection) {
      try {
        const { type, connection } = dbConnection;
        switch (type.toLowerCase()) {
          case 'mysql':
            await connection.end();
            break;
          case 'postgresql':
          case 'postgres':
            await connection.end();
            break;
          case 'sqlite':
            connection.close();
            break;
          case 'prisma':
            // Don't close Prisma connection as it's shared
            break;
        }
        this.databaseConnections.delete(challengeId);
        console.log(`Cleaned up database connection for challenge ${challengeId}`);
      } catch (error) {
        console.error('Error cleaning up database connection:', error);
      }
    }
  }

  stop() {
    if (this.io) {
      this.io.close();
    }
    
    if (this.server) {
      this.server.close();
    }
    
    // Clean up database connection
    if (this.databaseConnection) {
      try {
        if (this.databaseConnection.type === 'mysql' && this.databaseConnection.connection.end) {
          this.databaseConnection.connection.end();
        } else if (this.databaseConnection.type === 'postgresql' && this.databaseConnection.connection.end) {
          this.databaseConnection.connection.end();
        } else if (this.databaseConnection.type === 'sqlite' && this.databaseConnection.connection.close) {
          this.databaseConnection.connection.close();
        }
        this.databaseConnection = null;
      } catch (error) {
        console.error('Error closing database connection:', error);
      }
    }
    
    // Close Prisma connection
    this.prisma.$disconnect();
  }
}

// Export for use in server
module.exports = FlexibleDatabaseSocketServer;

// If running directly, start the server
if (require.main === module) {
  const server = new FlexibleDatabaseSocketServer();
  server.start();
  
  process.on('SIGINT', () => {
    console.log('Shutting down Flexible Database Socket.io server...');
    server.stop();
    process.exit(0);
  });
}
