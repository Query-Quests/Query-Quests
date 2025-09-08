# Development Setup Guide

This guide explains how to run the Query Quest application with all its components.

## Quick Start

### Unified Development Command
```bash
npm run dev:full
```
This command starts both:
- Next.js development server (port 3000)
- Socket.io server for database terminal (port 3001)

### Individual Services
```bash
# Start only Next.js
npm run dev

# Start only Socket.io server
npm run socket
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js development server only |
| `npm run socket` | Start Socket.io server only |
| `npm run dev:full` | Start Next.js + Socket.io servers (recommended) |

## Services and Ports

| Service | Port | URL | Description |
|---------|------|-----|-------------|
| Next.js | 3000 | http://localhost:3000 | Main application |
| Socket.io | 3001 | http://localhost:3001 | Database terminal server |

## Database Connection

The terminal automatically connects to your MySQL database:
- **Host:** localhost:3306
- **Database:** queryquest
- **Username:** root
- **Password:** password

*Note: Make sure your MySQL database is running separately (via Docker Compose or local installation)*

## Development Workflow

1. **Start MySQL database** (separate terminal):
   ```bash
   docker-compose up -d
   ```

2. **Start the application**:
   ```bash
   npm run dev:full
   ```

3. **Open the application**:
   - Main app: http://localhost:3000
   - Database admin: http://localhost:8080 (if using Docker Compose)

4. **Test the terminal**:
   - Go to any challenge page
   - Terminal should auto-connect to MySQL
   - Try: `SELECT * FROM users;`

## Troubleshooting

### Socket.io Connection Issues
```bash
# Check if Socket.io server is running
curl http://localhost:3001/socket.io/

# Restart Socket.io server
npm run socket
```

### MySQL Connection Issues
Make sure MySQL is running:
```bash
# If using Docker Compose
docker-compose up -d

# Check if MySQL is running
docker ps | grep mysql
```

### Port Conflicts
If you get port conflicts:
- Next.js (3000): Change in `next.config.mjs`
- Socket.io (3001): Change in `lib/flexible-socket-server.js`

## File Structure

```
src/
├── lib/
│   └── flexible-socket-server.js    # Socket.io server
├── components/
│   └── Terminal.jsx                 # Database terminal component
├── app/
│   ├── challenges/[id]/page.jsx     # Challenge pages with terminal
│   └── playground/page.jsx          # Playground with terminal
└── package.json                     # Scripts and dependencies
```

## Dependencies

- **Next.js 15** - React framework
- **Socket.io** - Real-time communication
- **xterm.js** - Terminal emulator
- **mysql2** - MySQL driver for terminal
- **concurrently** - Run multiple commands simultaneously

## Environment Variables

No environment variables are required for basic development. The application uses:
- Default database connections
- Local development settings

## Production Deployment

For production, you'll need to:
1. Set up a production MySQL database
2. Update connection strings in `flexible-socket-server.js`
3. Configure environment variables
4. Use `npm run build` and `npm run start`
