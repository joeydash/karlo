let isGoogleMapsLoaded = false;
let loadingPromise: Promise<void> | null = null;

export const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  if (isGoogleMapsLoaded) {
    return Promise.resolve();
  }

  if (loadingPromise) {
    return loadingPromise;
  }

  loadingPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('Window object not available'));
      return;
    }

    if (window.google && window.google.maps) {
      isGoogleMapsLoaded = true;
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      isGoogleMapsLoaded = true;
      resolve();
    };

    script.onerror = () => {
      loadingPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };

    document.head.appendChild(script);
  });

  return loadingPromise;
};

export const isGoogleMapsScriptLoaded = (): boolean => {
  return isGoogleMapsLoaded && typeof window !== 'undefined' && !!window.google?.maps;
};

declare global {
  interface Window {
    google: any;
  }
}
