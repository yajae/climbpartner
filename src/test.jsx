import React, { useState } from 'react';
import 'mapbox-gl/dist/mapbox-gl.css';
import './test.css';
import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = 'pk.eyJ1IjoieXZvbm5lMDIxOSIsImEiOiJjbHg0MmNwaHUweHluMmxxM2gxOHRxY3RmIn0.d-D92-Vj4tjgc3aQbvXfKQ';

const Test = () => {
    const [days, setDays] = useState([
        {
          date: '2024-06-30',
          time: '08:00',
          coordinates: [0, 0] // Default coordinates, you can update this
        }
      ]);
    
      const addNextDay = () => {
        setDays([
          ...days,
          {
            date: new Date().toISOString().split('T')[0],
            time: '08:00',
            coordinates: [0, 0] // Default coordinates for new day
          }
        ]);
      };
    
      const updateTime = (index, time) => {
        const newDays = [...days];
        newDays[index].time = time;
        setDays(newDays);
      };
    
      const updateDate = (index, date) => {
        const newDays = [...days];
        newDays[index].date = date;
        setDays(newDays);
      };
    
      const updateCoordinates = (index, coordinates) => {
        const newDays = [...days];
        newDays[index].coordinates = coordinates;
        setDays(newDays);
      };
    
      return (
        <div className="schedule">
          {days.map((day, index) => (
            <div key={index} className="day-container">
              <div className="day-info">
                <div className="day-header">
                  <div className="line"></div>
                  <span className="day-number">第 {index + 1} 天</span>
                  <div className="line"></div>
                  <input
                    type="date"
                    className="date-input"
                    value={day.date}
                    onChange={(e) => updateDate(index, e.target.value)}
                  />
                  <input
                    type="time"
                    className="time-input"
                    value={day.time}
                    onChange={(e) => updateTime(index, e.target.value)}
                  />
                </div>
                <div className="event">
                  <div className="time-container">
                    <div className="time">{day.time}</div>
                  </div>
                  <input type="radio" name="event" />
                  <div className="event-details">
                    <span className="event-number">1</span>
                    <span className="event-name">地點名稱目前只對 Pr...</span>
                  </div>
                  {index === days.length - 1 && (
                    <button className="add-day" onClick={addNextDay}>
                      新增下一天
                    </button>
                  )}
                </div>
              </div>
              <div className="map-container">
                <MapboxMap
                  coordinates={day.coordinates}
                  setCoordinates={(coords) => updateCoordinates(index, coords)}
                />
              </div>
            </div>
          ))}
        </div>
      );
    };
    
    const MapboxMap = ({ coordinates, setCoordinates }) => {
      const mapContainerRef = React.useRef(null);
    
      React.useEffect(() => {
        const map = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: 'mapbox://styles/mapbox/streets-v11',
          center: coordinates,
          zoom: 12
        });
    
        const marker = new mapboxgl.Marker({
          draggable: true
        })
          .setLngLat(coordinates)
          .addTo(map);
    
        marker.on('dragend', () => {
          const lngLat = marker.getLngLat();
          setCoordinates([lngLat.lng, lngLat.lat]);
        });
    
        return () => map.remove();
      }, [coordinates, setCoordinates]);
    
      return <div className="map" ref={mapContainerRef}></div>;
    };

export default Test;
