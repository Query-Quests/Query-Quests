// Set DATABASE_URL environment variable
process.env.DATABASE_URL = "file:./prisma/dev.db";

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Fictitious user data
const fictitiousUsers = [
  { name: "Alice Johnson", email: "alice.johnson@university.edu", score: 2850, challenges: 15 },
  { name: "Bob Smith", email: "bob.smith@techcollege.edu", score: 2720, challenges: 14 },
  { name: "Carol Davis", email: "carol.davis@university.edu", score: 2680, challenges: 13 },
  { name: "David Wilson", email: "david.wilson@institute.edu", score: 2590, challenges: 12 },
  { name: "Emma Brown", email: "emma.brown@university.edu", score: 2540, challenges: 12 },
  { name: "Frank Miller", email: "frank.miller@techcollege.edu", score: 2480, challenges: 11 },
  { name: "Grace Lee", email: "grace.lee@institute.edu", score: 2420, challenges: 11 },
  { name: "Henry Taylor", email: "henry.taylor@university.edu", score: 2380, challenges: 10 },
  { name: "Ivy Chen", email: "ivy.chen@techcollege.edu", score: 2340, challenges: 10 },
  { name: "Jack Anderson", email: "jack.anderson@institute.edu", score: 2290, challenges: 9 },
  { name: "Kate Thompson", email: "kate.thompson@university.edu", score: 2250, challenges: 9 },
  { name: "Liam Garcia", email: "liam.garcia@techcollege.edu", score: 2180, challenges: 8 },
  { name: "Mia Rodriguez", email: "mia.rodriguez@institute.edu", score: 2120, challenges: 8 },
  { name: "Noah Martinez", email: "noah.martinez@university.edu", score: 2080, challenges: 7 },
  { name: "Olivia White", email: "olivia.white@techcollege.edu", score: 2020, challenges: 7 },
  { name: "Peter Jackson", email: "peter.jackson@institute.edu", score: 1980, challenges: 6 },
  { name: "Quinn Lewis", email: "quinn.lewis@university.edu", score: 1920, challenges: 6 },
  { name: "Ruby Clark", email: "ruby.clark@techcollege.edu", score: 1860, challenges: 5 },
  { name: "Sam Walker", email: "sam.walker@institute.edu", score: 1820, challenges: 5 },
  { name: "Tina Hall", email: "tina.hall@university.edu", score: 1780, challenges: 4 }
];

// Institution data
const institutions = [
  { name: "State University", studentSuffix: "@university.edu", teacherSuffix: "@staff.university.edu" },
  { name: "Tech College", studentSuffix: "@techcollege.edu", teacherSuffix: "@faculty.techcollege.edu" },
  { name: "Research Institute", studentSuffix: "@institute.edu", teacherSuffix: "@research.institute.edu" }
];

async function seedLeaderboardData() {
  try {
    console.log('🌱 Starting to seed leaderboard data...');

    // First, create institutions
    console.log('📚 Creating institutions...');
    const createdInstitutions = [];
    
    for (const inst of institutions) {
      const existingInstitution = await prisma.institution.findFirst({
        where: { name: inst.name }
      });

      if (!existingInstitution) {
        const institution = await prisma.institution.create({
          data: {
            name: inst.name,
            studentEmailSuffix: inst.studentSuffix,
            teacherEmailSuffix: inst.teacherSuffix,
            address: `123 ${inst.name} Street, Education City, EC 12345`
          }
        });
        createdInstitutions.push(institution);
        console.log(`✅ Created institution: ${institution.name}`);
      } else {
        createdInstitutions.push(existingInstitution);
        console.log(`ℹ️  Institution already exists: ${existingInstitution.name}`);
      }
    }

    // Create users
    console.log('👥 Creating users...');
    const defaultPassword = await bcrypt.hash('password123', 10);
    
    for (let i = 0; i < fictitiousUsers.length; i++) {
      const userData = fictitiousUsers[i];
      
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`ℹ️  User already exists: ${userData.email}`);
        continue;
      }

      // Determine institution based on email domain
      let institutionId = null;
      if (userData.email.includes('@university.edu')) {
        institutionId = createdInstitutions.find(inst => inst.name === 'State University')?.id;
      } else if (userData.email.includes('@techcollege.edu')) {
        institutionId = createdInstitutions.find(inst => inst.name === 'Tech College')?.id;
      } else if (userData.email.includes('@institute.edu')) {
        institutionId = createdInstitutions.find(inst => inst.name === 'Research Institute')?.id;
      }

      // Create user
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          password: defaultPassword,
          isEmailVerified: true,
          isTeacher: false,
          isAdmin: false,
          solvedChallenges: userData.challenges,
          totalScore: userData.score,
          institution_id: institutionId,
          last_login: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random login within last week
        }
      });

      console.log(`✅ Created user: ${user.name} (${user.totalScore} pts, ${user.solvedChallenges} challenges)`);
    }

    // Create some sample challenges
    console.log('🎯 Creating sample challenges...');
    const sampleChallenges = [
      {
        name: "String Reversal Challenge",
        statement: "Write a function to reverse a string",
        solution: "function reverseString(str) { return str.split('').reverse().join(''); }",
        level: 1,
        initial_score: 100,
        current_score: 100
      },
      {
        name: "Binary Search Algorithm",
        statement: "Implement a binary search algorithm",
        solution: "function binarySearch(arr, target) { /* implementation */ }",
        level: 3,
        initial_score: 300,
        current_score: 280
      },
      {
        name: "REST API Authentication",
        statement: "Create a REST API endpoint for user authentication",
        solution: "app.post('/auth/login', async (req, res) => { /* implementation */ })",
        level: 4,
        initial_score: 400,
        current_score: 350
      },
      {
        name: "Database Schema Design",
        statement: "Design a database schema for an e-commerce system",
        solution: "CREATE TABLE users (...); CREATE TABLE products (...); /* etc */",
        level: 5,
        initial_score: 500,
        current_score: 450
      },
      {
        name: "Quicksort Implementation",
        statement: "Implement a sorting algorithm (quicksort)",
        solution: "function quickSort(arr) { /* implementation */ }",
        level: 3,
        initial_score: 300,
        current_score: 270
      }
    ];

    for (let i = 0; i < sampleChallenges.length; i++) {
      const challengeData = sampleChallenges[i];
      const institutionId = createdInstitutions[i % createdInstitutions.length].id;

      const existingChallenge = await prisma.challenge.findFirst({
        where: { statement: challengeData.statement }
      });

      if (!existingChallenge) {
        const challenge = await prisma.challenge.create({
          data: {
            ...challengeData,
            institution_id: institutionId,
            solves: Math.floor(Math.random() * 15) + 5 // Random solves between 5-20
          }
        });
        console.log(`✅ Created challenge: ${challenge.name}`);
      }
    }

    console.log('🎉 Leaderboard data seeding completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - ${institutions.length} institutions created/verified`);
    console.log(`   - ${fictitiousUsers.length} users created/verified`);
    console.log(`   - ${sampleChallenges.length} challenges created/verified`);
    console.log('');
    console.log('🔐 Default password for all users: password123');
    console.log('');
    console.log('🚀 You can now view the leaderboard with realistic data!');

  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
if (require.main === module) {
  seedLeaderboardData()
    .catch((error) => {
      console.error('❌ Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedLeaderboardData };
