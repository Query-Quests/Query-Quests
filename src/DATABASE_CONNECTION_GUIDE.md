# Database Connection Guide

This guide shows you how to connect to different types of databases using the flexible terminal system.

## Quick Start

1. **Start the servers:**
   ```bash
   npm run dev:full
   ```

2. **Open a challenge page:**
   - Navigate to `/challenges/[id]`
   - The terminal will automatically connect to your Prisma database

3. **Connect to other databases:**
   - Type `CONNECT` commands in the terminal
   - See examples below

## Supported Databases

### 1. Prisma Database (Default)
Uses your existing Prisma database setup.

```bash
CONNECT prisma
```

**What it does:**
- Connects to your existing SQLite database via Prisma
- Uses your current schema (users, challenges, institutions, etc.)
- No additional configuration needed

### 2. MySQL Database
Connect to a MySQL database.

```bash
CONNECT mysql localhost 3306 root password mydatabase
```

**Parameters:**
- `mysql` - Database type
- `localhost` - Host (optional, defaults to localhost)
- `3306` - Port (optional, defaults to 3306)
- `root` - Username (optional, defaults to root)
- `password` - Password (optional, defaults to empty)
- `mydatabase` - Database name (optional, defaults to test)

**Example with minimal config:**
```bash
CONNECT mysql
# Uses: localhost:3306, user: root, password: '', database: test
```

### 3. PostgreSQL Database
Connect to a PostgreSQL database.

```bash
CONNECT postgresql localhost 5432 postgres password mydatabase
```

**Parameters:**
- `postgresql` - Database type
- `localhost` - Host (optional, defaults to localhost)
- `5432` - Port (optional, defaults to 5432)
- `postgres` - Username (optional, defaults to postgres)
- `password` - Password (optional, defaults to empty)
- `mydatabase` - Database name (optional, defaults to test)

**Example with minimal config:**
```bash
CONNECT postgresql
# Uses: localhost:5432, user: postgres, password: '', database: test
```

### 4. SQLite Database
Connect to a SQLite database file.

```bash
CONNECT sqlite ./my-database.db
```

**Parameters:**
- `sqlite` - Database type
- `./my-database.db` - Path to SQLite file (optional, defaults to :memory:)

**Examples:**
```bash
CONNECT sqlite                    # Uses in-memory database
CONNECT sqlite ./data.db         # Uses file database
CONNECT sqlite /path/to/db.sqlite # Uses absolute path
```

## Terminal Commands

### Basic Commands
- `HELP` - Show all available commands
- `CLEAR` - Clear the terminal screen
- `EXIT` - Close the database connection
- `CONNECT <type> [options]` - Connect to a different database

### SQL Queries
Type any SQL query and press Enter to execute:

```sql
-- Basic queries
SELECT * FROM users;
SELECT name, email FROM users WHERE id = 1;

-- Create tables
CREATE TABLE products (id INT, name VARCHAR(100), price DECIMAL(10,2));

-- Insert data
INSERT INTO products (id, name, price) VALUES (1, 'Laptop', 999.99);

-- Update data
UPDATE products SET price = 899.99 WHERE id = 1;

-- Delete data
DELETE FROM products WHERE id = 1;
```

## Database Setup Examples

### MySQL Setup
1. **Install MySQL:**
   ```bash
   # macOS
   brew install mysql
   brew services start mysql
   
   # Ubuntu/Debian
   sudo apt-get install mysql-server
   sudo systemctl start mysql
   ```

2. **Create database:**
   ```sql
   CREATE DATABASE myapp;
   USE myapp;
   CREATE TABLE users (id INT PRIMARY KEY, name VARCHAR(100), email VARCHAR(100));
   INSERT INTO users VALUES (1, 'John Doe', 'john@example.com');
   ```

3. **Connect in terminal:**
   ```bash
   CONNECT mysql localhost 3306 root your_password myapp
   ```

### PostgreSQL Setup
1. **Install PostgreSQL:**
   ```bash
   # macOS
   brew install postgresql
   brew services start postgresql
   
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. **Create database:**
   ```sql
   CREATE DATABASE myapp;
   \c myapp;
   CREATE TABLE users (id SERIAL PRIMARY KEY, name VARCHAR(100), email VARCHAR(100));
   INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');
   ```

3. **Connect in terminal:**
   ```bash
   CONNECT postgresql localhost 5432 postgres your_password myapp
   ```

### SQLite Setup
1. **Create database file:**
   ```bash
   touch my-database.db
   ```

2. **Connect in terminal:**
   ```bash
   CONNECT sqlite ./my-database.db
   ```

3. **Create tables:**
   ```sql
   CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
   INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com');
   ```

## Advanced Configuration

### Custom Database Configurations
You can modify the connection parameters in the terminal:

```bash
# Custom MySQL with SSL
CONNECT mysql myserver.com 3306 myuser mypass mydb

# Custom PostgreSQL with custom port
CONNECT postgresql db.example.com 5433 admin secret production_db

# SQLite with custom path
CONNECT sqlite /var/lib/myapp/data.sqlite
```

### Environment Variables
For production, you can set environment variables:

```bash
export DB_HOST=localhost
export DB_PORT=3306
export DB_USER=root
export DB_PASSWORD=secret
export DB_NAME=myapp
```

Then use:
```bash
CONNECT mysql $DB_HOST $DB_PORT $DB_USER $DB_PASSWORD $DB_NAME
```

## Troubleshooting

### Common Issues

1. **"Connection refused"**
   - Check if the database server is running
   - Verify host and port are correct
   - Check firewall settings

2. **"Authentication failed"**
   - Verify username and password
   - Check if user has access to the database
   - Ensure database exists

3. **"Database not found"**
   - Create the database first
   - Check database name spelling
   - Verify user has CREATE privileges

4. **"Socket.io connection failed"**
   - Ensure Socket.io server is running on port 3001
   - Check browser console for errors
   - Verify CORS settings

### Debug Mode
Enable debug logging by checking the server console output.

### Testing Connections
Test your database connection outside the terminal:

```bash
# MySQL
mysql -h localhost -P 3306 -u root -p mydatabase

# PostgreSQL
psql -h localhost -p 5432 -U postgres -d mydatabase

# SQLite
sqlite3 my-database.db
```

## Security Considerations

1. **Never hardcode passwords** in production
2. **Use environment variables** for sensitive data
3. **Limit database privileges** to what's needed
4. **Use SSL connections** for remote databases
5. **Regularly update** database drivers and dependencies

## Performance Tips

1. **Use connection pooling** for high-traffic applications
2. **Index frequently queried columns**
3. **Limit result sets** with LIMIT clauses
4. **Use prepared statements** for repeated queries
5. **Monitor query performance** and optimize slow queries

## Next Steps

1. **Try different databases** to see which works best for your use case
2. **Create sample data** to test your queries
3. **Experiment with complex queries** like JOINs and subqueries
4. **Set up production databases** with proper security
5. **Monitor performance** and optimize as needed

Happy querying! 🚀
