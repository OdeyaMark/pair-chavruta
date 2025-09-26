interface User {
  _id: string;
  country: string;
  gender: string;
  prefGender?: string;
  skillLevel?: number;
  desiredSkillLevel?: number;
  englishLevel?: number;
  desiredEnglishLevel?: number;
  learningStyle?: number;
  preferredTracks: number[];
  utcOffset: number;
  // Change from nested structure to flat structure
  sunday?: { morning: boolean; noon: boolean; evening: boolean; lateNight: boolean; };
  monday?: { morning: boolean; noon: boolean; evening: boolean; lateNight: boolean; };
  tuesday?: { morning: boolean; noon: boolean; evening: boolean; lateNight: boolean; };
  wednesday?: { morning: boolean; noon: boolean; evening: boolean; lateNight: boolean; };
  thursday?: { morning: boolean; noon: boolean; evening: boolean; lateNight: boolean; };
  matchTo?: number;
  prefNumberOfMatches?: number;
}

const TIME_SLOTS = {
  morning: { start: 5, end: 12 },    // 05:00 - 12:00
  noon: { start: 12, end: 18 },      // 12:00 - 18:00
  evening: { start: 18, end: 21 },   // 18:00 - 21:00
  lateNight: { start: 21, end: 26 }  // 21:00 - 02:00 (next day, so 26 = 2)
};

/**
 * Checks if two users are compatible for pairing based on matching criteria
 * @param sourceUser - The user we're finding a match for
 * @param potentialPair - The potential pairing user
 * @returns boolean - true if they are compatible, false otherwise
 */
export function checkUserCompatibility(sourceUser: User, potentialPair: User): boolean {
  // 1. Check country compatibility: Israeli should pair with non-Israeli
  if (!checkCountryCompatibility(sourceUser, potentialPair)) {
    return false;
  }

  // 2. Check gender preference compatibility - Updated call
  if (!checkGenderCompatibility(
    sourceUser.gender, 
    sourceUser.prefGender, 
    potentialPair.gender, 
    potentialPair.prefGender
  )) {
    return false;
  }

  // 3. Check learning skill compatibility
  // if (!checkLearningSkillCompatibility(sourceUser, potentialPair)) {
  //   return false;
  // }

  // 4. Check English level compatibility
  if (!checkEnglishLevelCompatibility(sourceUser, potentialPair)) {
    return false;
  }

  // 5. Check if they share at least one preferred track
  if (!checkTrackCompatibility(sourceUser, potentialPair)) {
    return false;
  }

  // 6. Check if they have overlapping learning times
  if (!checkLearningTimeCompatibility(sourceUser, potentialPair)) {
    return false;
  }

  // 7. Check if potential pair has reached their matching limit (NEW)
  if (!checkMatchingLimitCompatibility(potentialPair)) {
    return false;
  }

  return true;
}

/**
 * Checks if the potential pair has not reached their matching limit
 * Only applies to the potential pair, not the source user
 */
function checkMatchingLimitCompatibility(potentialPair: User): boolean {
  // If either field is undefined, we can't determine the limit, so we allow the match
  if (potentialPair.matchTo === undefined || potentialPair.prefNumberOfMatches === undefined) {
    return true;
  }

  // Return false if they've reached or exceeded their preferred number of matches
  return potentialPair.matchTo < potentialPair.prefNumberOfMatches;
}

/**
 * Checks if users are from different countries (Israeli vs non-Israeli)
 */
function checkCountryCompatibility(sourceUser: User, potentialPair: User): boolean {
  const sourceIsIsraeli = sourceUser.country === 'Israel';
  const pairIsIsraeli = potentialPair.country === 'Israel';
  
  // One should be Israeli, the other should not be
  return sourceIsIsraeli !== pairIsIsraeli;
}

/**
 * Checks if gender preferences are compatible
 * @param sourceGender - The gender of the source user
 * @param sourcePrefGender - The gender preference of the source user
 * @param potentialGender - The gender of the potential pair
 * @param potentialPrefGender - The gender preference of the potential pair
 * @returns boolean - true if they are compatible, false otherwise
 */
function checkGenderCompatibility(
  sourceGender: string, 
  sourcePrefGender: string | undefined, 
  potentialGender: string, 
  potentialPrefGender: string | undefined
): boolean {

  // Check source user's preference
  if (sourcePrefGender && sourcePrefGender !== 'not specified') {
    if (sourcePrefGender === 'male' && potentialGender !== 'male') {
      return false;
    }
    if (sourcePrefGender === 'female' && potentialGender !== 'female') {
      return false;
    }
  }

  // Check potential pair's preference
  if (potentialPrefGender && potentialPrefGender !== 'not specified') {
    if (potentialPrefGender === 'male' && sourceGender !== 'male') {
      return false;
    }
    if (potentialPrefGender === 'female' && sourceGender !== 'female') {
      return false;
    }
  }

  console.log('✅ Gender compatibility passed');
  return true;
}

/**
 * Checks if learning skills are compatible
 * Israeli users have desiredSkillLevel, non-Israeli have skillLevel
 */
function checkLearningSkillCompatibility(sourceUser: User, potentialPair: User): boolean {
  const sourceIsIsraeli = sourceUser.country === 'Israel';
  const pairIsIsraeli = potentialPair.country === 'Israel';

  let requiredLevel: number | undefined;
  let actualLevel: number | undefined;

  if (sourceIsIsraeli) {
    // Israeli user has desired skill level, non-Israeli has actual skill level
    // Check if non-Israeli's actual skill >= Israeli's desired skill
    requiredLevel = sourceUser.desiredSkillLevel;
    actualLevel = potentialPair.skillLevel;
  } else {
    // Non-Israeli user has desired skill level, Israeli has actual skill level
    // Check if Israeli's actual skill >= non-Israeli's desired skill
    requiredLevel = sourceUser.desiredSkillLevel;
    actualLevel = potentialPair.skillLevel;
  }

  // Convert strings to numbers if needed
  if (typeof requiredLevel === 'string') {
    requiredLevel = parseInt(requiredLevel, 10);
    if (isNaN(requiredLevel)) {
      requiredLevel = undefined;
    }
  }

  if (typeof actualLevel === 'string') {
    actualLevel = parseInt(actualLevel, 10);
    if (isNaN(actualLevel)) {
      actualLevel = undefined;
    }
  }

  // If the desired skill level is undefined, return true (no specific requirement)
  if (requiredLevel === undefined) {
    return true; // No desired skill level requirement
  }

  // If the actual skill level is undefined but desired is specified, we can't match
  if (actualLevel === undefined) {
    return false;
  }

  // Actual skill level should be equal or higher than desired skill level
  return actualLevel >= requiredLevel;
}

/**
 * Checks if English levels are compatible
 * Israeli users have englishLevel, non-Israeli have desiredEnglishLevel
 */
function checkEnglishLevelCompatibility(sourceUser: User, potentialPair: User): boolean {
  const sourceIsIsraeli = sourceUser.country === 'Israel';
  const pairIsIsraeli = potentialPair.country === 'Israel';

  let requiredLevel: number | undefined;
  let actualLevel: number | undefined;

  if (sourceIsIsraeli) {
    // Israeli user has actual English level, non-Israeli has desired level
    // Non-Israeli's desired level should be <= Israeli's actual level
    requiredLevel = potentialPair.desiredEnglishLevel;
    actualLevel = sourceUser.englishLevel;
  } else {
    // Non-Israeli user has desired English level, Israeli has actual level
    // Non-Israeli's desired level should be <= Israeli's actual level
    requiredLevel = sourceUser.desiredEnglishLevel;
    actualLevel = potentialPair.englishLevel;
  }

  // Convert strings to numbers if needed
  if (typeof requiredLevel === 'string') {
    requiredLevel = parseInt(requiredLevel, 10);
    if (isNaN(requiredLevel)) {
      requiredLevel = undefined;
    }
  }

  if (typeof actualLevel === 'string') {
    actualLevel = parseInt(actualLevel, 10);
    if (isNaN(actualLevel)) {
      actualLevel = undefined;
    }
  }

  // If the desired English level is undefined, return true (no specific requirement)
  if (sourceIsIsraeli && requiredLevel === undefined) {
    return true; // Non-Israeli user has no desired English level requirement
  }
  
  if (!sourceIsIsraeli && requiredLevel === undefined) {
    return true; // Non-Israeli user has no desired English level requirement
  }

  // If either level is not specified (but desired level is specified), we can't match
  if (requiredLevel === undefined || actualLevel === undefined) {
    return false;
  }

  // Actual level should be equal or higher than desired level
  return actualLevel >= requiredLevel;
}

/**
 * Checks if users share at least one preferred track
 */
function checkTrackCompatibility(sourceUser: User, potentialPair: User): boolean {
  if (!sourceUser.preferredTracks || !potentialPair.preferredTracks) {
    return true;
  }

  // Check if there's any intersection between the track arrays
  return sourceUser.preferredTracks.some(track => 
    potentialPair.preferredTracks.includes(track)
  );
}

/**
 * Checks if users have at least one overlapping learning time considering timezone differences
 */
function checkLearningTimeCompatibility(sourceUser: User, potentialPair: User): boolean {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const timeSlots = ['morning', 'noon', 'evening', 'lateNight'] as const;

  // Calculate timezone difference
  const timezoneOffset = potentialPair.utcOffset - sourceUser.utcOffset;

  for (const day of days) {
    for (const timeSlot of timeSlots) {
      // Check if source user is available at this time - UPDATED ACCESS
      if (!sourceUser[day] || !sourceUser[day][timeSlot]) {
        continue;
      }

      // Convert source user's time to potential pair's timezone and check overlap
      if (isTimeOverlapping(day, timeSlot, timezoneOffset, potentialPair)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Checks if a specific time slot overlaps when converted to another timezone
 */
function isTimeOverlapping(
  sourceDay: string, 
  sourceTimeSlot: string, 
  timezoneOffset: number, 
  potentialPair: User
): boolean {
  const sourceSlot = TIME_SLOTS[sourceTimeSlot];
  
  // Convert source time to potential pair's timezone
  const convertedStartHour = sourceSlot.start + timezoneOffset;
  const convertedEndHour = sourceSlot.end + timezoneOffset;

  // Handle day overflow/underflow
  const { day: convertedDay, normalizedStart, normalizedEnd } = 
    normalizeDayAndTime(sourceDay, convertedStartHour, convertedEndHour);

  // Check each time slot in the converted day for overlap
  const timeSlots = ['morning', 'noon', 'evening', 'lateNight'] as const;
  
  for (const pairTimeSlot of timeSlots) {
    // UPDATED ACCESS - use flat structure
    if (!potentialPair[convertedDay] || !potentialPair[convertedDay][pairTimeSlot]) {
      continue;
    }

    const pairSlot = TIME_SLOTS[pairTimeSlot];
    
    // Check if there's any overlap between the converted time and pair's available time
    if (hasTimeOverlap(normalizedStart, normalizedEnd, pairSlot.start, pairSlot.end)) {
      return true;
    }
  }

  return false;
}

/**
 * Normalizes day and time when timezone conversion causes day overflow
 */
function normalizeDayAndTime(sourceDay: string, startHour: number, endHour: number): {
  day: string;
  normalizedStart: number;
  normalizedEnd: number;
} {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const sourceDayIndex = days.indexOf(sourceDay);
  
  let targetDayIndex = sourceDayIndex;
  let normalizedStart = startHour;
  let normalizedEnd = endHour;

  // Handle day underflow (negative hours)
  if (startHour < 0) {
    targetDayIndex = (sourceDayIndex - 1 + days.length) % days.length;
    normalizedStart = startHour + 24;
    normalizedEnd = endHour + 24;
  }
  // Handle day overflow (hours >= 24)
  else if (startHour >= 24) {
    targetDayIndex = (sourceDayIndex + 1) % days.length;
    normalizedStart = startHour - 24;
    normalizedEnd = endHour - 24;
  }

  // Handle special case for lateNight that spans to next day
  if (normalizedEnd > 24) {
    normalizedEnd = normalizedEnd - 24;
  }

  return {
    day: days[targetDayIndex],
    normalizedStart,
    normalizedEnd
  };
}

/**
 * Checks if two time ranges overlap
 */
function hasTimeOverlap(start1: number, end1: number, start2: number, end2: number): boolean {
  // Handle late night special case (crosses midnight)
  if (end1 > 24) {
    // Split into two ranges: before midnight and after midnight
    return hasTimeOverlap(start1, 24, start2, end2) || 
           hasTimeOverlap(0, end1 - 24, start2, end2);
  }
  
  if (end2 > 24) {
    // Split into two ranges: before midnight and after midnight
    return hasTimeOverlap(start1, end1, start2, 24) || 
           hasTimeOverlap(start1, end1, 0, end2 - 24);
  }

  // Normal overlap check
  return start1 < end2 && start2 < end1;
}

/**
 * Helper function to get detailed learning time analysis
 */
export function getLearningTimeAnalysis(sourceUser: User, potentialPair: User): {
  hasOverlap: boolean;
  overlappingTimes: Array<{
    sourceDay: string;
    sourceTimeSlot: string;
    pairDay: string;
    pairTimeSlot: string;
  }>;
} {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const timeSlots = ['morning', 'noon', 'evening', 'lateNight'] as const;
  const overlappingTimes: Array<{
    sourceDay: string;
    sourceTimeSlot: string;
    pairDay: string;
    pairTimeSlot: string;
  }> = [];

  const timezoneOffset = potentialPair.utcOffset - sourceUser.utcOffset;

  for (const sourceDay of days) {
    for (const sourceTimeSlot of timeSlots) {
      // UPDATED ACCESS - use flat structure
      if (!sourceUser[sourceDay] || !sourceUser[sourceDay][sourceTimeSlot]) {
        continue;
      }

      const sourceSlot = TIME_SLOTS[sourceTimeSlot];
      const convertedStartHour = sourceSlot.start + timezoneOffset;
      const convertedEndHour = sourceSlot.end + timezoneOffset;

      const { day: convertedDay, normalizedStart, normalizedEnd } = 
        normalizeDayAndTime(sourceDay, convertedStartHour, convertedEndHour);

      for (const pairTimeSlot of timeSlots) {
        // UPDATED ACCESS - use flat structure
        if (!potentialPair[convertedDay] || !potentialPair[convertedDay][pairTimeSlot]) {
          continue;
        }

        const pairSlot = TIME_SLOTS[pairTimeSlot];
        
        if (hasTimeOverlap(normalizedStart, normalizedEnd, pairSlot.start, pairSlot.end)) {
          overlappingTimes.push({
            sourceDay,
            sourceTimeSlot,
            pairDay: convertedDay,
            pairTimeSlot
          });
        }
      }
    }
  }

  return {
    hasOverlap: overlappingTimes.length > 0,
    overlappingTimes
  };
}

/**
 * Updated compatibility analysis including learning times
 */
export function getCompatibilityAnalysis(sourceUser: User, potentialPair: User): {
  compatible: boolean;
  reasons: string[];
} {
  const reasons: string[] = [];
  let compatible = true;

  if (!checkCountryCompatibility(sourceUser, potentialPair)) {
    compatible = false;
    reasons.push('Country mismatch: Both users are from the same region');
  }

  // Updated call
  if (!checkGenderCompatibility(
    sourceUser.gender, 
    sourceUser.prefGender, 
    potentialPair.gender, 
    potentialPair.prefGender
  )) {
    compatible = false;
    reasons.push('Gender preference mismatch');
  }

  if (!checkLearningSkillCompatibility(sourceUser, potentialPair)) {
    // compatible = false;
    reasons.push('Learning skill mismatch');
  }

  if (!checkEnglishLevelCompatibility(sourceUser, potentialPair)) {
    compatible = false;
    reasons.push('English level incompatible');
  }

  if (!checkTrackCompatibility(sourceUser, potentialPair)) {
    compatible = false;
    reasons.push('No shared preferred tracks');
  }

  if (!checkLearningTimeCompatibility(sourceUser, potentialPair)) {
    compatible = false;
    reasons.push('No overlapping learning times across timezones');
  } else {
    const timeAnalysis = getLearningTimeAnalysis(sourceUser, potentialPair);
    reasons.push(`Found ${timeAnalysis.overlappingTimes.length} overlapping time slots`);
  }

  if (!checkMatchingLimitCompatibility(potentialPair)) {
    compatible = false;
    reasons.push(`User has reached their matching limit (${potentialPair.matchTo}/${potentialPair.prefNumberOfMatches})`);
  }

  if (compatible) {
    reasons.push('All compatibility criteria met');
  }

  return { compatible, reasons };
}

/**
 * Calculates a match percentage score between two users based on compatibility criteria
 * @param sourceUser - The user we're finding a match for
 * @param potentialMatch - The potential matching user
 * @returns number - Match percentage (0 to 100)
 */
export function calculateMatchPercentage(sourceUser: User, potentialMatch: User): number {
  let score = 0;

  // 1. Gender preference compatibility - 1 point - Updated call
  if (checkGenderCompatibility(
    sourceUser.gender, 
    sourceUser.prefGender, 
    potentialMatch.gender, 
    potentialMatch.prefGender
  )) {
    score += 1;
  }

  // 2. Learning skill compatibility - 1 point
  if (checkLearningSkillCompatibility(sourceUser, potentialMatch)) {
    score += 1;
  }

  // 3. English level compatibility - 1 point
  if (checkEnglishLevelCompatibility(sourceUser, potentialMatch)) {
    score += 1;
  }

  // 4. Learning style compatibility - 1 point
  // Note: You'll need to add learningStyle to the User interface and implement this check
  if (checkLearningStyleCompatibility(sourceUser, potentialMatch)) {
    score += 1;
  }

  // 5. Common tracks - 1 point per common track
  if (sourceUser.preferredTracks && potentialMatch.preferredTracks) {
    const commonTracksCount = sourceUser.preferredTracks.filter(track => 
      potentialMatch.preferredTracks.includes(track)
    ).length;
    score += commonTracksCount;
  }

  // 6. Matching learning hours - 1 point per overlapping hour
  const overlappingHours = calculateOverlappingHours(sourceUser, potentialMatch);
  score += overlappingHours;

  // Calculate percentage based on maximum possible score
  // Max possible score depends on user data, but we'll use a reasonable baseline
  const maxPossibleScore = calculateMaxPossibleScore(sourceUser, potentialMatch);
  
  return Math.round((score / maxPossibleScore) * 100);
}

/**
 * Checks if learning styles are compatible
 */
function checkLearningStyleCompatibility(sourceUser: User, potentialMatch: User): boolean {
  // You'll need to add learningStyle field to User interface
  // For now, returning true as placeholder
  if (!sourceUser.learningStyle || !potentialMatch.learningStyle) {
    return false;
  }
  return sourceUser.learningStyle === potentialMatch.learningStyle;
}

/**
 * Calculates the number of overlapping hours between two users considering timezone differences
 */
function calculateOverlappingHours(sourceUser: User, potentialMatch: User): number {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const timeSlots = ['morning', 'noon', 'evening', 'lateNight'] as const;
  let totalOverlappingHours = 0;

  // Calculate timezone difference
  const timezoneOffset = potentialMatch.utcOffset - sourceUser.utcOffset;

  for (const day of days) {
    for (const timeSlot of timeSlots) {
      // Check if source user is available at this time - UPDATED ACCESS
      if (!sourceUser[day] || !sourceUser[day][timeSlot]) {
        continue;
      }

      // Get the overlapping hours for this specific time slot
      const overlappingHours = getTimeSlotOverlappingHours(
        day, 
        timeSlot, 
        timezoneOffset, 
        potentialMatch
      );
      
      totalOverlappingHours += overlappingHours;
    }
  }

  return totalOverlappingHours;
}

/**
 * Calculates overlapping hours for a specific time slot
 */
function getTimeSlotOverlappingHours(
  sourceDay: string,
  sourceTimeSlot: string,
  timezoneOffset: number,
  potentialPair: User
): number {
  const sourceSlot = TIME_SLOTS[sourceTimeSlot];
  
  // Convert source time to potential pair's timezone
  const convertedStartHour = sourceSlot.start + timezoneOffset;
  const convertedEndHour = sourceSlot.end + timezoneOffset;

  // Handle day overflow/underflow
  const { day: convertedDay, normalizedStart, normalizedEnd } = 
    normalizeDayAndTime(sourceDay, convertedStartHour, convertedEndHour);

  // Check each time slot in the converted day for overlap
  const timeSlots = ['morning', 'noon', 'evening', 'lateNight'] as const;
  let totalOverlap = 0;
  
  for (const pairTimeSlot of timeSlots) {
    // UPDATED ACCESS - use flat structure
    if (!potentialPair[convertedDay] || !potentialPair[convertedDay][pairTimeSlot]) {
      continue;
    }

    const pairSlot = TIME_SLOTS[pairTimeSlot];
    
    // Calculate the actual overlapping hours
    const overlapHours = calculateHourOverlap(
      normalizedStart, 
      normalizedEnd, 
      pairSlot.start, 
      pairSlot.end
    );
    
    totalOverlap += overlapHours;
  }

  return totalOverlap;
}

/**
 * Calculates the number of overlapping hours between two time ranges
 */
function calculateHourOverlap(start1: number, end1: number, start2: number, end2: number): number {
  // Handle late night special case (crosses midnight)
  if (end1 > 24) {
    const beforeMidnight = calculateHourOverlap(start1, 24, start2, end2);
    const afterMidnight = calculateHourOverlap(0, end1 - 24, start2, end2);
    return beforeMidnight + afterMidnight;
  }
  
  if (end2 > 24) {
    const beforeMidnight = calculateHourOverlap(start1, end1, start2, 24);
    const afterMidnight = calculateHourOverlap(start1, end1, 0, end2 - 24);
    return beforeMidnight + afterMidnight;
  }

  // Normal overlap calculation
  const overlapStart = Math.max(start1, start2);
  const overlapEnd = Math.min(end1, end2);
  
  return Math.max(0, overlapEnd - overlapStart);
}

/**
 * Calculates the maximum possible score for percentage calculation
 */
function calculateMaxPossibleScore(sourceUser: User, potentialMatch: User): number {
  let maxScore = 0;

  // Base compatibility points
  maxScore += 4; // gender, learning skill, english level, learning style

  // Maximum possible track points
  if (sourceUser.preferredTracks && potentialMatch.preferredTracks) {
    const maxTracks = Math.min(sourceUser.preferredTracks.length, potentialMatch.preferredTracks.length);
    maxScore += maxTracks;
  }

  // Maximum possible learning hour points (theoretical maximum)
  // Each day has 4 time slots, total possible hours per day varies
  // Morning: 7 hours, Noon: 6 hours, Evening: 3 hours, LateNight: 5 hours
  // Total: 21 hours per day × 5 days = 105 hours maximum
  // But we'll use a more realistic maximum based on actual availability
  const sourceAvailableHours = calculateTotalAvailableHours(sourceUser);
  const pairAvailableHours = calculateTotalAvailableHours(potentialMatch);
  const maxPossibleHours = Math.min(sourceAvailableHours, pairAvailableHours);
  maxScore += maxPossibleHours;

  return Math.max(maxScore, 1); // Ensure we don't divide by zero
}

/**
 * Calculates total available hours for a user
 */
function calculateTotalAvailableHours(user: User): number {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const timeSlots = ['morning', 'noon', 'evening', 'lateNight'] as const;
  let totalHours = 0;

  for (const day of days) {
    for (const timeSlot of timeSlots) {
      // UPDATED ACCESS - use flat structure
      if (user[day] && user[day][timeSlot]) {
        const slot = TIME_SLOTS[timeSlot];
        const hours = slot.end - slot.start;
        totalHours += hours > 24 ? hours - 24 : hours; // Handle overnight slots
      }
    }
  }

  return totalHours;
}

/**
 * Debug version of checkUserCompatibility with detailed logging
 */
export function checkUserCompatibilityDebug(sourceUser: User, potentialPair: User): boolean {
  console.log('\n=== COMPATIBILITY CHECK ===');
  console.log('Source User:', sourceUser._id, sourceUser.fullName);
  console.log('Potential Pair:', potentialPair._id, potentialPair.fullName);

  // 1. Check country compatibility
  console.log('\n1. COUNTRY COMPATIBILITY:');
  console.log('Source country:', sourceUser.country);
  console.log('Pair country:', potentialPair.country);
  const countryCompatible = checkCountryCompatibility(sourceUser, potentialPair);
  console.log('Country compatible:', countryCompatible);
  if (!countryCompatible) {
    console.log('❌ FAILED: Country compatibility');
    return false;
  }

  // 2. Check gender preference compatibility - Updated call and logging
  console.log('\n2. GENDER COMPATIBILITY:');
  console.log('Source gender:', sourceUser?.gender, 'prefGender:', sourceUser?.prefGender);
  console.log('Pair gender:', potentialPair?.gender, 'prefGender:', potentialPair?.prefGender);
  const genderCompatible = checkGenderCompatibility(
    sourceUser?.gender, 
    sourceUser?.prefGender, 
    potentialPair?.gender, 
    potentialPair?.prefGender
  );
  console.log('Gender compatible:', genderCompatible);
  if (!genderCompatible) {
    console.log('❌ FAILED: Gender compatibility');
    return false;
  }

  // 3. Check learning skill compatibility
  console.log('\n3. LEARNING SKILL COMPATIBILITY:');
  console.log('Source skillLevel:', sourceUser.skillLevel, 'desiredSkillLevel:', sourceUser.desiredSkillLevel);
  console.log('Pair skillLevel:', potentialPair.skillLevel, 'desiredSkillLevel:', potentialPair.desiredSkillLevel);
  // const learningSkillCompatible = checkLearningSkillCompatibility(sourceUser, potentialPair);
  // console.log('Learning skill compatible:', learningSkillCompatible);
  // if (!learningSkillCompatible) {
  //   console.log('❌ FAILED: Learning skill compatibility');
  //   return false;
  // }

  // 4. Check English level compatibility
  console.log('\n4. ENGLISH LEVEL COMPATIBILITY:');
  console.log('Source englishLevel:', sourceUser.englishLevel, 'desiredEnglishLevel:', sourceUser.desiredEnglishLevel);
  console.log('Pair englishLevel:', potentialPair.englishLevel, 'desiredEnglishLevel:', potentialPair.desiredEnglishLevel);
  const englishCompatible = checkEnglishLevelCompatibility(sourceUser, potentialPair);
  console.log('English level compatible:', englishCompatible);
  if (!englishCompatible) {
    console.log('❌ FAILED: English level compatibility');
    return false;
  }

  // 5. Check track compatibility
  console.log('\n5. TRACK COMPATIBILITY:');
  console.log('Source tracks:', sourceUser.preferredTracks);
  console.log('Pair tracks:', potentialPair.preferredTracks);
  const trackCompatible = checkTrackCompatibility(sourceUser, potentialPair);
  console.log('Track compatible:', trackCompatible);
  if (!trackCompatible) {
    console.log('❌ FAILED: Track compatibility');
    return false;
  }

  // 6. Check learning time compatibility - UPDATED ACCESS
  console.log('\n6. LEARNING TIME COMPATIBILITY:');
  console.log('Source UTC:', sourceUser.utcOffset);
  console.log('Pair UTC:', potentialPair.utcOffset);
  console.log('Source learning times available:', countAvailableTimes(sourceUser));
  console.log('Pair learning times available:', countAvailableTimes(potentialPair));
  const timeCompatible = checkLearningTimeCompatibility(sourceUser, potentialPair);
  console.log('Learning time compatible:', timeCompatible);
  if (!timeCompatible) {
    console.log('❌ FAILED: Learning time compatibility');
    return false;
  }

  // 7. Check matching limit compatibility
  console.log('\n7. MATCHING LIMIT COMPATIBILITY:');
  console.log('Pair matchTo:', potentialPair.matchTo, 'prefNumberOfMatches:', potentialPair.prefNumberOfMatches);
  const limitCompatible = checkMatchingLimitCompatibility(potentialPair);
  console.log('Matching limit compatible:', limitCompatible);
  if (!limitCompatible) {
    console.log('❌ FAILED: Matching limit compatibility');
    return false;
  }

  console.log('\n✅ ALL CHECKS PASSED!');
  return true;
}

/**
 * Debug version of checkLearningTimeCompatibility
 */
function checkLearningTimeCompatibilityDebug(sourceUser: User, potentialPair: User): boolean {
  console.log('\n--- DETAILED LEARNING TIME DEBUG ---');
  
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const timeSlots = ['morning', 'noon', 'evening', 'lateNight'] as const;

  // Check if learning times exist
  if (!sourceUser.learningTimes) {
    console.log('❌ Source user has no learning times');
    return false;
  }
  
  if (!potentialPair.learningTimes) {
    console.log('❌ Potential pair has no learning times');
    return false;
  }

  // Calculate timezone difference - FIX THE FIELD NAME
  console.log('Source utcOffset:', sourceUser.utcOffset);
  console.log('Pair utcOffset:', potentialPair.utcOffset);
  
  // CHECK: The issue might be here - using utc vs utcOffset
  const timezoneOffset = potentialPair.utcOffset - sourceUser.utcOffset;
  console.log('Timezone offset:', timezoneOffset);

  let foundOverlap = false;

  for (const day of days) {
    console.log(`\nChecking ${day}:`);
    
    if (!sourceUser.learningTimes[day] || !potentialPair.learningTimes[day]) {
      console.log(`  Missing learning times for ${day}`);
      continue;
    }

    for (const timeSlot of timeSlots) {
      if (!sourceUser.learningTimes[day][timeSlot]) {
        continue;
      }

      console.log(`  Source available at ${day} ${timeSlot}`);

      // Convert source user's time to potential pair's timezone and check overlap
      const overlap = isTimeOverlapping(day, timeSlot, timezoneOffset, potentialPair);
      console.log(`  Overlap found: ${overlap}`);
      
      if (overlap) {
        foundOverlap = true;
        console.log(`  ✅ OVERLAP FOUND: ${day} ${timeSlot}`);
        // Don't return immediately, let's see all overlaps
      }
    }
  }

  console.log(`\nFinal result: ${foundOverlap ? '✅' : '❌'} Learning time compatible: ${foundOverlap}`);
  return foundOverlap;
}

// Helper function to count available learning times - UPDATED
function countAvailableTimes(user: User): number {
  let count = 0;
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const timeSlots = ['morning', 'noon', 'evening', 'lateNight'];
  
  for (const day of days) {
    if (user[day]) {
      for (const slot of timeSlots) {
        if (user[day][slot]) {
          count++;
        }
      }
    }
  }
  return count;
}