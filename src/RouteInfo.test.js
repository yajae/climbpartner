import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import RouteInfo from './RouteInfo';

test('should display route name and start date input', () => {
  render(<RouteInfo />);

  // 檢查路線名稱輸入框是否存在
  const routeNameInput = screen.getByPlaceholderText('輸入路線名稱');
  expect(routeNameInput).toBeInTheDocument();

  // 檢查開始日期輸入框是否存在
  const startDateInput = screen.getByLabelText('開始日期');
  expect(startDateInput).toBeInTheDocument();
});

test('should handle save route button click', () => {
  const handleSaveRoute = jest.fn();
  render(<RouteInfo handleSaveRoute={handleSaveRoute} />);

  // 檢查保存路線按鈕是否存在
  const saveButton = screen.getByText('保存路線');
  expect(saveButton).toBeInTheDocument();

  // 模擬按鈕點擊事件
  fireEvent.click(saveButton);

  // 檢查 handleSaveRoute 函數是否被調用
  expect(handleSaveRoute).toHaveBeenCalled();
});
