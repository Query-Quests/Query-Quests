# Unified Terminal Component

This document describes the unified terminal component that replaces both `PlaygroundTerminal` and `DatabaseTerminal`.

## Overview

The `UnifiedTerminal` component provides a single, flexible terminal interface that can work in two modes:
- **Playground Mode**: Simple terminal for testing and learning
- **Database Mode**: Full database connectivity with WebSocket support

## Usage

### Basic Usage

```jsx
import UnifiedTerminal from "@/components/UnifiedTerminal";

// Playground mode (simple terminal)
<UnifiedTerminal mode="playground" />

// Database mode (with WebSocket connection)
<UnifiedTerminal 
  mode="database"
  challengeId="123"
  onQueryResult={(result) => console.log(result)}
  onQueryError={(error) => console.error(error)}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `mode` | `'playground' \| 'database'` | `'playground'` | Terminal mode |
| `challengeId` | `string \| null` | `null` | Challenge ID for database mode |
| `onQueryResult` | `function` | `null` | Callback for query results |
| `onQueryError` | `function` | `null` | Callback for query errors |
| `className` | `string` | `"w-full h-full bg-black rounded-b-lg overflow-hidden"` | CSS classes |

## Modes

### Playground Mode

Simple terminal for testing and learning SQL:

```jsx
<UnifiedTerminal mode="playground" />
```

**Features:**
- Basic terminal interface
- Command echo (no actual database connection)
- Help system
- Clear and exit commands

**Commands:**
- `HELP` - Show available commands
- `CLEAR` - Clear terminal screen
- `EXIT` - Close terminal
- `SQL queries` - Echo SQL commands (no execution)

### Database Mode

Full database connectivity with WebSocket support:

```jsx
<UnifiedTerminal 
  mode="database"
  challengeId="123"
  onQueryResult={(result) => setQueryResult(result)}
  onQueryError={(error) => setQueryError(error)}
/>
```

**Features:**
- Real database connections (MySQL, PostgreSQL, SQLite, Prisma)
- Live query execution
- Result display in table format
- Challenge completion detection
- Database switching

**Commands:**
- `HELP` - Show available commands
- `CLEAR` - Clear terminal screen
- `EXIT` - Close database connection
- `CONNECT <type> [options]` - Connect to different database
- `SQL queries` - Execute real SQL queries

## Database Connection Examples

### Connect to Prisma Database (Default)
```bash
CONNECT prisma
```

### Connect to MySQL
```bash
CONNECT mysql localhost 3306 root password mydatabase
```

### Connect to PostgreSQL
```bash
CONNECT postgresql localhost 5432 postgres password mydatabase
```

### Connect to SQLite
```bash
CONNECT sqlite ./database.db
```

## Implementation Details

### WebSocket Connection

The terminal connects to a Socket.io server running on port 3001:

```javascript
const socket = io('http://localhost:3001', {
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});
```

### Event Handling

**Outgoing Events:**
- `setup_database` - Setup database connection
- `join_challenge` - Join challenge room
- `execute_query` - Execute SQL query

**Incoming Events:**
- `database_connected` - Database connection established
- `database_ready` - Database initialized
- `query_result` - Query execution result
- `query_error` - Query execution error
- `challenge_completed` - Challenge completed

### Terminal Features

- **xterm.js integration** for professional terminal experience
- **Input handling** with proper key mapping
- **Command buffer** for multi-character commands
- **Error handling** with try-catch blocks
- **Resize support** with FitAddon
- **Theme customization** with green-on-black colors

## Migration from Old Components

### From PlaygroundTerminal

**Before:**
```jsx
import PlaygroundTerminal from "@/components/PlaygroundTerminal";
<PlaygroundTerminal />
```

**After:**
```jsx
import UnifiedTerminal from "@/components/UnifiedTerminal";
<UnifiedTerminal mode="playground" />
```

### From DatabaseTerminal

**Before:**
```jsx
import DatabaseTerminal from "@/components/DatabaseTerminal";
<DatabaseTerminal 
  challengeId="123"
  onQueryResult={handleResult}
  onQueryError={handleError}
/>
```

**After:**
```jsx
import UnifiedTerminal from "@/components/UnifiedTerminal";
<UnifiedTerminal 
  mode="database"
  challengeId="123"
  onQueryResult={handleResult}
  onQueryError={handleError}
/>
```

## Server Setup

The terminal requires a Socket.io server running on port 3001:

```bash
# Start the flexible socket server
npm run socket

# Or start both Next.js and Socket.io servers
npm run dev:full
```

## Styling

The terminal uses a green-on-black theme that can be customized:

```javascript
theme: {
  background: '#000000',
  foreground: '#00ff00',
  cursor: '#00ff00',
  // ... more colors
}
```

## Error Handling

The component includes comprehensive error handling:

- **Connection errors** - WebSocket connection failures
- **Query errors** - SQL execution errors
- **Terminal errors** - xterm.js input/output errors
- **Database errors** - Database connection and setup errors

## Performance Considerations

- **Connection pooling** - Reuses database connections
- **Query timeouts** - Prevents hanging queries
- **Memory management** - Proper cleanup on unmount
- **Event cleanup** - Removes event listeners on disconnect

## Future Enhancements

- **Syntax highlighting** for SQL queries
- **Query history** and auto-completion
- **Export results** to CSV/JSON
- **Multiple terminal tabs** support
- **Custom themes** and configurations
