# Interactive Shell Terminal

This document explains the interactive shell terminal implementation based on the [tutorial by EddyMens](https://www.eddymens.com/blog/creating-a-browser-based-interactive-terminal-using-xtermjs-and-nodejs#why-a-terminal-in-the-browser).

## Overview

The shell terminal provides a real, interactive system shell accessible through the browser using:
- **Frontend**: xterm.js for terminal emulation
- **Backend**: node-pty for pseudo-terminal sessions
- **Communication**: WebSocket for real-time interaction

## Architecture

```
Browser (xterm.js) ←→ WebSocket ←→ Shell Server (node-pty) ←→ System Shell
```

### Components

1. **Shell Server** (`src/lib/shell-server.js`)
   - WebSocket server on port 3002
   - Spawns individual shell sessions using node-pty
   - Handles real-time command/output forwarding

2. **Terminal Component** (`src/components/Terminal.jsx`)
   - Enhanced with shell mode support
   - Direct input forwarding to shell
   - Real-time output display

3. **Shell Page** (`src/app/shell/page.jsx`)
   - Demo page showcasing shell terminal
   - Security notices and usage instructions

## Key Features

### 🔐 Security Features
- **Individual Sessions**: Each user gets their own shell process
- **Session Isolation**: No shared state between users
- **Automatic Cleanup**: Shell processes are killed when connections close
- **Process Management**: Proper cleanup on server shutdown

### ⚡ Real-time Interaction
- **Live Output**: See command output as it happens
- **Interactive Programs**: Works with vim, nano, htop, etc.
- **Progress Bars**: Real-time progress indication
- **Ctrl+C Support**: Proper signal handling

### 🎯 Terminal Features
- **Full Shell Access**: All system commands available
- **Command History**: Arrow keys for command navigation
- **Tab Completion**: Auto-completion support
- **Color Support**: Full terminal color support
- **Resize Support**: Terminal adapts to window size

## Installation & Setup

### 1. Install Dependencies

```bash
npm install node-pty ws
```

### 2. Start Servers

```bash
# Option 1: Start everything (recommended)
npm run dev:complete

# Option 2: Start shell server only
npm run shell

# Option 3: Individual services
npm run dev     # Next.js
npm run socket  # Database terminal
npm run shell   # Interactive shell
```

### 3. Access Shell Terminal

Navigate to: `http://localhost:3000/shell`

## Usage Examples

### Basic Commands
```bash
# Navigation
pwd                    # Show current directory
ls -la                # List files with details
cd /path/to/directory # Change directory

# File operations
cat filename.txt      # Display file contents
nano filename.txt     # Edit file with nano
mkdir new_directory   # Create directory

# System information
ps aux               # List running processes
df -h                # Show disk usage
top                  # System monitor
```

### Interactive Programs
```bash
# Text editors
vim filename.txt     # Vim editor
nano filename.txt    # Nano editor

# System monitors
htop                 # Interactive process viewer
watch -n 1 'ls -la'  # Watch command output

# Network tools
ping google.com      # Network connectivity test
curl https://api.github.com  # HTTP requests
```

## Configuration

### Shell Server Configuration

```javascript
// Individual sessions (recommended)
shellServer.setSharedTerminalMode(false);

// Shared session (not recommended for production)
shellServer.setSharedTerminalMode(true);
```

### Terminal Configuration

```jsx
// Use shell mode
<UnifiedTerminal 
  mode="shell"
  className="w-full h-full bg-black"
/>
```

## Security Considerations

### ⚠️ Important Security Notes

1. **Production Deployment**: 
   - Implement proper authentication
   - Use containerization (Docker)
   - Restrict available commands
   - Monitor shell activity

2. **User Permissions**:
   - Run with limited user privileges
   - Avoid running as root
   - Implement command filtering if needed

3. **Network Security**:
   - Use HTTPS/WSS in production
   - Implement proper CORS policies
   - Add rate limiting

### Recommended Security Measures

```javascript
// Command filtering example
const commandProcessor = (command) => {
  const blockedCommands = ['rm -rf', 'sudo', 'su'];
  const cmd = command.trim().toLowerCase();
  
  for (const blocked of blockedCommands) {
    if (cmd.startsWith(blocked)) {
      return 'echo "Command blocked for security"\n';
    }
  }
  
  return command;
};
```

## Troubleshooting

### Common Issues

1. **Connection Failed**
   ```bash
   # Check if shell server is running
   curl ws://localhost:3002
   
   # Restart shell server
   npm run shell
   ```

2. **Permission Denied**
   ```bash
   # Check user permissions
   whoami
   
   # Verify shell access
   echo $SHELL
   ```

3. **node-pty Installation Issues**
   ```bash
   # Install build tools (if needed)
   npm install -g node-gyp
   
   # Rebuild native modules
   npm rebuild node-pty
   ```

### Debug Mode

Enable debug logging:

```javascript
// In shell-server.js
console.log('Debug mode enabled');
```

## Performance Considerations

### Optimization Tips

1. **Connection Management**
   - Limit concurrent connections
   - Implement connection pooling
   - Set reasonable timeouts

2. **Resource Usage**
   - Monitor shell process count
   - Set memory limits
   - Implement cleanup routines

3. **Scaling**
   - Use process managers (PM2)
   - Implement load balancing
   - Consider containerization

## Comparison with Database Terminal

| Feature | Database Terminal | Shell Terminal |
|---------|------------------|----------------|
| **Purpose** | SQL query execution | System shell access |
| **Connection** | Socket.io to MySQL | WebSocket to node-pty |
| **Input** | SQL commands only | All shell commands |
| **Output** | Formatted tables | Raw terminal output |
| **Interactivity** | Limited | Full interactive |
| **Security** | SQL injection risks | System access risks |

## Integration with Existing System

The shell terminal integrates seamlessly with the existing terminal system:

```jsx
// Database mode
<UnifiedTerminal mode="database" challengeId="123" />

// Shell mode  
<UnifiedTerminal mode="shell" />

// Playground mode
<UnifiedTerminal mode="playground" />
```

## Future Enhancements

### Planned Features
- [ ] Command history persistence
- [ ] File upload/download
- [ ] Multiple shell tabs
- [ ] Collaborative sessions
- [ ] Shell recording/playback
- [ ] Custom shell themes
- [ ] Plugin system

### Advanced Features
- [ ] Container integration
- [ ] SSH tunnel support
- [ ] SFTP file browser
- [ ] Terminal sharing
- [ ] Audit logging

## References

- [Original Tutorial by EddyMens](https://www.eddymens.com/blog/creating-a-browser-based-interactive-terminal-using-xtermjs-and-nodejs)
- [xterm.js Documentation](https://xtermjs.org/)
- [node-pty GitHub](https://github.com/microsoft/node-pty)
- [WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)

## License

This implementation follows the same license as the main Query Quest project.
