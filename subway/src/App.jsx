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

  // Blue connections (previously specialConnections) between Lane, Summit, etc.
  const blueConnections = new Set([
    "Lane-Summit", "Summit-East Hudson", "East Hudson-Old North",
    "Old North-Patterson", "Patterson-Lane"
  ]);

  // Orange connections between Lane and Schottenstein, Schottenstein and West Campus, etc.
  const orangeConnections = new Set([
    "Lane-Schottenstein", "Schottenstein-West Campus",
    "West Campus-Medical Center", "Medical Center-RPAC"
  ]);

  // Yellow connections between RPAC, South Dorms, South Neil, King Ave, 11th Ave, and The Union
  const yellowConnections = new Set([
    "RPAC-South Dorms", "South Dorms-South Neil",
    "South Neil-King Ave", "King Ave-11th Ave",
    "11th Ave-The Union"
  ]);

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

  // Display route with color transitions and formatted output
  const displayRoute = () => {
    const pathIds = findRoute();
    const pathNames = pathIds.map(id => nodes.find(node => node.id === id)?.name);
    let result = "<u>Route Plan</u><br>";

    if (pathNames.length === 0) {
        return 'No route found';
    }

    let currentLineColor = ''; // Keep track of the current color line
    result += `Start: ${pathNames[0]}<br>`;

    // Loop through the path except the last node
    for (let i = 0; i < pathNames.length - 2; i++) { 
        const currentNode = pathNames[i];
        const nextNode = pathNames[i + 1];
        const connection = `${currentNode}-${nextNode}`;

        let newLineColor = 'green'; // Default color
        if (blueConnections.has(connection) || blueConnections.has(`${nextNode}-${currentNode}`)) {
            newLineColor = 'blue';
        } else if (orangeConnections.has(connection) || orangeConnections.has(`${nextNode}-${currentNode}`)) {
            newLineColor = 'orange';
        } else if (yellowConnections.has(connection) || yellowConnections.has(`${nextNode}-${currentNode}`)) {
            newLineColor = 'yellow';
        }

        // Check if there's a line change
        if (newLineColor !== currentLineColor && currentLineColor !== '') {
            result += `Transfer onto ${newLineColor} line<br>`;
        }

        currentLineColor = newLineColor;

        // Only append the node names in the loop, skip the last one
        result += `${nextNode}<br>`;
    }

    // Append the end node once after the loop
    result += `End: ${pathNames[pathNames.length - 1]}`;
    return result;
};


  // Clear the selections
  const clearSelections = () => {
    setStartNode(null);
    setEndNode(null);
    setRoute([]);
    setIsRouteVisible(false);
  };

  // Get polyline for edges (visible at all times) and highlight special connections
  const getPolylines = () => {
    const lines = [];
    nodes.forEach(node => {
      node.edges.forEach(edgeId => {
        const targetNode = nodes.find(n => n.id === edgeId);
        if (targetNode) {
          const isBlueConnection = blueConnections.has(`${node.name}-${targetNode.name}`) || blueConnections.has(`${targetNode.name}-${node.name}`);
          const isOrangeConnection = orangeConnections.has(`${node.name}-${targetNode.name}`) || orangeConnections.has(`${targetNode.name}-${node.name}`);
          const isYellowConnection = yellowConnections.has(`${node.name}-${targetNode.name}`) || yellowConnections.has(`${targetNode.name}-${node.name}`);
          lines.push({
            positions: [node.position, targetNode.position],
            color: isBlueConnection ? 'blue' : isOrangeConnection ? 'orange' : isYellowConnection ? 'yellow' : 'green',
          });
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
            <Polyline key={index} positions={line.positions} color={line.color} />
          ))}

          {/* Render the route between start and end only when route is visible */}
          {isRouteVisible && route.length > 0 && (
            <Polyline positions={route.map(id => nodes.find(node => node.id === id).position)} color="red" />
          )}
        </MapContainer>
      </div>

      {/* Right section (30% width for buttons and text) */}
      <div className="w-[30%] h-full bg-black text-white p-8 flex flex-col space-y-4">
        <div className="mb-4">
          <p className="text-white mb-2">
            <strong>From:</strong> {startNode ? nodes.find(node => node.id === startNode)?.name : "Select a start node"}
          </p>
          <p className="text-white">
            <strong>To:</strong> {endNode ? nodes.find(node => node.id === endNode)?.name : "Select an end node"}
          </p>
        </div>

        {/* Clear Button */}
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-white hover:text-blue-500 hover:border hover:border-blue-500 transition-all duration-300"
          onClick={clearSelections}
        >
          Clear
        </button>

        {/* Route Button */}
        <button
          className={`px-4 py-2 rounded-md ${startNode && endNode ? 'bg-blue-500 hover:bg-white hover:text-blue-500 hover:border hover:border-blue-500 transition-all duration-300' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
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
            <p className="text-white" dangerouslySetInnerHTML={{ __html: displayRoute() }}></p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
