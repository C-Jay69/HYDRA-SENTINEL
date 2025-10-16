
import ApiService from '../services/ApiService';
import fetchMock from 'jest-fetch-mock';

fetchMock.enableMocks();

describe('ApiService', () => {
  beforeEach(() => {
    fetch.resetMocks();
    // Mock the Date object to have a consistent timestamp
    const DATE_TO_USE = new Date('2025-10-16T15:55:53.630Z');
    const _Date = Date;
    global.Date = jest.fn(() => DATE_TO_USE);
    global.Date.toISOString = jest.fn(() => DATE_TO_USE.toISOString());
  });

  it('should register a device', async () => {
    const mockResponse = { child_id: '123' }; // Corrected mock response
    fetch.mockResponseOnce(JSON.stringify(mockResponse));

    const deviceInfo = {
      deviceId: 'test-device-id',
      deviceName: 'Test Device',
      brand: 'TestBrand',
      model: 'TestModel',
      systemVersion: '12.0',
      appVersion: '1.0.0',
    };

    const result = await ApiService.registerDevice(deviceInfo);

    expect(fetch).toHaveBeenCalledWith('https://guardianapp-9.preview.emergentagent.com/api/monitoring/devices/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Device-ID': undefined,
      },
      body: JSON.stringify({
        device_id: 'test-device-id',
        device_name: 'Test Device',
        brand: 'TestBrand',
        model: 'TestModel',
        system_version: '12.0',
        app_version: '1.0.0',
        registration_timestamp: '2025-10-16T15:55:53.630Z',
      }),
      timeout: 15000,
    });
    expect(result).toEqual(true);
  });
});
