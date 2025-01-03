import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import * as d3Sankey from 'd3-sankey';

function SankeyDiagram({ data, searchTerm }) {
  const svgRef = useRef();
  const containerRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Create color scale for leadership levels
    const colorScale = d3.scaleLinear()
      .domain([1, 5])
      .range(['#a8e6cf', '#1b4332']) // Light green to dark green
      .interpolate(d3.interpolateHcl);

    // Get container dimensions
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear any existing SVG content
    d3.select(svgRef.current).selectAll("*").remove();

    // Process data for Sankey diagram
    // Group data by organizee and sort by date
    const organizeeTimeline = {};
    data.forEach(d => {
      if (!organizeeTimeline[d.organizee]) {
        organizeeTimeline[d.organizee] = [];
      }
      organizeeTimeline[d.organizee].push({
        date: new Date(d.date),
        leadership: d.leadership
      });
    });

    // Sort each organizee's timeline
    Object.values(organizeeTimeline).forEach(timeline => {
      timeline.sort((a, b) => a.date - b.date);
    });

    // Find overall date range
    let minDate = new Date(Math.min(...data.map(d => new Date(d.date))));
    let maxDate = new Date(Math.max(...data.map(d => new Date(d.date))));
    let timeRange = maxDate - minDate;

    // Create three time periods
    let period1End = new Date(minDate.getTime() + timeRange / 3);
    let period2End = new Date(minDate.getTime() + (2 * timeRange) / 3);

    // Create nodes and links for the Sankey diagram
    const nodes = [];
    const links = [];
    const timeWindows = ['Initial', 'Middle', 'Current'];
    const leadershipLevels = ['5', '4', '3', '2', '1']; // Reversed order for top-to-bottom arrangement

    // Create nodes for each time window and leadership level
    timeWindows.forEach(time => {
      leadershipLevels.forEach(level => {
        nodes.push({
          id: `${time}-${level}`,
          name: `${time} Level ${level}`,
          level: parseInt(level)
        });
      });
    });

    // Helper function to get time period
    const getTimePeriod = (date) => {
      if (date <= period1End) return 'Initial';
      if (date <= period2End) return 'Middle';
      return 'Current';
    };

    // Create links based on leadership changes across time periods
    Object.entries(organizeeTimeline).forEach(([organizee, timeline]) => {
      if (timeline.length > 0) {
        // Get leadership level for each period
        let initialLevel = null;
        let middleLevel = null;
        let currentLevel = null;

        // Find the leadership level for each period
        timeline.forEach(entry => {
          const period = getTimePeriod(entry.date);
          if (period === 'Initial' || initialLevel === null) {
            initialLevel = entry.leadership;
          }
          if (period === 'Middle') {
            middleLevel = entry.leadership;
          }
          if (period === 'Current') {
            currentLevel = entry.leadership;
          }
        });

        // If middle period is missing, use the closest known value
        if (middleLevel === null) {
          middleLevel = currentLevel !== null ? currentLevel : initialLevel;
        }

        // If current period is missing, use the last known value
        if (currentLevel === null) {
          currentLevel = middleLevel;
        }

        // Create links between periods
        if (initialLevel !== null) {
          // Initial to Middle
          const link1Id = `Initial-${initialLevel}-Middle-${middleLevel}`;
          const existingLink1 = links.find(l => 
            l.source === `Initial-${initialLevel}` && 
            l.target === `Middle-${middleLevel}`
          );
          if (existingLink1) {
            existingLink1.value += 1;
            existingLink1.organizees.push(organizee);
          } else {
            links.push({
              source: `Initial-${initialLevel}`,
              target: `Middle-${middleLevel}`,
              value: 1,
              organizees: [organizee]
            });
          }

          // Middle to Current
          const link2Id = `Middle-${middleLevel}-Current-${currentLevel}`;
          const existingLink2 = links.find(l => 
            l.source === `Middle-${middleLevel}` && 
            l.target === `Current-${currentLevel}`
          );
          if (existingLink2) {
            existingLink2.value += 1;
            existingLink2.organizees.push(organizee);
          } else {
            links.push({
              source: `Middle-${middleLevel}`,
              target: `Current-${currentLevel}`,
              value: 1,
              organizees: [organizee]
            });
          }
        }
      }
    });

    // Set up the SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const margin = { top: 20, right: 20, bottom: 20, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Convert node IDs to indices
    const nodeById = new Map(nodes.map((node, i) => [node.id, i]));
    
    // Convert links to use node indices instead of IDs
    const indexedLinks = links.map(link => ({
      source: nodeById.get(link.source),
      target: nodeById.get(link.target),
      value: link.value,
      organizees: link.organizees
    }));

    const sankey = d3Sankey.sankey()
      .nodeWidth(30)
      .nodePadding(10)
      .nodeSort((a, b) => a.level - b.level) // Sort nodes by leadership level
      .extent([[margin.left, margin.top], [innerWidth, innerHeight]]);

    const { nodes: sankeyNodes, links: sankeyLinks } = sankey({
      nodes: nodes.map(d => Object.assign({}, d)),
      links: indexedLinks
    });

    // Add nodes first
    const node = svg.append('g')
      .selectAll('rect')
      .data(sankeyNodes)
      .join('rect')
      .attr('x', d => d.x0)
      .attr('y', d => d.y0)
      .attr('height', d => Math.max(1, d.y1 - d.y0))
      .attr('width', d => d.x1 - d.x0)
      .attr('fill', d => {
        const level = parseInt(d.name.split(' ')[2]);
        return colorScale(level);
      });

    // Add labels
    svg.append('g')
      .selectAll('text')
      .data(sankeyNodes)
      .join('text')
      .attr('x', d => d.x0 < width / 2 ? d.x1 + 6 : d.x0 - 6)
      .attr('y', d => (d.y1 + d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', d => d.x0 < width / 2 ? 'start' : 'end')
      .text(d => d.name)
      .style('font-size', '12px');

    // Add links
    const link = svg.append('g')
      .selectAll('path')
      .data(sankeyLinks)
      .join('path')
      .attr('d', d3Sankey.sankeyLinkHorizontal())
      .attr('stroke-width', d => Math.max(1, d.width))
      .attr('stroke', d => {
        const sourceLevel = parseInt(nodes[d.source.index].name.split(' ')[2]);
        const targetLevel = parseInt(nodes[d.target.index].name.split(' ')[2]);
        // Use gradient between source and target colors
        const gradient = svg
          .append('linearGradient')
          .attr('id', `gradient-${d.source.index}-${d.target.index}`)
          .attr('gradientUnits', 'userSpaceOnUse')
          .attr('x1', d.source.x1)
          .attr('x2', d.target.x0);

        gradient
          .append('stop')
          .attr('offset', '0%')
          .attr('stop-color', colorScale(sourceLevel));

        gradient
          .append('stop')
          .attr('offset', '100%')
          .attr('stop-color', colorScale(targetLevel));

        return `url(#gradient-${d.source.index}-${d.target.index})`;
      })
      .attr('fill', 'none')
      .attr('opacity', 0.5)
      .attr('class', d => d.organizees.map(name => `flow-${name.replace(/\s+/g, '-')}`).join(' '))
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('opacity', 0.8)
        //   .attr('stroke-width', d => Math.max(2, d.width * 1.5));
        
        // Show tooltip with organizees
        const tooltip = svg.append('g')
          .attr('class', 'tooltip')
          .attr('transform', `translate(${event.offsetX + 10},${event.offsetY + 10})`);
        
        tooltip.append('rect')
          .attr('fill', 'white')
          .attr('stroke', '#ccc')
          .attr('rx', 4)
          .attr('ry', 4)
          .attr('opacity', 0.9);
        
        const text = tooltip.append('text')
          .attr('dy', '1em')
          .style('font-size', '12px');
        
        const sourceName = nodes[d.source.index].name;
        const targetName = nodes[d.target.index].name;
        
        text.append('tspan')
          .attr('x', 5)
          .text(`${d.organizees.length} organizee(s) moved from Level ${sourceName.split(' ')[2]} to Level ${targetName.split(' ')[2]}`);
        
        d.organizees.forEach((organizee, i) => {
          text.append('tspan')
            .attr('x', 5)
            .attr('dy', '1.2em')
            .text(organizee);
        });
        
        const bbox = tooltip.node().getBBox();
        tooltip.select('rect')
          .attr('width', bbox.width + 10)
          .attr('height', bbox.height + 5);

        // Ensure tooltip stays within SVG bounds
        const tooltipBBox = tooltip.node().getBBox();
        const currentTransform = d3.select(this).attr('transform');
        let tooltipX = event.offsetX + 10;
        let tooltipY = event.offsetY + 10;

        if (tooltipX + tooltipBBox.width > width) {
          tooltipX = event.offsetX - tooltipBBox.width - 10;
        }
        if (tooltipY + tooltipBBox.height > height) {
          tooltipY = event.offsetY - tooltipBBox.height - 10;
        }

        tooltip.attr('transform', `translate(${tooltipX},${tooltipY})`);
      })
      .on('mousemove', function(event) {
        const tooltip = svg.select('.tooltip');
        if (!tooltip.empty()) {
          const tooltipBBox = tooltip.node().getBBox();
          let tooltipX = event.offsetX + 10;
          let tooltipY = event.offsetY + 10;

          if (tooltipX + tooltipBBox.width > width) {
            tooltipX = event.offsetX - tooltipBBox.width - 10;
          }
          if (tooltipY + tooltipBBox.height > height) {
            tooltipY = event.offsetY - tooltipBBox.height - 10;
          }

          tooltip.attr('transform', `translate(${tooltipX},${tooltipY})`);
        }
      })
      .on('mouseout', function() {
        // Only reset if not currently searched
        if (!searchTerm) {
          d3.select(this)
            .attr('opacity', 0.5)
            .attr('stroke-width', d => Math.max(1, d.width));
        }
        svg.selectAll('.tooltip').remove();
      });

    // Function to highlight flows based on search
    const updateHighlight = () => {
      if (!searchTerm) {
        // Reset all
        link
          .attr('opacity', 0.5)
          .attr('stroke-width', d => Math.max(1, d.width));
        node.style('opacity', 1);
        return;
      }

      const searchRegex = new RegExp(searchTerm, 'i');
      
      // Dim all elements
      link
        .attr('opacity', 0.1)
        .attr('stroke-width', d => Math.max(1, d.width));
      node.style('opacity', 0.3);

      // Highlight matching flows
      link.each(function(d) {
        const element = d3.select(this);
        const hasMatch = d.organizees.some(name => searchRegex.test(name));
        if (hasMatch) {
          element
            .attr('opacity', 0.8)
            // .attr('stroke-width', d => Math.max(1, d.width * 1.5));
          
          // Highlight connected nodes
          const sourceNode = nodes[d.source.index];
          const targetNode = nodes[d.target.index];
          node.filter(n => n.id === sourceNode.id || n.id === targetNode.id)
            .style('opacity', 1);
        }
      });
    };

    // Watch for search term changes
    if (searchTerm) {
      updateHighlight();
    }

    // Handle window resize
    const handleResize = () => {
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      
      svg.attr('width', newWidth)
         .attr('height', newHeight);
      
      // Re-render the entire diagram with new dimensions
      d3.select(svgRef.current).selectAll("*").remove();
      // Note: The entire visualization will be redrawn on the next render
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };

  }, [data, searchTerm]); // Add data to dependencies

  return (
    <div ref={containerRef} style={{ 
      width: '100%', 
      height: '100%',
      position: 'absolute',
      top: 0,
      left: 0
    }}>
      <svg 
        ref={svgRef} 
        style={{ 
          width: '100%', 
          height: '100%'
        }}
      ></svg>
    </div>
  );
}

export default SankeyDiagram; 