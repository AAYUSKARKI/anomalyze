import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { getSocket } from '../utils/socketManager';
import { setSelectedFile } from '../store/FileSlice';
import type { CsvFile } from '../types/CsvFile';
import type { RootState } from '../store';

const defaultHeaders = ['timestamp', 'usage_kwh', 'co2_tco2', 'power_factor', 'voltage', 'current', 'temperature', 'humidity', 'vibration'];

const LiveSocketListener = () => {
  const { isSocketConnected} = useSelector((state: RootState) => state.socket);
  const selectedFile = useSelector((state: any) => state.files.selectedFile);
  console.log("live socket ..................")
  const dispatch = useDispatch();
  const [dataRows, setDataRows] = useState<string[][]>([]);

  // Listen to sensor data
  useEffect(() => {
    if(!isSocketConnected) return
    const socket = getSocket();
    console.log(socket,"live socket inside useEffect..................")
    if (!socket) return;
  console.log("live socket inside useEffect..................")

    const handleSensorData = (line: string) => {
      const parsedLine = line.split(',').map(val => val.trim());
      setDataRows(prev => [...prev, parsedLine]); // Safe
    };

    socket.on('sensor_data', handleSensorData);
    
    // Cleanup function
    return () => {
      socket.off('sensor_data', handleSensorData);
    };
  }, [isSocketConnected]);

  // Dispatch after rows are updated
  useEffect(() => {
    if (dataRows.length === 0) return;

    const formatted = dataRows.map(row =>
      Object.fromEntries(defaultHeaders.map((h, i) => [h, row[i] || '']))
    );

    const liveFile: CsvFile = {
      id: 'live-stream',
      name: 'Live Sensor Data',
      features: defaultHeaders,
      data: formatted,
      size: formatted.length,
      lastModified: Date.now(),
      isLive: true,
    };

    dispatch(setSelectedFile(liveFile));
    console.log('Dispatched live file',selectedFile);
  }, [dataRows, dispatch]);

  return null;
};

export default LiveSocketListener;
