export const parseCSV = (content: string) => {
  const lines = content.split('\n');
  const headers = lines[0].toLowerCase().split(',').map(header => header.trim());
  
  const normalizedHeaders = headers.map(header => {
    if (header.includes('usage') && header.includes('kwh')) return 'usage_kwh';
    if (header.includes('co2') && header.includes('tco2')) return 'co2_tco2';
    if (header.includes('power') && header.includes('factor')) return 'power_factor';
    if (header.includes('date') || header.includes('time')) return 'date';
    return header;
  });
  
  const data = lines.slice(1)
    .filter(line => line.trim())
    .map(line => {
      const values = line.split(',').map(value => value.trim());
      const row: Record<string, string | number> = {};
      
      normalizedHeaders.forEach((header, index) => {
        const value = values[index];
        if (header === 'date') {
          try {
            const date = new Date(value);
            row[header] = !isNaN(date.getTime()) 
              ? date.toISOString().split('.')[0].replace('T', ' ')
              : value;
          } catch {
            row[header] = value;
          }
        } else {
          const numValue = Number(value);
          row[header] = isNaN(numValue) ? value : numValue;
        }
      });
      
      return row;
    });
  
  return { headers: normalizedHeaders, data };
};