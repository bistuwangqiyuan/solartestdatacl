// Report generation type definitions

import { Device, TestSession, TestMeasurement, User } from './database';

export interface ReportTemplate {
  id: string;
  name: string;
  description?: string;
  report_type: ReportType;
  testing_standard: string;
  sections: ReportSection[];
  styling: ReportStyling;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type ReportType = 'full_compliance' | 'summary' | 'certificate' | 'analysis' | 'custom';

export interface ReportSection {
  id: string;
  title: string;
  type: SectionType;
  order: number;
  content?: SectionContent;
  conditions?: SectionConditions;
  page_break_after?: boolean;
}

export type SectionType = 
  | 'header'
  | 'summary'
  | 'device_info'
  | 'test_conditions'
  | 'measurements_table'
  | 'charts'
  | 'statistics'
  | 'compliance_statement'
  | 'signatures'
  | 'attachments'
  | 'custom';

export interface SectionContent {
  template?: string; // Mustache/Handlebars template
  data_source?: string; // Data field to use
  columns?: ReportColumn[]; // For tables
  chart_config?: ChartConfiguration; // For charts
  custom_content?: any; // For custom sections
}

export interface ReportColumn {
  field: string;
  header: string;
  width?: number;
  format?: string;
  alignment?: 'left' | 'center' | 'right';
  aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

export interface SectionConditions {
  show_if?: Record<string, any>; // Conditions to show section
  hide_if?: Record<string, any>; // Conditions to hide section
}

export interface ReportStyling {
  page_size: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  header?: DocumentHeader;
  footer?: DocumentFooter;
  fonts: {
    base: FontConfig;
    heading1?: FontConfig;
    heading2?: FontConfig;
    heading3?: FontConfig;
    table_header?: FontConfig;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    border: string;
  };
}

export interface DocumentHeader {
  height: number;
  content: HeaderFooterContent[];
}

export interface DocumentFooter {
  height: number;
  content: HeaderFooterContent[];
}

export interface HeaderFooterContent {
  type: 'text' | 'image' | 'page_number' | 'date' | 'line';
  value?: string;
  position: 'left' | 'center' | 'right';
  style?: any;
}

export interface FontConfig {
  family: string;
  size: number;
  weight?: 'normal' | 'bold';
  style?: 'normal' | 'italic';
  color?: string;
}

// Chart configuration for reports
export interface ChartConfiguration {
  type: ChartType;
  title?: string;
  data_config: ChartDataConfig;
  layout?: ChartLayout;
  options?: ChartOptions;
}

export type ChartType = 
  | 'line'
  | 'bar'
  | 'scatter'
  | 'area'
  | 'pie'
  | 'histogram'
  | 'box_plot'
  | 'heatmap';

export interface ChartDataConfig {
  x_field?: string;
  y_field?: string;
  series?: ChartSeries[];
  aggregation?: 'none' | 'hourly' | 'daily' | 'weekly';
  filters?: Record<string, any>;
}

export interface ChartSeries {
  name: string;
  field: string;
  type?: string;
  color?: string;
  style?: any;
}

export interface ChartLayout {
  width: number;
  height: number;
  legend_position?: 'top' | 'bottom' | 'left' | 'right' | 'none';
  grid?: boolean;
  x_axis?: AxisConfig;
  y_axis?: AxisConfig;
}

export interface AxisConfig {
  label?: string;
  min?: number;
  max?: number;
  tick_format?: string;
  grid_lines?: boolean;
}

export interface ChartOptions {
  show_values?: boolean;
  show_trend_line?: boolean;
  show_confidence_interval?: boolean;
  interactive?: boolean;
}

// Report generation context
export interface ReportContext {
  report_info: {
    title: string;
    report_number: string;
    generated_date: string;
    generated_by: User;
  };
  device: Device;
  test_session: TestSession & {
    engineer: User;
    reviewer?: User;
  };
  measurements: TestMeasurement[];
  statistics: ReportStatistics;
  compliance: ComplianceInfo;
  metadata: Record<string, any>;
}

export interface ReportStatistics {
  total_measurements: number;
  passed_measurements: number;
  failed_measurements: number;
  pass_rate: number;
  voltage: {
    min: number;
    max: number;
    avg: number;
    std_dev: number;
  };
  current: {
    min: number;
    max: number;
    avg: number;
    std_dev: number;
  };
  resistance?: {
    min: number;
    max: number;
    avg: number;
    std_dev: number;
  };
  power?: {
    min: number;
    max: number;
    avg: number;
    std_dev: number;
  };
  test_duration: {
    hours: number;
    minutes: number;
    seconds: number;
  };
}

export interface ComplianceInfo {
  standard: string;
  standard_version: string;
  compliance_status: 'compliant' | 'non_compliant' | 'conditional';
  requirements_met: ComplianceRequirement[];
  requirements_failed: ComplianceRequirement[];
  deviations: ComplianceDeviation[];
  overall_assessment: string;
}

export interface ComplianceRequirement {
  id: string;
  description: string;
  clause_reference: string;
  status: 'met' | 'not_met' | 'not_applicable';
  evidence?: string;
}

export interface ComplianceDeviation {
  parameter: string;
  expected_value: string;
  actual_value: string;
  deviation_percentage: number;
  acceptable: boolean;
  justification?: string;
}

// Digital signature for reports
export interface DigitalSignature {
  signer_id: string;
  signer_name: string;
  signer_role: string;
  signature_data: string; // Base64 encoded signature image or cryptographic signature
  signed_at: string;
  signature_type: 'electronic' | 'cryptographic';
  certificate?: string; // X.509 certificate for cryptographic signatures
}

// Report output formats
export interface ReportOutput {
  format: OutputFormat;
  file_path?: string;
  file_size?: number;
  content?: string | Buffer; // For in-memory generation
  url?: string; // For cloud storage
  expires_at?: string; // For temporary URLs
}

export type OutputFormat = 'pdf' | 'docx' | 'html' | 'excel' | 'xml';

// Report generation options
export interface ReportGenerationOptions {
  template_id?: string;
  output_format: OutputFormat;
  include_raw_data?: boolean;
  include_charts?: boolean;
  include_images?: boolean;
  watermark?: string;
  password_protect?: boolean;
  digital_signature?: boolean;
  compress?: boolean;
  metadata?: {
    title?: string;
    author?: string;
    subject?: string;
    keywords?: string[];
  };
}

// Report validation
export interface ReportValidation {
  is_valid: boolean;
  errors: ReportValidationError[];
  warnings: ReportValidationWarning[];
}

export interface ReportValidationError {
  section: string;
  field?: string;
  message: string;
  severity: 'critical' | 'major' | 'minor';
}

export interface ReportValidationWarning {
  section: string;
  message: string;
  suggestion?: string;
}

// Batch report generation
export interface BatchReportRequest {
  session_ids: string[];
  template_id: string;
  output_format: OutputFormat;
  output_location: 'inline' | 'storage' | 'email';
  notification_email?: string;
}

export interface BatchReportStatus {
  batch_id: string;
  total_reports: number;
  completed_reports: number;
  failed_reports: number;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  started_at?: string;
  completed_at?: string;
  reports: Array<{
    session_id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    output_url?: string;
    error?: string;
  }>;
}