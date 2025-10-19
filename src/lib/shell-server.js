const WebSocket = require('ws');
const pty = require('node-pty');

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

      // Setup shell session immediately (auto-login as root)
      this.setupShellSession(ws, clientId);

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

  setupShellSession(ws, clientId) {
    let ptyProcess;

    if (this.sharedMode && this.sharedShell) {
      // Use shared shell session
      ptyProcess = this.sharedShell;
      console.log(`[${clientId}] Using shared shell session`);
    } else {
      // Create individual shell session
      ptyProcess = this.spawnShell(clientId);
      
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
        const processedCommand = this.commandProcessor(command);
        ptyProcess.write(processedCommand);
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
    console.log(`[${clientId}] MySQL connection established directly via Docker exec`);

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
      const promptMsg = `💡 Ready for SQL commands!\r\n\r\n`;
      ws.send(promptMsg);
    }
  }

  spawnShell(clientId) {
    // Connect directly to MySQL in Docker container
    const shell = 'docker';
    const args = ['exec', '-it', 'query-quest-mysql-client', 'mysql', '-h', 'mysql', '-u', 'root', '-ppassword', 'queryquest'];

    console.log(`[${clientId}] Spawning Docker MySQL connection: ${shell} ${args.join(' ')}`);

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



  commandProcessor(command) {
    // Add any command preprocessing here
    // For now, just pass through as-is
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
