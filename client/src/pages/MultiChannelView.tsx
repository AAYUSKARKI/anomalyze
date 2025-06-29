import React, { useState, useEffect } from 'react';
import PageContainer from '../components/PageContainer';
import ChartContainer from '../components/ChartContainer';
import { setSelectedFeatures } from '../store/FileSlice';
import { useSelector, useDispatch } from 'react-redux';
import type{ RootState, AppDispatch } from '../store';
import { Link } from 'react-router-dom';
import FeatureSelector from '../components/FeatureSelector';

const generateColors = (count: number) => {
  const colors = [
    '#0f52ba', // primary
    '#00a6a6', // secondary
    '#ff8c00', // accent
    '#10b981', // success
    '#f59e0b', // warning
    '#ef4444', // error
  ];

  return Array.from({ length: count }, (_, i) => colors[i % colors.length]);
};

const MultiChannelView: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { selectedFile,selectedFeatures } = useSelector((state: RootState) => state.files);
  const [chartData, setChartData] = useState<any>(null);

useEffect(() => {
  if (selectedFile?.data && selectedFeatures.length > 0) {
    const totalPoints = selectedFile.data.length;
    const pointsToShow = Math.min(100, totalPoints);
    const step = Math.max(1, Math.floor(totalPoints / pointsToShow));

    const sampledData = selectedFile.data.filter((_, index) => index % step === 0);

    const labels = sampledData.map((row: any, index: number) => {
      if (row.date) {
        const date = new Date(row.date);
        return isNaN(date.getTime()) ? `Point ${index * step + 1}` : date.toLocaleDateString();
      }
      return `Point ${index * step + 1}`;
    });

    const colors = generateColors(selectedFeatures.length);

    const datasets = selectedFeatures.map((feature, i) => {
      const isDateField = feature.toLowerCase().includes('date');

      const rawValues = sampledData.map((row: any) => {
        const val = row[feature];
        if (isDateField) {
          const dateVal = new Date(val).getTime();
          return isNaN(dateVal) ? 0 : dateVal;
        }
        const numVal = Number(val);
        return isNaN(numVal) ? 0 : numVal;
      });

      const min = Math.min(...rawValues);
      const max = Math.max(...rawValues);
      const range = max - min;

      const normalizedData = rawValues.map(value => {
        if (range === 0) return 0;
        return ((value - min) / range) * 100;
      });

      // 🔥 Show human-readable legend for dates
      const readableMin = isDateField ? new Date(min).toLocaleDateString() : min.toFixed(2);
      const readableMax = isDateField ? new Date(max).toLocaleDateString() : max.toFixed(2);

      return {
        label: `${feature} (${readableMin} - ${readableMax})`,
        data: normalizedData,
        borderColor: colors[i],
        backgroundColor: `${colors[i]}33`,
        borderWidth: 2,
        pointRadius: 1,
        tension: 0.3,
        fill: false,
      };
    });

    setChartData({ labels, datasets });
  } else {
    setChartData(null);
  }
}, [selectedFile, selectedFeatures]);



   const handleFeatureChange = (features: string[]) => {
    dispatch(setSelectedFeatures(features));
  };

  return (
    <PageContainer
      title="Multichannel View"
      description="Visualize and analyze your data across multiple channels"
    >
      {!selectedFile && (
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <p className="text-gray-600 mb-4">
            No file selected. Please upload and select a CSV file first.
          </p>
          <Link to="/dashboard">
            <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">Go to Data Ingestion</button>
          </Link>
        </div>
      )}

      {selectedFile && (
        <div className="space-y-6">
          <section className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Data Features for: {selectedFile.name}
            </h2>
            {selectedFile.features && (
              <FeatureSelector
                features={selectedFile.features}
                selectedFeatures={selectedFeatures}
                onChange={handleFeatureChange}
              />
            )}
          </section>

          <section className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">Feature Visualization</h2>
            {chartData ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-gray-500">
                    <p>* Values are normalized to 0-100 scale for better comparison</p>
                    <p>* Original ranges shown in legend</p>
                  </div>
                  <span className="text-sm text-gray-500">
                    Showing {Math.min(100, selectedFile?.data?.length || 0)} data points
                  </span>
                </div>
                <ChartContainer
                  type="line"
                  data={chartData}
                  height={500}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>
                  {selectedFeatures.length === 0
                    ? 'Please select at least one feature to visualize'
                    : 'No data available for the selected features'}
                </p>
              </div>
            )}
          </section>
        </div>
      )}
    </PageContainer>
  );
};

export default MultiChannelView;