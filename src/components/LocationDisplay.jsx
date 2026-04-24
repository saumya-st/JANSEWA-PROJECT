import { useState, useEffect } from 'react';

// Simple in-memory cache to avoid duplicate requests and rate limiting
const addressCache = new Map();

export const LocationDisplay = ({ location, className = "truncate" }) => {
  const [address, setAddress] = useState(location?.address || null);
  const [loading, setLoading] = useState(!location?.address && location?.lat && location?.lng);

  useEffect(() => {
    let isMounted = true;

    const fetchAddress = async () => {
      if (!location || location.address || !location.lat || !location.lng) {
        return;
      }

      // Create a cache key using rounded coordinates
      const lat = parseFloat(location.lat).toFixed(4);
      const lng = parseFloat(location.lng).toFixed(4);
      const cacheKey = `${lat},${lng}`;

      if (addressCache.has(cacheKey)) {
        if (isMounted) {
          setAddress(addressCache.get(cacheKey));
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);
        // Using Nominatim API for reverse geocoding
        // Adding a small delay to prevent rapid-fire requests on mount
        await new Promise(resolve => setTimeout(resolve, Math.random() * 500));
        
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}&zoom=18&addressdetails=1`);
        
        if (!response.ok) throw new Error('Failed to fetch address');
        
        const data = await response.json();
        
        if (data && data.display_name) {
          const fullAddress = data.display_name;
          
          addressCache.set(cacheKey, fullAddress);
          if (isMounted) {
            setAddress(fullAddress);
          }
        }
      } catch (error) {
        console.error("Error fetching address:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchAddress();

    return () => {
      isMounted = false;
    };
  }, [location]);

  if (!location) return <span className={className}>Location not specified</span>;
  
  if (address) {
    return <span className={className} title={address}>{address}</span>;
  }
  
  if (loading) {
    return <span className={className}>Resolving location...</span>;
  }
  
  return <span className={className}>{location.lat?.toFixed(4)}, {location.lng?.toFixed(4)}</span>;
};
