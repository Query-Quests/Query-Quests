const { PrismaClient } = require('@prisma/client');
const { 
  calculateChallengeScore, 
  handleChallengeSolve, 
  getLeaderboard 
} = require('../lib/scoring-utils');

const prisma = new PrismaClient();

async function testScoringSystem() {
  console.log('🧪 Testing scoring system...\n');

  try {
    // Get a challenge and a user to test with
    const challenge = await prisma.challenge.findFirst({
      where: { level: 1 }
    });

    const user = await prisma.user.findFirst({
      where: { isAdmin: false, isTeacher: false }
    });

    if (!challenge || !user) {
      console.log('❌ No challenge or user found for testing');
      return;
    }

    console.log(`📋 Testing with challenge: "${challenge.statement.substring(0, 50)}..."`);
    console.log(`👤 Testing with user: ${user.name}`);
    console.log(`🎯 Initial challenge score: ${challenge.initial_score}`);
    console.log(`📊 Current challenge score: ${challenge.current_score}`);
    console.log(`🔢 Current solves: ${challenge.solves}\n`);

    // Test score calculation
    console.log('🧮 Testing score calculation:');
    for (let solves = 0; solves <= 10; solves++) {
      const score = calculateChallengeScore(challenge.initial_score, solves);
      console.log(`  Solves: ${solves} → Score: ${score}`);
    }

    console.log('\n🎮 Testing challenge solve:');
    
    // Clear any existing solves for this user-challenge combination
    await prisma.userChallenge.deleteMany({
      where: {
        user_id: user.id,
        challenge_id: challenge.id
      }
    });

    // Reset challenge solves count
    await prisma.challenge.update({
      where: { id: challenge.id },
      data: { solves: 0, current_score: challenge.initial_score }
    });

    // Reset user stats
    await prisma.user.update({
      where: { id: user.id },
      data: { solvedChallenges: 0, totalScore: 0 }
    });

    // Test solving the challenge
    const result = await handleChallengeSolve(user.id, challenge.id);
    console.log(`✅ Challenge solved!`);
    console.log(`   User received score: ${result.userScore}`);
    console.log(`   Challenge current score: ${result.challengeScore}`);
    console.log(`   User total score: ${result.totalScore}`);

    // Test solving the same challenge again (should fail)
    try {
      await handleChallengeSolve(user.id, challenge.id);
      console.log('❌ Should not have been able to solve the same challenge twice');
    } catch (error) {
      console.log(`✅ Correctly prevented duplicate solve: ${error.message}`);
    }

    // Test leaderboard
    console.log('\n🏆 Testing leaderboard:');
    const leaderboard = await getLeaderboard(5);
    console.log('Top 5 users:');
    leaderboard.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.name} - ${user.totalScore} points (${user.solvedChallenges} challenges)`);
    });

    console.log('\n✅ Scoring system test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testScoringSystem();
