import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Set default Leaflet icon using public folder paths
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

const App = () => {
  const [nodes, setNodes] = useState([]);

  // Fetch the nodes from the JSON file
  useEffect(() => {
    fetch('/data/nodes.json')
      .then(response => response.json())
      .then(data => {
        setNodes(data.nodes);
      })
      .catch(error => console.error('Error fetching nodes:', error));
  }, []);

  // Generate the polyline path based on the edges
  const getPolylines = () => {
    const lines = [];
    nodes.forEach(node => {
      node.edges.forEach(edgeId => {
        const targetNode = nodes.find(n => n.id === edgeId);
        if (targetNode) {
          lines.push([node.position, targetNode.position]);  // Connect the nodes with lines
        }
      });
    });
    return lines;
  };

  return (
    <div className="h-screen w-full flex">
      {/* Left section (70% width for map) */}
      <div className="w-[70%] h-full">
        <MapContainer
          center={[40.006, -83.030]}  // Center the map on OSU campus
          zoom={15}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Render preset pins from nodes.json */}
          {nodes.map((node) => (
            <Marker key={node.id} position={node.position}>
              <Popup>{node.name}</Popup>
            </Marker>
          ))}

          {/* Render connecting lines based on edges */}
          {getPolylines().map((line, index) => (
            <Polyline key={index} positions={line} color="blue" />
          ))}
        </MapContainer>
      </div>

      {/* Right section (30% width for buttons and text) */}
      <div className="w-[30%] h-full bg-gray-100 p-8 flex flex-col space-y-4">
        <div className="mb-4">
          <p className="text-black mb-2">
            <strong>Pins:</strong>
          </p>
          {/* List of preset markers */}
          {nodes.map((node) => (
            <p key={node.id}>{node.name}: {node.position[0]}, {node.position[1]}</p>
          ))}
        </div>
      </div>
    </div>
  );
};

export default App;
