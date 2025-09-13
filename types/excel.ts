// Excel parsing and export type definitions

export interface ExcelParseResult {
  success: boolean;
  data?: ExcelMeasurementData[];
  metadata?: ExcelMetadata;
  errors?: ExcelParseError[];
}

export interface ExcelMeasurementData {
  timestamp: string | Date;
  voltage?: number;
  current?: number;
  resistance?: number;
  power?: number;
  frequency?: number;
  phase_angle?: number;
  temperature?: number;
  humidity?: number;
  pass_fail?: boolean | string;
  notes?: string;
  // Raw data for debugging
  _raw?: Record<string, any>;
  _row?: number;
}

export interface ExcelMetadata {
  filename: string;
  file_size: number;
  total_rows: number;
  valid_rows: number;
  invalid_rows: number;
  headers: string[];
  detected_format?: ExcelFormat;
  device_info?: {
    device_name?: string;
    model_number?: string;
    serial_number?: string;
  };
  test_info?: {
    test_date?: string;
    test_standard?: string;
    test_engineer?: string;
  };
}

export interface ExcelParseError {
  row: number;
  column?: string;
  value?: any;
  message: string;
  type: 'format' | 'validation' | 'missing' | 'range' | 'type';
}

export interface ExcelFormat {
  name: string;
  version?: string;
  columns: ExcelColumnMapping[];
}

export interface ExcelColumnMapping {
  source_column: string | number; // Column name or index
  target_field: keyof ExcelMeasurementData;
  data_type: 'string' | 'number' | 'boolean' | 'date';
  required?: boolean;
  transform?: (value: any) => any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    values?: any[];
  };
}

// Predefined Excel formats for common testing equipment
export const EXCEL_FORMATS: Record<string, ExcelFormat> = {
  'standard_v1': {
    name: 'Standard Format V1',
    columns: [
      { source_column: 'Timestamp', target_field: 'timestamp', data_type: 'date', required: true },
      { source_column: 'Voltage (V)', target_field: 'voltage', data_type: 'number', required: true },
      { source_column: 'Current (A)', target_field: 'current', data_type: 'number', required: true },
      { source_column: 'Resistance (Ω)', target_field: 'resistance', data_type: 'number' },
      { source_column: 'Power (W)', target_field: 'power', data_type: 'number' },
      { source_column: 'Temperature (°C)', target_field: 'temperature', data_type: 'number' },
      { source_column: 'Humidity (%)', target_field: 'humidity', data_type: 'number' },
      { source_column: 'Pass/Fail', target_field: 'pass_fail', data_type: 'boolean' },
      { source_column: 'Notes', target_field: 'notes', data_type: 'string' }
    ]
  },
  'fluke_1736': {
    name: 'Fluke 1736 Power Logger',
    columns: [
      { source_column: 0, target_field: 'timestamp', data_type: 'date', required: true },
      { source_column: 1, target_field: 'voltage', data_type: 'number', required: true },
      { source_column: 2, target_field: 'current', data_type: 'number', required: true },
      { source_column: 3, target_field: 'power', data_type: 'number' },
      { source_column: 4, target_field: 'frequency', data_type: 'number' },
      { source_column: 5, target_field: 'phase_angle', data_type: 'number' }
    ]
  },
  'keysight_34465a': {
    name: 'Keysight 34465A DMM',
    columns: [
      { source_column: 'Time', target_field: 'timestamp', data_type: 'date', required: true },
      { source_column: 'Primary', target_field: 'voltage', data_type: 'number', required: true },
      { source_column: 'Secondary', target_field: 'current', data_type: 'number', required: true },
      { source_column: 'Calculated', target_field: 'resistance', data_type: 'number' }
    ]
  }
};

// Excel export configuration
export interface ExcelExportConfig {
  filename: string;
  sheets: ExcelSheetConfig[];
  metadata?: {
    title?: string;
    author?: string;
    created_date?: string;
    description?: string;
  };
}

export interface ExcelSheetConfig {
  name: string;
  data: any[];
  columns: ExcelColumnConfig[];
  styling?: ExcelSheetStyling;
  summary?: ExcelSummaryConfig;
}

export interface ExcelColumnConfig {
  header: string;
  field: string;
  width?: number;
  format?: string; // Excel number format
  style?: ExcelCellStyle;
}

export interface ExcelSheetStyling {
  header_style?: ExcelCellStyle;
  data_style?: ExcelCellStyle;
  alternate_row_color?: string;
  freeze_panes?: { row: number; column: number };
}

export interface ExcelCellStyle {
  font?: {
    bold?: boolean;
    italic?: boolean;
    size?: number;
    color?: string;
    name?: string;
  };
  fill?: {
    type?: 'solid' | 'pattern';
    color?: string;
    pattern?: string;
  };
  border?: {
    top?: ExcelBorderStyle;
    bottom?: ExcelBorderStyle;
    left?: ExcelBorderStyle;
    right?: ExcelBorderStyle;
  };
  alignment?: {
    horizontal?: 'left' | 'center' | 'right';
    vertical?: 'top' | 'middle' | 'bottom';
    wrap_text?: boolean;
  };
}

export interface ExcelBorderStyle {
  style?: 'thin' | 'medium' | 'thick' | 'dotted' | 'dashed';
  color?: string;
}

export interface ExcelSummaryConfig {
  show_totals?: boolean;
  show_averages?: boolean;
  show_min_max?: boolean;
  custom_formulas?: Array<{
    label: string;
    formula: string;
  }>;
}

// Excel validation rules
export interface ExcelValidationRules {
  required_columns: string[];
  column_types: Record<string, 'string' | 'number' | 'date' | 'boolean'>;
  value_ranges?: Record<string, { min?: number; max?: number }>;
  custom_validators?: Record<string, (value: any, row: Record<string, any>) => boolean | string>;
}

// Helper types for Excel processing
export interface ExcelProcessingOptions {
  format?: string; // Format identifier
  sheet_name?: string; // Specific sheet to process
  header_row?: number; // Row number containing headers (0-based)
  data_start_row?: number; // First row of data (0-based)
  max_rows?: number; // Maximum rows to process
  date_format?: string; // Date parsing format
  decimal_separator?: '.' | ',';
  thousand_separator?: '.' | ',' | ' ' | '';
  skip_empty_rows?: boolean;
  trim_values?: boolean;
  convert_formulas?: boolean; // Convert formula results to values
}

export interface ExcelImportProgress {
  total_rows: number;
  processed_rows: number;
  valid_rows: number;
  invalid_rows: number;
  percentage: number;
  status: 'preparing' | 'processing' | 'validating' | 'importing' | 'completed' | 'failed';
  current_operation?: string;
  estimated_time_remaining?: number; // seconds
}

// Type guards
export function isExcelMeasurementData(data: any): data is ExcelMeasurementData {
  return (
    data &&
    typeof data === 'object' &&
    'timestamp' in data &&
    (data.voltage !== undefined || data.current !== undefined)
  );
}

export function isValidExcelFormat(format: any): format is ExcelFormat {
  return (
    format &&
    typeof format === 'object' &&
    'name' in format &&
    Array.isArray(format.columns) &&
    format.columns.every((col: any) => 
      'source_column' in col && 
      'target_field' in col && 
      'data_type' in col
    )
  );
}