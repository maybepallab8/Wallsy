import axios from 'axios';

interface NASAImage {
  title: string;
  description: string;
  nasa_id: string;
  dateCreated: string;
  thumbnailUrl: string;
  fullImageUrl: string;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchImage = async (search: string, callback: (image: NASAImage) => void) => {
    try {
        const response = await axios.get(`https://images-api.nasa.gov/search?q=${search}&media_type=image`);
        const items = response.data.collection.items;
        
        // Process items in parallel
        items.forEach(async (item) => {
            try {
                const assetUrl = item.href;
                
                // First, immediately return the thumbnail
                callback({
                    title: item.data[0].title,
                    description: item.data[0].description,
                    nasa_id: item.data[0].nasa_id,
                    dateCreated: item.data[0].date_created,
                    thumbnailUrl: (item.links?.[0]?.href || '').replace('http://', 'https://'),
                    fullImageUrl: '', // Will be updated later
                });

                // Then fetch the full image URL in background
                const assetResponse = await axios.get(assetUrl);
                const imageUrls = assetResponse.data
                    .filter((url: string) => url.endsWith('.jpg') || url.endsWith('.png'))
                    .map((url: string) => url.replace('http://', 'https://'));
                
                const fullImageUrl = imageUrls.find((url: string) => url.includes('~orig.')) || 
                                   imageUrls.find((url: string) => url.includes('~large.')) ||
                                   imageUrls[0];

                // Update with full image URL
                callback({
                    title: item.data[0].title,
                    description: item.data[0].description,
                    nasa_id: item.data[0].nasa_id,
                    dateCreated: item.data[0].date_created,
                    thumbnailUrl: (item.links?.[0]?.href || '').replace('http://', 'https://'),
                    fullImageUrl: fullImageUrl || '',
                });
            } catch (error) {
                console.error('Error processing image:', error);
            }
        });
    } catch (error) {
        console.error('Error fetching images:', error);
        throw error;
    }
};
