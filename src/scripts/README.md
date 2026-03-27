# Database Seeding Scripts

This directory contains scripts to populate the database with sample data for testing and development.

## Leaderboard Seeding Script

### Overview
The `seed-leaderboard.js` script populates the database with fictitious data to demonstrate the leaderboard functionality.

### What it creates:
- **3 Institutions**: State University, Tech College, Research Institute
- **20 Students**: With realistic names, emails, scores, and challenge completion counts
- **5 Sample Challenges**: Various difficulty levels with different point values
- **Realistic Data**: Users distributed across institutions with varying performance levels

### Usage

#### Option 1: Using npm script (Recommended)
```bash
cd src
npm run seed-leaderboard
```

#### Option 2: Direct execution
```bash
cd src
node scripts/seed-leaderboard.js
```

### Sample Data Overview

**Top 5 Students:**
1. Alice Johnson - 2,850 points (15 challenges)
2. Bob Smith - 2,720 points (14 challenges)  
3. Carol Davis - 2,680 points (13 challenges)
4. David Wilson - 2,590 points (12 challenges)
5. Emma Brown - 2,540 points (12 challenges)

**Institutions:**
- State University (@university.edu)
- Tech College (@techcollege.edu)
- Research Institute (@institute.edu)

**Default Login:**
- Email: Any of the seeded user emails
- Password: `password123`

### Features
- ✅ Prevents duplicate data (safe to run multiple times)
- ✅ Creates realistic score distributions
- ✅ Associates users with appropriate institutions
- ✅ Adds recent login timestamps
- ✅ Creates sample challenges with varying difficulty

### After Running
1. Visit the leaderboard page to see the top 20 students
2. Check the line chart showing 3-month progression
3. Test filtering by institution
4. Login as any user with password `password123`

### Troubleshooting
- Ensure your database is running and accessible
- Make sure Prisma is properly configured
- Check that all dependencies are installed (`npm install`)
- Verify database connection in your `.env` file
