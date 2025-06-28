import { parse } from 'csv-parse';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

interface SensorData {
  timestamp: string;
  usage_kwh: string;
  co2_tco2: string;
  power_factor: string;
  voltage: string;
  current: string;
  temperature: string;
  humidity: string;
  vibration: string;
}

export const setupSocket = (io: any) => {
  io.on('connection', (socket: any) => {
    console.log('Client connected');

    // Get __dirname in ES modules
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Define the file path to src/api/sensor/sensor_data.csv
    const filePath = path.join(__dirname, '..', '..', '..', 'src', 'api', 'sensor', 'sensor_data.csv');
    console.log('Resolved file path:', filePath);

    if (!fs.existsSync(filePath)) {
      console.error('CSV file not found');
      socket.emit('error', 'CSV file not found');
      return;
    }

    let currentIndex = 0;
    let csvData: SensorData[] = [];
    const emitInterval = 2000; // Emit one line every 2 seconds

    // Parse CSV to extract data
    fs.createReadStream(filePath)
      .pipe(parse({ delimiter: ',', columns: true }))
      .on('data', (row) => {
        csvData.push(row);
      })
      .on('end', () => {
        console.log('CSV parsed, starting emission');
        emitLines();
      })
      .on('error', (err) => {
        console.error('CSV parse error:', err.message);
        socket.emit('error', `CSV parse error: ${err.message}`);
      });

    const emitLines = () => {
      if (currentIndex >= csvData.length) {
        socket.emit('sensor_end');
        console.log('CSV stream complete');
        return;
      }

      const row = csvData[currentIndex];
      const currentTime = new Date();
      // Adjust timestamp to current date and time
      const adjustedRow = {
        ...row,
        timestamp: new Date(currentTime.getTime() + currentIndex * emitInterval).toISOString(),
      };

      const line = `${adjustedRow.timestamp},${row.usage_kwh},${row.co2_tco2},${row.power_factor},${row.voltage},${row.current},${row.temperature},${row.humidity},${row.vibration}`;
      socket.emit('sensor_data', line);
      console.log(`Emitting line: ${line}`);
      currentIndex++;

      setTimeout(emitLines, emitInterval);
    };

    socket.on('disconnect', () => {
      console.log('Client disconnected');
      currentIndex = csvData.length; // Stop emission
    });
  });
};
