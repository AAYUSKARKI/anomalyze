import{ useEffect, useState } from "react";
import PageContainer from "../components/PageContainer";
import { useSelector, useDispatch } from "react-redux";
import FileList from "../components/FileList";
import { Play, CheckCircle, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { setSelectedFile,removeFile } from "../store/FileSlice";
import toast from "react-hot-toast";
import { setSelectedModel } from "../store/ModelSlice";
import type { RootState, AppDispatch } from "../store";
import type { CsvFile } from "../types/CsvFile";
import type { ModelOption } from "../types/ModelOption";
import axios from "axios";
import { setAnomalyData } from "../store/AnomalySlice";
import ModelSelector from "../components/ModelSelector";
import { useNavigate } from "react-router-dom";
import alertSound from '../assets/alerttone.mp3'
import { exportAnomaliesAsExcel, exportAnomaliesAsPDF } from "../utils/reportExport";
const ModelTraining = () => {
  const navigate = useNavigate();
    const {files} = useSelector((state: RootState) => state.files);
    const {anomalyData} = useSelector((state: RootState) => state.anomaly);
    const { selectedModel } = useSelector((state: RootState) => state.model);
    const { selectedFile} = useSelector((state: RootState) => state.files);
    const dispatch = useDispatch<AppDispatch>();

    const [trainingStatus, setTrainingStatus] = useState<
        'idle' | 'training' | 'success' | 'error'
    >('idle');
    const [progress, setProgress] = useState(0);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleFileSelect = (file: CsvFile) => {
    dispatch(setSelectedFile(file));
    setTrainingStatus('idle');
    setProgress(0);
    setErrorMessage(null);
  };

  const handleFileDelete = () => {
    if (!selectedFile) {
    toast.error('No file selected to delete');
    return;
  }
    console.log("file deleted")
    dispatch(setSelectedFile(null));
    dispatch(removeFile(selectedFile.id));
    console.log(selectedFile)
    setTrainingStatus('idle');
    setProgress(0);
    setErrorMessage(null);
  };

  const handleModelSelect = (model: ModelOption) => {
    dispatch(setSelectedModel(model));
    console.log(model)
    setTrainingStatus('idle');
    setProgress(0);
    setErrorMessage(null);
  };

   const validateTrainingData = () => {
    if (!selectedFile?.features || selectedFile.features.length === 0) {
      throw new Error('Selected file has no features to analyze');
    }

    if (!selectedFile?.data || selectedFile.data.length === 0) {
      throw new Error('Selected file contains no data');
    }

    const requiredFeatures = ['usage_kwh', 'co2_tco2', 'power_factor'];
    const missingFeatures = requiredFeatures.filter(
      feature => !selectedFile.features?.includes(feature)
    );

    if (missingFeatures.length > 0) {
      throw new Error(
        `Missing required features: ${missingFeatures.join(', ')}`
      );
    }
  };

const handleTrainModel = async () => {
  try {
    if (!selectedFile) {
      throw new Error('Please select a file for training');
    }

    if (!selectedModel) {
      throw new Error('Please select a model for training');
    }

    validateTrainingData();

    setTrainingStatus('training');
    setProgress(25);
    setErrorMessage(null);
    // console.log(selectedFile)
    // console.log(selectedFile.features)

    // Create CSV content from the selected file
    const csvContent = selectedFile.features?.join(',') + '\n' +
      selectedFile.data?.map(row => 
        selectedFile.features?.map(feature => row[feature]).join(',')
      ).join('\n');

    // console.log(csvContent)
    setProgress(50);

    const { data: anomalies } = await axios.post('http://127.0.0.1:5000//train', {
      csvContent,
      modelType: selectedModel.id,
      fileId: selectedFile.id
    });

    if (!anomalies) {
      throw new Error('No response from training function');
    }

    if (!Array.isArray(anomalies)) {
      throw new Error('Invalid response format from training function');
    }

    setProgress(75);

    // Store anomalies in the database 
    const { data: insertResponse } = await axios.post('http://localhost:7000/anomaly/insert', {
      anomalies: anomalies.map(anomaly => ({
        date: anomaly.timestamp,
        usageKwh: anomaly.Usage_kWh,
        co2Tco2: anomaly['CO2(tCO2)'],
        powerFactor: anomaly.Lagging_Current_Power_Factor,
        anomalyLabel: anomaly.Anomaly_Label,
        fmeaDiagnosis: anomaly.FMEA_Diagnosis,
        alertLevel: anomaly.Alert_Level,
        fileId: selectedFile.id
      }))
    });

    if (insertResponse.error) {
      throw new Error(`Failed to store anomalies: ${insertResponse.error}`);
    }
    dispatch(setAnomalyData(anomalies));
    setTrainingStatus('success');
    setProgress(100);
    exportAnomaliesAsExcel(anomalies);
    exportAnomaliesAsPDF(anomalies);

    if(anomalies.some(anomaly => anomaly.Alert_Level === "normal")) {
      const audio = new Audio(alertSound);
      audio.play().catch((error) => console.error('Error playing audio:', error));
      toast.error('Critical anomaly detected!');

      setTimeout(() => {
        navigate('/dashboard/alerts');
      }, 5000);
    }
    toast.success(`${selectedModel.name} model successfully trained on ${selectedFile.name}. Found ${anomalies.length} anomalies.`);
  } catch (error: any) {
    console.error('Training error:', error);
    setTrainingStatus('error');
    setProgress(0);
    setErrorMessage(error.message);
    toast.error(error.message || 'An unexpected error occurred');
  }
};

useEffect(() => {
  if(!selectedModel) {
    dispatch(
      setSelectedModel({
        id:"isolation_forest",
        name:"Isolation Forest",
        description:"Effective for detecting anomalies in high-dimensional datasets using isolation techniques"
      })
    )
  }
})

//auto train model
useEffect(()=>{
  if(selectedFile?.isLive && selectedModel && selectedFile.data && selectedFile.data.length > 10) {
    handleTrainModel();
  }
},[selectedFile, selectedModel])

return (
    <PageContainer
      title="Model Training"
      description="Train anomaly detection models on your data"
    >
      <div className="space-y-6">
        <section className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Select Training Data</h2>
          {files.length > 0 ? (
            <FileList
              files={files}
              onFileSelect={handleFileSelect}
              onFileDelete={handleFileDelete}
              selectedFileId={selectedFile?.id}
            />
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">
                No files available. Please upload a CSV file first.
              </p>
              <Link to="/dashboard">
                <button className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2">Go to Data Ingestion</button>
              </Link>
            </div>
          )}
        </section>

        <section className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Model Selection</h2>
          <ModelSelector selectedModel={selectedModel} onChange={handleModelSelect} />
        </section>

        <section className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Training Status</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {selectedFile
                    ? `Selected File: ${selectedFile.name}`
                    : 'No file selected'}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedModel
                    ? `Selected Model: ${selectedModel.name}`
                    : 'No model selected'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {trainingStatus === 'success' && (
                  <CheckCircle size={20} className="text-success-500" />
                )}
                {trainingStatus === 'error' && (
                  <AlertCircle size={20} className="text-error-500" />
                )}
                <button 
                  className="px-4 py-2 text-sm font-medium text-black cursor-pointer bg-primary-600 rounded-md hover:bg-primary-700 transition-colors flex items-center gap-2"
                  onClick={handleTrainModel}
                  disabled={!selectedFile || !selectedModel || trainingStatus === 'training'}
                >
                  <Play size={16} />{trainingStatus === 'training' ? 'Training...' : 'Train Model'}
                </button>
              </div>
            </div>

            {trainingStatus === 'training' && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-primary-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
            )}

            {trainingStatus === 'success' && (
              <div className="p-4 bg-success-50 text-success-700 rounded-lg">
                <p className="font-medium">Training Completed Successfully!</p>
                <p className="text-sm mt-1">
                  {anomalyData && anomalyData.length === 0
                    ? 'No anomalies were detected in the dataset.'
                    : 'The model has been trained and anomalies have been stored in the database. View results in the Alerts tab.'}
                </p>
              </div>
            )}

            {trainingStatus === 'error' && (
              <div className="p-4 bg-error-50 text-error-700 rounded-lg">
                <p className="font-medium">Training Failed</p>
                <p className="text-sm mt-1">
                  {errorMessage || 'There was an error training the model. Please try again.'}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </PageContainer>
  );
};

export default ModelTraining;
