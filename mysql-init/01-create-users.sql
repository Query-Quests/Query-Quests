-- MySQL initialization script for Query Quest Challenge Database
-- This runs on the mysql-challenges container on first startup

-- Read-only user for students (SELECT only)
CREATE USER IF NOT EXISTS 'student_readonly'@'%' IDENTIFIED BY 'student_readonly_pass';

-- Teacher user for preview queries (SELECT only, but for different purposes)
CREATE USER IF NOT EXISTS 'teacher_preview'@'%' IDENTIFIED BY 'teacher_preview_pass';

-- Admin user for database management (full privileges)
CREATE USER IF NOT EXISTS 'db_admin'@'%' IDENTIFIED BY 'db_admin_pass';
GRANT ALL PRIVILEGES ON *.* TO 'db_admin'@'%' WITH GRANT OPTION;

-- Create a default practice database for general use
CREATE DATABASE IF NOT EXISTS practice;

-- Grant student read access to practice database
GRANT SELECT ON practice.* TO 'student_readonly'@'%';
GRANT SELECT ON practice.* TO 'teacher_preview'@'%';

FLUSH PRIVILEGES;

-- Create sample tables in practice database
USE practice;

-- Sample employees table
CREATE TABLE IF NOT EXISTS employees (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    department VARCHAR(50),
    salary DECIMAL(10, 2),
    hire_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample departments table
CREATE TABLE IF NOT EXISTS departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    budget DECIMAL(15, 2),
    manager_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample products table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample orders table
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    product_id INT,
    quantity INT NOT NULL,
    total_amount DECIMAL(10, 2),
    order_date DATE,
    status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Insert sample data into employees
INSERT INTO employees (first_name, last_name, email, department, salary, hire_date) VALUES
('John', 'Doe', 'john.doe@company.com', 'Engineering', 75000.00, '2020-01-15'),
('Jane', 'Smith', 'jane.smith@company.com', 'Marketing', 65000.00, '2019-06-20'),
('Bob', 'Johnson', 'bob.johnson@company.com', 'Engineering', 80000.00, '2018-03-10'),
('Alice', 'Williams', 'alice.williams@company.com', 'HR', 55000.00, '2021-09-01'),
('Charlie', 'Brown', 'charlie.brown@company.com', 'Finance', 70000.00, '2020-11-15'),
('Diana', 'Davis', 'diana.davis@company.com', 'Engineering', 85000.00, '2017-02-28'),
('Eve', 'Miller', 'eve.miller@company.com', 'Marketing', 60000.00, '2022-04-10'),
('Frank', 'Wilson', 'frank.wilson@company.com', 'Engineering', 72000.00, '2021-07-22'),
('Grace', 'Moore', 'grace.moore@company.com', 'HR', 58000.00, '2020-08-05'),
('Henry', 'Taylor', 'henry.taylor@company.com', 'Finance', 75000.00, '2019-12-01');

-- Insert sample data into departments
INSERT INTO departments (name, budget, manager_id) VALUES
('Engineering', 500000.00, 3),
('Marketing', 200000.00, 2),
('HR', 150000.00, 4),
('Finance', 300000.00, 5),
('Sales', 250000.00, NULL);

-- Insert sample data into products
INSERT INTO products (name, category, price, stock_quantity) VALUES
('Laptop Pro 15', 'Electronics', 1299.99, 50),
('Wireless Mouse', 'Electronics', 29.99, 200),
('Office Chair', 'Furniture', 249.99, 75),
('Standing Desk', 'Furniture', 599.99, 30),
('Monitor 27 inch', 'Electronics', 399.99, 100),
('Keyboard Mechanical', 'Electronics', 89.99, 150),
('Webcam HD', 'Electronics', 79.99, 80),
('Desk Lamp', 'Office Supplies', 34.99, 120),
('Notebook Set', 'Office Supplies', 12.99, 500),
('Pen Pack', 'Office Supplies', 8.99, 1000);

-- Insert sample data into orders
INSERT INTO orders (customer_name, product_id, quantity, total_amount, order_date, status) VALUES
('Tech Corp', 1, 10, 12999.90, '2024-01-15', 'delivered'),
('StartUp Inc', 2, 50, 1499.50, '2024-01-20', 'shipped'),
('Big Company', 3, 25, 6249.75, '2024-02-01', 'processing'),
('Small Biz', 4, 5, 2999.95, '2024-02-10', 'pending'),
('Home Office', 5, 3, 1199.97, '2024-02-15', 'delivered'),
('Remote Team', 6, 20, 1799.80, '2024-02-20', 'shipped'),
('Video Studio', 7, 10, 799.90, '2024-03-01', 'delivered'),
('Writing Co', 9, 100, 1299.00, '2024-03-05', 'processing'),
('School Dist', 10, 500, 4495.00, '2024-03-10', 'pending'),
('Design Agency', 1, 5, 6499.95, '2024-03-15', 'cancelled');
