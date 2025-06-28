export interface CsvFile {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  file?: File;
  features?: string[];
  data?: any[];
}