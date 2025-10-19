const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function createAdminUser() {
  console.log('🔧 Creating admin user...');

  const email = 'al.orellanaserrano@alum.uca.es';
  const password = '123456789';
  const name = 'Admin User';

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email }
    });

    if (existingUser) {
      console.log('❌ User with this email already exists!');
      console.log(`   Email: ${email}`);
      console.log(`   ID: ${existingUser.id}`);
      console.log(`   Is Admin: ${existingUser.isAdmin}`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Find the UCA institution (since the email is from UCA)
    const ucaInstitution = await prisma.institution.findFirst({
      where: {
        OR: [
          { name: { contains: 'Universidad de Cádiz' } },
          { studentEmailSuffix: '@alum.uca.es' }
        ]
      }
    });

    if (!ucaInstitution) {
      console.log('⚠️  UCA institution not found. Creating user without institution.');
    }

    // Create the admin user
    const adminUser = await prisma.user.create({
      data: {
        id: randomUUID(),
        name: name,
        email: email,
        password: hashedPassword,
        isEmailVerified: true,
        isTeacher: false,
        isAdmin: true,
        solvedChallenges: 0,
        last_login: new Date(),
        institution_id: ucaInstitution?.id || null
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log(`   ID: ${adminUser.id}`);
    console.log(`   Name: ${adminUser.name}`);
    console.log(`   Email: ${adminUser.email}`);
    console.log(`   Is Admin: ${adminUser.isAdmin}`);
    console.log(`   Is Email Verified: ${adminUser.isEmailVerified}`);
    console.log(`   Institution: ${ucaInstitution?.name || 'None'}`);
    console.log(`   Created at: ${adminUser.last_login}`);
    
    console.log('\n🎉 Admin user is ready to use!');
    console.log(`   Login with: ${email}`);
    console.log(`   Password: ${password}`);

  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    
    if (error.code === 'P2002') {
      console.log('   This email is already in use.');
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createAdminUser()
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
