import React, { useState, useEffect, useRef } from 'react';
import { X, Search, MapPin, Home, Briefcase, Hotel, MapPinned, Loader2, Navigation } from 'lucide-react';
import { Address, AddressFormData } from '../types/address';
import { loadGoogleMapsScript } from '../utils/googleMaps';
import { useToast } from '../contexts/ToastContext';

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: AddressFormData) => Promise<void>;
  editAddress?: Address | null;
  isLoading: boolean;
  userName?: string;
  userPhone?: string;
}

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

const AddressModal: React.FC<AddressModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editAddress,
  isLoading,
  userName = '',
  userPhone = '',
}) => {
  const { showError } = useToast();
  const [formData, setFormData] = useState<AddressFormData>({
    name: '',
    full_address: '',
    contact_number: '',
    type: 'home',
    latitude: '12.9716',
    longitude: '77.5946',
    fhb_name: '',
    floor: '',
    nearby_landmark: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const searchBoxRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    if (editAddress) {
      setFormData({
        name: editAddress.name,
        full_address: editAddress.full_address,
        contact_number: editAddress.contact_number || '',
        type: editAddress.type,
        latitude: editAddress.latitude,
        longitude: editAddress.longitude,
        fhb_name: editAddress.fhb_name,
        floor: editAddress.floor || '',
        nearby_landmark: editAddress.nearby_landmark || '',
      });
    } else if (!editAddress && userName) {
      setFormData(prev => ({
        ...prev,
        name: userName,
        contact_number: userPhone,
      }));
    }
  }, [editAddress, userName, userPhone]);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        if (mapRef.current && !mapInstanceRef.current) {
          initializeMap();
        }
      }, 100);
      return () => clearTimeout(timer);
    } else {
      if (mapInstanceRef.current) {
        mapInstanceRef.current = null;
      }
      if (markerRef.current) {
        markerRef.current = null;
      }
      if (autocompleteRef.current) {
        autocompleteRef.current = null;
      }
      setIsLoadingMap(true);
    }
  }, [isOpen]);

  const initializeMap = async () => {
    if (!GOOGLE_MAPS_API_KEY) {
      console.error('Google Maps API key is missing');
      setMapError('Google Maps API key is not configured');
      setIsLoadingMap(false);
      return;
    }

    try {
      console.log('Loading Google Maps script...');
      setIsLoadingMap(true);
      await loadGoogleMapsScript(GOOGLE_MAPS_API_KEY);

      console.log('Google Maps script loaded, checking mapRef...');
      if (!mapRef.current) {
        console.error('Map ref is null');
        setIsLoadingMap(false);
        return;
      }

      console.log('Initializing map instance...');

      const lat = parseFloat(formData.latitude);
      const lng = parseFloat(formData.longitude);

      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat, lng },
        zoom: 15,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });

      mapInstanceRef.current = map;

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map: map,
        draggable: true,
      });

      markerRef.current = marker;

      marker.addListener('dragend', () => {
        const position = marker.getPosition();
        if (position) {
          handleLocationSelect(position.lat(), position.lng());
        }
      });

      map.addListener('click', (e: any) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        marker.setPosition({ lat, lng });
        handleLocationSelect(lat, lng);
      });

      const searchInput = document.getElementById('address-search-input') as HTMLInputElement;
      if (searchInput) {
        console.log('Setting up autocomplete...');
        const autocomplete = new window.google.maps.places.Autocomplete(
          searchInput,
          { types: ['geocode'] }
        );

        autocompleteRef.current = autocomplete;

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry && place.geometry.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            map.setCenter({ lat, lng });
            marker.setPosition({ lat, lng });
            handleLocationSelect(lat, lng);
            setSearchQuery(place.formatted_address || '');
          }
        });
      } else {
        console.warn('Search input not found');
      }

      console.log('Map initialized successfully');
      setIsLoadingMap(false);
    } catch (error) {
      console.error('Error loading Google Maps:', error);
      setMapError('Failed to load Google Maps');
      setIsLoadingMap(false);
    }
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    setFormData((prev) => ({ ...prev, latitude: String(lat), longitude: String(lng) }));

    try {
      const geocoder = new window.google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });

      if (response.results && response.results[0]) {
        const address = response.results[0].formatted_address;
        setFormData((prev) => ({ ...prev, full_address: address }));
        setSearchQuery(address);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  };

  const detectCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        if (mapInstanceRef.current && markerRef.current) {
          mapInstanceRef.current.setCenter({ lat, lng });
          markerRef.current.setPosition({ lat, lng });
          handleLocationSelect(lat, lng);
        }
        setIsDetectingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert('Unable to retrieve your location');
        setIsDetectingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showError('Please enter your name');
      return;
    }

    if (!formData.full_address.trim()) {
      showError('Please select a location on the map');
      return;
    }

    if (!formData.fhb_name.trim()) {
      showError('Please enter flat/house/building name');
      return;
    }

    await onSave(formData);

    if (!editAddress) {
      setFormData({
        name: userName || '',
        full_address: '',
        contact_number: userPhone || '',
        type: 'home',
        latitude: '12.9716',
        longitude: '77.5946',
        fhb_name: '',
        floor: '',
        nearby_landmark: '',
      });
      setSearchQuery('');
    }
  };

  const handleClose = () => {
    if (!editAddress) {
      setFormData({
        name: userName || '',
        full_address: '',
        contact_number: userPhone || '',
        type: 'home',
        latitude: '12.9716',
        longitude: '77.5946',
        fhb_name: '',
        floor: '',
        nearby_landmark: '',
      });
    }
    setSearchQuery('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="flex min-h-full items-center justify-center p-0 sm:p-2 md:p-4">
        <div className="relative w-full h-full sm:h-auto sm:max-w-6xl bg-white dark:bg-gray-800 sm:rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden">
          <div className="flex flex-col lg:flex-row h-full sm:h-[90vh] lg:max-h-[900px]">
            <div className="lg:w-1/2 h-[40vh] sm:h-80 md:h-96 lg:h-full relative">
              <div className="absolute top-2 left-2 right-2 sm:top-4 sm:left-4 sm:right-4 z-10 flex space-x-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                  <input
                    id="address-search-input"
                    type="text"
                    placeholder="Search for area, street..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-7 sm:pl-10 pr-7 sm:pr-10 py-1.5 sm:py-2 md:py-3 text-xs sm:text-sm md:text-base bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg sm:rounded-xl shadow-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('');
                        setFormData(prev => ({ ...prev, full_address: '' }));
                      }}
                      className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"
                    >
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  )}
                </div>
              </div>

              <button
                onClick={detectCurrentLocation}
                disabled={isDetectingLocation || isLoadingMap}
                className="absolute bottom-2 left-2 sm:bottom-4 sm:left-4 z-10 flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 md:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg sm:rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDetectingLocation ? (
                  <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 animate-spin" />
                ) : (
                  <Navigation className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                )}
                <span className="text-xs sm:text-sm font-medium">Detect</span>
              </button>

              <div className="w-full h-full relative">
                <div ref={mapRef} className="w-full h-full" />
                {isLoadingMap && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 z-10">
                    <div className="text-center">
                      <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-blue-600 mx-auto" />
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-2">Loading map...</p>
                    </div>
                  </div>
                )}
                {mapError && !isLoadingMap && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-700 z-10 p-4">
                    <p className="text-red-600 text-xs sm:text-sm text-center">{mapError}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="lg:w-1/2 flex flex-col flex-1 lg:flex-none">
              <div className="flex items-center justify-between p-3 sm:p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-sm sm:text-base md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                  {editAddress ? 'Edit Address' : 'Enter complete address'}
                </h2>
                <button
                  onClick={handleClose}
                  className="p-1 sm:p-1.5 md:p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex-shrink-0"
                >
                  <X className="h-5 w-5 sm:h-6 sm:w-6 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-2.5 sm:space-y-3 md:space-y-4">
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Save address as *
                  </label>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {[
                      { value: 'home', label: 'Home', icon: Home },
                      { value: 'work', label: 'Work', icon: Briefcase },
                      { value: 'hotel', label: 'Hotel', icon: Hotel },
                      { value: 'other', label: 'Other', icon: MapPinned },
                    ].map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: value as any })}
                        className={`flex items-center space-x-1 sm:space-x-2 px-2.5 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg border-2 transition-all ${
                          formData.type === value
                            ? 'bg-blue-600 border-blue-600 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-blue-500'
                        }`}
                      >
                        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                        <span className="text-xs sm:text-sm font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Full Name"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.contact_number}
                    onChange={(e) => setFormData({ ...formData, contact_number: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Contact Number (Optional)"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Flat / House no / Building name *
                  </label>
                  <input
                    type="text"
                    value={formData.fhb_name}
                    onChange={(e) => setFormData({ ...formData, fhb_name: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter flat/house/building name"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Floor / Nearby landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.floor}
                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                    placeholder="Floor number"
                  />
                  <input
                    type="text"
                    value={formData.nearby_landmark}
                    onChange={(e) => setFormData({ ...formData, nearby_landmark: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Nearby landmark"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 sm:mb-2">
                    Area / Sector / Locality * <span className="text-green-600 text-xs">(Auto-filled)</span>
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                    <input
                      type="text"
                      value={formData.full_address}
                      readOnly
                      className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 text-xs sm:text-sm bg-gray-100 dark:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white cursor-not-allowed"
                      placeholder="Select location on map"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex items-center justify-center space-x-2 px-4 sm:px-6 py-2.5 sm:py-3 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-2 sm:mt-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <MapPin className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>Save Address</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressModal;
