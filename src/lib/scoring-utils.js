const { prisma } = require('./prisma');

/**
 * Get user's solved challenges with their scores.
 */
async function getUserSolvedChallenges(userId) {
  return await prisma.userChallenge.findMany({
    where: { user_id: userId },
    include: {
      challenge: {
        select: {
          id: true,
          statement: true,
          level: true,
          initial_score: true,
          current_score: true,
          solves: true
        }
      }
    },
    orderBy: { created_at: 'desc' }
  });
}

/**
 * Get leaderboard data sorted by total score.
 */
async function getLeaderboard(limit = 50, institutionId = null) {
  const whereClause = institutionId ? { institution_id: institutionId } : {};

  return await prisma.user.findMany({
    where: {
      ...whereClause,
      isAdmin: false, // Exclude admins from leaderboard
    },
    select: {
      id: true,
      name: true,
      email: true,
      totalScore: true,
      solvedChallenges: true,
      institution: {
        select: {
          name: true
        }
      }
    },
    orderBy: { totalScore: 'desc' },
    take: limit
  });
}

module.exports = {
  getUserSolvedChallenges,
  getLeaderboard
};
