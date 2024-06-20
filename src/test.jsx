import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Chart from 'chart.js/auto';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = 'pk.eyJ1IjoieXZvbm5lMDIxOSIsImEiOiJjbHg0MmNwaHUweHluMmxxM2gxOHRxY3RmIn0.d-D92-Vj4tjgc3aQbvXfKQ';

const MapWithElevation = () => {
  const mapContainer = useRef(null);
  const chartContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [chart, setChart] = useState(null);

  useEffect(() => {
    const mapInstance = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/outdoors-v12',
      center: [121.5438, 25.19],
      zoom: 12
    });

    mapInstance.on('load', () => {
      mapInstance.addSource('mapbox-dem', {
        type: 'raster-dem',
        url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
        tileSize: 512,
        maxzoom: 20
      });
      mapInstance.setTerrain({ source: 'mapbox-dem', exaggeration: 1 });

      // 加載舊座標點並生成海拔高度變化圖表
      loadCoordinatesAndGenerateProfile(mapInstance);
    });

    setMap(mapInstance);

    return () => {
      mapInstance.remove();
    };
  }, []);

  const loadCoordinatesAndGenerateProfile = async (mapInstance) => {
    const coordinates = [
      [121.5438, 25.19],
      [121.5500, 25.20],
      [121.5600, 25.21]
    ];

    coordinates.forEach(coord => {
      new mapboxgl.Marker().setLngLat(coord).addTo(mapInstance);
    });

    const elevations = await Promise.all(coordinates.map(coord => mapInstance.queryTerrainElevation(coord)));
    generateElevationProfile(coordinates, elevations);
  };

  const generateElevationProfile = (coordinates, elevations) => {
    if (chart) {
      chart.destroy();
    }

    const ctx = chartContainer.current.getContext('2d');
    const newChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: coordinates.map((coord, index) => `Point ${index + 1}`),
        datasets: [{
          label: 'Elevation (m)',
          data: elevations,
          fill: false,
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
          x: { grid: { display: false } },
          y: { min: 0, grid: { display: false } }
        },
        elements: { point: { radius: 0 } },
        layout: { padding: { top: 6, right: 20, bottom: -10, left: 20 } }
      }
    });

    setChart(newChart);
  };

  return (
    <div>
      <div ref={mapContainer} style={{ width: '100%', height: '400px' }}></div>
      <div style={{ width: '100%', height: '400px' }}>
        <canvas ref={chartContainer} id="chart-canvas"></canvas>
      </div>
    </div>
  );
};

export default MapWithElevation;
