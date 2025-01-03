import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Box, Slider, Typography } from '@mui/material';
import dayjs from 'dayjs';

function ForceGraph({ data, searchTerm }) {
  const svgRef = useRef();
  const containerRef = useRef();
  const [currentDate, setCurrentDate] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Create color scale for leadership levels
    const colorScale = d3.scaleLinear()
      .domain([1, 5])
      .range(['#a8e6cf', '#1b4332']) // Light green to dark green
      .interpolate(d3.interpolateHcl);

    // Get date range from data
    const dates = data.map(d => new Date(d.date));
    const minDate = d3.min(dates);
    const maxDate = d3.max(dates);
    setDateRange([minDate, maxDate]);
    if (!currentDate) setCurrentDate(maxDate);

    // Get container dimensions
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Filter data based on current date
    const filteredData = data.filter(d => new Date(d.date) <= currentDate);

    // Create a map of the latest leadership level for each organizee
    const latestLeadership = {};
    filteredData.forEach(d => {
      if (!latestLeadership[d.organizee] || new Date(d.date) > new Date(latestLeadership[d.organizee].date)) {
        latestLeadership[d.organizee] = {
          leadership: d.leadership,
          date: d.date
        };
      }
    });

    // Get unique nodes (organizers and organizees)
    const nodes = Array.from(new Set(filteredData.flatMap(d => [d.organizer, d.organizee])))
      .filter(Boolean)  // Remove any null/undefined values
      .map(id => ({ 
        id,
        x: width / 2 + (Math.random() - 0.5) * 100,  // Add initial positions
        y: height / 2 + (Math.random() - 0.5) * 100,
        leadership: latestLeadership[id]?.leadership || null  // Add leadership level if available
      }));

    // Count frequency of connections between pairs
    const connectionCounts = {};
    filteredData.forEach(d => {
      if (d.organizer && d.organizee) {  // Only count if both fields exist
        const key = [d.organizer, d.organizee].sort().join('-');
        connectionCounts[key] = (connectionCounts[key] || 0) + 1;
      }
    });

    // Create links from the filtered data with connection counts
    const links = filteredData
      .filter(d => d.organizer && d.organizee)  // Only create links if both fields exist
      .map(d => {
        const key = [d.organizer, d.organizee].sort().join('-');
        return {
          source: d.organizer,
          target: d.organizee,
          date: d.date,
          event: d.event,
          count: connectionCounts[key]
        };
      });

    // Get max connection count for scaling
    const maxCount = Math.max(...Object.values(connectionCounts), 1);

    // Set up the SVG with dynamic dimensions
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    // Create a group for zoom/pan
    const g = svg.append('g');

    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoom);

    // Scale for link strength and width
    const strengthScale = d3.scaleLinear()
      .domain([1, maxCount])
      .range([100, 30]); // Stronger links (shorter distance) for more connections

    const widthScale = d3.scaleLinear()
      .domain([1, maxCount])
      .range([1, 6]); // Thicker lines for more connections

    // Create the force simulation with dynamic center
    const simulation = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links)
        .id(d => d.id)
        .distance(d => strengthScale(d.count)))
      .force('charge', d3.forceManyBody().strength(-100))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(40))
      .force('x', d3.forceX(width / 2).strength(0.1))
      .force('y', d3.forceY(height / 2).strength(0.1));

    // Add links with varying thickness
    const link = g.append('g')
      .selectAll('line')
      .data(links)
      .join('line')
      .style('stroke', '#999')
      .style('stroke-opacity', 0.6)
      .style('stroke-width', d => widthScale(d.count));

    // Create node groups
    const node = g.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .call(drag(simulation));

    // Add circles to nodes with leadership-based colors
    node.append('circle')
      .attr('r', 8)
      .style('fill', d => {
        if (d.leadership) {
          return colorScale(parseInt(d.leadership));
        }
        return '#1b4332'; // Dark green for organizers without leadership level
      })
      .attr('class', d => `node-${d.id.replace(/\s+/g, '-')}`);

    // Add labels to nodes
    node.append('text')
      .text(d => d.id)
      .attr('dx', 12)
      .attr('dy', 4)
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .attr('class', d => `label-${d.id.replace(/\s+/g, '-')}`);

    // Add hover effects
    node.on('mouseover', function(event, d) {
      // Highlight the node
      d3.select(this).select('circle')
        .style('fill', '#ff7f0e')
        .attr('r', 12);
      
      // Highlight connected links and show connection count
      link
        .style('stroke', l => {
          if (l.source.id === d.id || l.target.id === d.id) {
            const otherNode = l.source.id === d.id ? l.target.id : l.source.id;
            const key = [l.source.id, l.target.id].sort().join('-');
            const count = connectionCounts[key];
            
            // Add temporary label for connection count
            // g.append('text')
            //   .attr('class', 'connection-count')
            //   .attr('x', (l.source.x + l.target.x) / 2)
            //   .attr('y', (l.source.y + l.target.y) / 2)
            //   .text(`${count} connection${count > 1 ? 's' : ''}`)
            //   .style('font-size', '10px')
            //   .style('fill', '#ff7f0e')
            //   .style('text-anchor', 'middle')
            //   .style('dominant-baseline', 'middle')
            //   .style('pointer-events', 'none');
            
            return '#ff7f0e';
          }
          return '#999';
        })
        .style('stroke-width', l => {
          const baseWidth = widthScale(l.count);
          return (l.source.id === d.id || l.target.id === d.id) ? baseWidth * 1.5 : baseWidth;
        });
    })
    .on('mouseout', function() {
      // Reset node
      d3.select(this).select('circle')
        .style('fill', '#69b3a2')
        .attr('r', 8);
      
      // Reset links and remove connection counts
      link
        .style('stroke', '#999')
        .style('stroke-width', d => widthScale(d.count));
      g.selectAll('.connection-count').remove();
    });

    // Update positions on each tick
    simulation.on('tick', () => {
      // Constrain nodes to the visible area
      nodes.forEach(d => {
        d.x = Math.max(40, Math.min(width - 40, d.x));
        d.y = Math.max(40, Math.min(height - 40, d.y));
      });

      link
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);

      node
        .attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Drag functionality
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
      }

      function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
      }

      return d3.drag()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended);
    }

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      svg.attr('width', newWidth)
         .attr('height', newHeight);
      
      simulation.force('center', d3.forceCenter(newWidth / 2, newHeight / 2))
                .force('x', d3.forceX(newWidth / 2).strength(0.1))
                .force('y', d3.forceY(newHeight / 2).strength(0.1))
                .alpha(0.3)
                .restart();
    };

    window.addEventListener('resize', handleResize);

    // Function to highlight nodes and links based on search
    const updateHighlight = () => {
      if (!searchTerm) {
        // Reset all
        node.selectAll('circle')
          .style('fill', d => {
            if (d.leadership) {
              return colorScale(parseInt(d.leadership));
            }
            return '#1b4332';
          })
          .attr('r', 8);
        node.selectAll('text').style('font-weight', 'normal');
        link.style('stroke', '#999').style('stroke-opacity', 0.6);
        return;
      }

      const searchRegex = new RegExp(searchTerm, 'i');
      // Only search through nodes that are visible at current date
      const matchingNodes = nodes.filter(n => {
        const nodeData = filteredData.find(d => 
          d.organizer === n.id || d.organizee === n.id
        );
        return nodeData && searchRegex.test(n.id);
      });
      const matchingNodeIds = new Set(matchingNodes.map(n => n.id));

      // Dim all elements
      node.selectAll('circle')
        .style('fill', d => {
          if (d.leadership) {
            return d3.color(colorScale(parseInt(d.leadership))).darker(1);
          }
          return d3.color('#1b4332').darker(1);
        })
        .attr('r', 8);
      node.selectAll('text').style('font-weight', 'normal');
      link.style('stroke', '#ddd').style('stroke-opacity', 0.2);

      // Highlight matching nodes and their connections
      matchingNodes.forEach(n => {
        d3.select(`.node-${n.id.replace(/\s+/g, '-')}`)
          .style('fill', d => {
            if (d.leadership) {
              return colorScale(parseInt(d.leadership));
            }
            return '#1b4332';
          })
          .attr('r', 12);
        d3.select(`.label-${n.id.replace(/\s+/g, '-')}`)
          .style('font-weight', 'bold');
      });

      // Highlight connected links
      link.style('stroke', l => {
        if (matchingNodeIds.has(l.source.id) || matchingNodeIds.has(l.target.id)) {
          return '#ff7f0e';
        }
        return '#ddd';
      }).style('stroke-opacity', l => {
        if (matchingNodeIds.has(l.source.id) || matchingNodeIds.has(l.target.id)) {
          return 0.8;
        }
        return 0.2;
      });
    };

    // Watch for search term changes or date changes
    if (searchTerm || currentDate) {
      updateHighlight();
    }

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      simulation.stop();
    };

  }, [data, searchTerm, currentDate]);

  const handleSliderChange = (event, newValue) => {
    setCurrentDate(new Date(newValue));
  };

  return (
    <div ref={containerRef} style={{ 
      width: '100%', 
      height: '100%',
      position: 'relative'
    }}>
      <svg 
        ref={svgRef} 
        style={{ 
          width: '100%', 
          height: '100%'
        }}
      ></svg>
      {dateRange[0] && dateRange[1] && (
        <Box sx={{ 
          position: 'absolute', 
          top: 0, 
          right: 0,
          width: '300px',
          padding: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          borderRadius: '0 0 0 8px'
        }}>
          <Typography variant="caption" display="block" gutterBottom>
            {dayjs(currentDate).format('MM/DD/YYYY')}
          </Typography>
          <Slider
            value={currentDate?.getTime()}
            min={dateRange[0].getTime()}
            max={dateRange[1].getTime()}
            onChange={handleSliderChange}
            valueLabelDisplay="auto"
            valueLabelFormat={(value) => dayjs(value).format('MM/DD/YYYY')}
          />
        </Box>
      )}
    </div>
  );
}

export default ForceGraph; 