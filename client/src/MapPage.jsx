import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import Chart from 'chart.js/auto';
import * as turf from '@turf/turf';
import io from 'socket.io-client';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapPage.css';
import { useLocation, useNavigate } from 'react-router-dom';
import ChatWidget from './ChatWidget';
import Tabs from './Tabs';
import MapChart from './MapChart';
import deleteIcon from './assets/delete.png';

mapboxgl.accessToken = 'pk.eyJ1IjoieXZvbm5lMDIxOSIsImEiOiJjbHg0MmNwaHUweHluMmxxM2gxOHRxY3RmIn0.d-D92-Vj4tjgc3aQbvXfKQ';

const MapPage = () => {
  const mapContainer = useRef(null);
  const chartContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [chart, setChart] = useState(null);
  const socketRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const routeId = queryParams.get('routeId') ;
  const userId = localStorage.getItem('userId');
  const room = `${routeId}`;
  const [activeTab, setActiveTab] = useState(0);
  const tabs = [
    { label: '路線規劃' },
    { label: '聊天室' },
    { label: '即時天氣預測' }
  ];
  const [isChartVisible, setIsChartVisible] = useState(false);
  const [dayCount, setDayCount] = useState(1);
  const [schedule, setSchedule] = useState([ 
    {
      dayNumber: 1,
      date: '',
      time: '',
      events: [{ time: '提示', name: '目前尚未設定行程，請點擊地圖新增行程' }]
    }
  ]);
  let markerCounter = 1;
  const [currentTime, setCurrentTime] = useState('');
  const [selectedEvent, setSelectedEvent] = useState({ dayIndex: 0, eventIndex: 0 });
  const [routeName, setRouteName] = useState('請輸入路線名稱');
  const [startDate, setStartDate] = useState('');
  
  useEffect(() => {
 
    const checkPermission = async (userId) => {
      if(!routeId){
        console.log('no routeId')
        return
      }
      try {
        const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/route/check-permission/${userId}/${routeId}`, {
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
    checkPermission(userId);
  }, [navigate, routeId, userId]);

  useEffect(() => {

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
            maxzoom: 11
          });
          mapInstance.setTerrain({ source: 'mapbox-dem', exaggeration: 1 });

          mapInstance.on('sourcedata', async (e) => {
            if (e.sourceId === 'mapbox-dem' && e.isSourceLoaded) {
              await new Promise(resolve => setTimeout(resolve, 1000)); 
              setMap(mapInstance);
              mapInstance.on('click', handleClick);
            }
          });
        });
        mapInstance.on('load', () => {
            mapInstance.resize();
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
                  <p>經緯度: ${e.lngLat.lng},${e.lngLat.lat}</p>
                  <p>地名: ${data.features[0].place_name}</p>
                  <button id="add-button" className="add-button">新增</button>
                </div>`
              )
              .addTo(mapInstance);

            popup.getElement().querySelector('#add-button').addEventListener('click', () => {
              const markerData = { lng: e.lngLat.lng, lat: e.lngLat.lat, day: 1 };
              var el = document.createElement('div');
              el.className = 'marker';
         
              var number = document.createElement('span');
              number.className = 'marker-number';
              number.textContent = markerCounter++; 
      

              el.appendChild(number);

              const marker = new mapboxgl.Marker({   
                element: el,
                draggable: true})
                .setLngLat([e.lngLat.lng, e.lngLat.lat])
                .addTo(mapInstance);
              setMarkers((prevMarkers) => {

                const newMarkers = [...prevMarkers, marker];
                updatePath(newMarkers);
                return newMarkers;
              });

              popup.remove();
              setSchedule((prevSchedule) => {
                console.log('prev',prevSchedule)
                if(prevSchedule[0].time===''){
                  const newSchedule=[{dayNumber: 1, date: '2024-07-01', time: '9:00', events: [{time: '9:00', name: data.features[0].place_name}]}]
                  return newSchedule;
                }
               const newSchedule=[...prevSchedule,{dayNumber: 1, date: '2024-07-01', time: '9:00', events: [{time: '9:00', name: data.features[0].place_name}]}]
                return newSchedule;
              });
      
              socketRef.current.emit('new-marker', { 
                room,
                userId, 
                routeId,
                lngLat: markerData,
                placeName: data.features[0].place_name,
                day:1,
                time:'9:00',
                routeName,
                startDate
            });
            });
            console.log('new-marker emitted',markers)
          } catch (error) {
            console.error('Error fetching geocoding data:', error);
          }
        };

        return () => {
          mapInstance.off('click', handleClick);
        };
      };

      initializeMap();
    
  }, []);

  useEffect(() => {
    if (map && markers.length > 0) {
      updatePath();
    }
  }, [map, markers]);

  useEffect(() => {
    console.log('map',map)
    if (map) {
      fetchInitialMarkers(userId);
      socketRef.current = io(`${import.meta.env.VITE_SERVER_URL}`, {
        withCredentials: true,
      });
      socketRef.current.emit('join-room', room);
      socketRef.current.on('new-marker', (newMarker) => {
        console.log('create a new marker')

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

      socketRef.current.on("connect_error", (err) => {

        console.log('socker err message',err.message);
      

        console.log('socker err description',err.description);
      
        
        console.log('socker err context',err.context);
      });

      return () => {
        socketRef.current.disconnect();
      };
    }
  }, [map]);

  const fetchInitialMarkers = async (userId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SERVER_URL}/route/markers/latest/${userId}/${routeId}`, {
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
        console.log('late',latestMarkers)
        if(latestMarkers.routeName){
          setRouteName(latestMarkers.routeName);
        }
        const newMarkers = latestMarkers.markers.day1.map((marker) => {
          const marker1 = new mapboxgl.Marker()
            .setLngLat([marker.lng, marker.lat])
            .addTo(map);
         
          return marker1;
        });
        setMarkers((prevMarkers) => {
          const updatedMarkers = [...prevMarkers, ...newMarkers];
          return updatedMarkers;
        });
        updatePath();
    
        const newSchedule = latestMarkers.markers.day1.map((marker, index) => ({
          dayNumber:   1,
          date: marker.date || new Date().toISOString().split('T')[0],
          time:  marker.time,
          events: [{ time: marker.time, name: marker.placeName }],
       }));
      if(newMarkers.length!==0){
        setSchedule(newSchedule);
      }
    
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
    const estimatedTime = `${hours} 小時 ${minutes} 分`;

    const totalDistance = (distance / 1000).toFixed(2); 
    document.getElementById('walking-time').innerText = `預估行走時間: ${estimatedTime}`;
    document.getElementById('walking-distance').innerText = `總共行走距離: ${totalDistance} 公里`;
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

    document.getElementById('total-ascent').innerText = `總爬升高度: ${totalAscent.toFixed(2)} m`;
    document.getElementById('total-descent').innerText = `總下坡高度: ${totalDescent.toFixed(2)} m`;
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
    document.getElementById('1-day').appendChild(newLabel);
  };

  const handleSaveRoute = () => {
    const routeName = document.getElementById('route-name').value;
    const newRoute = {
      name: routeName,
      markers: markers.map(marker => marker.getLngLat().toArray()),
    };
    setRoutes([route, newRoute]);
    navigate('/dashboard');
  };

  const handleEventSelection = (dayIndex, eventIndex) => {
    setSelectedEvent({ dayIndex, eventIndex });
  };
  const toggleChartVisibility = () => {
    setIsChartVisible(!isChartVisible);
  };

  const updateTime = (dayIndex, eventIndex, newTime) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].events[eventIndex].time = newTime;
    setSchedule(newSchedule);
  };


  const addNextDay = () => {
    const newDayCount = dayCount + 1;
    setDayCount(newDayCount);
    const newSchedule = [
      ...schedule,
      {
        dayNumber: newDayCount,
        date: new Date().toISOString().split('T')[0],
        time: '08:00',
        events: [{ time: '08:00', name: '地點名稱目前只對 Pr...' }],
      },
    ];
    setSchedule(newSchedule);
  };

  useEffect(() => {
    console.log('Current schedule:', schedule);

  }, [schedule]);

  
  const handleDelete = (markerIndex) => {
    const marker = markers[markerIndex];
    console.log('onclick delete button')
    if (marker) {
      marker.remove();
      setMarkers((prevMarkers) => {
        const updatedMarkers = prevMarkers.filter((_, index) => index !== markerIndex);
        updatePath(updatedMarkers);
        return updatedMarkers;
      });
    
      setSchedule((prevSchedule) => {
        const newSchedule = prevSchedule.filter((_, scheduleIndex) => scheduleIndex !== markerIndex);
        return newSchedule;
      });
      
      if (socketRef.current) {
        socketRef.current.emit('delete-marker', { room, lngLat: { lng: marker.getLngLat().lng, lat: marker.getLngLat().lat } });
      }
    }
  }

  useEffect(() => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setCurrentTime(`${hours}:${minutes}`);
  }, []);

  return (
    <div className="map-page">
      <div id='tab-box'>
        <Tabs tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab} />
        <div className="tab-content">
          {activeTab === 0 && (
            <div className="schedule">
              <div className='route'>
                <div>
                  <div className='route-name' >路線名稱
                  <input 
                        id='route-name-input'
                        type="text" 
                        value={routeName}
                        className='route-input'
                        onChange={(e) => {
                          const newRouteName = e.target.value
                          console.log('newRouteName',newRouteName)
                          setRouteName(newRouteName);
                          console.log('routeName',routeName)
                        }}
                    />
                  </div>
               
                </div>
                <div>
                <div className='route-name' >日期</div>
                <input
                        type="date"
                        className="date-input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                </div>
                
              </div>
              {schedule.map((day, index) => (
              
                <div key={index}>
                  {index === 0 && (
                    <div className="day-header">
                 
                     
                        <span className="day-number">第 {day.dayNumber} 天</span>
                        <div className="line"></div>
                      <div>
                        出發時間
                        <input
                        type="time"
                        className="time-input"
                        value={currentTime}
                        onChange={(e) => updateTime(dayIndex, 0, e.target.value)}
                      />
                      </div>
                 
              
                     
                    </div>
                  )}
                  <div className="event" id='1-day'>
             
                    {/* <div className="time-container" id='1-day'>
                      <div className="time">{day.events[0].time}</div>
                    </div>
                    <input
                      type="radio"
                      className={`event${day.dayNumber}`}
                      checked={selectedEvent.dayIndex === 0 && selectedEvent.eventIndex === 0}
                      onChange={() => handleEventSelection(0, 0)}
                    /> */}
                    <div className="event-details">
                      <div className="event-container">
                        <span className="event-number">{index+1}</span>
                        <span className="event-name">{day.events[0].name}</span>
                      </div>
                      <div>
                        <button className="btn-icon" onClick={() => handleDelete(index)}> 
                          <img src={deleteIcon} alt="Delete Icon"/>
                        </button>
                      </div>
                      
                    </div>
                 
                  </div>
                  {index === schedule.length - 1 && (
                    <button className="add-day" onClick={addNextDay}>
                      新增下一天
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          {activeTab === 1 && (
            <div className='chat-widget-container'>   
              <ChatWidget room={room} />
            </div>
          )}
          {activeTab === 2 && (
            <div> 
              <MapChart />
            </div>
          )}
        </div>
      </div>
      <div id="main-info">
        <div ref={mapContainer} id="map"></div>
        <div id="chart-container" style={{ display: isChartVisible ? 'block' : 'none' }}>
          <div id='chart-space'></div>
          <canvas ref={chartContainer} id="chart-canvas"></canvas>
        </div>
        <div className='under-map-info'>
         
          <div id="walking-time"></div>
          <div id="walking-distance"></div>
          <div id="total-ascent"></div>
          <div id="total-descent"></div>
          <button id="toggle-elevation-button" onClick={toggleChartVisibility} style={{ background: '#254f7c' }}>
          <img alt="Elevation Profile" width="30" height="30" className="img-elevation-profile" lazy="loaded" src="https://zh-tw.hikingbook.net/images/map/elevation-profile.png"/>
          <span>{isChartVisible ? '海拔剖面圖' : '海拔剖面圖'}</span>  
          </button>
        </div>
      </div>
    </div>
  );
  
};

export default MapPage;
