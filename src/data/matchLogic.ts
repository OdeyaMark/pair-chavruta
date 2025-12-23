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
  prefTracks: number[];  // Changed from preferredTracks
  utcOffset: string | number; // Allow both string and number formats
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
  Morning: { start: 5, end: 12 },    // 05:00 - 12:00
  Noon: { start: 12, end: 18 },      // 12:00 - 18:00
  Evening: { start: 18, end: 21 },   // 18:00 - 21:00
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
 * @param sourceGender - The gender of the source user (can be string or array)
 * @param sourcePrefGender - The gender preference of the source user (can be string or array)
 * @param potentialGender - The gender of the potential pair (can be string or array)
 * @param potentialPrefGender - The gender preference of the potential pair (can be string or array)
 * @returns boolean - true if they are compatible, false otherwise
 */
export function checkGenderCompatibility(
  sourceGender: string | string[] | undefined, 
  sourcePrefGender: string | string[] | undefined, 
  potentialGender: string | string[] | undefined, 
  potentialPrefGender: string | string[] | undefined
): boolean {
  // Destructure arrays to get the first element
  const sourceGenderStr = Array.isArray(sourceGender) ? sourceGender[0] : sourceGender;
  const sourcePrefGenderStr = Array.isArray(sourcePrefGender) ? sourcePrefGender[0] : sourcePrefGender;
  const potentialGenderStr = Array.isArray(potentialGender) ? potentialGender[0] : potentialGender;
  const potentialPrefGenderStr = Array.isArray(potentialPrefGender) ? potentialPrefGender[0] : potentialPrefGender;

  // Check source user's preference - source user must be satisfied with potential's gender
  if (sourcePrefGenderStr && sourcePrefGenderStr !== 'not specified') {
    if (sourcePrefGenderStr === 'male' && potentialGenderStr !== 'male') {
      return false;
    }
    if (sourcePrefGenderStr === 'female' && potentialGenderStr !== 'female') {
      return false;
    }
  }

  // Check potential pair's preference - potential user must be satisfied with source's gender
  if (potentialPrefGenderStr && potentialPrefGenderStr !== 'not specified') {
    if (potentialPrefGenderStr === 'male' && sourceGenderStr !== 'male') {
      return false;
    }
    if (potentialPrefGenderStr === 'female' && sourceGenderStr !== 'female') {
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
export function checkLearningSkillCompatibility(sourceUser: User, potentialPair: User): boolean {
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
    const parsedRequired = parseInt(requiredLevel, 10);
    requiredLevel = Number.isNaN(parsedRequired) ? undefined : parsedRequired;
  }

  if (typeof actualLevel === 'string') {
    const parsedActual = parseInt(actualLevel, 10);
    actualLevel = Number.isNaN(parsedActual) ? undefined : parsedActual;
  }

  // If the desired skill level is undefined, return true (no specific requirement)
  if (requiredLevel === undefined || requiredLevel === 3) {
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
export function checkEnglishLevelCompatibility(sourceUser: User, potentialPair: User): boolean {
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
export function checkTrackCompatibility(sourceUser: User, potentialPair: User): boolean {
  if (!sourceUser.prefTracks || !potentialPair.prefTracks) {
    return true;
  }
  if (!Array.isArray(sourceUser.prefTracks)){
    console.log("source user preferred tracks is not an array:", sourceUser._id, sourceUser.prefTracks);
  }
  if (!Array.isArray(potentialPair.prefTracks)){
    console.log("potential pair preferred tracks is not an array:", potentialPair._id, potentialPair.prefTracks);
  }

  // Check if there's any intersection between the track arrays
  return sourceUser.prefTracks.some(track => 
    potentialPair.prefTracks.includes(track)
  );
}

/**
 * Converts UTC offset string (e.g., "-03:00", "+02:00") to number of hours
 */
export function parseUtcOffset(utcOffset: string | number): number {
  // If it's already a number, return it
  if (typeof utcOffset === 'number') {
    return utcOffset;
  }

  // If it's a string, parse it
  if (typeof utcOffset === 'string') {
    // Handle formats like "+02:00", "-03:00", "+0530", "-0730"
    const match = utcOffset.match(/^([+−-])(\d{1,2}):?(\d{2})?$/);
    if (match) {
      const sign = match[1] === '+' ? 1 : -1;
      const hours = parseInt(match[2], 10);
      const minutes = match[3] ? parseInt(match[3], 10) : 0;
      return sign * (hours + minutes / 60);
    }
  }

  // Default to 0 if parsing fails
  console.warn('Failed to parse UTC offset:', utcOffset, 'defaulting to 2');
  return 2; // default to Israel time zone UTC+2
}

/**
 * Converts a user's available time slots to a list of available hours for each day
 */
export function convertTimeSlotesToHours(user: User): Record<string, number[]> {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const timeSlots = ['Morning', 'Noon', 'Evening', 'lateNight'] as const;
  const result: Record<string, number[]> = {};

  for (const day of days) {
    if (!user[day]) continue;

    const availableHours: number[] = [];

    for (const timeSlot of timeSlots) {
      // Handle both boolean and array formats for time availability
      let isAvailable = false;
      
      if (typeof user[day] === 'object') {
        if (Array.isArray(user[day])) {
          // Array format: check if slot name is in arra
          const slotToCheck = timeSlot === 'lateNight' ? 'Late night' : timeSlot;
          isAvailable = user[day].includes(slotToCheck);
        } else {
          // Object format: check boolean property
          isAvailable = user[day][timeSlot] === true;
        }
      }

      if (isAvailable) {
        const slot = TIME_SLOTS[timeSlot];
        // Add all hours in this time slot
        for (let hour = slot.start; hour < slot.end; hour++) {
          availableHours.push(hour);
        }
      }
    }

    if (availableHours.length > 0) {
      result[day] = availableHours.sort((a, b) => a - b); // Sort hours
    }
  }

  return result;
}

/**
 * Converts source user's hours to pair's timezone and maps them to correct days
 */
export function convertHoursToTargetTimezone(
  sourceHours: Record<string, number[]>, 
  timezoneOffset: number
): Record<string, number[]> {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday'];
  const result: Record<string, number[]> = {};

  for (const [sourceDay, hours] of Object.entries(sourceHours)) {
    const sourceDayIndex = days.indexOf(sourceDay);
    
    for (const hour of hours) {
      const convertedHour = hour + timezoneOffset;
      
      // Calculate which day this hour falls on after timezone conversion
      let targetDayOffset = 0;
      let normalizedHour = convertedHour;

      // Handle day changes
      if (convertedHour >= 24) {
        targetDayOffset = Math.floor(convertedHour / 24);
        normalizedHour = convertedHour % 24;
      } else if (convertedHour < 0) {
        targetDayOffset = Math.floor(convertedHour / 24); // This will be negative
        normalizedHour = ((convertedHour % 24) + 24) % 24;
      }

      // Calculate target day
      const targetDayIndex = (sourceDayIndex + targetDayOffset + days.length) % days.length;
      const targetDay = days[targetDayIndex];

      // Add hour to target day
      if (!result[targetDay]) {
        result[targetDay] = [];
      }
      result[targetDay].push(normalizedHour);
    }
  }

  // Sort hours for each day
  for (const day in result) {
    result[day] = result[day].sort((a, b) => a - b);
  }

  return result;
}

/**
 * Finds overlapping hours between two users' availability
 */
export function findOverlappingHours(
  sourceHours: Record<string, number[]>, 
  pairHours: Record<string, number[]>
): Record<string, number[]> {
  const result: Record<string, number[]> = {};

  for (const day in sourceHours) {
    if (!pairHours[day]) continue;

    const sourceAvailable = sourceHours[day];
    const pairAvailable = pairHours[day];
    
    // Find intersection of hours
    const overlapping = sourceAvailable.filter(hour => pairAvailable.includes(hour));
    
    if (overlapping.length > 0) {
      result[day] = overlapping.sort((a, b) => a - b);
    }
  }

  return result;
}

/**
 * Checks if users have at least one overlapping learning time considering timezone differences
 */
function checkLearningTimeCompatibility(sourceUser: User, potentialPair: User): boolean {
  // Parse and calculate timezone difference (hours)
  const sourceOffset = parseUtcOffset(sourceUser.utcOffset);
  const pairOffset = parseUtcOffset(potentialPair.utcOffset);
  const timezoneOffset = pairOffset - sourceOffset;

  // Step 1: Convert both users' time slots to hours
  const sourceHours = convertTimeSlotesToHours(sourceUser);
  const pairHours = convertTimeSlotesToHours(potentialPair);

  // Step 2: Convert source user's hours to pair's timezone
  const sourceHoursInPairTimezone = convertHoursToTargetTimezone(sourceHours, timezoneOffset);

  // Step 3: Find overlapping hours
  const overlappingHours = findOverlappingHours(sourceHoursInPairTimezone, pairHours);

  // Return true if there's any overlap
  return Object.keys(overlappingHours).length > 0;
}

/**
 * Enhanced debugging function for the new hour-based approach
 */
function checkLearningTimeCompatibilityDebug(sourceUser: User, potentialPair: User): boolean {
  console.log('\n=== DETAILED LEARNING TIME COMPATIBILITY DEBUG (HOUR-BASED) ===');
  
  console.log('Source UTC Offset (raw):', sourceUser.utcOffset);
  console.log('Pair UTC Offset (raw):', potentialPair.utcOffset);
  
  // Parse UTC offsets
  const sourceOffset = parseUtcOffset(sourceUser.utcOffset);
  const pairOffset = parseUtcOffset(potentialPair.utcOffset);
  const timezoneOffset = pairOffset - sourceOffset;
  
  console.log('Source UTC Offset (parsed):', sourceOffset);
  console.log('Pair UTC Offset (parsed):', pairOffset);
  console.log('Timezone difference:', timezoneOffset, 'hours');

  // Step 1: Convert both users' time slots to hours
  console.log('\n--- STEP 1: Converting time slots to hours ---');
  const sourceHours = convertTimeSlotesToHours(sourceUser);
  const pairHours = convertTimeSlotesToHours(potentialPair);
  
  console.log('Source user available hours by day:');
  for (const [day, hours] of Object.entries(sourceHours)) {
    console.log(`  ${day}: ${hours.join(', ')}`);
  }
  
  console.log('Pair user available hours by day:');
  for (const [day, hours] of Object.entries(pairHours)) {
    console.log(`  ${day}: ${hours.join(', ')}`);
  }

  // Step 2: Convert source user's hours to pair's timezone
  console.log('\n--- STEP 2: Converting source hours to pair\'s timezone ---');
  const sourceHoursInPairTimezone = convertHoursToTargetTimezone(sourceHours, timezoneOffset);
  
  console.log('Source user hours converted to pair\'s timezone:');
  for (const [day, hours] of Object.entries(sourceHoursInPairTimezone)) {
    console.log(`  ${day}: ${hours.join(', ')}`);
  }

  // Step 3: Find overlapping hours
  console.log('\n--- STEP 3: Finding overlapping hours ---');
  const overlappingHours = findOverlappingHours(sourceHoursInPairTimezone, pairHours);
  
  console.log('Overlapping hours by day:');
  let totalOverlaps = 0;
  for (const [day, hours] of Object.entries(overlappingHours)) {
    console.log(`  ${day}: ${hours.join(', ')} (${hours.length} hours)`);
    totalOverlaps += hours.length;
  }

  const hasOverlap = Object.keys(overlappingHours).length > 0;
  
  console.log('\n=== SUMMARY ===');
  console.log(`Total overlapping hours: ${totalOverlaps}`);
  console.log(`Days with overlaps: ${Object.keys(overlappingHours).length}`);
  console.log(`Final result: ${hasOverlap ? '✅ COMPATIBLE' : '❌ NOT COMPATIBLE'}`);
  
  return hasOverlap;
}

/**
 * Calculates the number of overlapping learning hours between two users (updated for hour-based approach)
 */
export function calculateOverlappingHours(sourceUser: User, potentialMatch: User): number {
  // Parse UTC offsets
  const sourceOffset = parseUtcOffset(sourceUser.utcOffset);
  const pairOffset = parseUtcOffset(potentialMatch.utcOffset);
  const timezoneOffset = pairOffset - sourceOffset;

  // Convert time slots to hours
  const sourceHours = convertTimeSlotesToHours(sourceUser);
  const pairHours = convertTimeSlotesToHours(potentialMatch);

  // Convert source hours to pair's timezone
  const sourceHoursInPairTimezone = convertHoursToTargetTimezone(sourceHours, timezoneOffset);

  // Find overlapping hours
  const overlappingHours = findOverlappingHours(sourceHoursInPairTimezone, pairHours);

  // Count total overlapping hours
  let totalOverlappingHours = 0;
  for (const hours of Object.values(overlappingHours)) {
    totalOverlappingHours += hours.length;
  }

  return totalOverlappingHours;
}

/**
 * Calculates total available hours for a user (updated for hour-based approach)
 */
function calculateTotalAvailableHours(user: User): number {
  const userHours = convertTimeSlotesToHours(user);
  let totalHours = 0;
  
  for (const hours of Object.values(userHours)) {
    totalHours += hours.length;
  }

  return totalHours;
}

/**
 * Calculates a match percentage score between two users based on compatibility criteria
 * @param sourceUser - The user we're finding a match for
 * @param potentialMatch - The potential matching user
 * @returns number - Match percentage (0 to 100)
 */
export function calculateMatchPercentage(sourceUser: User, potentialMatch: User): number {
  let score = 0;

  // 1. Gender preference compatibility - 1 point
  if (checkGenderCompatibility(
    sourceUser.gender, 
    sourceUser.prefGender, 
    potentialMatch.gender, 
    potentialMatch.prefGender
  )) {
    score += 1;
  }

  // 2. Learning skill compatibility - 1 point (commented out in main compatibility)
  // if (checkLearningSkillCompatibility(sourceUser, potentialMatch)) {
  //   score += 1;
  // }

  // 3. English level compatibility - 1 point
  if (checkEnglishLevelCompatibility(sourceUser, potentialMatch)) {
    score += 1;
  }

  // 4. Learning style compatibility - 1 point
  if (checkLearningStyleCompatibility(sourceUser, potentialMatch)) {
    score += 1;
  }

  // 5. Common tracks - 1 point per common track
  if (sourceUser.prefTracks && potentialMatch.prefTracks) {
    const commonTracksCount = sourceUser.prefTracks.filter(track => 
      potentialMatch.prefTracks.includes(track)
    ).length;
    score += commonTracksCount;
  }

  // 6. Matching learning hours - 1 point per overlapping hour
  const overlappingHours = calculateOverlappingHours(sourceUser, potentialMatch);
  score += overlappingHours;

  // Calculate percentage based on maximum possible score
  const maxPossibleScore = calculateMaxPossibleScore(sourceUser, potentialMatch);
  
  return Math.round((score / maxPossibleScore) * 100);
}

/**
 * Calculates the maximum possible score for percentage calculation
 */
function calculateMaxPossibleScore(sourceUser: User, potentialMatch: User): number {
  let maxScore = 0;

  // Base compatibility points (excluding learning skill which is commented out)
  maxScore += 3; // gender, english level, learning style

  // Maximum possible track points
  if (sourceUser.prefTracks && potentialMatch.prefTracks) {
    const maxTracks = Math.min(sourceUser.prefTracks.length, potentialMatch.prefTracks.length);
    maxScore += maxTracks;
  }

  // Maximum possible learning hour points
  const sourceAvailableHours = calculateTotalAvailableHours(sourceUser);
  const pairAvailableHours = calculateTotalAvailableHours(potentialMatch);
  const maxPossibleHours = Math.min(sourceAvailableHours, pairAvailableHours);
  maxScore += maxPossibleHours;

  return Math.max(maxScore, 1); // Ensure we don't divide by zero
}

/**
 * Checks learning style compatibility
 */
export function checkLearningStyleCompatibility(sourceUser: User, potentialMatch: User): boolean {
  // If either user doesn't have a learning style specified, consider it compatible
  if (!sourceUser.learningStyle || !potentialMatch.learningStyle) {
    return true;
  }
  
  // For now, exact match required, but you can adjust this logic
  return sourceUser.learningStyle === potentialMatch.learningStyle;
}

/**
 * Debug version of checkUserCompatibility with detailed logging
 */
export function checkUserCompatibilityDebug(sourceUser: User, potentialPair: User): boolean {
  console.log('\n=== COMPATIBILITY CHECK ===');
  console.log('Source User:', sourceUser._id, sourceUser.fullName || 'Unknown');
  console.log('Potential Pair:', potentialPair._id, potentialPair.fullName || 'Unknown');

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

  // 2. Check gender compatibility
  console.log('\n2. GENDER COMPATIBILITY:');
  console.log('Source gender:', sourceUser.gender, 'prefers:', sourceUser.prefGender);
  console.log('Pair gender:', potentialPair.gender, 'prefers:', potentialPair.prefGender);
  const genderCompatible = checkGenderCompatibility(
    sourceUser.gender,
    sourceUser.prefGender,
    potentialPair.gender,
    potentialPair.prefGender
  );
  console.log('Gender compatible:', genderCompatible);
  if (!genderCompatible) {
    console.log('❌ FAILED: Gender compatibility');
    return false;
  }

  // 3. Check learning skill compatibility (commented out in main function)
  // console.log('\n3. LEARNING SKILL COMPATIBILITY:');
  // console.log('Source skill:', sourceUser.skillLevel, 'desired:', sourceUser.desiredSkillLevel);
  // console.log('Pair skill:', potentialPair.skillLevel, 'desired:', potentialPair.desiredSkillLevel);
  // const skillCompatible = checkLearningSkillCompatibility(sourceUser, potentialPair);
  // console.log('Skill compatible:', skillCompatible);
  // if (!skillCompatible) {
  //   console.log('❌ FAILED: Learning skill compatibility');
  //   return false;
  // }

  // 4. Check English level compatibility
  console.log('\n4. ENGLISH LEVEL COMPATIBILITY:');
  console.log('Source English:', sourceUser.englishLevel, 'desired:', sourceUser.desiredEnglishLevel);
  console.log('Pair English:', potentialPair.englishLevel, 'desired:', potentialPair.desiredEnglishLevel);
  const englishCompatible = checkEnglishLevelCompatibility(sourceUser, potentialPair);
  console.log('English compatible:', englishCompatible);
  if (!englishCompatible) {
    console.log('❌ FAILED: English level compatibility');
    return false;
  }

  // 5. Check track compatibility
  console.log('\n5. TRACK COMPATIBILITY:');
  console.log('Source tracks:', sourceUser.prefTracks);
  console.log('Pair tracks:', potentialPair.prefTracks);
  const trackCompatible = checkTrackCompatibility(sourceUser, potentialPair);
  console.log('Track compatible:', trackCompatible);
  if (!trackCompatible) {
    console.log('❌ FAILED: Track compatibility');
    return false;
  }

  // 6. Check learning time compatibility - USE DEBUG VERSION
  console.log('\n6. LEARNING TIME COMPATIBILITY:');
  const timeCompatible = checkLearningTimeCompatibilityDebug(sourceUser, potentialPair);
  if (!timeCompatible) {
    console.log('❌ FAILED: Learning time compatibility');
    return false;
  }

  // 7. Check matching limit compatibility
  console.log('\n7. MATCHING LIMIT COMPATIBILITY:');
  console.log('Pair matchTo:', potentialPair.matchTo, 'prefNumberOfMatches:', potentialPair.prefNumberOfMatches);
  const limitCompatible = checkMatchingLimitCompatibility(potentialPair);
  console.log('Limit compatible:', limitCompatible);
  if (!limitCompatible) {
    console.log('❌ FAILED: Matching limit compatibility');
    return false;
  }

  // 8. Calculate and display match percentage
  console.log('\n8. MATCH PERCENTAGE:');
  const matchPercentage = calculateMatchPercentage(sourceUser, potentialPair);
  console.log('Match percentage:', matchPercentage + '%');

  console.log('\n✅ ALL CHECKS PASSED!');
  return true;
}