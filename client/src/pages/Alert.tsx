import React, { useState, useMemo, useEffect } from 'react';
import PageContainer from '../components/PageContainer';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type SortingState,
  getPaginationRowModel,
} from '@tanstack/react-table';
import type { AnomalyData, AnomalyResponse } from '../types/Anomaly';
import { ChevronDown, ChevronUp, ArrowUpDown, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import axios from 'axios';
import toast from 'react-hot-toast';

const columnHelper = createColumnHelper<AnomalyData>();

const Alerts: React.FC = () => {
  const severityLabels = {
  Critical: 'critical',
  Moderate: 'moderate',
  Minor: 'minor',
} as const;

type SeverityLevel = typeof severityLabels[keyof typeof severityLabels];
  const [sorting, setSorting] = useState<SortingState>([]);
  const { anomalyData } = useSelector((state: RootState) => state.anomaly);
  const [alerts, setAlerts] = useState<AnomalyData[]>([]);
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | null>(null);
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const response = await axios.get('http://localhost:7000/anomaly/fetch', {
          params: {
            orderBy: 'date',
            order: 'desc'
          }
        });

        if (response.data.data) {
          console.log(response.data.data);
          setAlerts(response.data.data.map((item: AnomalyResponse) => ({
            date: item.date,
            Usage_kWh: item.usageKwh,
            'CO2(tCO2)': item.co2Tco2,
            Lagging_Current_Power_Factor: item.powerFactor,
            Anomaly_Label: item.anomalyLabel,
            FMEA_Diagnosis: item.fmeaDiagnosis,
            Alert_Level: item.alertLevel,
          })));
        }
      } catch (error) {
        console.error('Error fetching alerts:', error);
        toast.error('Failed to fetch alerts');
      }
    };

    if (anomalyData) {
      setAlerts(anomalyData);
    } else {
      fetchAlerts();
    }
  }, [anomalyData]);

  const handleClearAll = async () => {
    try {
      await axios.delete('http://localhost:7000/anomaly/delete');
      setAlerts([]);
      toast.success('Alerts cleared successfully');
    } catch (error) {
      console.error('Error clearing alerts:', error);
      toast.error('Failed to clear alerts');
    }
  };

  const filteredData = useMemo(() => {
    if (severityFilter === null) return alerts;
    return alerts.filter(alert => alert.Alert_Level === severityFilter);
  }, [alerts, severityFilter]);

  const columns = useMemo(
    () => [
      columnHelper.accessor('timestamp', {
        header: 'Timestamp',
        cell: (info) => {
          const dateValue = info.getValue();
          if (!dateValue) return 'Invalid Date';
          
          const date = new Date(dateValue);
          return isValid(date) ? format(date, 'PPpp') : 'Invalid Date';
        },
      }),
      columnHelper.accessor('Usage_kWh', {
        header: 'Usage (kWh)',
        cell: (info) => info.getValue().toFixed(2),
      }),
      columnHelper.accessor('CO2(tCO2)', {
        header: 'CO2 (tCO2)',
        cell: (info) => info.getValue().toFixed(2),
      }),
      columnHelper.accessor('FMEA_Diagnosis', {
        header: 'Diagnosis',
      }),
      columnHelper.accessor('Alert_Level', {
        header: 'Severity',
        cell: (info) => {
          const level = info.getValue()?.toLowerCase() as SeverityLevel;
          const severity = level === 'critical' ? 'Critical' : level === 'moderate' ? 'Moderate' : 'Minor';
          const colors: Record<SeverityLevel, string> = {
            critical: 'bg-red-100 text-red-700',
            moderate: 'bg-yellow-100 text-yellow-700',
            minor: 'bg-green-100 text-green-700',
          };

          return (
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${colors[level]}`}
            >
              {severity}
            </span>
          );
        },
      }),
    ],
    []
  );

  const table = useReactTable({
    data: filteredData,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  const severityCounts = useMemo(() => {
    return alerts.reduce((acc: Record<SeverityLevel, number>, alert) => {
      const level = alert.Alert_Level?.toLowerCase() as SeverityLevel;
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {
      critical: 0,
      moderate: 0,
      minor: 0
    });
  }, [alerts]);
  return (
    <PageContainer
      title="Alerts"
      description="Monitor and manage anomaly detection alerts"
    >
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {alerts.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No alerts found. Train a model to detect anomalies.
          </div>
        ) : (
          <>
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <button 
                    className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
                    onClick={() => setSeverityFilter(null)}
                  >
                    All ({alerts.length})
                  </button>
                  <button
                    onClick={() => setSeverityFilter('critical')}
                    className="text-red-700 px-4 py-2 text-sm font-medium bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                  >
                    Critical ({severityCounts.critical})
                  </button>
                  <button
                    onClick={() => setSeverityFilter('moderate')}
                    className="text-yellow-700 px-4 py-2 text-sm font-medium bg-yellow-50 rounded-md hover:bg-yellow-100 transition-colors"
                  >
                    Moderate ({severityCounts.moderate})
                  </button>
                  <button
                    onClick={() => setSeverityFilter('minor')}
                    className="text-green-700 px-4 py-2 text-sm font-medium bg-green-50 rounded-md hover:bg-green-100 transition-colors"
                  >
                    Minor ({severityCounts.minor})
                  </button>
                </div>
                <button
                  onClick={handleClearAll}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />Clear All
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {header.isPlaceholder ? null : (
                            <div
                              className={`flex items-center gap-1 ${header.column.getCanSort() ? 'cursor-pointer select-none' : ''}`}
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {{
                                asc: <ChevronUp className="h-4 w-4" />,
                                desc: <ChevronDown className="h-4 w-4" />,
                              }[header.column.getIsSorted() as string] ?? (
                                header.column.getCanSort() && (
                                  <ArrowUpDown className="h-4 w-4" />
                                )
                              )}
                            </div>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {table.getRowModel().rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50">
                      {row.getVisibleCells().map((cell) => (
                        <td
                          key={cell.id}
                          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  <ChevronLeft size={16} className="inline mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  Next
                  <ChevronRight size={16} className="inline ml-1" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-700">
                  Page {table.getState().pagination.pageIndex + 1} of{' '}
                  {table.getPageCount()}
                </span>
                <select
                  value={table.getState().pagination.pageSize}
                  onChange={e => {
                    table.setPageSize(Number(e.target.value));
                  }}
                  className="text-sm border rounded px-2 py-1"
                >
                  {[10, 20, 30, 40, 50].map(pageSize => (
                    <option key={pageSize} value={pageSize}>
                      Show {pageSize}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
};

export default Alerts;