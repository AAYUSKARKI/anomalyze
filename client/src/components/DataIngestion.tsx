// src/components/DataIngestion.tsx
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import PageContainer from './PageContainer';
import FileUploader from './FileUploader';
import FileList from './FileList';
import toast from 'react-hot-toast';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';
import { FileText, PlugZap, Plug, CheckCircle, Wifi, Activity } from 'lucide-react';

import { addFile, removeFile, setSelectedFile, setSelectedFeatures } from '../store/FileSlice';
import { initSocket, getSocket, closeSocket } from '../utils/socketManager';
import type { RootState, AppDispatch } from '../store';
import type { CsvFile } from '../types/CsvFile';

const DataIngestion: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { files, selectedFile } = useSelector((state: RootState) => state.files);

  const [mode, setMode] = useState<'upload' | 'sensor' | null>(null);
  const [sensorEndpoint, setSensorEndpoint] = useState('http://localhost:7000');
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [sensorData, setSensorData] = useState<string[][]>([]);

  const parsedDataRef = useRef<{ [fileId: string]: string[][] }>({});
  const liveIndicatorControls = useAnimation();
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const socket = getSocket();

  // 🌐 Check if socket already alive on mount
  useEffect(() => {
    if (socket?.connected) {
      setIsConnected(true);
      setMode('sensor');
      liveIndicatorControls.start({
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
        transition: { repeat: Infinity, duration: 1.5 },
      });
    }
  }, [socket]);

  const handleFileUpload = useCallback((csvFile: CsvFile) => {
    try {
      console.log(csvFile)
      const headers = csvFile.features || [];
      const dataRows = (csvFile.data || []).map(row => Object.values(row) as string[]);
      const parsed = [headers, ...dataRows];
      if (headers.length === 0) throw new Error('No headers found in uploaded file');
      console.log(headers)
      parsedDataRef.current[csvFile.id] = parsed;

      dispatch(addFile(csvFile));
      dispatch(setSelectedFile(csvFile));
      setMode('upload');
      toast.success('File uploaded successfully!', { position: 'top-center' });
    } catch (error: any) {
      console.error('Error processing uploaded file:', error);
      toast.error(error.message || 'Failed to process uploaded file', { position: 'top-center' });
    }
  }, [dispatch]);

  const handleConnect = useCallback(() => {
    if (!sensorEndpoint) {
      toast.error('Please enter a valid sensor endpoint', { position: 'top-center' });
      return;
    }
    dispatch(setSelectedFile(null));
    dispatch(setSelectedFeatures([]));
    setConnecting(true);
    setIsConnected(false);
    setMode('sensor');

    const socket = initSocket(
      sensorEndpoint,
      () => {
        setIsConnected(true);
        setConnecting(false);
        liveIndicatorControls.start({
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
          transition: { repeat: Infinity, duration: 1.5 },
        });
        toast.success('Connected to sensor endpoint!', { position: 'top-center' });
      },
      () => {
        setIsConnected(false);
        setConnecting(false);
        toast.error('Connection failed. Please check the endpoint.', { position: 'top-center' });
      }
    );

    connectionTimeoutRef.current = setTimeout(() => {
      if (!socket.connected) {
        toast.error('Connection timed out. Please try again.', { position: 'top-center' });
        closeSocket();
        setConnecting(false);
        setIsConnected(false);
      }
    }, 15000);
  }, [sensorEndpoint]);

  useEffect(() => {
  if (
    selectedFile?.id === 'live-stream' && selectedFile.data &&
    selectedFile.data.length === 10
  ) {
    navigate('/dashboard/multichannel');
  }
}, [selectedFile, navigate]);


  useEffect(() => {
    if (!socket || !mode || mode !== 'sensor') return;

const handleSensorData = (line: string) => {
  try {
    const parsedLine = line.split(',').map((v: string) => v.trim());

    setSensorData(prev => {
      const updated = [...prev, parsedLine];

      const headers =
        parsedDataRef.current['live-stream']?.[0] ||
        ['timestamp', 'usage_kwh', 'co2_tco2', 'power_factor', 'voltage', 'current', 'temperature', 'humidity', 'vibration'];

      if (updated.length === 1) {
        parsedDataRef.current['live-stream'] = [headers];
      }

      parsedDataRef.current['live-stream']?.push(parsedLine);

      const dataRows = parsedDataRef.current['live-stream'].slice(1);
      const formattedData = dataRows.map(row =>
        Object.fromEntries(headers.map((h, i) => [h, row[i] || '']))
      );

      // ✅ Dispatch outside of rendering
      setTimeout(() => {
        dispatch(setSelectedFile({
          id: 'live-stream',
          name: 'Live Sensor Data',
          features: headers,
          data: formattedData,
          size: formattedData.length,
          lastModified: Date.now(),
          isLive: true,
        }));
      }, 0);

      return updated;
    });
  } catch (err) {
    console.error('Error parsing sensor data:', err);
    toast.error('Invalid data received', { position: 'top-center' });
  }
};



    const handleDisconnect = () => {
      setIsConnected(false);
      setConnecting(false);
      liveIndicatorControls.stop();
      liveIndicatorControls.set({ scale: 1, opacity: 0.7 });
      toast.error('Disconnected from sensor');
    };

    socket.on('sensor_data', handleSensorData);
    socket.on('disconnect', handleDisconnect);

    return () => {
      socket.off('sensor_data', handleSensorData);
      socket.off('disconnect', handleDisconnect);
      liveIndicatorControls.stop();
      if (connectionTimeoutRef.current) clearTimeout(connectionTimeoutRef.current);
    };
  }, [socket, mode, dispatch, navigate]);

  const handleFileSelect = (file: CsvFile) => {
    dispatch(setSelectedFile(file));
    setMode('upload');
    toast.success(`Selected file: ${file.name}`);
  };

  const handleFileDelete = (fileId: string) => {
    dispatch(removeFile(fileId));
    delete parsedDataRef.current[fileId];
    if (selectedFile?.id === fileId) {
      dispatch(setSelectedFile(null));
      setMode(null);
    }
  };

  return (
    <PageContainer title="Data Ingestion" description="Upload CSV files or stream from sensor">
      <div className="space-y-6 max-w-5xl mx-auto px-4">
        {/* Mode Selection */}
        <motion.section className="bg-white shadow rounded-lg p-6 border border-gray-100">
          <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
            <FileText className="mr-2 text-blue-500" /> Select Data Source
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              onClick={() => setMode('upload')}
              className={`px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
                mode === 'upload' ? 'bg-blue-600 shadow-md' : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              Upload CSV
            </motion.button>
            <motion.button
              onClick={() => {
                if (isConnected) return;
                setMode('sensor');
              }}
              className={`px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
                mode === 'sensor' ? 'bg-blue-600 shadow-md' : 'bg-gray-500 hover:bg-gray-600'
              }`}
            >
              {isConnected ? 'Streaming Active' : 'Connect to Sensor'}
            </motion.button>
          </div>
        </motion.section>

        {/* Upload Section */}
        {mode === 'upload' && (
          <motion.section className="bg-white shadow rounded-lg p-6 border border-gray-100">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Upload CSV</h2>
            <FileUploader onFileUpload={handleFileUpload} />
            {files.length > 0 && (
              <div className="mt-4">
                <h3 className="text-md font-medium text-gray-700 mb-2">Uploaded Files</h3>
                <FileList
                  files={files}
                  onFileSelect={handleFileSelect}
                  onFileDelete={handleFileDelete}
                  selectedFileId={selectedFile?.id}
                />
              </div>
            )}
          </motion.section>
        )}

        {/* Sensor Section */}
        {mode === 'sensor' && (
          <motion.section className="bg-white shadow rounded-lg p-6 border border-gray-100">
            <h2 className="text-xl font-medium text-gray-800 mb-4">Sensor Connection</h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="text"
                value={sensorEndpoint}
                onChange={e => setSensorEndpoint(e.target.value)}
                placeholder="e.g. ws://localhost:4000"
                className="border px-4 py-3 rounded-lg flex-grow"
                disabled={isConnected || connecting}
              />
              <button
                onClick={handleConnect}
                disabled={!sensorEndpoint || isConnected || connecting}
                className={`px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 flex items-center justify-center ${
                  isConnected
                    ? 'bg-green-600 cursor-not-allowed'
                    : connecting
                    ? 'bg-blue-300 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {connecting ? <FaSpinner className="animate-spin mr-2" /> : isConnected && <CheckCircle className="mr-2" />}
                {connecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}
              </button>
            </div>
            <div className="mt-4 text-sm text-gray-500 flex items-center gap-2">
              {isConnected ? (
                <motion.div animate={liveIndicatorControls} className="text-green-600 flex items-center">
                  <Wifi className="w-5 h-5 mr-1" /> Streaming live data...
                </motion.div>
              ) : connecting ? (
                <div className="text-yellow-600 flex items-center">
                  <PlugZap className="w-5 h-5 mr-1" /> Connecting to sensor...
                </div>
              ) : (
                <div className="text-gray-500 flex items-center">
                  <Plug className="w-5 h-5 mr-1" /> Awaiting connection...
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Data Preview */}
        {(mode === 'upload' && selectedFile) || (mode === 'sensor' && sensorData.length > 0) ? (
          <motion.section className="bg-white shadow rounded-lg p-6 border border-gray-100">
            <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
              <Activity className="mr-2 text-blue-500" /> Data Preview
            </h2>
            <div className="bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto shadow-inner">
              <AnimatePresence>
                {(mode === 'upload'
                  ? parsedDataRef.current[selectedFile!.id]?.slice(0, 10)
                  : sensorData.slice(-10)
                )?.map((row, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-sm text-gray-600 py-1 hover:bg-gray-200 rounded"
                  >
                    {row.join(', ')}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        ) : (
          <motion.section className="bg-white shadow rounded-lg p-6 border border-gray-100">
            <p className="text-gray-500 italic">
              {mode === 'upload'
                ? 'Select a file to view its data.'
                : 'Connect to a sensor to view live data.'}
            </p>
          </motion.section>
        )}
      </div>
    </PageContainer>
  );
};

export default DataIngestion;
