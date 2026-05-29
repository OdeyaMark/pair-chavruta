import pymongo
import pandas as pd
from datetime import datetime
import os
      
        

def export_combined_csv():
    """
    Alternative function to export both collections into a single CSV file
    with an additional column indicating the source collection.
    """
    
    # MongoDB connection configuration
    MONGO_URI = os.getenv("MONGO_URI")
    DATABASE_NAME = os.getenv("MONGO_DATABASE", "Shalhevet")

    if not MONGO_URI:
        raise ValueError("Missing MONGO_URI environment variable")
    
    try:
        # Connect to MongoDB
        client = pymongo.MongoClient(MONGO_URI)
        db = client[DATABASE_NAME]
        
        print(f"Connected to MongoDB database: {DATABASE_NAME}")
        
        # Collections to process
        collections = ["IsraelParticipants", "WorldParticipants"]

        # Query filter
        query_filter = {"IsInArchive": True}
        
        all_documents = []
        
        # Process each collection
        for collection_name in collections:
            print(f"Processing collection: {collection_name}")
            
            collection = db[collection_name]
            
            # Find documents where IsInArchive is True
            cursor = collection.find(query_filter)
            documents = list(cursor)
            
            # Add source collection info to each document
            for doc in documents:
                doc['source_collection'] = collection_name
                # Convert ObjectId to string if present
                if '_id' in doc:
                    doc['_id'] = str(doc['_id'])
            
            all_documents.extend(documents)
            print(f"Found {len(documents)} documents in {collection_name}")
        
        if not all_documents:
            print("No documents found with IsInArchive=True in any collection")
            return
        
        # Convert to DataFrame
        df = pd.DataFrame(all_documents)
        
        # Generate filename with timestamp
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"combined_archived_participants_{timestamp}.csv"
        
        # Export to CSV
        df.to_csv(filename, index=False, encoding='utf-8')
        print(f"\nExported {len(all_documents)} total documents to {filename}")
        print(f"Columns: {list(df.columns)}")
        
        # Show count by source collection
        print("\nDocuments by collection:")
        print(df['source_collection'].value_counts())
        
    except pymongo.errors.ConnectionFailure as e:
        print(f"Failed to connect to MongoDB: {e}")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        # Close the connection
        if 'client' in locals():
            client.close()
            print("MongoDB connection closed.")

if __name__ == "__main__":
    print("MongoDB to CSV Export Tool")
    print("=" * 40)
    print("Set MONGO_URI in your environment before running this script")
    
    export_combined_csv()