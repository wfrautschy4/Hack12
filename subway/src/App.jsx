import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Tooltip, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Set default Leaflet icon using public folder paths
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/marker-icon-2x.png',
  iconUrl: '/marker-icon.png',
  shadowUrl: '/marker-shadow.png',
});

const ClickAwayHandler = ({ setRoute }) => {
  // Handle clicks outside markers (e.g. clicking on the map)
  useMapEvents({
    click: () => {
      setRoute([]); // Clear the route on clicking the map
    }
  });
  return null; // This component doesn't render anything visible
};

const App = () => {
  const [nodes, setNodes] = useState([]);
  const [startNode, setStartNode] = useState(null);
  const [endNode, setEndNode] = useState(null);
  const [route, setRoute] = useState([]);
  const [isRouteVisible, setIsRouteVisible] = useState(false); // For showing route only after button is clicked

  // Fetch the nodes from the JSON file
  useEffect(() => {
    fetch('/data/nodes.json')
      .then(response => response.json())
      .then(data => setNodes(data.nodes))
      .catch(error => console.error('Error fetching nodes:', error));
  }, []);

  // Handle node click to set start or end node
  const handleNodeClick = (nodeId) => {
    if (!startNode) {
      setStartNode(nodeId);
    } else if (!endNode && nodeId !== startNode) {
      setEndNode(nodeId);
    }
  };

  // Find route based on edges between nodes
  const findRoute = () => {
    if (!startNode || !endNode) return [];

    const visited = new Set();
    const queue = [[startNode, [startNode]]]; // [currentNode, path]

    while (queue.length > 0) {
      const [currentNodeId, path] = queue.shift();
      const currentNode = nodes.find(node => node.id === currentNodeId);

      if (currentNodeId === endNode) {
        return path; // Return the path once the end node is reached
      }

      currentNode.edges.forEach(edgeId => {
        if (!visited.has(edgeId)) {
          visited.add(edgeId);
          queue.push([edgeId, [...path, edgeId]]);
        }
      });
    }

    return []; // No path found
  };

  // Display full route with node names
  const displayRoute = () => {
    const pathIds = findRoute();
    const pathNames = pathIds.map(id => nodes.find(node => node.id === id)?.name);
    return pathNames.length > 0 ? `Route: ${pathNames.join(' -> ')}` : 'No route found';
  };

  // Clear the selections
  const clearSelections = () => {
    setStartNode(null);
    setEndNode(null);
    setRoute([]);
    setIsRouteVisible(false);
  };

  // Get polyline for edges (visible at all times)
  const getPolylines = () => {
    const lines = [];
    nodes.forEach(node => {
      node.edges.forEach(edgeId => {
        const targetNode = nodes.find(n => n.id === edgeId);
        if (targetNode) {
          lines.push([node.position, targetNode.position]);
        }
      });
    });
    return lines;
  };

  // Render markers with different colors for start, end, and default nodes
  const renderMarkers = () => {
    return nodes.map((node) => {
      const isEndpoint = node.id === startNode || node.id === endNode;

      return (
        <Marker
          key={node.id}
          position={node.position}
          eventHandlers={{
            click: () => handleNodeClick(node.id),
          }}
          icon={L.icon({
            iconUrl: isEndpoint ? '/endpoint-marker.png' : '/marker-icon.png',
            shadowUrl: '/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
          })}
        >
          {/* Tooltip to display node name on hover */}
          <Tooltip direction="top" offset={[0, -35]} opacity={1} permanent={false}>
            <strong>{node.name}</strong>
          </Tooltip>
        </Marker>
      );
    });
  };

  return (
    <div className="h-screen w-full flex">
      {/* Left section (70% width for map) */}
      <div className="w-[70%] h-full">
        <MapContainer
          center={[39.999246, -83.012685]}  // Center the map on OSU campus
          zoom={15}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false} // Disable attribution control
        >
          {/* Add the event handler for clearing selections */}
          <ClickAwayHandler setRoute={setRoute} />

          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Render preset pins from nodes.json */}
          {renderMarkers()}

          {/* Render connecting lines for all nodes (edges) */}
          {getPolylines().map((line, index) => (
            <Polyline key={index} positions={line} color="green" />
          ))}

          {/* Render the route between start and end only when route is visible */}
          {isRouteVisible && route.length > 0 && (
            <Polyline positions={route.map(id => nodes.find(node => node.id === id).position)} color="red" />
          )}
        </MapContainer>
      </div>

      {/* Right section (30% width for buttons and text) */}
      <div className="w-[30%] h-full bg-gray-100 p-8 flex flex-col space-y-4">
        <div className="mb-4">
          <p className="text-black mb-2">
            <strong>From:</strong> {startNode ? nodes.find(node => node.id === startNode)?.name : "Select a start node"}
          </p>
          <p className="text-black">
            <strong>To:</strong> {endNode ? nodes.find(node => node.id === endNode)?.name : "Select an end node"}
          </p>
        </div>

        {/* Clear Button */}
        <button
          className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600"
          onClick={clearSelections}
        >
          Clear
        </button>

        {/* Route Button */}
        <button
          className={`px-4 py-2 rounded-md ${startNode && endNode ? 'bg-blue-500 hover:bg-blue-600 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
          disabled={!startNode || !endNode}
          onClick={() => {
            setRoute(findRoute());
            setIsRouteVisible(true);
          }}
        >
          Route
        </button>

        {/* Display Route */}
        {isRouteVisible && route.length > 0 && (
          <div className="mt-4">
            <p className="text-black">{displayRoute()}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
