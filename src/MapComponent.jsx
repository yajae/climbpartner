import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import * as turf from '@turf/turf';
import io from 'socket.io-client';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapPage.css';
import { useNavigate } from 'react-router-dom';

mapboxgl.accessToken = 'pk.eyJ1IjoieXZvbm5lMDIxOSIsImEiOiJjbHg0MmNwaHUweHluMmxxM2gxOHRxY3RmIn0.d-D92-Vj4tjgc3aQbvXfKQ';

const MapComponent = ({ isAuthenticated, setAuthenticated, userId, routeId, room }) => {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const socketRef = useRef(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    const checkPermission = async () => {
      try {
        const response = await fetch(`http://localhost:3000/check-permission/${userId}/${routeId}`, {
          method: 'GET',
          credentials: 'include'
        });
        const data = await response.json();
        if (data.hasPermission === false) {
          navigate('/auth');
        }
      } catch (error) {
        console.error('Error checking permission:', error);
      }
    };
    checkPermission();
  }, [setAuthenticated, navigate, routeId, userId]);

  useEffect(() => {
    if (isAuthenticated) {
      const initializeMap = async () => {
        const mapInstance = new mapboxgl.Map({
          container: mapContainer.current,
          style: 'mapbox://styles/mapbox/outdoors-v12',
          center: [121.5438, 25.19],
          zoom: 12
        });

        mapInstance.on('style.load', () => {
          mapInstance.addSource('mapbox-dem', {
            type: 'raster-dem',
            url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
            tileSize: 512,
            maxzoom: 20
          });
          mapInstance.setTerrain({ source: 'mapbox-dem', exaggeration: 1 });

          mapInstance.on('sourcedata', async (e) => {
            if (e.sourceId === 'mapbox-dem' && e.isSourceLoaded) {
              await new Promise(resolve => setTimeout(resolve, 700)); 
              setMap(mapInstance);
              mapInstance.on('click', handleClick);
            }
          });
        });

        const handleClick = async (e) => {
          try {
            const response = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${e.lngLat.lng},${e.lngLat.lat}.json?access_token=${mapboxgl.accessToken}&language=zh`
            );
            if (!response.ok) {
              throw new Error('Network response was not ok');
            }
            const data = await response.json();
            const popup = new mapboxgl.Popup({ offset: [0, -15], anchor: 'bottom' })
              .setLngLat(e.lngLat)
              .setHTML(
                `<div>
                  <p>placeName: ${data.features[0].place_name}</p>
                  <button id="add-button" class="add-button">新增</button>
                </div>`
              )
              .addTo(mapInstance);

            popup.getElement().querySelector('#add-button').addEventListener('click', () => {
              const markerData = { lng: e.lngLat.lng, lat: e.lngLat.lat, day: 1 };
              const marker = new mapboxgl.Marker(<div className = 'marker'>113</div>)
                .setLngLat([e.lngLat.lng, e.lngLat.lat])
                .addTo(mapInstance);
              setMarkers((prevMarkers) => {
                const newMarkers = [...prevMarkers, marker];
                updatePath(newMarkers);
                return newMarkers;
              });
              popup.remove();
              createNewLabel(marker, data.features[0].place_name);
              socketRef.current.emit('new-marker', { room, userId, routeId: 1, lngLat: markerData });
            });
          } catch (error) {
            console.error('Error fetching geocoding data:', error);
          }
        };

        return () => {
          mapInstance.off('click', handleClick);
        };
      };

      initializeMap();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (map && markers.length > 0) {
      updatePath();
    }
  }, [map, markers]);

  useEffect(() => {
    if (map && isAuthenticated) {
      fetchInitialMarkers(userId);
      socketRef.current = io('http://localhost:3000', {
        withCredentials: true,
      });
      socketRef.current.emit('join-room', room);

      socketRef.current.on('new-marker', (newMarker) => {
        const marker = new mapboxgl.Marker()
          .setLngLat([newMarker.lngLat.lng, newMarker.lngLat.lat])
          .addTo(map);
        setMarkers((prevMarkers) => {
          const newMarkers = [...prevMarkers, marker];
          updatePath(newMarkers);
          return newMarkers;
        });
      });

      socketRef.current.on('delete-marker', (lngLat) => {
        setMarkers((prevMarkers) => {
          const updatedMarkers = prevMarkers.filter((marker) => {
            const markerLngLat = marker.getLngLat();
            if (markerLngLat.lng === lngLat.lng && markerLngLat.lat === lngLat.lat) {
              marker.remove();
              return false;
            }
            return true;
          });
          updatePath(updatedMarkers);
          return updatedMarkers;
        });
      });

      socketRef.current.on('connect_error', (err) => {
        console.error('Connection error:', err);
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [map, isAuthenticated]);

  const fetchInitialMarkers = async (userId) => {
    try {
      const response = await fetch(`http://localhost:3000/markers/latest/${userId}/${routeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch markers');
      }
      const latestMarkers = await response.json();
      if (map) {
        const newMarkers = latestMarkers.map((marker) => {
          const marker1 = new mapboxgl.Marker()
            .setLngLat([marker.lng, marker.lat])
            .addTo(map);
          createNewLabel(marker1, '已存在的标记');
          return marker1;
        });
        setMarkers((prevMarkers) => {
          const updatedMarkers = [...prevMarkers, ...newMarkers];
          return updatedMarkers;
        });
        updatePath();
      } else {
        console.log('No markers to load or map is not ready');
      }
    } catch (error) {
      console.error('Error fetching initial markers:', error);
    }
  };

  const updatePath = async (currentMarkers = markers) => {
    if (!map) {
      console.log('Map is not ready');
      return;
    }

    const points = currentMarkers.map((marker) => marker.getLngLat().toArray());
    const waypoints = points.map((point) => point.join(',')).join(';');

    if (currentMarkers.length <= 1) {
      if (map.getLayer('line-line-data')) {
        map.removeLayer('line-line-data');
      }
      updateElevationProfile([[0, 0], [0, 0]]);
      if (map.getSource('line-data')) {
        map.removeSource('line-data');
      }
      return;
    }

    try {
      const query = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/walking/${waypoints}?geometries=geojson&access_token=${mapboxgl.accessToken}`
      );
      const json = await query.json();

      if (json.routes && json.routes.length > 0) {
        const data = json.routes[0];
        const pathData = {
          type: 'Feature',
          geometry: data.geometry,
          properties: {}
        };

        if (map.getSource('line-data')) {
          map.getSource('line-data').setData(pathData);
        } else {
          map.addSource('line-data', {
            type: 'geojson',
            data: pathData
          });

          map.addLayer({
            id: 'line-line-data',
            type: 'line',
            source: 'line-data',
            paint: {
              'line-width': 4,
              'line-color': '#37a2eb'
            }
          });
        }

        updateElevationProfile(pathData.geometry.coordinates);
        displayEstimatedTimeAndDistance(data.duration, data.distance);
      }
    } catch (error) {
      console.error('Error fetching the walking route:', error);
      alert('Failed to retrieve walking route.');
    }
  };

  const displayEstimatedTimeAndDistance = (duration, distance) => {
    const totalMinutes = Math.round(duration / 60);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const estimatedTime = `${hours} 小时 ${minutes} 分钟`;

    const totalDistance = (distance / 1000).toFixed(2); // distance in kilometers

    document.getElementById('walking-time').innerText = `Estimated walking time: ${estimatedTime}`;
    document.getElementById('walking-distance').innerText = `Total distance: ${totalDistance} km`;
  };

  const updateElevationProfile = async (coordinates) => {
    if (!chartContainer.current) {
      return;
    }
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

    if (coordinates.length > 2) {
      const chunks = turf.lineChunk({ type: 'LineString', coordinates }, 1).features;
      const elevations = [
        ...chunks.map((feature) => {
          const elevation = map.queryTerrainElevation(feature.geometry.coordinates[0]);
          return elevation;
        }),
        map.queryTerrainElevation(chunks[chunks.length - 1].geometry.coordinates[1])
      ];

      newChart.data.labels = elevations.map(() => '');
      newChart.data.datasets[0].data = elevations;
      newChart.update();

      calculateElevationGains(elevations);

    } else {
      newChart.data.labels = [];
      newChart.data.datasets[0].data = [];
      newChart.update();
    }
  };

  const calculateElevationGains = (elevations) => {
    let totalAscent = 0;
    let totalDescent = 0;

    for (let i = 1; i < elevations.length; i++) {
      const elevationChange = elevations[i] - elevations[i - 1];
      if (elevationChange > 0) {
        totalAscent += elevationChange;
      } else {
        totalDescent += Math.abs(elevationChange);
      }
    }

    document.getElementById('total-ascent').innerText = `Total Ascent: ${totalAscent.toFixed(2)} m`;
    document.getElementById('total-descent').innerText = `Total Descent: ${totalDescent.toFixed(2)} m`;
  };

  const createNewLabel = (marker, placeName) => {
    const infoElementId = `marker${markers.length}-info`;

    const newLabel = document.createElement('div');
    newLabel.id = infoElementId;
    newLabel.innerHTML = `Coordinates: ${marker.getLngLat().lng.toFixed(5)}, ${marker.getLngLat().lat.toFixed(5)}<br>Place Name: ${placeName}`;
    const deleteButton = document.createElement('button');
    deleteButton.innerText = '刪除';
    deleteButton.onclick = () => {
      marker.remove();
      setMarkers((prevMarkers) => {
        const updatedMarkers = prevMarkers.filter((m) => m !== marker);
        updatePath(updatedMarkers);
        return updatedMarkers;
      });
      newLabel.innerHTML = '';
      if (socketRef.current) {
        socketRef.current.emit('delete-marker', { room, lngLat: { lng: marker.getLngLat().lng, lat: marker.getLngLat().lat } });
      }
    };

    newLabel.appendChild(deleteButton);
    document.getElementById('day-1').appendChild(newLabel);
  };

  return (
    <div ref={mapContainer} id="map"></div>
  );
};

export default MapComponent;
