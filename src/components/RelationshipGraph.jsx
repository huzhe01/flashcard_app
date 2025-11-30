import React, { useEffect, useRef, useState } from 'react';

const RelationshipGraph = ({ flashcards, onSelectCategory }) => {
    const canvasRef = useRef(null);
    const [nodes, setNodes] = useState([]);
    const [links, setLinks] = useState([]);
    const [hoveredNode, setHoveredNode] = useState(null);

    useEffect(() => {
        // Build category nodes
        const categoryMap = {};

        flashcards.forEach(card => {
            const category = card.category || 'Uncategorized';
            if (!categoryMap[category]) {
                categoryMap[category] = {
                    id: category,
                    type: 'category',
                    count: 0,
                    x: Math.random() * 700 + 50,
                    y: Math.random() * 500 + 50,
                    vx: 0,
                    vy: 0
                };
            }
            categoryMap[category].count++;
        });

        const categoryNodes = Object.values(categoryMap);
        setNodes(categoryNodes);
        setLinks([]); // For now, just show categories. Can extend to show cards later.

    }, [flashcards]);

    useEffect(() => {
        if (nodes.length === 0) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let animationFrameId;
        let iteration = 0;

        const simulate = () => {
            const width = canvas.width;
            const height = canvas.height;

            // Simple physics simulation
            if (iteration < 100) { // Run physics for first 100 frames
                // Repulsion between nodes
                for (let i = 0; i < nodes.length; i++) {
                    for (let j = i + 1; j < nodes.length; j++) {
                        const dx = nodes[j].x - nodes[i].x;
                        const dy = nodes[j].y - nodes[i].y;
                        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                        const force = 500 / dist;
                        const fx = (dx / dist) * force;
                        const fy = (dy / dist) * force;

                        nodes[i].vx -= fx * 0.01;
                        nodes[i].vy -= fy * 0.01;
                        nodes[j].vx += fx * 0.01;
                        nodes[j].vy += fy * 0.01;
                    }
                }

                // Center gravity
                nodes.forEach(node => {
                    const dx = width / 2 - node.x;
                    const dy = height / 2 - node.y;
                    node.vx += dx * 0.001;
                    node.vy += dy * 0.001;

                    // Update position
                    node.x += node.vx;
                    node.y += node.vy;

                    // Damping
                    node.vx *= 0.95;
                    node.vy *= 0.95;

                    // Bounds
                    const margin = 40;
                    node.x = Math.max(margin, Math.min(width - margin, node.x));
                    node.y = Math.max(margin, Math.min(height - margin, node.y));
                });

                iteration++;
            }

            // Draw
            ctx.clearRect(0, 0, width, height);

            // Draw category nodes
            nodes.forEach(node => {
                const radius = Math.max(20, Math.min(50, Math.sqrt(node.count) * 10));
                const isHovered = hoveredNode === node.id;

                // Shadow for depth
                if (isHovered) {
                    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
                    ctx.shadowBlur = 15;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 5;
                }

                // Draw circle
                ctx.beginPath();
                ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);

                // Gradient fill
                const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius);
                gradient.addColorStop(0, isHovered ? '#805ad5' : '#667eea');
                gradient.addColorStop(1, isHovered ? '#553c9a' : '#4c51bf');
                ctx.fillStyle = gradient;
                ctx.fill();

                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 3;
                ctx.stroke();

                // Reset shadow
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;

                // Draw count badge
                ctx.beginPath();
                ctx.arc(node.x + radius * 0.7, node.y - radius * 0.7, 15, 0, 2 * Math.PI);
                ctx.fillStyle = '#f56565';
                ctx.fill();
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(node.count, node.x + radius * 0.7, node.y - radius * 0.7);

                // Draw label
                ctx.fillStyle = '#2d3748';
                ctx.font = isHovered ? 'bold 14px Arial' : '13px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'top';
                const maxWidth = radius * 2;
                const text = node.id;

                if (ctx.measureText(text).width > maxWidth) {
                    const truncated = text.substring(0, 10) + '...';
                    ctx.fillText(truncated, node.x, node.y + radius + 5);
                } else {
                    ctx.fillText(text, node.x, node.y + radius + 5);
                }
            });

            animationFrameId = requestAnimationFrame(simulate);
        };

        simulate();

        return () => cancelAnimationFrame(animationFrameId);
    }, [nodes, hoveredNode]);

    const handleMouseMove = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        let foundNode = null;
        for (const node of nodes) {
            const radius = Math.max(20, Math.min(50, Math.sqrt(node.count) * 10));
            const dx = node.x - x;
            const dy = node.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < radius) {
                foundNode = node.id;
                break;
            }
        }

        setHoveredNode(foundNode);

        if (foundNode) {
            canvasRef.current.style.cursor = 'pointer';
        } else {
            canvasRef.current.style.cursor = 'default';
        }
    };

    const handleClick = (e) => {
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const clickedNode = nodes.find(node => {
            const radius = Math.max(20, Math.min(50, Math.sqrt(node.count) * 10));
            const dx = node.x - x;
            const dy = node.y - y;
            return Math.sqrt(dx * dx + dy * dy) < radius;
        });

        if (clickedNode) {
            onSelectCategory(clickedNode.id);
        }
    };

    return (
        <div style={{
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%)',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
            <div style={{
                padding: '15px 20px',
                borderBottom: '1px solid #e2e8f0',
                background: 'white',
                fontWeight: 'bold',
                color: '#2d3748',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
            }}>
                <span style={{ fontSize: '1.2em' }}>🔗</span>
                <span>Category Relationship Map</span>
                {hoveredNode && (
                    <span style={{
                        marginLeft: 'auto',
                        fontSize: '0.9em',
                        color: '#667eea',
                        fontWeight: 'normal'
                    }}>
                        Click to filter by: {hoveredNode}
                    </span>
                )}
            </div>
            <canvas
                ref={canvasRef}
                width={800}
                height={600}
                style={{ width: '100%', height: 'auto', display: 'block' }}
                onMouseMove={handleMouseMove}
                onClick={handleClick}
            />
            <div style={{
                padding: '10px 20px',
                background: 'white',
                borderTop: '1px solid #e2e8f0',
                fontSize: '0.85em',
                color: '#718096'
            }}>
                💡 Tip: Node size represents the number of cards in each category. Click a category to filter.
            </div>
        </div>
    );
};

export default RelationshipGraph;
