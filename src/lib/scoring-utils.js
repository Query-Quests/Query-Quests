const { prisma } = require('./prisma');

/**
 * Calculate the current score for a challenge based on the number of solves
 * The score decreases as more people solve the challenge
 * @param {number} initialScore - The initial score of the challenge
 * @param {number} solves - The number of times the challenge has been solved
 * @returns {number} - The current score for the challenge
 */
function calculateChallengeScore(initialScore, solves) {
  if (solves === 0) {
    return initialScore;
  }
  
  // Score decreases by 10% for each solve, with a minimum of 20% of initial score
  const decayFactor = Math.pow(0.9, solves);
  const minScore = Math.floor(initialScore * 0.2);
  const currentScore = Math.floor(initialScore * decayFactor);
  
  return Math.max(currentScore, minScore);
}

/**
 * Calculate the score a user should receive for solving a challenge
 * This is based on the current score of the challenge at the time of solving
 * @param {string} challengeId - The ID of the challenge
 * @returns {Promise<number>} - The score the user should receive
 */
async function calculateUserScoreForChallenge(challengeId) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { 
      initial_score: true, 
      solves: true,
      current_score: true 
    }
  });
  
  if (!challenge) {
    throw new Error('Challenge not found');
  }
  
  // Return the current score of the challenge
  return challenge.current_score;
}

/**
 * Update a challenge's current score based on its solve count
 * @param {string} challengeId - The ID of the challenge
 * @returns {Promise<void>}
 */
async function updateChallengeScore(challengeId) {
  const challenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { 
      initial_score: true, 
      solves: true 
    }
  });
  
  if (!challenge) {
    throw new Error('Challenge not found');
  }
  
  const newCurrentScore = calculateChallengeScore(challenge.initial_score, challenge.solves);
  
  await prisma.challenge.update({
    where: { id: challengeId },
    data: { current_score: newCurrentScore }
  });
}

/**
 * Update a user's total score by recalculating from all their solved challenges
 * @param {string} userId - The ID of the user
 * @returns {Promise<number>} - The user's new total score
 */
async function updateUserTotalScore(userId) {
  const userChallenges = await prisma.userChallenge.findMany({
    where: { user_id: userId },
    select: { score: true }
  });
  
  const totalScore = userChallenges.reduce((sum, uc) => sum + uc.score, 0);
  
  await prisma.user.update({
    where: { id: userId },
    data: { totalScore }
  });
  
  return totalScore;
}

/**
 * Handle when a user solves a challenge
 * This updates the challenge's solve count, current score, and user's total score
 * @param {string} userId - The ID of the user who solved the challenge
 * @param {string} challengeId - The ID of the challenge that was solved
 * @returns {Promise<{userScore: number, challengeScore: number}>} - The scores awarded
 */
async function handleChallengeSolve(userId, challengeId) {
  // Check if user has already solved this challenge
  const existingSolve = await prisma.userChallenge.findFirst({
    where: {
      user_id: userId,
      challenge_id: challengeId
    }
  });
  
  if (existingSolve) {
    throw new Error('User has already solved this challenge');
  }
  
  // Get the current challenge score
  const userScore = await calculateUserScoreForChallenge(challengeId);
  
  // Create the user challenge record
  await prisma.userChallenge.create({
    data: {
      user_id: userId,
      challenge_id: challengeId,
      score: userScore
    }
  });
  
  // Update challenge solve count
  await prisma.challenge.update({
    where: { id: challengeId },
    data: {
      solves: { increment: 1 }
    }
  });
  
  // Update challenge's current score based on new solve count
  await updateChallengeScore(challengeId);
  
  // Update user's solved challenges count
  await prisma.user.update({
    where: { id: userId },
    data: {
      solvedChallenges: { increment: 1 }
    }
  });
  
  // Update user's total score
  const newTotalScore = await updateUserTotalScore(userId);
  
  // Get the updated challenge score
  const updatedChallenge = await prisma.challenge.findUnique({
    where: { id: challengeId },
    select: { current_score: true }
  });
  
  return {
    userScore,
    challengeScore: updatedChallenge.current_score,
    totalScore: newTotalScore
  };
}

/**
 * Get user's solved challenges with their scores
 * @param {string} userId - The ID of the user
 * @returns {Promise<Array>} - Array of solved challenges with scores
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
 * Get leaderboard data sorted by total score
 * @param {number} limit - Number of users to return (default: 50)
 * @param {string} institutionId - Optional institution filter
 * @returns {Promise<Array>} - Array of users with their scores
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
  calculateChallengeScore,
  calculateUserScoreForChallenge,
  updateChallengeScore,
  updateUserTotalScore,
  handleChallengeSolve,
  getUserSolvedChallenges,
  getLeaderboard
};
