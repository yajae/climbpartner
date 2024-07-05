import React, { useRef, useEffect, useState } from 'react';
import Chart from 'chart.js/auto';
import * as turf from '@turf/turf';

const ElevationProfile = ({ isChartVisible }) => {
  const chartContainer = useRef(null);
  const [chart, setChart] = useState(null);

  useEffect(() => {
    if (chartContainer.current) {
      Object.keys(Chart.instances).forEach(key => {
        Chart.instances[key].destroy();
      });

      const newChart = new Chart(chartContainer.current, {
        type: 'line',
        data: {
          labels: [],
          datasets: [{
            data: [],
            fill: true, 
            backgroundColor: 'rgba(55, 162, 235, 0.3)',
            borderColor: '#37a2eb',
            tension: 0.4
          }]
        },
        options: {
          plugins: {
            legend: { display: false },
            title: { display: true, align: 'start', text: 'Elevation (m)' }
          },
          maintainAspectRatio: false,
          responsive: true,
          scales: {
            x: {
              grid: { display: true, color: '#e0e0e0' },
            },
            y: {
              min: 0,
              grid: { display: true, color: '#e0e0e0' }, 
            }
          },
          elements: { point: { radius: 0 } },
          layout: { padding: { top: 6, right: 20, bottom: -10, left: 20 } }
        }
      });

      setChart(newChart);
    }
  }, []);

  return (
    <div id="chart-container" style={{ display: isChartVisible ? 'block' : 'none' }}>
      <div id='chart-space'></div>
      <canvas ref={chartContainer} id="chart-canvas"></canvas>
    </div>
  );
};

export default ElevationProfile;
