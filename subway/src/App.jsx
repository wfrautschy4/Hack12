import React, { useState, useEffect } from 'react';

const App = () => {
  const [nodes, setNodes] = useState([]);
  const [startNode, setStartNode] = useState("");
  const [endNode, setEndNode] = useState("");

  // Fetch the nodes from the JSON file
  useEffect(() => {
    fetch('/data/nodes.json')
      .then(response => response.json())
      .then(data => setNodes(data.nodes))
      .catch(error => console.error('Error fetching nodes:', error));
  }, []);

  // Function to find the shortest route using BFS
  const bfsRoute = (startId, endId) => {
    if (startId === endId) return [startId];

    const graph = new Map();
    nodes.forEach(node => {
      graph.set(node.id, node.edges);
    });

    const queue = [[startId]];
    const visited = new Set();

    while (queue.length > 0) {
      const path = queue.shift();
      const node = path[path.length - 1];

      if (node === endId) {
        return path;
      }

      if (!visited.has(node)) {
        visited.add(node);
        const neighbors = graph.get(node);
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor)) {
            queue.push([...path, neighbor]);
          }
        });
      }
    }

    return null; // No route found
  };

  const handleNodeClick = (nodeId) => {
    if (!startNode) {
      setStartNode(nodeId);
    } else if (!endNode && nodeId !== startNode) {
      setEndNode(nodeId);
    }
  };

  const findRoute = () => {
    if (!startNode || !endNode) {
      alert('Please select both a start and end node.');
      return;
    }

    const route = bfsRoute(startNode, endNode);
    if (route) {
      const routeNames = route.map(id => nodes.find(node => node.id === id)?.name).join(' -> ');
      alert(`Route: ${routeNames}`);
    } else {
      alert('No route found between the selected nodes.');
    }
  };

  const flipNodes = () => {
    if (startNode && endNode) {
      const temp = startNode;
      setStartNode(endNode);
      setEndNode(temp);
    }
  };

  const clearSelections = () => {
    setStartNode("");
    setEndNode("");
  };

  return (
    <div className='bg-subway h-screen flex justify-between items-start'>
      <div className="relative w-4/5 h-4/5">
        {/* Render nodes as buttons */}
        {nodes.map((node) => (
          <button
            key={node.id}
            onClick={() => handleNodeClick(node.id)}
            className={`absolute bg-red-500 text-white p-2 rounded-full ${
              node.id === startNode || node.id === endNode ? 'font-bold bg-green-500' : ''
            }`}
            style={{
              left: `${node.position.x}%`,
              top: `${node.position.y}%`,
              transform: 'translate(-50%, -50%)' // Center the buttons
            }}
          >
            {node.name}
          </button>
        ))}

        {/* Render connections between nodes */}
        <svg className="absolute w-full h-full top-0 left-0 pointer-events-none">
          {nodes.map((node) =>
            node.edges.map((edge) => {
              const targetNode = nodes.find((n) => n.id === edge);
              if (targetNode) {
                return (
                  <line
                    key={`${node.id}-${edge}`}
                    x1={`${node.position.x}%`}
                    y1={`${node.position.y}%`}
                    x2={`${targetNode.position.x}%`}
                    y2={`${targetNode.position.y}%`}
                    stroke="green"
                    strokeWidth="2"
                  />
                );
              }
              return null;
            })
          )}
        </svg>
      </div>

      {/* Control Area on the Right */}
      <div className="flex flex-col items-start justify-start space-y-4 p-8">
        {/* Display Selections */}
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
          className={`px-4 py-2 rounded-md ${
            startNode || endNode ? 'bg-red-500 text-white hover:bg-red-600' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={clearSelections}
        >
          Clear
        </button>

        {/* Flip Button */}
        <button
          className={`px-4 py-2 rounded-md ${
            startNode && endNode ? 'bg-gray-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={flipNodes}
          disabled={!startNode || !endNode}
        >
          Flip
        </button>

        {/* Route Button */}
        <button
          className={`px-4 py-2 rounded-md ${
            startNode && endNode ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          onClick={findRoute}
          disabled={!startNode || !endNode}
        >
          Route
        </button>
      </div>
    </div>
  );
};

export default App;
