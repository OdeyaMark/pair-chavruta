import consola from 'consola';
import { items } from '@wix/data';






export async function fetchCMSData() {
  try {
  consola.info('Fetching CMS data...');
  const results = await items.query('regFormEn').fields("fullName", "country", "havrutaFound", "_createdDate", "_id", "prefTra").limit(1000).find();
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
    const results = await items.update("regFormEn", userData);
    return results;
  } catch (error) {
    consola.error('Error saving user changes:', error);
    throw error; // Rethrow to handle in UI
  }
}


export async function fetchUserById(userId: string) {
  try {
    consola.info(`Fetching user data for ID: ${userId}`);
    const result = await items.query('regFormEn')
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
    const response = await items.query('regFormEn')
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
  const results = await items.query('Import2').descending('DateOfCreate').ne('IsDeleted', true).include('fromIsraelId', 'fromWorldId').limit(1000).find();
  return results.items;
}

export async function fetchPendingChavrutasFromCMS(){
  const results = await items.query('Import2').descending('DateOfCreate').ne('IsDeleted', true).eq('status', 1).include('fromIsraelId', 'fromWorldId').limit(1000).find();
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
    const collectionName = "Import2"; // Replace with your actual collection name
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
    const result = await items.query('Import2')
      .eq('_id', chavrutaId)
      .find();
    
    const chavruta = result.items[0];
    if (!chavruta) {
      throw new Error(`Chavruta with ID ${chavrutaId} not found`);
    }

    // Apply updates and return
    return await items.update('Import2', updateFn(chavruta));
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
    const result = await items.query('regFormEn')
      .eq('IsInArchive', true)
      .find();
    return result.items;
  } catch (error) {
    console.error('Error fetching archived users:', error);
    throw error;
  }
}

