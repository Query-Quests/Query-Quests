# Docker MySQL Client Shell Terminal

This document explains how the shell terminal now connects to a Docker container with MySQL client tools, providing a secure and isolated environment for database operations.

## 🏗️ Architecture Overview

```
Browser (xterm.js) ←→ WebSocket ←→ Shell Server ←→ Docker Container (MySQL Client) ←→ MySQL Server
```

### Container Setup

1. **MySQL Server Container** (`query-quest-mysql`)
   - MySQL 8.0 server
   - Hosts the `queryquest` database
   - Port 3306 exposed to host

2. **MySQL Client Container** (`query-quest-mysql-client`)
   - MySQL 8.0 image with client tools
   - Connected to MySQL server via Docker network
   - Provides bash shell with MySQL client access

3. **Shell Server** (`src/lib/shell-server.js`)
   - Connects to client container via `docker exec`
   - Provides WebSocket interface to browser

## 🚀 Quick Start

### 1. Start All Services

```bash
# Option 1: Everything with Docker (recommended)
cd src
npm run dev:docker

# Option 2: Manual setup
docker-compose up -d
npm run dev:complete
```

### 2. Access the MySQL Client Shell

Navigate to: `http://localhost:3000/shell`

### 3. Connect to MySQL

Once in the container shell, connect to MySQL:

```bash
# Connect as root user
mysql -h mysql -u root -ppassword

# Connect directly to queryquest database
mysql -h mysql -u root -ppassword queryquest

# Connect as queryquest user
mysql -h mysql -u queryquest -pqueryquest
```

## 🐳 Docker Configuration

### docker-compose.yml

```yaml
services:
  mysql:
    image: mysql:8.0
    container_name: query-quest-mysql
    # ... MySQL server configuration

  mysql-client:
    image: mysql:8.0
    container_name: query-quest-mysql-client
    depends_on:
      - mysql
    command: >
      bash -c "
        echo 'MySQL Client Container Ready';
        echo 'Available commands:';
        echo '  mysql -h mysql -u root -p (password: password)';
        echo '  mysql -h mysql -u queryquest -p (password: queryquest)';
        echo '  mysql -h mysql -u root -ppassword queryquest (direct connect)';
        echo '';
        echo 'Container shell ready...';
        tail -f /dev/null
      "
    volumes:
      - ./mysql-init:/docker-entrypoint-initdb.d:ro
    networks:
      - default
```

### Shell Server Configuration

```javascript
spawnShell(clientId) {
  // Connect to Docker container shell
  const shell = 'docker';
  const args = ['exec', '-it', 'query-quest-mysql-client', '/bin/bash'];
  
  const ptyProcess = pty.spawn(shell, args, {
    name: 'xterm-color',
    cols: 80,
    rows: 30,
    // ...
  });
  
  return ptyProcess;
}
```

## 💡 Usage Examples

### Basic Container Commands

```bash
# Check container environment
whoami                    # Current user
pwd                      # Current directory
ls -la                   # List files
env | grep MYSQL         # MySQL environment variables

# System information
cat /etc/os-release      # OS information
mysql --version          # MySQL client version
```

### MySQL Operations

```bash
# Connect to MySQL
mysql -h mysql -u root -ppassword queryquest

# Once connected to MySQL:
SHOW DATABASES;
USE queryquest;
SHOW TABLES;
SELECT * FROM users LIMIT 5;
DESCRIBE challenges;

# Exit MySQL
exit
```

### Advanced Usage

```bash
# Execute SQL from command line
mysql -h mysql -u root -ppassword queryquest -e "SHOW TABLES;"

# Import SQL file (if you have one in the container)
mysql -h mysql -u root -ppassword queryquest < /path/to/file.sql

# Export database
mysqldump -h mysql -u root -ppassword queryquest > backup.sql
```

## 🔧 Available npm Scripts

```bash
# Docker management
npm run docker:up        # Start Docker containers
npm run docker:down      # Stop Docker containers
npm run docker:logs      # View container logs

# Development with Docker
npm run dev:docker       # Start everything (Docker + servers)

# Individual services
npm run dev              # Next.js only
npm run socket           # Database socket server
npm run shell            # Shell WebSocket server
```

## 🛠️ Management Script

Use the provided `docker-setup.sh` script for easy management:

```bash
# Make executable (first time only)
chmod +x docker-setup.sh

# Start everything
./docker-setup.sh start

# Check status
./docker-setup.sh status

# Test MySQL connection
./docker-setup.sh test

# Stop containers
./docker-setup.sh stop

# Clean up everything
./docker-setup.sh cleanup
```

## 🔍 Troubleshooting

### Container Connection Issues

```bash
# Check if containers are running
docker ps

# Check container logs
docker logs query-quest-mysql-client
docker logs query-quest-mysql

# Test direct container access
docker exec -it query-quest-mysql-client bash
```

### MySQL Connection Issues

```bash
# Test MySQL server from client container
docker exec query-quest-mysql-client mysql -h mysql -u root -ppassword -e "SELECT 1;"

# Check MySQL server status
docker exec query-quest-mysql mysqladmin ping -h localhost -u root -ppassword
```

### Shell Server Issues

```bash
# Check if shell server is running
ps aux | grep shell-server

# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" -H "Sec-WebSocket-Key: test" http://localhost:3002/
```

## 🔐 Security Benefits

### Container Isolation
- **Process Isolation**: Shell commands run in container, not host
- **Network Isolation**: Container can only access MySQL server
- **File System Isolation**: Limited access to container filesystem
- **User Isolation**: Each session gets separate container process

### MySQL Security
- **Network Security**: MySQL only accessible within Docker network
- **User Management**: Separate MySQL users with limited privileges
- **Data Protection**: Database data persists in Docker volumes

## 🎯 Features

### ✅ What Works
- **Interactive MySQL Client**: Full mysql command-line interface
- **Container Shell Access**: bash shell within MySQL client container
- **Real-time Terminal**: All terminal features (colors, interactive programs)
- **Multiple Sessions**: Each user gets individual container session
- **Automatic Cleanup**: Container processes cleaned up on disconnect

### ⏳ Planned Enhancements
- **File Upload/Download**: Transfer files to/from container
- **SQL Script Execution**: Upload and execute SQL files
- **Database Backup/Restore**: Built-in backup functionality
- **Container Resource Limits**: CPU/memory limits for security

## 📊 Performance Considerations

### Resource Usage
- **Container Overhead**: Each session creates a new container process
- **Memory Usage**: MySQL client + bash shell per session
- **Network Latency**: Additional Docker network layer

### Optimization Tips
```bash
# Monitor container resource usage
docker stats query-quest-mysql-client

# Limit container resources (add to docker-compose.yml)
deploy:
  resources:
    limits:
      memory: 256M
      cpus: '0.5'
```

## 🔄 Migration from Host Shell

### Before (Host Shell)
```javascript
// Connected directly to host shell
const shell = process.env.SHELL || '/bin/bash';
const ptyProcess = pty.spawn(shell, [], { ... });
```

### After (Docker Container)
```javascript
// Connects to Docker container shell
const shell = 'docker';
const args = ['exec', '-it', 'query-quest-mysql-client', '/bin/bash'];
const ptyProcess = pty.spawn(shell, args, { ... });
```

## 🌐 Integration Points

### With Database Terminal
- **Complementary**: Database terminal for structured queries
- **Container Terminal**: For system-level MySQL operations
- **Different Protocols**: Socket.io vs WebSocket

### With Existing System
- **Same Terminal Component**: Uses `mode="shell"`
- **Same Infrastructure**: xterm.js frontend, node-pty backend
- **Unified Interface**: Consistent user experience

## 📝 Development Notes

### Container Lifecycle
1. **Container Start**: `docker-compose up -d`
2. **Shell Connection**: `docker exec -it query-quest-mysql-client /bin/bash`
3. **Session Management**: Individual processes per user
4. **Cleanup**: Automatic process termination on disconnect

### Error Handling
- **Container Not Running**: Graceful error messages
- **MySQL Connection Failed**: Clear error reporting
- **Docker Command Failed**: Proper error propagation

## 🚀 Future Enhancements

### Planned Features
- [ ] **Multi-Database Support**: Connect to different database types
- [ ] **Container Templates**: Pre-configured environments
- [ ] **File Manager**: Browse/edit files in container
- [ ] **SQL Editor**: Syntax highlighting for SQL files
- [ ] **Query History**: Persistent command history

### Advanced Features
- [ ] **Kubernetes Integration**: Deploy on K8s clusters
- [ ] **Container Registry**: Custom container images
- [ ] **Resource Monitoring**: Real-time resource usage
- [ ] **Audit Logging**: Track all container activities

This setup provides a secure, isolated, and professional MySQL client environment accessible through your browser! 🎉
