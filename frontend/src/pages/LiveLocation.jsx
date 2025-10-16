import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { api } from '../services/api';

// Leaflet icon fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const LiveLocation = () => {
  const { childId } = useParams();
  const [child, setChild] = useState(null);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);
  const ws = useRef(null);

  // Fetch initial child data and location
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // These API calls would fetch the child's profile and their last known location
        const childData = await api.get(`/children/${childId}`);
        const lastLocation = await api.get(`/monitoring/${childId}/location/latest`);
        
        setChild(childData.data);
        if (lastLocation.data) {
          setPosition([lastLocation.data.latitude, lastLocation.data.longitude]);
        }

      } catch (err) {
        setError('Failed to load initial location data.');
        console.error(err);
      }
    };
    fetchInitialData();
  }, [childId]);

  // Setup WebSocket connection
  useEffect(() => {
    // The WebSocket URL needs to be exposed by the backend
    const wsUrl = `wss://guardianapp-9.preview.emergentagent.com/ws/location/${childId}`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => console.log('WebSocket connected');
    ws.current.onclose = () => console.log('WebSocket disconnected');

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received location update:', data);
        setPosition([data.latitude, data.longitude]);
      } catch (e) {
        console.error('Error parsing WebSocket message:', e);
      }
    };

    ws.current.onerror = (err) => {
        console.error('WebSocket error:', err);
        setError("Real-time connection failed.");
    }

    // Cleanup on component unmount
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [childId]);

  if (error && !position) {
    return <div className="text-center p-8 text-red-500">{error}</div>;
  }

  if (!position) {
    return <div className="text-center p-8">Loading map and location...</div>;
  }

  return (
    <div className="h-screen w-screen flex flex-col">
      <header className="bg-gray-900 text-white p-4 z-10 border-b border-gray-700 flex justify-between items-center">
        <h1 className="text-xl font-bold">Live Location Tracking</h1>
        {child && (
          <div className='flex items-center gap-3'>
            <Avatar>
              <AvatarImage src={child.avatar} alt={child.name} />
              <AvatarFallback>{child.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <p className='font-semibold'>{child.name}</p>
                <p className='text-sm text-gray-400'>Last updated: {new Date().toLocaleTimeString()}</p>
            </div>
          </div>
        )}
      </header>
      <MapContainer center={position} zoom={15} className="flex-grow z-0">
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        />
        <Marker position={position}>
          <Popup>
            {child ? `${child.name}'s current location.` : 'Current location.'}
          </Popup>
        </Marker>
      </MapContainer>
    </div>
  );
};

export default LiveLocation;
