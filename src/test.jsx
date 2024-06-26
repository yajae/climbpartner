import React, { useState, useEffect } from 'react';
import Chart from 'chart.js/auto';

const App = () => {
  const [city, setCity] = useState('臺北市');
  const [temperatureData, setTemperatureData] = useState([]);
  const [rainfallData, setRainfallData] = useState([]);
  const [uvIndexData, setUvIndexData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiKey = 'CWA-470BABA2-7EE9-45E7-9E55-C5FF8DEE1DB2'; // 替換為你的API金鑰
  const cities = ['臺北市', '高雄市', '台中市']; // 可以添加更多城市

  const fetchData = async () => {
    setLoading(true);
    try {
      const tempRainUrl = `https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0001-001?Authorization=${apiKey}&locationName=${city}`;
      const uvIndexUrl = `https://opendata.cwb.gov.tw/api/v1/rest/datastore/O-A0005-001?Authorization=${apiKey}&locationName=${city}`;

      const [tempRainResponse, uvIndexResponse] = await Promise.all([fetch(tempRainUrl), fetch(uvIndexUrl)]);

      if (!tempRainResponse.ok || !uvIndexResponse.ok) {
        throw new Error('Network response was not ok');
      }

      const tempRainResult = await tempRainResponse.json();
      const uvIndexResult = await uvIndexResponse.json();

      const temperatureRecords = tempRainResult.records.location;
      const uvIndexRecords = uvIndexResult.records.location;

      setTemperatureData(temperatureRecords);
      setRainfallData(temperatureRecords);
      setUvIndexData(uvIndexRecords);
      setLoading(false);
    } catch (err) {
      setError(err);
      setLoading(false);
    }
  };

  const handleButtonClick = () => {
    fetchData();
  };

  useEffect(() => {
    if (temperatureData.length > 0) {
      const ctx = document.getElementById('temperatureChart').getContext('2d');
      new Chart(ctx, {
        type: 'line',
        data: {
          labels: temperatureData.map(item => item.time.obsTime),
          datasets: [{
            label: 'Temperature (°C)',
            data: temperatureData.map(item => parseFloat(item.weatherElement.find(el => el.elementName === 'TEMP').elementValue)),
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)',
            fill: true,
          }]
        },
        options: {
          scales: {
            x: { type: 'time', time: { unit: 'hour' } },
            y: { beginAtZero: true }
          }
        }
      });

      const ctx2 = document.getElementById('rainfallChart').getContext('2d');
      new Chart(ctx2, {
        type: 'bar',
        data: {
          labels: rainfallData.map(item => item.time.obsTime),
          datasets: [{
            label: 'Rainfall (mm)',
            data: rainfallData.map(item => parseFloat(item.weatherElement.find(el => el.elementName === 'HUMD').elementValue)),
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)',
            fill: true,
          }]
        },
        options: {
          scales: {
            x: { type: 'time', time: { unit: 'hour' } },
            y: { beginAtZero: true }
          }
        }
      });

      const ctx3 = document.getElementById('uvIndexChart').getContext('2d');
      new Chart(ctx3, {
        type: 'line',
        data: {
          labels: uvIndexData.map(item => item.time.obsTime),
          datasets: [{
            label: 'UV Index',
            data: uvIndexData.map(item => parseFloat(item.weatherElement.find(el => el.elementName === 'UVI').elementValue)),
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)',
            fill: true,
          }]
        },
        options: {
          scales: {
            x: { type: 'time', time: { unit: 'hour' } },
            y: { beginAtZero: true }
          }
        }
      });
    }
  }, [temperatureData, rainfallData, uvIndexData]);

  return (
    <div>
      <h1>Weather Data for {city}</h1>
      <div>
        <label htmlFor="city">Select City:</label>
        <select id="city" value={city} onChange={(e) => setCity(e.target.value)}>
          {cities.map((cityName, index) => (
            <option key={index} value={cityName}>{cityName}</option>
          ))}
        </select>
      </div>
      <button onClick={handleButtonClick}>Show Weather Data</button>
      {loading && <div>Loading...</div>}
      {error && <div>Error: {error.message}</div>}
      <div>
        <canvas id="temperatureChart" width="400" height="200"></canvas>
        <canvas id="rainfallChart" width="400" height="200"></canvas>
        <canvas id="uvIndexChart" width="400" height="200"></canvas>
      </div>
    </div>
  );
};

export default App;
