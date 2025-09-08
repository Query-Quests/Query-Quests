-- Create sample tables for Query Quest
USE queryquest;

-- Users table
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    role ENUM('student', 'teacher', 'admin') DEFAULT 'student',
    institution_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Institutions table
CREATE TABLE institutions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Challenges table
CREATE TABLE challenges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL,
    statement TEXT NOT NULL,
    hint TEXT,
    solution TEXT NOT NULL,
    level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    points INT DEFAULT 100,
    institution_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- User challenges (solves)
CREATE TABLE user_challenges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    challenge_id INT NOT NULL,
    solved_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    score INT DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_challenge (user_id, challenge_id)
);

-- Insert sample institutions
INSERT INTO institutions (name, description) VALUES
('MIT', 'Massachusetts Institute of Technology'),
('Stanford University', 'Stanford University'),
('Harvard University', 'Harvard University'),
('UC Berkeley', 'University of California, Berkeley'),
('Carnegie Mellon', 'Carnegie Mellon University');

-- Insert sample users
INSERT INTO users (name, email, role, institution_id) VALUES
('John Doe', 'john.doe@mit.edu', 'student', 1),
('Jane Smith', 'jane.smith@stanford.edu', 'student', 2),
('Prof. Johnson', 'prof.johnson@harvard.edu', 'teacher', 3),
('Alice Brown', 'alice.brown@berkeley.edu', 'student', 4),
('Bob Wilson', 'bob.wilson@cmu.edu', 'admin', 5),
('Sarah Davis', 'sarah.davis@mit.edu', 'student', 1),
('Mike Johnson', 'mike.johnson@stanford.edu', 'student', 2);

-- Insert sample challenges
INSERT INTO challenges (title, statement, hint, solution, level, points, institution_id) VALUES
('Basic SELECT', 'Write a query to select all users from the users table.', 'Use SELECT * FROM users', 'SELECT * FROM users;', 'beginner', 50, 1),
('Filter by Role', 'Find all students in the users table.', 'Use WHERE clause with role = "student"', 'SELECT * FROM users WHERE role = "student";', 'beginner', 75, 1),
('Count Users', 'Count the total number of users.', 'Use COUNT(*) function', 'SELECT COUNT(*) FROM users;', 'beginner', 100, 2),
('Join Tables', 'Get all users with their institution names.', 'Use JOIN between users and institutions tables', 'SELECT u.name, i.name as institution FROM users u JOIN institutions i ON u.institution_id = i.id;', 'intermediate', 150, 2),
('Advanced Filtering', 'Find all students from MIT or Stanford.', 'Use WHERE with IN clause or OR conditions', 'SELECT * FROM users u JOIN institutions i ON u.institution_id = i.id WHERE u.role = "student" AND i.name IN ("MIT", "Stanford University");', 'intermediate', 200, 3),
('Aggregate Functions', 'Find the average points for challenges by level.', 'Use GROUP BY and AVG functions', 'SELECT level, AVG(points) as avg_points FROM challenges GROUP BY level;', 'advanced', 250, 3),
('Subquery Challenge', 'Find users who have solved at least 2 challenges.', 'Use subquery with COUNT and HAVING', 'SELECT u.name FROM users u WHERE u.id IN (SELECT user_id FROM user_challenges GROUP BY user_id HAVING COUNT(*) >= 2);', 'advanced', 300, 4);

-- Insert some sample solves
INSERT INTO user_challenges (user_id, challenge_id, score) VALUES
(1, 1, 50),
(1, 2, 75),
(2, 1, 50),
(2, 3, 100),
(3, 4, 150),
(4, 5, 200),
(5, 6, 250),
(6, 1, 50),
(6, 2, 75),
(6, 3, 100);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_institution ON users(institution_id);
CREATE INDEX idx_challenges_level ON challenges(level);
CREATE INDEX idx_challenges_institution ON challenges(institution_id);
CREATE INDEX idx_user_challenges_user ON user_challenges(user_id);
CREATE INDEX idx_user_challenges_challenge ON user_challenges(challenge_id);
