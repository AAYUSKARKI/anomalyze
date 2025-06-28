import React, { useEffect, useState, useCallback, useRef } from 'react';
import PageContainer from './PageContainer';
import FileUploader from './FileUploader';
import FileList from './FileList';
import { addFile, removeFile, setSelectedFile } from '../store/FileSlice';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState, AppDispatch } from '../store';
import { io, Socket } from 'socket.io-client';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { FaSpinner } from 'react-icons/fa';
import { CheckCircle, PlugZap, Plug, FileText, Activity, Wifi } from 'lucide-react';
import type{ CsvFile } from '../types/CsvFile';
import toast from 'react-hot-toast';

const DataIngestion: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { files, selectedFile } = useSelector((state: RootState) => state.files);
  const [mode, setMode] = useState<'upload' | 'sensor' | null>(null);
  const [sensorEndpoint, setSensorEndpoint] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [sensorData, setSensorData] = useState<string[][]>([]);
  const liveIndicatorControls = useAnimation();
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const parsedDataRef = useRef<{ [fileId: string]: string[][] }>({}); // Store parsed data per file

  const handleFileUpload = useCallback(
    (csvFile: CsvFile) => {
      try {
        const headers = csvFile.features || [];
        const dataRows = (csvFile.data || []).map(row => Object.values(row) as string[]);
        const parsed = [headers, ...dataRows];
        
        if (headers.length === 0) {
          throw new Error('No headers found in uploaded file');
        }

        parsedDataRef.current[csvFile.id] = parsed;
        dispatch(addFile(csvFile));
        dispatch(setSelectedFile(csvFile));
        setMode('upload');
        toast.success('File uploaded successfully!', { position: 'top-center' });
      } catch (error: any) {
        console.error('Error processing uploaded file:', error);
        toast.error(error.message || 'Failed to process uploaded file', { position: 'top-center' });
      }
    },
    [addFile, setSelectedFile]
  );

  const handleConnect = useCallback(() => {
    if (!sensorEndpoint) {
      toast.error('Please enter a valid sensor endpoint', { position: 'top-center' });
      return;
    }
    setConnecting(true);
    setIsConnected(false);
    const newSocket = io(sensorEndpoint, {
      reconnectionAttempts: 3,
      timeout: 10000,
    });
    setSocket(newSocket);
    connectionTimeoutRef.current = setTimeout(() => {
      if (!isConnected && connecting) {
        setConnecting(false);
        setIsConnected(false);
        newSocket.disconnect();
        setSocket(null);
        toast.error('Connection timed out. Please try again.', { position: 'top-center' });
      }
    }, 15000);
    setMode('sensor');
  }, [sensorEndpoint, isConnected, connecting]);

  const handleFileSelect = useCallback(
    (file: CsvFile) => {
      dispatch(setSelectedFile(file));
      setMode('upload');
      toast.success(`Selected file: ${file.name}`);
    },
    [setSelectedFile]
  );

  const handleFileDelete = useCallback(
    (fileId: string) => {
      dispatch(removeFile(fileId));
      delete parsedDataRef.current[fileId];
      if (selectedFile?.id === fileId) {
        dispatch(setSelectedFile(null));
        setMode(null);
      }
    },
    [removeFile, selectedFile, setSelectedFile]
  );

  useEffect(() => {
    if (!socket || mode !== 'sensor') return;

    const handleConnect = () => {
      setIsConnected(true);
      setConnecting(false);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      liveIndicatorControls.start({
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
        transition: { repeat: Infinity, duration: 1.5 },
      });
      toast.success('Connected to sensor endpoint!', { position: 'top-center' });
    };

    const handleSensorData = (line: string) => {
      try {
        const parsedLine = line.split(',').map((v: string) => v.trim());
        setSensorData((prev) => [...prev, parsedLine]);
      } catch (error) {
        console.error('Error processing sensor data:', error);
        toast.error('Invalid sensor data received', { position: 'top-center' });
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
      setConnecting(false);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      liveIndicatorControls.stop();
      liveIndicatorControls.set({ scale: 1, opacity: 0.7 });
      toast.error('Disconnected from sensor endpoint');
    };

    const handleError = (err: any) => {
      console.error('Socket error:', err);
      setIsConnected(false);
      setConnecting(false);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      liveIndicatorControls.stop();
      liveIndicatorControls.set({ scale: 1, opacity: 0.7 });
      toast.error('Connection error occurred', { position: 'top-center' });
    };

    socket.on('connect', handleConnect);
    socket.on('sensor_data', handleSensorData);
    socket.on('disconnect', handleDisconnect);
    socket.on('error', handleError);

    return () => {
      socket.off('connect', handleConnect);
      socket.off('sensor_data', handleSensorData);
      socket.off('disconnect', handleDisconnect);
      socket.off('error', handleError);
      socket.disconnect();
      setIsConnected(false);
      setConnecting(false);
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
      liveIndicatorControls.stop();
      liveIndicatorControls.set({ scale: 1, opacity: 0.7 });
    };
  }, [socket, mode, liveIndicatorControls]);

  return (
    <PageContainer
      title="Data Ingestion"
      description="Upload CSV files or connect to live sensor data for real-time monitoring and analysis"
    >
      <div className="space-y-6 max-w-5xl mx-auto px-4">
        {/* Mode Selection */}
        <motion.section
          className="bg-white shadow rounded-lg p-6 border border-gray-100"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
            <FileText className="mr-2 text-blue-500" /> Select Data Source
          </h2>
          <div className="flex flex-col sm:flex-row gap-4">
            <motion.button
              onClick={() => setMode('upload')}
              className={`px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
                mode === 'upload' ? 'bg-blue-600 shadow-md' : 'bg-gray-500 hover:bg-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Upload CSV File
            </motion.button>
            <motion.button
              onClick={() => setMode('sensor')}
              className={`px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 ${
                mode === 'sensor' ? 'bg-blue-600 shadow-md' : 'bg-gray-500 hover:bg-gray-600'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Connect to Sensor
            </motion.button>
          </div>
        </motion.section>

        {/* Upload CSV File */}
        {mode === 'upload' && (
          <motion.section
            className="bg-white shadow rounded-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
              <FileText className="mr-2 text-blue-500" /> Upload CSV File
            </h2>
            <FileUploader onFileUpload={handleFileUpload} />
            {files.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                transition={{ duration: 0.4 }}
                className="mt-4"
              >
                <h3 className="text-md font-medium text-gray-700 mb-2">Uploaded Files</h3>
                <FileList
                  files={files}
                  onFileSelect={handleFileSelect}
                  onFileDelete={handleFileDelete}
                  selectedFileId={selectedFile?.id}
                />
              </motion.div>
            )}
          </motion.section>
        )}

        {/* Sensor Connection */}
        {mode === 'sensor' && (
          <motion.section
            className="bg-white shadow rounded-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
              <PlugZap className="mr-2 text-blue-500" /> Connect to Sensor
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <motion.input
                type="text"
                value={sensorEndpoint}
                onChange={(e) => setSensorEndpoint(e.target.value)}
                placeholder="e.g., ws://localhost:4000"
                className="border border-gray-300 rounded-lg px-4 py-3 flex-grow focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all duration-300"
                disabled={isConnected || connecting}
                whileFocus={{ scale: 1.02 }}
              />
              <motion.button
                onClick={handleConnect}
                disabled={!sensorEndpoint || isConnected || connecting}
                className={`px-6 py-3 rounded-lg text-white font-semibold transition-all duration-300 flex items-center justify-center ${
                  isConnected
                    ? 'bg-green-600 cursor-not-allowed'
                    : connecting
                    ? 'bg-blue-300 cursor-wait'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
                whileHover={{ scale: !isConnected && !connecting ? 1.05 : 1 }}
                whileTap={{ scale: !isConnected && !connecting ? 0.95 : 1 }}
              >
                {connecting ? (
                  <FaSpinner className="animate-spin mr-2" />
                ) : isConnected ? (
                  <CheckCircle className="mr-2" />
                ) : null}
                {connecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect'}
              </motion.button>
            </div>
            <div className="mt-4 flex items-center space-x-2">
              {isConnected && (
                <motion.div
                  className="text-green-600 flex items-center"
                  animate={liveIndicatorControls}
                >
                  <Wifi className="w-5 h-5 mr-2 text-green-500" />
                  <span>Streaming live data...</span>
                </motion.div>
              )}
              {!isConnected && connecting && (
                <motion.div
                  className="text-yellow-600 flex items-center"
                  animate={{ opacity: [0.5, 1, 0.5], transition: { repeat: Infinity, duration: 1 } }}
                >
                  <PlugZap className="w-5 h-5 mr-2" />
                  <span>Connecting to sensor...</span>
                </motion.div>
              )}
              {!isConnected && !connecting && (
                <div className="text-gray-500 flex items-center">
                  <Plug className="w-5 h-5 mr-2" />
                  <span>Awaiting connection...</span>
                </div>
              )}
            </div>
          </motion.section>
        )}

        {/* Data Display */}
        {(mode === 'upload' && selectedFile) || (mode === 'sensor' && sensorData.length > 0) ? (
          <motion.section
            className="bg-white shadow rounded-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-medium text-gray-800 mb-4 flex items-center">
              <Activity className="mr-2 text-blue-500" /> Data View
            </h2>
            <div className="bg-gray-100 p-4 rounded-lg max-h-64 overflow-y-auto shadow-inner">
              <AnimatePresence>
                {(mode === 'upload' && selectedFile
                  ? parsedDataRef.current[selectedFile.id]?.slice(0, 10)
                  : sensorData.slice(-10)
                )?.map((row, index) => (
                  <motion.div
                    key={`data-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-gray-600 py-1 hover:bg-gray-200 rounded transition-colors"
                  >
                    {row.join(', ')}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </motion.section>
        ) : (
          <motion.section
            className="bg-white shadow rounded-lg p-6 border border-gray-100"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-500 italic p-4"
            >
              {mode === 'upload' ? 'Select a file to view its data.' : 'Connect to a sensor to view live data.'}
            </motion.div>
          </motion.section>
        )}
      </div>
    </PageContainer>
  );
};

export default DataIngestion;
