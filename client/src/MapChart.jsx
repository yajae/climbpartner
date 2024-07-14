import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';


const extractData = (data, locationName, elementName) => {
  const location = data.location.find(loc => loc.locationName === locationName);
  if (!location) return [];
  const element = location.weatherElement.find(el => el.elementName === elementName);
  if (!element) return [];
  return element.time.map(t => ({
    time: t.startTime,
    value: t.parameter.parameterName
  }));
};

const MapChart = () => {
  const [data, setData] = useState(null);
  const [locationName, setLocationName] = useState("新北市");
  const [chartData, setChartData] = useState({});

  useEffect(() => {
    fetch(`${import.meta.env.VITE_SERVER_URL}/route/weather`)
      .then(response => response.json())
      .then(data => {
        setData(data.records);
        updateChartData(data.records, locationName);
      })
      .catch(error => console.error('Error fetching data:', error));
  }, []);

  useEffect(() => {
    if (data) {
      updateChartData(data, locationName);
    }
  }, [locationName]);

  const updateChartData = (data, locationName) => {
    const popData = extractData(data, locationName, "PoP");
    const maxTData = extractData(data, locationName, "MaxT");
    const minTData = extractData(data, locationName, "MinT");

    const newChartData = {
      labels: popData.map(d => d.time),
      datasets: [
        {
          type: 'bar',
          label: '降雨機率 (%)',
          data: popData.map(d => d.value),
          borderColor: 'blue',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          yAxisID: 'y1'
        },
        {
          type: 'line',
          label: '最高溫 (°C)',
          data: maxTData.map(d => d.value),
          borderColor: 'red',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          yAxisID: 'y2'
        },
        {
          type: 'line',
          label: '最低溫 (°C)',
          data: minTData.map(d => d.value),
          borderColor: 'green',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          yAxisID: 'y2'
        }
      ]
    };

    setChartData(newChartData);
  };

  const handleLocationChange = (event) => {
    setLocationName(event.target.value);
  };

  const formatDate = (dateString) => {
    const options = { month: 'short', day: 'numeric' };
    const date = new Date(dateString).toLocaleDateString('zh-TW', options);
    const time = new Date(dateString).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', hour12: false });
    return `${date}\n${time}`;
  };
  return (
    <div>
      <h2>{locationName}的36小時天氣預報</h2>
      <select onChange={handleLocationChange} value={locationName}>
        {data && data.location.map(loc => (
          <option key={loc.locationName} value={loc.locationName}>
            {loc.locationName}
          </option>
        ))}
      </select>
      {chartData.labels && (
        <Line 
          data={chartData} 
          options={{
            scales: {
              x: {
                ticks: {
                  callback: function(value, index, values) {
                    return formatDate(chartData.labels[index]);
                  }
                }
              },
              y1: {
                type: 'linear',
                position: 'left',
                max: 100, 
                ticks: {
                  callback: function(value) {
                    return value + '%';
                  }
                }
              },
              y2: {
                type: 'linear',
                position: 'right',
                ticks: {
                  callback: function(value) {
                    return value + '°C';
                  }
                }
              }
            }
          }} 
        />
      )}
    </div>
  );
};

export default MapChart;
