import {
  FAMILY_PROFILES,
  calculateProfileTargets,
  getHybridWorkoutPrescription,
  analyzeWeeklyWorkoutBalance,
  calculateSystemicPillars,
  HYBRID_ATHLETE_SYSTEM
} from './src/lib/fitness-data.js';

console.log('Testing workout tab state simulation...');

const activeProfileId = 'pareja'; // since screenshot had Mi Pareja active!
const currentProfile = FAMILY_PROFILES[activeProfileId];
const selectedSplit = null;
const isMissedDay = false;
const sleepHours = 7.5;
const sleepQuality = 'deep';
const recentHeavyDays = 0;
const workoutContext = 'gym';
const workoutDurationMode = 'full';
const weeklyWorkoutLogs = {};

try {
  const hybridPrescription = getHybridWorkoutPrescription({
    profile: currentProfile,
    selectedSplit,
    isMissedDay,
    sleepHours,
    sleepQuality,
    recentHeavyDays,
    context: workoutContext,
    durationMode: workoutDurationMode
  });
  console.log('hybridPrescription:', hybridPrescription ? hybridPrescription.routineTitle : 'null');

  const weeklyWorkoutBalance = analyzeWeeklyWorkoutBalance({
    weeklyLogs: weeklyWorkoutLogs,
    profileId: activeProfileId
  });
  console.log('weeklyWorkoutBalance:', weeklyWorkoutBalance);

  const systemicPillars = calculateSystemicPillars({
    profile: currentProfile,
    loggedFoods: [],
    targets: calculateProfileTargets(currentProfile),
    waterMl: 0,
    sleepHours,
    sleepQuality,
    selectedSplit,
    isMissedDay,
    todayWorkoutDone: false,
    habits: currentProfile.habits || [],
    weeklyLogs: weeklyWorkoutLogs
  });
  console.log('systemicPillars:', systemicPillars.totalScore, systemicPillars.synergies);

  console.log('Testing split options mapping:');
  const splits = HYBRID_ATHLETE_SYSTEM.splits[activeProfileId] || {};
  Object.entries(splits).forEach(([sKey, sObj]) => {
    console.log(`- ${sKey}: ${sObj.title}`);
  });

  console.log('ALL STATE FUNCTIONS PASSED CLEANLY IN NODE!');
} catch (err) {
  console.error('ERROR IN WORKOUT STATE SIMULATION:', err);
}
