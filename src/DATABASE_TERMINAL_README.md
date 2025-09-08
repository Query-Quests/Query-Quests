# Database Terminal Integration

This implementation provides a real-time database terminal using xterm.js and Socket.io, allowing users to execute SQL queries directly in the browser.

## Architecture

```
Browser (xterm.js) ↔ Socket.io ↔ Node.js Server ↔ SQLite Process
```

## Components

### 1. DatabaseTerminal Component (`src/components/DatabaseTerminal.jsx`)
- **xterm.js terminal interface** with proper input handling
- **Socket.io connection** to database server
- **Real-time query execution** and result display
- **Command handling** (HELP, CLEAR, EXIT)
- **Challenge completion detection**

### 2. Socket.io Server (`src/lib/socket-server.js`)
- **Node.js Socket.io server** running on port 3001
- **Database process management** (one per challenge)
- **SQLite integration** with challenge-specific schemas
- **Query result parsing** and formatting
- **Room-based connections** for challenge isolation

### 3. API Routes (`src/app/api/websocket/route.js`)
- **Fallback HTTP API** for development
- **Mock database responses** for testing
- **Challenge solution validation**

## Setup Instructions

### 1. Install Dependencies
```bash
npm install socket.io socket.io-client concurrently
```

### 2. Start the Development Environment

**Option A: Run both servers separately**
```bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Socket.io server
npm run socket
```

**Option B: Run both servers together**
```bash
npm run dev:full
```

### 3. Access the Terminal
1. Navigate to any challenge page: `/challenges/[id]`
2. The left panel will show the database terminal
3. Type SQL queries and press Enter to execute

## Features

### Terminal Commands
- **SQL Queries**: Type any SQL and press Enter
- **HELP**: Show available commands
- **CLEAR**: Clear the terminal screen
- **EXIT**: Close the database connection

### Real-time Features
- **Live query execution** with immediate feedback
- **Table result formatting** with proper alignment
- **Error handling** with descriptive messages
- **Challenge completion detection**
- **Connection status indicators**

### Database Integration
- **SQLite backend** with challenge-specific schemas
- **Process isolation** (one database per challenge)
- **Automatic cleanup** when connections close
- **Query timeout protection** (10 seconds)

## Customization

### Adding New Challenge Schemas
Edit `src/lib/websocket-server.js` in the `initializeChallengeDatabase` method:

```javascript
async initializeChallengeDatabase(dbProcess, challengeId) {
  const schemas = {
    '1': `
      CREATE TABLE users (id INTEGER, name TEXT, email TEXT);
      INSERT INTO users VALUES (1, 'John', 'john@example.com');
    `,
    '2': `
      CREATE TABLE products (id INTEGER, name TEXT, price REAL);
      INSERT INTO products VALUES (1, 'Laptop', 999.99);
    `
  };
  
  const schema = schemas[challengeId] || schemas['1'];
  // ... rest of the method
}
```

### Customizing Terminal Theme
Edit `src/components/DatabaseTerminal.jsx` in the Terminal configuration:

```javascript
const term = new Terminal({
  theme: {
    background: '#000000',
    foreground: '#00ff00',
    // ... customize colors
  }
});
```

### Adding New Commands
Edit the `handleTerminalInput` method in `DatabaseTerminal.jsx`:

```javascript
if (command.toUpperCase() === 'SCHEMA') {
  showSchema(term);
  return;
}
```

## Security Considerations

1. **Process Isolation**: Each challenge gets its own database process
2. **Query Timeouts**: Prevents infinite loops and resource exhaustion
3. **Input Validation**: Sanitize SQL queries before execution
4. **Resource Limits**: Monitor memory and CPU usage
5. **Connection Limits**: Prevent too many concurrent connections

## Production Deployment

### 1. Use a Proper Socket.io Server
The current implementation already uses Socket.io, but for production:
- **Redis adapter** for scaling across multiple servers
- **Docker** for containerized database processes
- **Load balancing** for high availability

### 2. Database Security
- **Read-only databases** for challenges
- **Query whitelisting** for allowed operations
- **User authentication** and authorization
- **Rate limiting** to prevent abuse

### 3. Monitoring
- **Connection metrics** and health checks
- **Query performance** monitoring
- **Error logging** and alerting
- **Resource usage** tracking

## Troubleshooting

### Common Issues

1. **Socket.io Connection Failed**
   - Ensure Socket.io server is running on port 3001
   - Check firewall settings
   - Verify CORS configuration
   - Check browser console for connection errors

2. **Terminal Not Responding**
   - Check browser console for errors
   - Verify xterm.js dependencies
   - Clear browser cache

3. **Database Queries Failing**
   - Check SQLite installation
   - Verify database schema initialization
   - Check server logs for errors

### Debug Mode
Enable debug logging by setting:
```javascript
const DEBUG = true; // In DatabaseTerminal.jsx
```

## Future Enhancements

1. **Multiple Database Support** (PostgreSQL, MySQL, etc.)
2. **Query History** and auto-completion
3. **Syntax Highlighting** for SQL
4. **Export Results** to CSV/JSON
5. **Collaborative Features** for team challenges
6. **Performance Analytics** and query optimization hints
