const WebSocket = require('ws');
const pty = require('node-pty');
const url = require('url');

class ShellSocketServer {
  constructor(port = 3002) {
    this.port = port;
    this.wss = null;
    this.sessions = new Map(); // Store shell sessions per connection
    this.sharedMode = false; // Individual sessions by default
    this.sharedShell = null; // Shared shell instance
  }

  start() {
    this.wss = new WebSocket.Server({
      port: this.port,
      perMessageDeflate: false
    });

    console.log(`Shell WebSocket server running on port ${this.port}`);

    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      console.log(`[${clientId}] Shell client connected from ${req.socket.remoteAddress}`);

      // Parse query parameters for database name
      const queryParams = url.parse(req.url, true).query;
      const databaseName = queryParams.database || 'practice';
      const useReadonly = queryParams.readonly !== 'false';

      console.log(`[${clientId}] Connecting to database: ${databaseName}, readonly: ${useReadonly}`);

      // Setup shell session with database context
      this.setupShellSession(ws, clientId, databaseName, useReadonly);

      // Handle disconnection
      ws.on('close', () => {
        this.cleanupSession(clientId);
        console.log(`[${clientId}] Shell client disconnected`);
      });

      ws.on('error', (error) => {
        console.error(`[${clientId}] WebSocket error:`, error);
        this.cleanupSession(clientId);
      });
    });

    // Handle server shutdown
    process.on('SIGINT', () => {
      console.log('Shutting down Shell WebSocket server...');
      this.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('Shutting down Shell WebSocket server...');
      this.stop();
      process.exit(0);
    });
  }

  setupShellSession(ws, clientId, databaseName, useReadonly) {
    let ptyProcess;

    if (this.sharedMode && this.sharedShell) {
      // Use shared shell session
      ptyProcess = this.sharedShell;
      console.log(`[${clientId}] Using shared shell session`);
    } else {
      // Create individual shell session
      ptyProcess = this.spawnShell(clientId, databaseName, useReadonly);

      if (!this.sharedMode) {
        this.sessions.set(clientId, ptyProcess);
      } else {
        this.sharedShell = ptyProcess;
      }
    }

    // Handle incoming commands from frontend
    ws.on('message', (rawCommand) => {
      try {
        const command = rawCommand.toString();
        console.log(`[${clientId}] Received command:`, command.replace(/\r?\n/g, '\\n'));

        // Process and send command to shell
        const processedCommand = this.commandProcessor(command, useReadonly);

        if (processedCommand === null) {
          // Command was blocked
          ws.send('\r\n\x1b[38;2;248;113;113m[Error] This command is not allowed in read-only mode\x1b[0m\r\n');
          ws.send('mysql> ');
        } else {
          ptyProcess.write(processedCommand);
        }
      } catch (error) {
        console.error(`[${clientId}] Error processing command:`, error);
        ws.send(`Error: ${error.message}\r\n`);
      }
    });

    // Handle shell output and send to frontend
    ptyProcess.onData((rawOutput) => {
      try {
        const processedOutput = this.outputProcessor(rawOutput);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(processedOutput);
        }
      } catch (error) {
        console.error(`[${clientId}] Error processing output:`, error);
      }
    });

    // MySQL connection is direct - no separate auto-connect needed
    console.log(`[${clientId}] MySQL connection established directly via Docker exec to database: ${databaseName}`);

    // Handle shell exit
    ptyProcess.onExit(({ exitCode, signal }) => {
      console.log(`[${clientId}] Shell process exited with code ${exitCode}, signal ${signal}`);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(`\r\n[Shell process exited with code ${exitCode}]\r\n`);
        ws.close();
      }
    });

    // Send initial welcome message
    if (ws.readyState === WebSocket.OPEN) {
      const readonlyMsg = useReadonly ? ' (read-only)' : '';
      const promptMsg = `💡 Connected to database: ${databaseName}${readonlyMsg}\r\n\r\n`;
      ws.send(promptMsg);
    }
  }

  spawnShell(clientId, databaseName = 'practice', useReadonly = true) {
    // Connect directly to MySQL in Docker container
    const shell = 'docker';

    // Use readonly user for students, admin for teachers
    const user = useReadonly ? 'student_readonly' : 'db_admin';
    const password = useReadonly ? 'student_readonly_pass' : 'db_admin_pass';

    const args = [
      'exec', '-it',
      'query-quest-mysql-client',
      'mysql',
      '-h', 'mysql-challenges',
      '-u', user,
      `-p${password}`,
      databaseName
    ];

    console.log(`[${clientId}] Spawning Docker MySQL connection: ${shell} ${args.slice(0, -1).join(' ')} -p***`);

    const ptyProcess = pty.spawn(shell, args, {
      name: 'xterm-color',
      cols: 80,
      rows: 30,
      cwd: process.cwd(),
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor'
      }
    });

    // Handle Docker connection errors
    ptyProcess.onExit(({ exitCode, signal }) => {
      if (exitCode !== 0) {
        console.error(`[${clientId}] Docker MySQL connection exited with code ${exitCode}, signal ${signal}`);
      }
    });

    return ptyProcess;
  }

  commandProcessor(command, useReadonly = true) {
    if (!useReadonly) {
      // Admin mode - allow all commands
      return command;
    }

    // Read-only mode - block dangerous commands
    const blockedPatterns = [
      /\b(INSERT)\s+INTO\b/i,
      /\b(UPDATE)\s+\w+\s+SET\b/i,
      /\b(DELETE)\s+FROM\b/i,
      /\b(DROP)\s+(TABLE|DATABASE|INDEX|VIEW)\b/i,
      /\b(TRUNCATE)\s+TABLE\b/i,
      /\b(ALTER)\s+(TABLE|DATABASE)\b/i,
      /\b(CREATE)\s+(TABLE|DATABASE|INDEX|VIEW|USER)\b/i,
      /\b(GRANT)\b/i,
      /\b(REVOKE)\b/i,
      /\bINTO\s+OUTFILE\b/i,
      /\bINTO\s+DUMPFILE\b/i,
      /\bLOAD\s+DATA\b/i,
      /\bSOURCE\b/i,
      /\\!/g,  // Shell escape
      /\bUSE\s+\w+/i,  // Database switching
    ];

    for (const pattern of blockedPatterns) {
      if (pattern.test(command)) {
        console.log(`Blocked command: ${command}`);
        return null; // Block the command
      }
    }

    return command;
  }

  outputProcessor(output) {
    // Add any output processing here
    // For now, just pass through as-is
    return output;
  }

  cleanupSession(clientId) {
    if (this.sessions.has(clientId)) {
      const ptyProcess = this.sessions.get(clientId);
      try {
        ptyProcess.kill();
      } catch (error) {
        console.error(`[${clientId}] Error killing shell process:`, error);
      }
      this.sessions.delete(clientId);
    }
  }

  setSharedTerminalMode(enabled) {
    this.sharedMode = enabled;
    console.log(`Shell terminal mode: ${enabled ? 'shared' : 'individual'} sessions`);
  }

  generateClientId() {
    return Math.random().toString(36).substring(2, 15);
  }

  stop() {
    // Clean up all sessions
    for (const [clientId, ptyProcess] of this.sessions) {
      try {
        ptyProcess.kill();
      } catch (error) {
        console.error(`Error killing shell process for ${clientId}:`, error);
      }
    }
    this.sessions.clear();

    // Clean up shared shell
    if (this.sharedShell) {
      try {
        this.sharedShell.kill();
      } catch (error) {
        console.error('Error killing shared shell process:', error);
      }
      this.sharedShell = null;
    }

    // Close WebSocket server
    if (this.wss) {
      this.wss.close();
    }
  }
}

// Start the server
const shellServer = new ShellSocketServer(3002);

// Configure for individual sessions (recommended for security)
shellServer.setSharedTerminalMode(false);

shellServer.start();

module.exports = ShellSocketServer;
