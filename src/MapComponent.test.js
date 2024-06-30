import React from 'react';
import { render, screen } from '@testing-library/react';
import MapComponent from './MapComponent';

test('should render map container', () => {
  render(<MapComponent isAuthenticated={true} userId="1" routeId="1" room="1" />);

  // 檢查地圖容器是否存在
  const mapContainer = screen.getByTestId('map');
  expect(mapContainer).toBeInTheDocument();
});
