import consola from 'consola';
import { items } from '@wix/data';
// import { sendPairingEmailHeb, sendPairingEmail } from './sendEmails';
import { PreferredTracksInfo } from '../constants/tracks';






export async function fetchCMSData() {
  try {
  consola.info('Fetching CMS data...');
  const results = await items.query('Import3').fields("fullName", "country", "matchTo", "prefNumberOfMatches", "dateOfRegistered", "_id", "prefTracks").descending('dateOfRegistered').limit(1000).find();
  return results.items;
  } catch (error) {
  consola.error('Error fetching CMS data:', error);
  }
}
  
export async function saveUserChanges(userData: User, user_id: string) {
  try {
    consola.info('Saving user changes...', userData);
    if (!user_id) {
      throw new Error('User ID is required');
    }
    userData._id = user_id;
    const results = await items.update("Import3", userData);
    return results;
  } catch (error) {
    consola.error('Error saving user changes:', error);
    throw error; // Rethrow to handle in UI
  }
}


export async function fetchUserById(userId: string) {
  try {
    consola.info(`Fetching user data for ID: ${userId}`);
    const result = await items.query('Import3')
      .eq('_id', userId)
      .find();
    const user = result.items[0] || null;
    consola.success('Fetched user:', user);
    return user;
  } catch (error) {
    consola.error('Error fetching user by ID:', error);
    return null;
  }
}

interface Track {
  id: string;
  trackEn: string;
}

// Function to fetch tracks and log them - run this during development to get the data
export async function fetchTracks() {
  try {
    consola.info('Fetching tracks data...');
    const results = await items.query('tracks')
      .fields("_id", "trackEn")
      .find();
    
    const tracks: Track[] = results.items.map(item => ({
      id: item._id,
      trackEn: item.trackEn
    }));

    // Log the tracks data to copy into the static file
    consola.success('Tracks data:', JSON.stringify({ tracks }, null, 2));
    return tracks;
  } catch (error) {
    consola.error('Error fetching tracks:', error);
    return [];
  }
}

// Import the static tracks data
import tracksData from './tracks.json';
import { dashboard } from '@wix/dashboard';

// Function to get tracks, fetching from CMS if static data is empty
export async function getTracks(): Promise<Track[]> {
  // Check if we have data in the static file
  if (!tracksData.tracks || tracksData.tracks.length === 0) {
    consola.info('No tracks found in static file, fetching from CMS...');
    return await fetchTracks();
  }

  consola.info('Using tracks from static file');
  return tracksData.tracks;
}

export const fetchUserContact = async (userId: string): Promise<{ email: string; tel: string }> => {
  try {
    const response = await items.query('Import3')
      .eq('_id', userId).fields('email', 'tel')
      .find();
    
    const user = response.items[0];
    return {
      email: user?.email || '',
      tel: user?.tel || ''
    };
  } catch (error) {
    console.error('Error fetching user contact:', error);
    return { email: '', tel: '' };
  }
};


export async function fetchChavrutasFromCMS(){
  const results = await items.query('Import5').descending('DateOfCreate').ne('IsDeleted', true).include('newFromIsraelId', 'newFromWorldId').limit(1000).find();
  consola.info("fetched chavruta", results);
  return results.items;
}

export async function fetchPendingChavrutasFromCMS(){
  const results = await items.query('Import5').descending('DateOfCreate').ne('IsDeleted', true).eq('status', 1).include('newFromIsraelId', 'newFromWorldId').limit(1000).find();
  return results.items;
}

// Define your track mapping based on your C# PrefferdTracks enum
const trackMapping = {
  0: "df6ce1e8-1839-4749-bd4f-495295d75657", // Tanya (Chassidic Thought)
  1: "e9a52d6e-5510-4259-a157-c661e9ff95e9", // Talmud
  2: "3e55135c-846d-4f7e-a39c-c8512cc62714", // Parsha (Weekly Parsha)
  3: "c01b5f93-3797-473e-9eff-17bd7bddf736", // Prayer
  4: "8fc9e767-d4bf-4093-ad17-bb366ca31adf", // PirkeiAvot
  5: null, // NoPrefrence (no ID provided)
  6: "788830c2-45f4-471d-aa0d-8c7412826562"  // IndependentLearning
};



export async function replaceTrackNumbersWithIds() {
  try {
    const collectionName = "Import5"; // Replace with your actual collection name
    const trackNumberField = "track"; // Replace with your actual field name
    const trackIdField = "track"; // Replace with your target field name
    
    // Query all items from the collection
    const results = await items.query(collectionName).skip(50).limit(1000)
      .find();
    
    const resItems = results.items;
    console.log(`Found ${resItems.length} items to process`);
    
    // Process each item
    const updatePromises = resItems.map(async (item) => {
      const trackNumber:number = item[trackNumberField];
      
      if (trackNumber !== undefined && trackNumber !== null) {
        const trackId = trackMapping[trackNumber];
        
        if (trackId !== undefined) {
          // Update the item with the track ID (or null for NoPrefrence)
          const updatedItem = {
            ...item,
            [trackIdField]: trackId
          };
          
          // console.log(`Updating item ${item._id}: ${trackNames[trackNumber]} (${trackNumber}) -> ${trackId || 'null'}`);
          return items.update(collectionName, updatedItem);
        } else {
          console.warn(`No mapping found for track number: ${trackNumber} in item ${item._id}`);
          return Promise.resolve(null);
        }
      } else {
        console.log(`Skipping item ${item._id}: no track number found`);
        return Promise.resolve(null);
      }
    });
    
    // Wait for all updates to complete
    const updateResults = await Promise.all(updatePromises);
    const successfulUpdates = updateResults.filter(result => result !== null);
    
    console.log(`Successfully updated ${successfulUpdates.length} items`);
    return {
      success: true,
      updatedCount: successfulUpdates.length,
      totalCount: resItems.length
    };
    
  } catch (error) {
    console.error("Error updating track numbers:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Base update function that fetches and updates
export async function updateChavrutaBase(chavrutaId: string, updateFn: (chavruta: any) => any) {
  try {
    // Fetch current data
    const result = await items.query('Import5')
      .eq('_id', chavrutaId)
      .find();
    
    const chavruta = result.items[0];
    if (!chavruta) {
      throw new Error(`Chavruta with ID ${chavrutaId} not found`);
    }

    // Apply updates and return
    return await items.update('Import5', updateFn(chavruta));
  } catch (error) {
    console.error('Error updating chavruta:', error);
    throw error;
  }
}

// Specific update functions
export async function updateChavrutaStatus(chavrutaId: string, status: number) {
  return updateChavrutaBase(chavrutaId, (chavruta) => ({
    ...chavruta,
    status
  }));
}

export async function updateChavrutaTrack(chavrutaId: string, track: string) {
  return updateChavrutaBase(chavrutaId, (chavruta) => ({
    ...chavruta,
    track
  }));
}

export async function updateChavrutaNote(chavrutaId: string, note: string) {
  return updateChavrutaBase(chavrutaId, (chavruta) => ({
    ...chavruta,
    note
  }));
}

export async function fetchArchivedUsers() {
  try {
    const result = await items.query('Import3')
      .eq('IsInArchive', true)
      .find();
    return result.items;
  } catch (error) {
    console.error('Error fetching archived users:', error);
    throw error;
  }
}

export function deletePairFromDatabase(pairId: string, reason: string) {
  // Implement your deletion logic here
  console.log(`Deleting pair ${pairId} for reason: ${reason}`);
  return updateChavrutaBase(pairId, (chavruta) => ({
    ...chavruta,
    isDeleted: true,
    deleteReason: reason,
    dateOfDelete: new Date().toISOString()
  }));
}

// Add this function to cmsData.ts

export async function fetchMatchData() {
  try {
    consola.info('Fetching match data...');
    const results = await items.query('Import3')
      .fields(
        "_id",
        "fullName", 
        "country", 
        "gender", 
        "prefGender",
        "skillLevel",
        "desiredSkillLevel", 
        "englishLevel",
        "desiredEnglishLevel",
        "prefLearningStyle",
        "prefTracks",
        "utcOffset",
        "sunday","monday","tuesday","wednesday","thursday",
        "matchTo", "prefNumberOfMatches",
        
      )
      .ne('isInArchive', true)
      .descending('dateOfRegistered')
      .limit(1000)
      .find();
      console.log(results)
    consola.success(`Fetched ${results.items.length} users for matching`);
    return results.items;
  } catch (error) {
    consola.error('Error fetching match data:', error);
    throw error;
  }
}


export async function activatePairInDatabase(chavrutaId: string, sendEmail: boolean) {
  try {
    // Update the chavruta status to active
    await updateChavrutaBase(chavrutaId, (chavruta) => ({
      ...chavruta,
      status: 2, // Active
      dateOfActivation: new Date().toISOString()
    }));

   /* if (sendEmail) {
      // Fetch the chavruta with user details
      const result = await items.query('Import5')
        .eq('_id', chavrutaId)
        .include('fromIsraelId', 'fromWorldId')
        .find();
      
      const chavruta = result.items[0];
      
      if (!chavruta) {
        throw new Error(`Chavruta with ID ${chavrutaId} not found`);
      }

      const israeliUser = chavruta.fromIsraelId;
      const worldUser = chavruta.fromWorldId;

      if (!israeliUser || !worldUser) {
        throw new Error('Missing user data in chavruta');
      }

      // Get track name for the email
      const track = Object.values(PreferredTracksInfo)
        .find(t => t.id === chavruta.track);
      const trackName = track?.trackEn || 'Unknown Track';

      // Fetch contact information for both users
      

      // Generate WhatsApp link (optional - you can customize this)
      const whatsappLink = `https://wa.me/${worldContact.tel.replace(/\D/g, '')}`;
      // Send Hebrew email to Israeli user
      await sendPairingEmailHeb(
        israeliUser._id,
        israeliUser.fullName,
        worldUser.fullName,
        worldUser.email,
        worldUser.phoneNumber,
        trackName,
        whatsappLink
      );

      // Send English email to World user
      await sendPairingEmail(
        worldUser._id,
        worldUser.fullName,
        israeliUser.fullName,
        israeliUser.email,
        israeliUser.phoneNumber,
        trackName,
        whatsappLink
      );

      consola.success(`Emails sent to both users for chavruta ${chavrutaId}`);
    }

    consola.success(`Chavruta ${chavrutaId} activated successfully`);
    return { success: true, emailsSent: sendEmail };
    */ return { success: true, emailsSent: false }; // Temporarily disable email sending
  } catch (error) {
    consola.error('Error activating pair:', error);
    throw error;
  }
}

export async function createNewPairInDatabase(israeliUserId: string, worldUserId: string, trackId: string) {
  try {
    // Create the new chavruta
    const israeliUser = await fetchUserById(israeliUserId);
    console.log("Israeli user:", israeliUser);
    const newChavruta = {
      newFromIsraelId: {"_id":israeliUserId},
      newFromWorldId: {"_id":worldUserId},
      track: trackId,
      status: 1, // standby
      dateOfCreate: new Date().toISOString(),
      isDeleted: false
    };
    
    const result = await items.insert('Import5', newChavruta);
    dashboard.showToast({ message: `New pair created between ${israeliUser?.fullName || 'Israeli User'} and World user.`, type: 'success' });

    // Update matchTo count for both users
    try {
      // Fetch current user data to get current matchTo values
      const [israeliUserResult, worldUserResult] = await Promise.all([
        items.query('Import3').eq('_id', israeliUserId).find(),
        items.query('Import3').eq('_id', worldUserId).find()
      ]);

      const israeliUser = israeliUserResult.items[0];
      const worldUser = worldUserResult.items[0];

      if (!israeliUser || !worldUser) {
        throw new Error('One or both users not found when updating matchTo counts');
      }

      // Increment matchTo for both users
      const israeliUpdates = {
        ...israeliUser,
        matchTo: (israeliUser.matchTo || 0) + 1
      };

      const worldUpdates = {
        ...worldUser,
        matchTo: (worldUser.matchTo || 0) + 1
      };

      // Update both users' matchTo counts
      await Promise.all([
        items.update('Import3', israeliUpdates),
        items.update('Import3', worldUpdates)
      ]);

      consola.success(`Updated matchTo counts - Israeli user: ${israeliUpdates.matchTo}, World user: ${worldUpdates.matchTo}`);

    } catch (updateError) {
      consola.error('Error updating matchTo counts:', updateError);
      // Don't throw here - the chavruta was created successfully, just log the error
      // You might want to handle this differently based on your business logic
    }

    return result;
  } catch (error) {
    consola.error('Error creating new pair:', error);
    throw error;
  }
}

/**
 * Updates a user in the database with the provided update function
 * @param userId - The ID of the user to update
 * @param updateFn - Function that takes the current user data and returns the updated data
 * @returns Promise<void>
 */
export const updateUserBase = async (userId: string, updateFn: (user: any) => any): Promise<void> => {
  try {
    console.log('Updating user with ID:', userId);
    
    // First, get the current user data
    const userResult = await items.query("Import3")
      .eq("_id", userId)
      .find();
    
    if (userResult.items.length === 0) {
      throw new Error(`User with ID ${userId} not found`);
    }
    
    const currentUser = userResult.items[0];
    console.log('Current user data:', currentUser);
    
    // Apply the update function to get the new data
    const updatedUser = updateFn(currentUser);
    console.log('Updated user data:', updatedUser);
    
    // Update the user in the database
    await items.update("Import3", updatedUser);
    console.log('User updated successfully');
    
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
};

/**
 * Gets a user by ID from the database
 * @param userId - The ID of the user to fetch
 * @returns Promise<any> - The user data or null if not found
 */
export const getUserById = async (userId: string): Promise<any> => {
  try {
    const result = await items.query("Import3")
      .eq("_id", userId)
      .find();
    
    return result.items.length > 0 ? result.items[0] : null;
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    throw error;
  }
};

/**
 * Updates multiple users in batch
 * @param updates - Array of {userId, updateFn} objects
 * @returns Promise<void>
 */
export const updateMultipleUsers = async (updates: Array<{userId: string, updateFn: (user: any) => any}>): Promise<void> => {
  try {
    console.log('Updating multiple users:', updates.length);
    
    const updatePromises = updates.map(async ({ userId, updateFn }) => {
      return updateUserBase(userId, updateFn);
    });
    
    await Promise.all(updatePromises);
    console.log('All users updated successfully');
    
  } catch (error) {
    console.error('Error updating multiple users:', error);
    throw error;
  }
};

/**
 * Deletes a chavruta and decrements the matchTo field for both participants
 */
export const deleteChavrutaAndUpdateUsers = async (chavrutaId: string): Promise<void> => {
  try {
    console.log('Starting chavruta deletion process for ID:', chavrutaId);
    
    // First, get the chavruta data to find the participant IDs
    const chavruta = await getChavrutaById(chavrutaId);
    if (!chavruta) {
      throw new Error('Chavruta not found');
    }

    const israeliUserId = chavruta.newFromIsraelId?._id;
    const diasporaUserId = chavruta.fromWorldId?._id;

    console.log('Found participant IDs:', { israeliUserId, diasporaUserId });

    // Update both users' matchTo field (decrement by 1)
    const userUpdates = [];

    if (israeliUserId) {
      console.log('Preparing Israeli user update:', israeliUserId);
      userUpdates.push({
        userId: israeliUserId,
        updateFn: (user: any) => ({
          ...user,
          matchTo: Math.max(0, (user.matchTo || 1) - 1) // Ensure it doesn't go below 0
        })
      });
    }

    if (diasporaUserId) {
      console.log('Preparing Diaspora user update:', diasporaUserId);
      userUpdates.push({
        userId: diasporaUserId,
        updateFn: (user: any) => ({
          ...user,
          matchTo: Math.max(0, (user.matchTo || 1) - 1) // Ensure it doesn't go below 0
        })
      });
    }

    // Update users in batch
    if (userUpdates.length > 0) {
      await updateMultipleUsers(userUpdates);
      console.log('User matchTo fields updated successfully');
    }

    // Now delete the chavruta (soft delete by setting isDeleted to true)
    await updateChavrutaBase(chavrutaId, (chavruta) => ({
      ...chavruta,
      isDeleted: true,
      dateOfDelete: new Date().toISOString(),
      deleteReason: 'Deleted by admin'
    }));

    console.log('Chavruta marked as deleted successfully');

  } catch (error) {
    console.error('Error deleting chavruta and updating users:', error);
    throw error;
  }
};

/**
 * Permanently removes a chavruta from the database and decrements matchTo fields
 * Use with caution - this cannot be undone
 */

// Helper function to get chavruta by ID if it doesn't exist
export const getChavrutaById = async (chavrutaId: string) => {
  try {
    const result = await items.query("Import5")
      .eq("_id", chavrutaId)
      .include("newFromIsraelId", "newFromWorldId")
      .find();
    
    return result.items.length > 0 ? result.items[0] : null;
  } catch (error) {
    console.error('Error fetching chavruta by ID:', error);
    throw error;
  }
};

export const sendPairingEmail = async (sourceUserId: string, targetUserId: string, trackId: string) => {
  try {
    // Fetch the chavruta with user details
    const [sourceUser, targetUser] = await Promise.all([
      getUserById(sourceUserId),
      getUserById(targetUserId)
    ]);

    if (!sourceUser || !targetUser) {
      throw new Error('Missing user data for email sending');
    }
    
    // Get track name for the email
    const track = Object.values(PreferredTracksInfo)
      .find(t => t.id === trackId);
    const trackName = track?.trackEn || 'Unknown Track';
    await fetch("https://www.shalhevet.steinsaltzyeshiva.com/_functions/post_sendFoundPairEmail", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: targetUser._id,
        userName: targetUser.fullName,
        partnerName: sourceUser.fullName,
        partnerEmail: sourceUser.email,
        partnerPhone: sourceUser.phoneNumber,
        trackName})
    });
    consola.success(`Email sent to ${targetUser.fullName} (${targetUser.email})`);

    await fetch("https://www.shalhevet.steinsaltzyeshiva.com/_functions/post_sendFoundPairEmailHeb", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        userId: sourceUser._id,
        userName: sourceUser.fullName,
        partnerName: targetUser.fullName,
        partnerEmail: targetUser.email,
        partnerPhone: targetUser.phoneNumber,
        trackName})
    });
    consola.success(`Email sent to ${sourceUser.fullName} (${sourceUser.email})`);
  } catch (error) {
    consola.error('Error sending pairing email:', error);
    throw error;
  }
};