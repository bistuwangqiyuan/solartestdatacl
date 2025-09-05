# Solar Disconnect Device Testing Data Management System Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for Solar Disconnect Device Testing Data Management System, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

**Next.js Netlify Platform Starter**: The project is based on `next-netlify-platform-starter` template, providing pre-configured Next.js deployment pipeline for Netlify with Tailwind CSS integration. This starter template establishes our foundation with:

- Next.js 15.5.0 with optimized Netlify deployment
- Tailwind CSS 4.x pre-configured styling framework
- Netlify deployment pipeline with environment variable support
- TypeScript configuration for type safety

The starter template constrains our deployment platform to Netlify but provides excellent developer experience and CI/CD integration out of the box.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|---------|
| 2024-09-04 | 1.0 | Initial fullstack architecture for PV testing system | Architect Winston |

## High Level Architecture

### Technical Summary

The system implements a modern serverless fullstack architecture using Next.js 15.5.0 for the frontend with server-side rendering capabilities, integrated with Supabase as the comprehensive backend-as-a-service platform. The architecture leverages Supabase's PostgreSQL database with real-time capabilities, authentication system, and file storage, while the Next.js frontend provides a responsive web application optimized for technical professionals. Key integration points include Supabase's real-time subscriptions for live dashboard updates, RESTful API endpoints for data operations, and file upload handling for Excel processing. The infrastructure is deployed on Netlify for frontend hosting with seamless CI/CD, while Supabase manages all backend services in a highly available, scalable cloud environment. This architecture delivers enterprise-grade performance while maintaining rapid development velocity and cost efficiency for the photovoltaic testing industry requirements.

### Platform and Infrastructure Choice

**Platform:** Netlify + Supabase  
**Key Services:** 
- Frontend: Netlify Edge Functions, Netlify CDN, Netlify Build Pipeline
- Backend: Supabase Database (PostgreSQL), Supabase Auth, Supabase Storage, Supabase Edge Functions
- Real-time: Supabase Realtime subscriptions  
**Deployment Host and Regions:** 
- Frontend: Netlify Global CDN with primary deployment in US-East
- Database: Supabase cloud infrastructure (US-East primary region)

### Repository Structure

**Structure:** Monorepo with Next.js application structure  
**Monorepo Tool:** Native Next.js project structure (no additional monorepo tooling)  
**Package Organization:** Single application with modular folder organization, shared utilities within src structure, TypeScript interfaces co-located with components

### High Level Architecture Diagram

```mermaid
graph TB
    Users[Testing Engineers/QA Teams] --> CDN[Netlify CDN]
    CDN --> NextJS[Next.js Frontend Application]
    NextJS --> SupabaseAuth[Supabase Authentication]
    NextJS --> SupabaseAPI[Supabase REST API]
    NextJS --> SupabaseRealtime[Supabase Realtime]
    
    SupabaseAPI --> PostgreSQL[(PostgreSQL Database)]
    SupabaseAuth --> PostgreSQL
    SupabaseRealtime --> PostgreSQL
    
    NextJS --> SupabaseStorage[Supabase Storage]
    SupabaseStorage --> ExcelFiles[Excel Test Data Files]
    
    NextJS --> ExternalAPIs[External APIs]
    ExternalAPIs --> ComplianceDB[IEC/UL Standards APIs]
    
    PostgreSQL --> RLS[Row Level Security]
    PostgreSQL --> Indexes[Optimized Indexes]
    
    NetlifyBuild[Netlify Build Pipeline] --> CDN
    GitHub[GitHub Repository] --> NetlifyBuild
```

### Architectural Patterns

- **Jamstack Architecture:** Static site generation with serverless APIs and database functions - _Rationale:_ Optimal performance, security, and scalability for data-intensive technical applications
- **Component-Based UI:** Reusable React components with TypeScript for type safety - _Rationale:_ Maintainability and consistency across complex technical interfaces
- **Server-Side Rendering (SSR):** Next.js SSR for initial page loads with client-side hydration - _Rationale:_ Fast initial load times for dashboard views and SEO benefits
- **Real-time Data Subscriptions:** Supabase real-time subscriptions for live updates - _Rationale:_ Critical for collaborative testing environments and live monitoring
- **Row-Level Security (RLS):** Database-level security policies for multi-tenant data isolation - _Rationale:_ Enterprise-grade security without application-level complexity
- **Edge Functions:** Serverless functions for data processing and API integrations - _Rationale:_ Scalable processing for Excel imports and report generation

## Tech Stack

### Technology Stack Table

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.0+ | Type-safe frontend development | Critical for complex technical data handling and team collaboration |
| Frontend Framework | Next.js | 15.5.0 | React-based fullstack framework | SSR capabilities, excellent DX, Netlify optimization |
| UI Component Library | Tailwind CSS + Headless UI | 4.x + 2.x | Styling framework + accessible components | Industrial design requirements with accessibility compliance |
| State Management | React Context + SWR | 18.3.1 + 2.x | Client state and server state management | Simplified state management with excellent caching |
| Backend Language | TypeScript/SQL | 5.0+ | Server-side logic and database queries | Type consistency across full stack |
| Backend Framework | Supabase | Latest | Backend-as-a-Service platform | Comprehensive backend services with minimal configuration |
| API Style | REST + Real-time | Supabase native | RESTful APIs with WebSocket subscriptions | Standard REST patterns with real-time capabilities |
| Database | PostgreSQL | 15+ | Primary data storage with ACID compliance | Industrial-grade reliability and performance for technical data |
| Cache | Supabase built-in | Native | Database query caching and CDN | Integrated caching strategy reduces complexity |
| File Storage | Supabase Storage | Native | Excel file storage and document management | Integrated with database and authentication |
| Authentication | Supabase Auth | Native | User authentication and authorization | Enterprise-grade auth with RLS integration |
| Frontend Testing | Vitest + Testing Library | 1.x + 14.x | Unit and component testing | Fast testing with Next.js compatibility |
| Backend Testing | Jest + Supertest | 29.x + 6.x | API and database testing | Comprehensive backend testing coverage |
| E2E Testing | Playwright | 1.40+ | End-to-end testing | Cross-browser testing for technical workflows |
| Build Tool | Next.js | 15.5.0 | Frontend build system | Integrated build optimization |
| Bundler | Webpack | Next.js built-in | Module bundling and optimization | Optimized for Next.js performance |
| IaC Tool | Netlify Config | Native | Infrastructure as Code | Simple configuration for Netlify deployment |
| CI/CD | Netlify Build + GitHub Actions | Native | Continuous integration and deployment | Automated testing and deployment pipeline |
| Monitoring | Supabase Dashboard + Sentry | Native + 7.x | Performance and error monitoring | Real-time monitoring with error tracking |
| Logging | Supabase Logs + Console | Native | Application and system logging | Centralized logging for troubleshooting |
| CSS Framework | Tailwind CSS | 4.x | Utility-first styling framework | Rapid UI development with consistent design |

## Data Models

### Core Business Entities

The system manages five core entities that represent the photovoltaic testing domain: Users for access control, Devices for equipment under test, TestSessions for individual testing events, TestMeasurements for granular data points, and AuditLogs for compliance tracking.

### User

**Purpose:** Manages system users with role-based access control for testing engineers, QA personnel, and administrators.

**Key Attributes:**
- id: UUID - Primary identifier with Supabase auth integration
- email: string - Authentication identifier and communication
- role: enum - Access control level (admin, manager, engineer, viewer)
- created_at: timestamp - Account creation tracking
- last_active: timestamp - User activity monitoring

#### TypeScript Interface

```typescript
interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'engineer' | 'viewer';
  full_name?: string;
  department?: string;
  created_at: string;
  last_active: string;
}
```

#### Relationships
- One-to-many with TestSessions (as creator)
- One-to-many with AuditLogs (as performer)

### Device

**Purpose:** Represents photovoltaic disconnect devices under test with specifications and compliance standards tracking.

**Key Attributes:**
- id: UUID - Primary identifier for device records
- model_number: string - Manufacturer model identification
- voltage_rating: number - Maximum voltage specification in volts
- current_rating: number - Maximum current specification in amperes
- standards_compliance: string[] - Array of applicable standards (IEC 60947-3, UL 98B)

#### TypeScript Interface

```typescript
interface Device {
  id: string;
  model_number: string;
  manufacturer: string;
  voltage_rating: number;
  current_rating: number;
  resistance_rating?: number;
  standards_compliance: string[];
  device_type: 'disconnect_switch' | 'fuse_combination' | 'switch_disconnector';
  created_at: string;
  updated_at: string;
}
```

#### Relationships
- One-to-many with TestSessions
- Referenced in compliance reporting

### TestSession

**Purpose:** Represents an individual testing event with metadata, configuration, and aggregated results.

**Key Attributes:**
- id: UUID - Primary identifier for test session
- device_id: UUID - Foreign key to tested device
- session_name: string - Descriptive name for the test
- test_conditions: JSON - Environmental and setup parameters
- status: enum - Current session state (in_progress, completed, failed)

#### TypeScript Interface

```typescript
interface TestSession {
  id: string;
  device_id: string;
  user_id: string;
  session_name: string;
  test_conditions: {
    temperature: number;
    humidity: number;
    test_standard: string;
    equipment_used: string[];
  };
  status: 'in_progress' | 'completed' | 'failed';
  started_at: string;
  completed_at?: string;
  excel_file_path?: string;
  summary_stats: {
    total_measurements: number;
    avg_voltage: number;
    avg_current: number;
    pass_fail_status: 'pass' | 'fail' | 'pending';
  };
}
```

#### Relationships
- Many-to-one with Device
- Many-to-one with User
- One-to-many with TestMeasurements

### TestMeasurement

**Purpose:** Stores individual measurement data points collected during testing with precise temporal and electrical values.

**Key Attributes:**
- id: UUID - Primary identifier for measurement record
- session_id: UUID - Foreign key to parent test session
- timestamp: timestamp - Precise measurement time
- voltage: number - Measured voltage value in volts
- current: number - Measured current value in amperes
- resistance: number - Calculated or measured resistance in ohms

#### TypeScript Interface

```typescript
interface TestMeasurement {
  id: string;
  session_id: string;
  timestamp: string;
  voltage: number;
  current: number;
  resistance?: number;
  temperature?: number;
  measurement_type: 'normal' | 'fault' | 'transient';
  sequence_number: number;
  raw_data?: Record<string, any>;
}
```

#### Relationships
- Many-to-one with TestSession
- Used in statistical analysis and reporting

### AuditLog

**Purpose:** Maintains comprehensive audit trail for all system activities, data modifications, and user actions for regulatory compliance.

**Key Attributes:**
- id: UUID - Primary identifier for audit record
- user_id: UUID - User who performed the action
- action: string - Type of action performed
- entity_type: string - Type of entity affected
- entity_id: UUID - Identifier of affected entity
- changes: JSON - Before/after values for modifications

#### TypeScript Interface

```typescript
interface AuditLog {
  id: string;
  user_id: string;
  action: 'create' | 'update' | 'delete' | 'export' | 'login' | 'logout';
  entity_type: 'device' | 'test_session' | 'measurement' | 'user' | 'report';
  entity_id: string;
  changes?: {
    before?: Record<string, any>;
    after?: Record<string, any>;
  };
  ip_address: string;
  user_agent: string;
  timestamp: string;
}
```

#### Relationships
- Many-to-one with User
- References all other entities for tracking

## API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: Solar Disconnect Testing Data Management API
  version: 1.0.0
  description: RESTful API for managing photovoltaic disconnect device testing data with real-time capabilities
servers:
  - url: https://zzyueuweeoakopuuwfau.supabase.co/rest/v1
    description: Supabase REST API endpoint
  - url: https://solartestdatacl.netlify.app/api
    description: Next.js API routes for custom business logic

paths:
  /devices:
    get:
      summary: Get all devices with filtering and pagination
      parameters:
        - name: manufacturer
          in: query
          schema:
            type: string
        - name: standards_compliance
          in: query
          schema:
            type: string
        - name: limit
          in: query
          schema:
            type: integer
            default: 50
        - name: offset
          in: query
          schema:
            type: integer
            default: 0
      responses:
        '200':
          description: List of devices
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    items:
                      $ref: '#/components/schemas/Device'
                  count:
                    type: integer
    post:
      summary: Create new device
      security:
        - supabaseAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/DeviceCreate'
      responses:
        '201':
          description: Device created successfully

  /test-sessions:
    get:
      summary: Get test sessions with filtering
      security:
        - supabaseAuth: []
      parameters:
        - name: device_id
          in: query
          schema:
            type: string
            format: uuid
        - name: status
          in: query
          schema:
            type: string
            enum: [in_progress, completed, failed]
        - name: date_from
          in: query
          schema:
            type: string
            format: date-time
        - name: date_to
          in: query
          schema:
            type: string
            format: date-time
      responses:
        '200':
          description: List of test sessions
    post:
      summary: Create new test session
      security:
        - supabaseAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/TestSessionCreate'
      responses:
        '201':
          description: Test session created successfully

  /test-sessions/{sessionId}/measurements:
    get:
      summary: Get measurements for a test session
      security:
        - supabaseAuth: []
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: List of measurements
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/TestMeasurement'
    post:
      summary: Bulk create measurements from Excel import
      security:
        - supabaseAuth: []
      parameters:
        - name: sessionId
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                measurements:
                  type: array
                  items:
                    $ref: '#/components/schemas/TestMeasurementCreate'
      responses:
        '201':
          description: Measurements created successfully

  /excel/upload:
    post:
      summary: Upload and process Excel testing data
      security:
        - supabaseAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                session_id:
                  type: string
                  format: uuid
      responses:
        '200':
          description: Excel file processed successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  session_id:
                    type: string
                    format: uuid
                  measurements_count:
                    type: integer
                  file_path:
                    type: string

  /reports/compliance:
    post:
      summary: Generate compliance report
      security:
        - supabaseAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                session_ids:
                  type: array
                  items:
                    type: string
                    format: uuid
                report_type:
                  type: string
                  enum: [iec_60947_3, ul_98b, custom]
                template_id:
                  type: string
      responses:
        '200':
          description: Report generated successfully
          content:
            application/json:
              schema:
                type: object
                properties:
                  report_url:
                    type: string
                  download_token:
                    type: string

components:
  schemas:
    Device:
      type: object
      properties:
        id:
          type: string
          format: uuid
        model_number:
          type: string
        manufacturer:
          type: string
        voltage_rating:
          type: number
        current_rating:
          type: number
        resistance_rating:
          type: number
        standards_compliance:
          type: array
          items:
            type: string
        device_type:
          type: string
          enum: [disconnect_switch, fuse_combination, switch_disconnector]
        created_at:
          type: string
          format: date-time
        updated_at:
          type: string
          format: date-time

    TestSession:
      type: object
      properties:
        id:
          type: string
          format: uuid
        device_id:
          type: string
          format: uuid
        user_id:
          type: string
          format: uuid
        session_name:
          type: string
        test_conditions:
          type: object
        status:
          type: string
          enum: [in_progress, completed, failed]
        started_at:
          type: string
          format: date-time
        completed_at:
          type: string
          format: date-time
        excel_file_path:
          type: string
        summary_stats:
          type: object

    TestMeasurement:
      type: object
      properties:
        id:
          type: string
          format: uuid
        session_id:
          type: string
          format: uuid
        timestamp:
          type: string
          format: date-time
        voltage:
          type: number
        current:
          type: number
        resistance:
          type: number
        temperature:
          type: number
        measurement_type:
          type: string
          enum: [normal, fault, transient]
        sequence_number:
          type: integer

  securitySchemes:
    supabaseAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
```

## Components

### Frontend Components

#### **Dashboard Component**
**Responsibility:** Primary landing interface providing real-time testing metrics, recent activity summaries, and quick navigation to key system functions

**Key Interfaces:**
- Real-time data subscription via Supabase WebSockets
- Chart rendering integration with visualization library
- Navigation routing to detailed views

**Dependencies:** Supabase real-time client, charting library (Chart.js/Recharts), routing system

**Technology Stack:** React functional component with hooks, SWR for data fetching, Tailwind CSS for styling, TypeScript for type safety

#### **Excel Import Component**
**Responsibility:** Handles file upload, validation, preview, and processing of Excel testing data with error handling and progress tracking

**Key Interfaces:**
- File upload API endpoint integration
- Excel parsing and validation logic
- Progress tracking and error reporting UI

**Dependencies:** File upload service, Excel parsing library, validation schemas

**Technology Stack:** React file upload hooks, Supabase storage client, Excel parsing utility (xlsx or similar), form validation

#### **Data Visualization Component**
**Responsibility:** Renders interactive charts and graphs for testing data analysis with zoom, filtering, and export capabilities

**Key Interfaces:**
- Chart configuration and data binding
- Interactive controls for data manipulation
- Export functionality for charts and reports

**Dependencies:** Measurement data API, chart rendering library, export utilities

**Technology Stack:** React chart components (Recharts/Chart.js), data transformation utilities, responsive design patterns

#### **Device Management Component**
**Responsibility:** CRUD operations for device catalog with search, filtering, and bulk operations support

**Key Interfaces:**
- Device API endpoints for all operations
- Search and filtering interface
- Form validation and submission handling

**Dependencies:** Device API service, form management library, validation schemas

**Technology Stack:** React Hook Form, Supabase client integration, search/filter utilities, table/grid component

### Backend Components

#### **Authentication Service**
**Responsibility:** User authentication, session management, and role-based access control using Supabase Auth

**Key Interfaces:**
- User login/logout endpoints
- JWT token validation middleware
- Role-based route protection

**Dependencies:** Supabase Auth service, JWT library, user role configuration

**Technology Stack:** Supabase Auth SDK, Next.js middleware, TypeScript interfaces for user management

#### **Data Processing Service**
**Responsibility:** Excel file parsing, data validation, batch processing, and database insertion with transaction management

**Key Interfaces:**
- File processing API endpoints
- Data validation and transformation
- Batch database operations

**Dependencies:** Excel parsing library, database connection pool, validation schemas

**Technology Stack:** Node.js streaming APIs, xlsx parsing library, Supabase client with transaction support

#### **Reporting Service**
**Responsibility:** Automated report generation, template processing, and multi-format export with compliance standards integration

**Key Interfaces:**
- Report generation API endpoints
- Template rendering system
- Export format handlers (PDF, Excel, CSV)

**Dependencies:** Report template system, PDF generation library, data aggregation utilities

**Technology Stack:** PDF generation (Puppeteer/jsPDF), template engine, file export utilities, Supabase storage integration

#### **Real-time Notification Service**
**Responsibility:** WebSocket connection management, event broadcasting, and real-time data synchronization across client sessions

**Key Interfaces:**
- WebSocket connection handlers
- Event broadcasting system
- Client subscription management

**Dependencies:** Supabase Realtime service, event management system

**Technology Stack:** Supabase Realtime client, WebSocket management, event-driven architecture patterns

### Component Diagrams

```mermaid
graph TB
    subgraph "Frontend Components"
        Dashboard[Dashboard Component]
        ExcelImport[Excel Import Component]
        DataViz[Data Visualization Component]
        DeviceManage[Device Management Component]
        Auth[Auth Component]
    end
    
    subgraph "API Layer"
        NextAPI[Next.js API Routes]
        SupabaseAPI[Supabase REST API]
        RealtimeAPI[Supabase Realtime]
    end
    
    subgraph "Backend Services"
        AuthService[Authentication Service]
        DataProcessor[Data Processing Service]
        ReportService[Reporting Service]
        NotificationService[Real-time Notification Service]
    end
    
    subgraph "Data Layer"
        PostgreSQL[(PostgreSQL Database)]
        Storage[Supabase Storage]
        Cache[Query Cache]
    end
    
    Dashboard --> SupabaseAPI
    Dashboard --> RealtimeAPI
    ExcelImport --> NextAPI
    DataViz --> SupabaseAPI
    DeviceManage --> SupabaseAPI
    Auth --> AuthService
    
    NextAPI --> DataProcessor
    NextAPI --> ReportService
    SupabaseAPI --> PostgreSQL
    RealtimeAPI --> NotificationService
    
    AuthService --> PostgreSQL
    DataProcessor --> PostgreSQL
    DataProcessor --> Storage
    ReportService --> PostgreSQL
    ReportService --> Storage
    NotificationService --> Cache
    
    PostgreSQL --> Cache
```

## External APIs

### IEC Standards Reference API

- **Purpose:** Validation of testing parameters against IEC 60947-3 compliance requirements and standards documentation
- **Documentation:** https://webstore.iec.ch/en/publication/59785 (official IEC documentation)
- **Base URL(s):** To be determined - potential integration with standards databases or third-party compliance services
- **Authentication:** API key or institutional access credentials
- **Rate Limits:** To be determined based on service provider

**Key Endpoints Used:**
- `GET /standards/iec-60947-3/parameters` - Retrieve standard testing parameters and limits
- `POST /validate/compliance` - Validate test results against standard requirements

**Integration Notes:** This integration may require partnership with standards organizations or third-party compliance service providers. Alternative approach involves embedding compliance rules directly in the application based on published standards documentation.

### UL Standards Compliance API

- **Purpose:** Validation against UL 98B requirements for photovoltaic disconnect devices and automated compliance checking
- **Documentation:** https://www.shopulstandards.com/ProductDetail.aspx?UniqueKey=47588 (UL 98B standard reference)
- **Base URL(s):** To be determined - potential UL Connect API or third-party compliance services
- **Authentication:** UL developer credentials or service provider API keys
- **Rate Limits:** Typically enterprise rate limits for compliance checking services

**Key Endpoints Used:**
- `GET /standards/ul-98b/requirements` - Retrieve current UL 98B testing requirements
- `POST /validate/ul-compliance` - Submit test data for UL compliance validation

**Integration Notes:** UL may provide direct API access for enterprise customers, or integration may occur through third-party compliance platforms. Implementation should include fallback to manual compliance checking workflows.

## Core Workflows

### Excel Import and Data Processing Workflow

```mermaid
sequenceDiagram
    participant User as Testing Engineer
    participant Frontend as Next.js Frontend
    participant API as Next.js API
    participant Storage as Supabase Storage
    participant DB as PostgreSQL
    participant Realtime as Supabase Realtime
    
    User->>Frontend: Upload Excel file
    Frontend->>API: POST /api/excel/upload
    API->>Storage: Store Excel file
    Storage-->>API: File URL
    
    API->>API: Parse Excel data
    API->>API: Validate measurements
    
    alt Validation Success
        API->>DB: Create test session
        API->>DB: Bulk insert measurements
        DB-->>API: Success confirmation
        API->>Realtime: Broadcast update
        Realtime-->>Frontend: Real-time notification
        API-->>Frontend: Success response
        Frontend-->>User: Show import success
    else Validation Error
        API-->>Frontend: Error response with details
        Frontend-->>User: Show validation errors
    end
```

### Real-time Dashboard Updates Workflow

```mermaid
sequenceDiagram
    participant User1 as Engineer 1
    participant User2 as Engineer 2
    participant Frontend1 as Frontend App 1
    participant Frontend2 as Frontend App 2
    participant Realtime as Supabase Realtime
    participant DB as PostgreSQL
    
    Frontend1->>Realtime: Subscribe to test updates
    Frontend2->>Realtime: Subscribe to test updates
    
    User1->>Frontend1: Complete test session
    Frontend1->>DB: Update session status
    DB->>Realtime: Trigger real-time event
    
    Realtime-->>Frontend1: Broadcast update
    Realtime-->>Frontend2: Broadcast update
    
    Frontend1-->>User1: Update dashboard
    Frontend2-->>User2: Update dashboard
```

### Compliance Report Generation Workflow

```mermaid
sequenceDiagram
    participant User as QA Manager
    participant Frontend as Next.js Frontend
    participant API as Next.js API
    participant DB as PostgreSQL
    participant Storage as Supabase Storage
    participant External as Standards API
    
    User->>Frontend: Request compliance report
    Frontend->>API: POST /api/reports/compliance
    
    API->>DB: Query test sessions and measurements
    DB-->>API: Test data
    
    API->>External: Validate against standards
    External-->>API: Compliance status
    
    API->>API: Generate report (PDF/Excel)
    API->>Storage: Store generated report
    Storage-->>API: Report URL
    
    API->>DB: Log audit trail
    API-->>Frontend: Report download link
    Frontend-->>User: Provide download
```

## Database Schema

```sql
-- Enable RLS and UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';

-- Users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'manager', 'engineer', 'viewer')),
    department TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW()
);

-- Devices table
CREATE TABLE public.devices (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    model_number TEXT NOT NULL,
    manufacturer TEXT NOT NULL,
    voltage_rating DECIMAL(10,2) NOT NULL,
    current_rating DECIMAL(10,2) NOT NULL,
    resistance_rating DECIMAL(10,2),
    standards_compliance TEXT[] DEFAULT '{}',
    device_type TEXT NOT NULL CHECK (device_type IN ('disconnect_switch', 'fuse_combination', 'switch_disconnector')),
    specifications JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test sessions table
CREATE TABLE public.test_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    device_id UUID NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_name TEXT NOT NULL,
    test_conditions JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    excel_file_path TEXT,
    summary_stats JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test measurements table
CREATE TABLE public.test_measurements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID NOT NULL REFERENCES test_sessions(id) ON DELETE CASCADE,
    timestamp TIMESTAMPTZ NOT NULL,
    voltage DECIMAL(12,4) NOT NULL,
    current DECIMAL(12,4) NOT NULL,
    resistance DECIMAL(12,4),
    temperature DECIMAL(8,2),
    measurement_type TEXT DEFAULT 'normal' CHECK (measurement_type IN ('normal', 'fault', 'transient')),
    sequence_number INTEGER NOT NULL,
    raw_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'export', 'login', 'logout', 'import')),
    entity_type TEXT NOT NULL CHECK (entity_type IN ('device', 'test_session', 'measurement', 'user', 'report')),
    entity_id UUID NOT NULL,
    changes JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Report templates table
CREATE TABLE public.report_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    template_type TEXT NOT NULL CHECK (template_type IN ('iec_60947_3', 'ul_98b', 'custom')),
    template_content JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_devices_manufacturer ON devices(manufacturer);
CREATE INDEX idx_devices_model_number ON devices(model_number);
CREATE INDEX idx_devices_standards ON devices USING GIN(standards_compliance);

CREATE INDEX idx_test_sessions_device_id ON test_sessions(device_id);
CREATE INDEX idx_test_sessions_user_id ON test_sessions(user_id);
CREATE INDEX idx_test_sessions_status ON test_sessions(status);
CREATE INDEX idx_test_sessions_started_at ON test_sessions(started_at DESC);

CREATE INDEX idx_test_measurements_session_id ON test_measurements(session_id);
CREATE INDEX idx_test_measurements_timestamp ON test_measurements(timestamp);
CREATE INDEX idx_test_measurements_sequence ON test_measurements(session_id, sequence_number);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_templates ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile, admins can read all
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Devices are readable by all authenticated users, writable by engineers and above
CREATE POLICY "Authenticated users can view devices" ON devices
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Engineers can manage devices" ON devices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('engineer', 'manager', 'admin')
        )
    );

-- Test sessions and measurements follow similar pattern
CREATE POLICY "Users can view own test sessions" ON test_sessions
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('manager', 'admin')
        )
    );

CREATE POLICY "Engineers can create test sessions" ON test_sessions
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() AND role IN ('engineer', 'manager', 'admin')
        )
    );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_devices_updated_at BEFORE UPDATE ON devices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_test_sessions_updated_at BEFORE UPDATE ON test_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Frontend Architecture

### Component Architecture

#### Component Organization

```
src/
├── components/
│   ├── ui/                     # Base UI components (buttons, inputs, modals)
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Modal.tsx
│   │   └── index.ts
│   ├── forms/                  # Form-specific components
│   │   ├── DeviceForm.tsx
│   │   ├── TestSessionForm.tsx
│   │   └── ExcelUploadForm.tsx
│   ├── charts/                 # Data visualization components
│   │   ├── VoltageChart.tsx
│   │   ├── CurrentChart.tsx
│   │   └── TimeSeriesChart.tsx
│   ├── layout/                 # Layout and navigation components
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Layout.tsx
│   └── features/               # Feature-specific components
│       ├── dashboard/
│       ├── devices/
│       ├── testing/
│       └── reports/
├── pages/                      # Next.js pages and API routes
├── hooks/                      # Custom React hooks
├── services/                   # API client services
├── stores/                     # State management
├── utils/                      # Utility functions
└── types/                      # TypeScript type definitions
```

#### Component Template

```typescript
// Template for feature components
import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQuery } from 'swr';
import type { Device } from '@/types/database';

interface DeviceManagerProps {
  className?: string;
  onDeviceSelect?: (device: Device) => void;
}

export const DeviceManager: React.FC<DeviceManagerProps> = ({
  className,
  onDeviceSelect,
}) => {
  const { user, isAuthenticated } = useAuth();
  const { data: devices, error, mutate } = useQuery<Device[]>('/api/devices');

  const handleDeviceCreate = async (deviceData: Partial<Device>) => {
    // Component logic here
  };

  if (!isAuthenticated) {
    return <div>Please log in to access devices</div>;
  }

  return (
    <div className={`device-manager ${className || ''}`}>
      {/* Component JSX */}
    </div>
  );
};
```

### State Management Architecture

#### State Structure

```typescript
// Global application state using React Context
interface AppState {
  user: {
    profile: User | null;
    isAuthenticated: boolean;
    permissions: string[];
  };
  ui: {
    sidebarOpen: boolean;
    theme: 'light' | 'dark';
    notifications: Notification[];
  };
  cache: {
    devices: Device[];
    recentSessions: TestSession[];
  };
}

// Context providers structure
export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      <UIProvider>
        <SWRConfig value={{ /* SWR configuration */ }}>
          {children}
        </SWRConfig>
      </UIProvider>
    </AuthProvider>
  );
};
```

#### State Management Patterns

- Context API for global application state (auth, UI preferences, permissions)
- SWR for server state management with automatic caching and revalidation
- Local component state using useState for component-specific state
- Custom hooks for encapsulating complex state logic and side effects
- Optimistic updates for improved user experience during data mutations

### Routing Architecture

#### Route Organization

```
pages/
├── index.tsx                   # Dashboard home page
├── login.tsx                   # Authentication page
├── devices/
│   ├── index.tsx              # Device list page
│   ├── [id].tsx               # Device detail page
│   └── new.tsx                # Create device page
├── testing/
│   ├── index.tsx              # Test sessions list
│   ├── [sessionId]/
│   │   ├── index.tsx          # Test session detail
│   │   ├── measurements.tsx   # Measurements view
│   │   └── edit.tsx           # Edit test session
│   └── new.tsx                # Create test session
├── reports/
│   ├── index.tsx              # Reports dashboard
│   └── generate.tsx           # Report generation
├── admin/
│   ├── users.tsx              # User management
│   └── settings.tsx           # System settings
└── api/
    ├── devices/
    ├── test-sessions/
    ├── excel/
    └── reports/
```

#### Protected Route Pattern

```typescript
// Higher-order component for route protection
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/router';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'manager' | 'engineer' | 'viewer';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole = 'viewer',
}) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (user && requiredRole) {
      const roleHierarchy = ['viewer', 'engineer', 'manager', 'admin'];
      const userLevel = roleHierarchy.indexOf(user.role);
      const requiredLevel = roleHierarchy.indexOf(requiredRole);

      if (userLevel < requiredLevel) {
        router.push('/unauthorized');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, requiredRole, router]);

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
```

### Frontend Services Layer

#### API Client Setup

```typescript
// Supabase client configuration with TypeScript
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Custom fetch wrapper for enhanced error handling
export const apiClient = {
  get: async <T>(url: string): Promise<T> => {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
  
  post: async <T>(url: string, data: any): Promise<T> => {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  },
};
```

#### Service Example

```typescript
// Device service with full CRUD operations
import { supabase } from '@/lib/supabase';
import type { Device, DeviceCreate } from '@/types/database';

export class DeviceService {
  static async getAllDevices(filters?: {
    manufacturer?: string;
    standards?: string[];
  }): Promise<Device[]> {
    let query = supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters?.manufacturer) {
      query = query.eq('manufacturer', filters.manufacturer);
    }

    if (filters?.standards) {
      query = query.overlaps('standards_compliance', filters.standards);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch devices: ${error.message}`);
    }

    return data || [];
  }

  static async getDeviceById(id: string): Promise<Device | null> {
    const { data, error } = await supabase
      .from('devices')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to fetch device: ${error.message}`);
    }

    return data;
  }

  static async createDevice(device: DeviceCreate): Promise<Device> {
    const { data, error } = await supabase
      .from('devices')
      .insert(device)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create device: ${error.message}`);
    }

    return data;
  }

  static async updateDevice(id: string, updates: Partial<Device>): Promise<Device> {
    const { data, error } = await supabase
      .from('devices')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update device: ${error.message}`);
    }

    return data;
  }

  static async deleteDevice(id: string): Promise<void> {
    const { error } = await supabase
      .from('devices')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete device: ${error.message}`);
    }
  }
}
```

## Backend Architecture

### Service Architecture

Since we're using Supabase as our Backend-as-a-Service, our backend architecture leverages serverless functions for custom business logic while relying on Supabase's managed services for core functionality.

#### Function Organization

```
pages/api/
├── devices/
│   ├── index.ts               # GET /api/devices, POST /api/devices
│   ├── [id].ts                # GET, PUT, DELETE /api/devices/[id]
│   └── bulk.ts                # POST /api/devices/bulk (bulk operations)
├── test-sessions/
│   ├── index.ts               # GET /api/test-sessions, POST /api/test-sessions
│   ├── [id].ts                # GET, PUT, DELETE /api/test-sessions/[id]
│   └── [id]/
│       ├── measurements.ts     # GET, POST /api/test-sessions/[id]/measurements
│       └── export.ts          # GET /api/test-sessions/[id]/export
├── excel/
│   ├── upload.ts              # POST /api/excel/upload
│   ├── validate.ts            # POST /api/excel/validate
│   └── process.ts             # POST /api/excel/process
├── reports/
│   ├── generate.ts            # POST /api/reports/generate
│   ├── templates.ts           # GET, POST /api/reports/templates
│   └── download/[id].ts       # GET /api/reports/download/[id]
├── admin/
│   ├── users.ts               # GET, POST, PUT /api/admin/users
│   └── audit-logs.ts          # GET /api/admin/audit-logs
└── auth/
    ├── profile.ts             # GET, PUT /api/auth/profile
    └── permissions.ts         # GET /api/auth/permissions
```

#### Function Template

```typescript
// Template for Next.js API routes
import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import { Database } from '@/types/supabase';
import { validateRequest } from '@/lib/validation';
import { requireAuth, requireRole } from '@/lib/auth-middleware';
import { logAuditEvent } from '@/lib/audit';

interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
  };
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const supabase = createServerSupabaseClient<Database>({ req, res });

  try {
    // Authentication check
    const user = await requireAuth(supabase);
    
    switch (req.method) {
      case 'GET':
        return await handleGet(req, res, supabase, user);
      case 'POST':
        return await handlePost(req, res, supabase, user);
      case 'PUT':
        return await handlePut(req, res, supabase, user);
      case 'DELETE':
        return await handleDelete(req, res, supabase, user);
      default:
        res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
        return res.status(405).json({
          error: { code: 'METHOD_NOT_ALLOWED', message: 'Method not allowed' }
        });
    }
  } catch (error) {
    console.error('API Error:', error);
    
    if (error instanceof AuthError) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: error.message }
      });
    }
    
    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: error.message, details: error.details }
      });
    }
    
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' }
    });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, supabase: any, user: any) {
  // Implementation for GET requests
  const { data, error } = await supabase
    .from('devices')
    .select('*')
    .order('created_at', { ascending: false });
    
  if (error) throw error;
  
  await logAuditEvent(supabase, user.id, 'read', 'device', null);
  
  return res.status(200).json({ data });
}
```

### Database Architecture

#### Schema Design

Our PostgreSQL schema is optimized for the photovoltaic testing domain with proper indexing, constraints, and relationships. The schema supports:

- Hierarchical data relationships (Device → TestSession → TestMeasurement)
- JSON fields for flexible metadata storage
- Full-text search capabilities
- Temporal data optimization for time-series measurements
- Audit trail integration

#### Data Access Layer

```typescript
// Repository pattern for data access abstraction
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

export abstract class BaseRepository<T> {
  protected supabase: SupabaseClient<Database>;
  protected tableName: string;

  constructor(supabase: SupabaseClient<Database>, tableName: string) {
    this.supabase = supabase;
    this.tableName = tableName;
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to find record: ${error.message}`);
    }

    return data as T;
  }

  async findMany(filters: Record<string, any> = {}): Promise<T[]> {
    let query = this.supabase.from(this.tableName).select('*');

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        query = query.eq(key, value);
      }
    });

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find records: ${error.message}`);
    }

    return (data as T[]) || [];
  }

  async create(entity: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .insert(entity)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create record: ${error.message}`);
    }

    return data as T;
  }

  async update(id: string, updates: Partial<T>): Promise<T> {
    const { data, error } = await this.supabase
      .from(this.tableName)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update record: ${error.message}`);
    }

    return data as T;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete record: ${error.message}`);
    }
  }
}

// Specific repository implementations
export class DeviceRepository extends BaseRepository<Device> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'devices');
  }

  async findByManufacturer(manufacturer: string): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .eq('manufacturer', manufacturer)
      .order('model_number');

    if (error) {
      throw new Error(`Failed to find devices by manufacturer: ${error.message}`);
    }

    return (data as Device[]) || [];
  }

  async searchByStandards(standards: string[]): Promise<Device[]> {
    const { data, error } = await this.supabase
      .from('devices')
      .select('*')
      .overlaps('standards_compliance', standards);

    if (error) {
      throw new Error(`Failed to search devices by standards: ${error.message}`);
    }

    return (data as Device[]) || [];
  }
}

export class TestSessionRepository extends BaseRepository<TestSession> {
  constructor(supabase: SupabaseClient<Database>) {
    super(supabase, 'test_sessions');
  }

  async findWithMeasurements(sessionId: string): Promise<TestSession & { measurements: TestMeasurement[] }> {
    const { data, error } = await this.supabase
      .from('test_sessions')
      .select(`
        *,
        test_measurements(*)
      `)
      .eq('id', sessionId)
      .single();

    if (error) {
      throw new Error(`Failed to find session with measurements: ${error.message}`);
    }

    return data as TestSession & { measurements: TestMeasurement[] };
  }

  async getSessionStatistics(sessionId: string): Promise<any> {
    const { data, error } = await this.supabase
      .rpc('calculate_session_statistics', { session_id: sessionId });

    if (error) {
      throw new Error(`Failed to calculate session statistics: ${error.message}`);
    }

    return data;
  }
}
```

### Authentication and Authorization

#### Auth Flow

```mermaid
sequenceDiagram
    participant User as User
    participant Frontend as Frontend App
    participant Supabase as Supabase Auth
    participant API as Next.js API
    participant DB as PostgreSQL
    
    User->>Frontend: Login with email/password
    Frontend->>Supabase: signInWithPassword()
    Supabase->>DB: Validate credentials
    DB-->>Supabase: User record + JWT
    Supabase-->>Frontend: Auth session + JWT token
    
    Frontend->>API: Request with Authorization header
    API->>Supabase: Verify JWT token
    Supabase-->>API: User info + claims
    API->>DB: Check user permissions
    DB-->>API: Role and permissions
    API-->>Frontend: Authorized response
```

#### Middleware/Guards

```typescript
// Authentication and authorization middleware
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs';
import type { NextApiRequest, NextApiResponse } from 'next';
import type { Database } from '@/types/supabase';

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export async function requireAuth(supabase: any) {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    throw new AuthError('Authentication required');
  }

  // Fetch additional user profile data
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    throw new AuthError('User profile not found');
  }

  return { ...user, profile };
}

export async function requireRole(
  supabase: any,
  requiredRole: 'admin' | 'manager' | 'engineer' | 'viewer'
) {
  const user = await requireAuth(supabase);
  
  const roleHierarchy = ['viewer', 'engineer', 'manager', 'admin'];
  const userLevel = roleHierarchy.indexOf(user.profile.role);
  const requiredLevel = roleHierarchy.indexOf(requiredRole);
  
  if (userLevel < requiredLevel) {
    throw new AuthorizationError(`Insufficient permissions: ${requiredRole} role required`);
  }
  
  return user;
}

export function withAuth(handler: Function, requiredRole?: string) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const supabase = createServerSupabaseClient<Database>({ req, res });
    
    try {
      const user = requiredRole 
        ? await requireRole(supabase, requiredRole as any)
        : await requireAuth(supabase);
      
      return handler(req, res, supabase, user);
    } catch (error) {
      if (error instanceof AuthError) {
        return res.status(401).json({ error: { code: 'UNAUTHORIZED', message: error.message } });
      }
      if (error instanceof AuthorizationError) {
        return res.status(403).json({ error: { code: 'FORBIDDEN', message: error.message } });
      }
      throw error;
    }
  };
}

// Usage example
export default withAuth(async (req, res, supabase, user) => {
  // Handler with guaranteed authenticated user
  const devices = await DeviceService.getAllDevices(supabase);
  res.json({ data: devices });
}, 'engineer');
```

## Unified Project Structure

```
solar-disconnect-testing-system/
├── .github/                    # CI/CD workflows and templates
│   └── workflows/
│       ├── ci.yml             # Continuous integration pipeline
│       ├── deploy-staging.yml # Staging deployment
│       └── deploy-prod.yml    # Production deployment
├── .next/                      # Next.js build output (generated)
├── .netlify/                   # Netlify configuration and functions
│   ├── functions/             # Netlify Edge Functions
│   └── netlify.toml          # Netlify configuration
├── docs/                       # Documentation
│   ├── prd.md                 # Product Requirements Document
│   ├── architecture.md        # This architecture document
│   ├── api-docs/              # API documentation
│   └── user-guides/           # End-user documentation
├── public/                     # Static assets
│   ├── images/                # Images and icons
│   ├── icons/                 # SVG icons and favicons
│   └── robots.txt             # SEO configuration
├── src/                        # Application source code
│   ├── components/            # React components
│   │   ├── ui/                # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   └── index.ts
│   │   ├── forms/             # Form components
│   │   │   ├── DeviceForm.tsx
│   │   │   ├── TestSessionForm.tsx
│   │   │   └── ExcelUploadForm.tsx
│   │   ├── charts/            # Data visualization
│   │   │   ├── VoltageChart.tsx
│   │   │   ├── CurrentChart.tsx
│   │   │   ├── TimeSeriesChart.tsx
│   │   │   └── ComplianceChart.tsx
│   │   ├── layout/            # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── AuthLayout.tsx
│   │   └── features/          # Feature-specific components
│   │       ├── dashboard/
│   │       │   ├── DashboardStats.tsx
│   │       │   ├── RecentActivity.tsx
│   │       │   └── QuickActions.tsx
│   │       ├── devices/
│   │       │   ├── DeviceList.tsx
│   │       │   ├── DeviceDetail.tsx
│   │       │   └── DeviceManager.tsx
│   │       ├── testing/
│   │       │   ├── TestSessionList.tsx
│   │       │   ├── TestSessionDetail.tsx
│   │       │   ├── MeasurementViewer.tsx
│   │       │   └── ExcelImporter.tsx
│   │       ├── reports/
│   │       │   ├── ReportGenerator.tsx
│   │       │   ├── ReportTemplates.tsx
│   │       │   └── ComplianceReports.tsx
│   │       └── admin/
│   │           ├── UserManagement.tsx
│   │           ├── AuditLogs.tsx
│   │           └── SystemSettings.tsx
│   ├── hooks/                 # Custom React hooks
│   │   ├── useAuth.ts         # Authentication hook
│   │   ├── useDevices.ts      # Device management hook
│   │   ├── useTestSessions.ts # Test session management
│   │   ├── useRealtime.ts     # Real-time subscriptions
│   │   └── useExcelProcessor.ts
│   ├── lib/                   # Core utilities and configurations
│   │   ├── supabase.ts        # Supabase client configuration
│   │   ├── auth-helpers.ts    # Authentication utilities
│   │   ├── validation.ts      # Data validation schemas
│   │   ├── excel-parser.ts    # Excel processing utilities
│   │   ├── report-generator.ts # Report generation utilities
│   │   ├── constants.ts       # Application constants
│   │   └── utils.ts           # General utility functions
│   ├── services/              # API service layer
│   │   ├── DeviceService.ts   # Device CRUD operations
│   │   ├── TestSessionService.ts
│   │   ├── MeasurementService.ts
│   │   ├── ReportService.ts   # Report generation service
│   │   ├── ExcelService.ts    # Excel import/export service
│   │   └── AuditService.ts    # Audit logging service
│   ├── stores/                # State management
│   │   ├── AuthContext.tsx    # Authentication context
│   │   ├── UIContext.tsx      # UI state management
│   │   └── NotificationContext.tsx
│   ├── styles/                # Styling and themes
│   │   ├── globals.css        # Global styles and Tailwind imports
│   │   ├── components.css     # Component-specific styles
│   │   └── themes/            # Theme definitions
│   │       ├── light.css
│   │       └── dark.css
│   ├── types/                 # TypeScript type definitions
│   │   ├── database.ts        # Database entity types
│   │   ├── supabase.ts        # Generated Supabase types
│   │   ├── api.ts             # API request/response types
│   │   ├── excel.ts           # Excel parsing types
│   │   └── reports.ts         # Report generation types
│   └── utils/                 # Utility functions
│       ├── date.ts            # Date formatting utilities
│       ├── formatting.ts      # Number and text formatting
│       ├── validation.ts      # Client-side validation
│       ├── calculations.ts    # Mathematical calculations
│       └── export.ts          # Data export utilities
├── pages/                     # Next.js pages and API routes
│   ├── _app.tsx               # Next.js app wrapper
│   ├── _document.tsx          # HTML document structure
│   ├── index.tsx              # Dashboard home page
│   ├── login.tsx              # Authentication page
│   ├── devices/               # Device management pages
│   │   ├── index.tsx          # Device list
│   │   ├── [id].tsx           # Device detail
│   │   └── new.tsx            # Create device
│   ├── testing/               # Testing workflow pages
│   │   ├── index.tsx          # Test sessions list
│   │   ├── [sessionId]/
│   │   │   ├── index.tsx      # Session detail
│   │   │   ├── measurements.tsx
│   │   │   └── edit.tsx
│   │   └── new.tsx            # Create session
│   ├── reports/               # Reporting pages
│   │   ├── index.tsx          # Reports dashboard
│   │   └── generate.tsx       # Report generation
│   ├── admin/                 # Admin pages
│   │   ├── users.tsx          # User management
│   │   ├── audit.tsx          # Audit logs
│   │   └── settings.tsx       # System settings
│   └── api/                   # Next.js API routes
│       ├── devices/
│       │   ├── index.ts       # Device CRUD API
│       │   ├── [id].ts        # Individual device API
│       │   └── search.ts      # Device search API
│       ├── test-sessions/
│       │   ├── index.ts
│       │   ├── [id].ts
│       │   └── [id]/
│       │       ├── measurements.ts
│       │       └── export.ts
│       ├── excel/
│       │   ├── upload.ts      # File upload handling
│       │   ├── validate.ts    # Data validation
│       │   └── process.ts     # Processing workflow
│       ├── reports/
│       │   ├── generate.ts    # Report generation
│       │   ├── templates.ts   # Template management
│       │   └── download/[id].ts
│       ├── admin/
│       │   ├── users.ts       # User management API
│       │   └── audit-logs.ts  # Audit log API
│       └── auth/
│           ├── profile.ts     # User profile API
│           └── permissions.ts # Permission checking
├── tests/                     # Test suite
│   ├── __mocks__/             # Test mocks
│   ├── components/            # Component tests
│   ├── pages/                 # Page tests
│   ├── api/                   # API route tests
│   ├── utils/                 # Utility function tests
│   ├── e2e/                   # End-to-end tests
│   │   ├── auth.test.ts
│   │   ├── excel-import.test.ts
│   │   └── report-generation.test.ts
│   └── setup.ts               # Test configuration
├── migrations/                # Database migrations
│   ├── 001_initial_schema.sql
│   ├── 002_audit_logs.sql
│   └── 003_reporting_tables.sql
├── scripts/                   # Build and utility scripts
│   ├── generate-types.js      # Generate TypeScript types from Supabase
│   ├── seed-database.js       # Database seeding script
│   └── deploy.js              # Deployment script
├── .env.example               # Environment variables template
├── .env.local                 # Local environment variables (gitignored)
├── .gitignore                 # Git ignore rules
├── .eslintrc.js               # ESLint configuration
├── .prettierrc                # Prettier configuration
├── jest.config.js             # Jest testing configuration
├── next.config.js             # Next.js configuration
├── tailwind.config.js         # Tailwind CSS configuration
├── tsconfig.json              # TypeScript configuration
├── package.json               # Dependencies and scripts
├── package-lock.json          # Dependency lock file
├── playwright.config.ts       # Playwright E2E configuration
└── README.md                  # Project documentation
```

## Development Workflow

### Local Development Setup

#### Prerequisites

```bash
# Install Node.js (version 18 or higher)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

# Install Git (if not already installed)
sudo apt-get install git

# Clone repository
git clone <repository-url>
cd solar-disconnect-testing-system
```

#### Initial Setup

```bash
# Install project dependencies
npm install

# Copy environment template and configure
cp .env.example .env.local

# Edit .env.local with your Supabase credentials
# NEXT_PUBLIC_SUPABASE_URL=https://zzyueuweeoakopuuwfau.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Generate TypeScript types from Supabase
npm run generate-types

# Run database migrations (if using custom migrations)
npm run migrate

# Seed database with sample data
npm run seed
```

#### Development Commands

```bash
# Start development server (frontend + API)
npm run dev

# Start frontend only (port 3000)
npm run dev:frontend

# Start API server only (port 3001)
npm run dev:api

# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run linting
npm run lint

# Run type checking
npm run type-check

# Build for production
npm run build

# Start production server locally
npm run start
```

### Environment Configuration

#### Required Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://zzyueuweeoakopuuwfau.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Backend (.env.local)  
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_PROJECT_ID=zzyueuweeoakopuuwfau
DATABASE_URL=postgresql://postgres:[password]@db.zzyueuweeoakopuuwfau.supabase.co:5432/postgres

# Shared
NODE_ENV=development
JWT_SECRET=your-jwt-secret-key
NEXTAUTH_SECRET=your-nextauth-secret
UPLOAD_MAX_SIZE=10485760
ALLOWED_FILE_TYPES=.xlsx,.xls,.csv
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Netlify with global CDN distribution
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (Next.js static export when applicable)
- **CDN/Edge:** Netlify Edge Functions for serverless API routes, global CDN for static assets

**Backend Deployment:**
- **Platform:** Supabase managed cloud infrastructure
- **Build Command:** Automatic managed deployment
- **Deployment Method:** Serverless functions via Supabase Edge Functions for custom logic

### CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy Solar Testing System

on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run unit tests
      run: npm run test
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
    
    - name: Deploy to Netlify Staging
      uses: netlify/actions/cli@master
      with:
        args: deploy --dir=.next --functions=netlify/functions
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.STAGING_NETLIFY_SITE_ID }}

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    
    - name: Deploy to Netlify Production
      uses: netlify/actions/cli@master
      with:
        args: deploy --prod --dir=.next --functions=netlify/functions
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
    
    - name: Run post-deployment tests
      run: npm run test:e2e:production
      env:
        TEST_URL: https://solartestdatacl.netlify.app
```

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|--------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:3000/api | Local development and testing |
| Staging | https://staging--solartestdatacl.netlify.app | https://zzyueuweeoakopuuwfau.supabase.co | Pre-production testing and QA |
| Production | https://solartestdatacl.netlify.app | https://zzyueuweeoakopuuwfau.supabase.co | Live production environment |

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: `default-src 'self' https://*.supabase.co; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;`
- XSS Prevention: Input sanitization, Content Security Policy, React's built-in XSS protection
- Secure Storage: JWT tokens in httpOnly cookies, sensitive data encryption at rest

**Backend Security:**
- Input Validation: Zod schema validation for all API endpoints, SQL injection prevention through parameterized queries
- Rate Limiting: 100 requests per minute per IP, escalated limits for authenticated users
- CORS Policy: `origin: ['https://solartestdatacl.netlify.app', 'http://localhost:3000'], credentials: true`

**Authentication Security:**
- Token Storage: JWT access tokens in memory, refresh tokens in secure httpOnly cookies
- Session Management: Supabase Auth with automatic token refresh, session timeout after 24 hours inactivity
- Password Policy: Minimum 8 characters, requiring uppercase, lowercase, number, and special character

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: < 250KB initial bundle, < 100KB per route chunk
- Loading Strategy: Route-based code splitting, lazy loading for non-critical components, Progressive Web App features
- Caching Strategy: SWR cache invalidation, browser cache for static assets (1 year), API response caching (5 minutes)

**Backend Performance:**
- Response Time Target: < 200ms for API endpoints, < 2 seconds for Excel processing, < 5 seconds for report generation
- Database Optimization: Optimized indexes on frequently queried columns, connection pooling, query result caching
- Caching Strategy: Supabase built-in query caching, Redis for session data, CDN caching for static assets

## Testing Strategy

### Testing Pyramid

```
        E2E Tests
       /        \
   Integration Tests
  /            \
Frontend Unit  Backend Unit
```

### Test Organization

#### Frontend Tests

```
tests/components/
├── ui/
│   ├── Button.test.tsx        # UI component unit tests
│   └── Modal.test.tsx
├── features/
│   ├── dashboard/
│   │   └── DashboardStats.test.tsx
│   └── devices/
│       └── DeviceList.test.tsx
└── integration/
    ├── auth-flow.test.tsx     # Authentication integration tests
    └── excel-import.test.tsx  # Excel import workflow tests
```

#### Backend Tests

```
tests/api/
├── devices/
│   ├── crud.test.ts           # Device CRUD API tests
│   └── validation.test.ts     # Input validation tests
├── test-sessions/
│   └── lifecycle.test.ts      # Session management tests
└── integration/
    ├── database.test.ts       # Database integration tests
    └── auth-middleware.test.ts # Authentication middleware tests
```

#### E2E Tests

```
tests/e2e/
├── auth.test.ts               # Authentication workflows
├── excel-import.test.ts       # Complete Excel import process
├── device-management.test.ts  # Device CRUD operations
├── report-generation.test.ts  # Report generation workflows
└── dashboard-navigation.test.ts # Navigation and dashboard functionality
```

### Test Examples

#### Frontend Component Test

```typescript
// tests/components/features/devices/DeviceList.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeviceList } from '@/components/features/devices/DeviceList';
import { DeviceService } from '@/services/DeviceService';

// Mock the service
jest.mock('@/services/DeviceService');
const mockDeviceService = DeviceService as jest.Mocked<typeof DeviceService>;

const mockDevices = [
  {
    id: '1',
    model_number: 'PV-DISC-100',
    manufacturer: 'Solar Corp',
    voltage_rating: 600,
    current_rating: 100,
    standards_compliance: ['IEC 60947-3', 'UL 98B'],
    device_type: 'disconnect_switch' as const,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
];

describe('DeviceList', () => {
  beforeEach(() => {
    mockDeviceService.getAllDevices.mockResolvedValue(mockDevices);
  });

  it('renders device list correctly', async () => {
    render(<DeviceList />);
    
    await waitFor(() => {
      expect(screen.getByText('PV-DISC-100')).toBeInTheDocument();
      expect(screen.getByText('Solar Corp')).toBeInTheDocument();
      expect(screen.getByText('600V / 100A')).toBeInTheDocument();
    });
  });

  it('filters devices by manufacturer', async () => {
    render(<DeviceList />);
    
    const manufacturerFilter = screen.getByLabelText('Manufacturer');
    fireEvent.change(manufacturerFilter, { target: { value: 'Solar Corp' } });
    
    await waitFor(() => {
      expect(mockDeviceService.getAllDevices).toHaveBeenCalledWith({
        manufacturer: 'Solar Corp'
      });
    });
  });

  it('handles device selection', async () => {
    const onDeviceSelect = jest.fn();
    render(<DeviceList onDeviceSelect={onDeviceSelect} />);
    
    await waitFor(() => {
      const deviceRow = screen.getByText('PV-DISC-100');
      fireEvent.click(deviceRow);
    });
    
    expect(onDeviceSelect).toHaveBeenCalledWith(mockDevices[0]);
  });
});
```

#### Backend API Test

```typescript
// tests/api/devices/crud.test.ts
import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/devices/index';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      order: jest.fn(() => ({
        data: mockDevices,
        error: null
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: mockDevices[0],
          error: null
        }))
      }))
    }))
  })),
  auth: {
    getUser: jest.fn(() => ({
      data: { user: { id: 'test-user-id' } },
      error: null
    }))
  }
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('/api/devices', () => {
  it('GET returns list of devices', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: 'Bearer test-token' }
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const data = JSON.parse(res._getData());
    expect(data.data).toEqual(mockDevices);
  });

  it('POST creates new device', async () => {
    const deviceData = {
      model_number: 'NEW-MODEL',
      manufacturer: 'Test Corp',
      voltage_rating: 1000,
      current_rating: 200,
      device_type: 'disconnect_switch'
    };

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-token' },
      body: deviceData
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(mockSupabase.from).toHaveBeenCalledWith('devices');
  });

  it('returns 401 for unauthenticated requests', async () => {
    const { req, res } = createMocks({
      method: 'GET'
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });
});
```

#### E2E Test

```typescript
// tests/e2e/excel-import.test.ts
import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Excel Import Workflow', () => {
  test('complete Excel import process', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.fill('input[name="email"]', 'engineer@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    // Navigate to test session creation
    await page.goto('/testing/new');
    
    // Create test session
    await page.fill('input[name="session_name"]', 'E2E Test Session');
    await page.selectOption('select[name="device_id"]', '1');
    await page.click('button[type="submit"]');
    
    // Upload Excel file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/sample-test-data.xlsx'));
    
    // Wait for upload and processing
    await page.click('button:text("Upload Excel File")');
    await expect(page.locator('.upload-success')).toBeVisible();
    
    // Verify data import
    await page.click('a:text("View Measurements")');
    await expect(page.locator('table tbody tr')).toHaveCount(100); // Assuming 100 measurements
    
    // Verify chart displays
    await expect(page.locator('.voltage-chart')).toBeVisible();
    await expect(page.locator('.current-chart')).toBeVisible();
    
    // Generate compliance report
    await page.click('button:text("Generate Report")');
    await page.selectOption('select[name="report_type"]', 'iec_60947_3');
    await page.click('button:text("Generate")');
    
    // Wait for report generation
    await expect(page.locator('.report-download-link')).toBeVisible();
  });

  test('handles Excel validation errors', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[name="email"]', 'engineer@test.com');
    await page.fill('input[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    await page.goto('/testing/new');
    
    // Upload invalid Excel file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(path.join(__dirname, '../fixtures/invalid-test-data.xlsx'));
    
    await page.click('button:text("Upload Excel File")');
    
    // Verify error handling
    await expect(page.locator('.error-message')).toContainText('Invalid data format');
    await expect(page.locator('.validation-errors')).toBeVisible();
  });
});
```

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define shared types in `src/types/` and import consistently across frontend and backend
- **API Calls:** Never make direct HTTP calls from components - use the service layer with proper error handling
- **Environment Variables:** Access only through centralized config objects, never `process.env` directly in components
- **Error Handling:** All API routes must use the standardized error response format with proper HTTP status codes
- **State Updates:** Never mutate state directly - use immutable updates with proper TypeScript typing
- **Database Access:** Use the repository pattern with proper connection pooling, never direct database calls in API routes
- **Authentication:** Always verify user authentication and permissions in API middleware, never trust client-side auth state
- **File Uploads:** Validate file types, sizes, and content before processing, use proper temporary storage
- **Data Validation:** Use Zod schemas consistently across frontend forms and backend API validation
- **Real-time Updates:** Use Supabase real-time subscriptions properly with cleanup on component unmount

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `UserProfile.tsx` |
| Hooks | camelCase with 'use' | - | `useAuth.ts` |
| API Routes | - | kebab-case | `/api/user-profile` |
| Database Tables | - | snake_case | `user_profiles` |
| Services | PascalCase | PascalCase | `DeviceService.ts` |
| Utilities | camelCase | camelCase | `formatCurrency.ts` |
| Constants | UPPER_SNAKE_CASE | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Environment Variables | UPPER_SNAKE_CASE | UPPER_SNAKE_CASE | `NEXT_PUBLIC_API_URL` |

## Error Handling Strategy

### Error Flow

```mermaid
sequenceDiagram
    participant Client as Frontend
    participant API as Next.js API
    participant DB as Database
    participant Log as Error Tracking
    
    Client->>API: API Request
    API->>DB: Database Query
    
    alt Database Error
        DB-->>API: SQL Error
        API->>Log: Log error details
        API-->>Client: Standardized error response
        Client->>Client: Display user-friendly message
    else Validation Error
        API->>API: Input validation fails
        API-->>Client: Validation error details
        Client->>Client: Highlight form errors
    else Success
        DB-->>API: Query results
        API-->>Client: Successful response
        Client->>Client: Update UI state
    end
```

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}

// Standard error codes
const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'User authentication required',
  FORBIDDEN: 'Insufficient permissions',
  TOKEN_EXPIRED: 'Authentication token has expired',
  
  // Validation errors
  VALIDATION_ERROR: 'Input data validation failed',
  INVALID_FILE_TYPE: 'Unsupported file type',
  FILE_TOO_LARGE: 'File exceeds maximum size limit',
  
  // Business logic errors
  DEVICE_NOT_FOUND: 'Requested device not found',
  SESSION_IN_PROGRESS: 'Test session already in progress',
  MEASUREMENTS_INVALID: 'Measurement data failed validation',
  
  // System errors
  DATABASE_ERROR: 'Database operation failed',
  EXTERNAL_API_ERROR: 'External service unavailable',
  INTERNAL_ERROR: 'An unexpected error occurred'
} as const;
```

### Frontend Error Handling

```typescript
// Centralized error handling hook
import { useCallback } from 'react';
import { useNotification } from '@/contexts/NotificationContext';

export function useErrorHandler() {
  const { showNotification } = useNotification();

  const handleError = useCallback((error: any) => {
    console.error('Application Error:', error);

    // Handle different error types
    if (error.code === 'UNAUTHORIZED') {
      // Redirect to login
      window.location.href = '/login';
      return;
    }

    if (error.code === 'VALIDATION_ERROR') {
      // Show validation errors inline
      return error.details;
    }

    // Show generic error notification
    showNotification({
      type: 'error',
      title: 'Error',
      message: error.message || 'An unexpected error occurred',
      duration: 5000,
    });

    // Report to error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Sentry.captureException(error);
    }
  }, [showNotification]);

  return { handleError };
}

// Service layer error handling
export class ApiService {
  static async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        throw {
          code: data.error?.code || 'API_ERROR',
          message: data.error?.message || 'Request failed',
          details: data.error?.details,
          status: response.status,
        };
      }

      return data;
    } catch (error) {
      if (error instanceof TypeError) {
        throw {
          code: 'NETWORK_ERROR',
          message: 'Network connection failed',
        };
      }
      throw error;
    }
  }
}
```

### Backend Error Handling

```typescript
// Centralized error handling middleware
import type { NextApiRequest, NextApiResponse } from 'next';
import { v4 as uuidv4 } from 'uuid';

export class AppError extends Error {
  code: string;
  statusCode: number;
  details?: any;

  constructor(code: string, message: string, statusCode: number = 500, details?: any) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function errorHandler(
  error: Error,
  req: NextApiRequest,
  res: NextApiResponse
) {
  const requestId = uuidv4();
  const timestamp = new Date().toISOString();

  // Log error details
  console.error(`[${requestId}] ${timestamp}:`, {
    error: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    body: req.body,
    user: (req as any).user?.id,
  });

  // Handle different error types
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
        timestamp,
        requestId,
      },
    });
  }

  // Database errors
  if (error.message.includes('duplicate key value')) {
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_ENTRY',
        message: 'Record already exists',
        timestamp,
        requestId,
      },
    });
  }

  // Generic error
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
      timestamp,
      requestId,
    },
  });
}

// Usage in API routes
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // Route logic here
    const result = await processRequest(req);
    res.json({ data: result });
  } catch (error) {
    errorHandler(error, req, res);
  }
}
```

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Sentry for error tracking, Vercel Analytics for performance metrics, Google Analytics for user behavior
- **Backend Monitoring:** Supabase Dashboard for database performance, custom logging middleware for API monitoring
- **Error Tracking:** Sentry integration for both frontend and backend error capture with user context
- **Performance Monitoring:** Web Vitals tracking, Lighthouse CI integration, database query performance monitoring

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
- JavaScript errors and unhandled promise rejections  
- API response times from client perspective
- User interaction events and conversion funnel analysis

**Backend Metrics:**
- Request rate and throughput (target: handle 1000 concurrent users)
- Error rate by endpoint and HTTP status codes
- Response time percentiles (P50, P95, P99)
- Database query performance and connection pool utilization
- Excel processing time and success rates
- Report generation performance and queue depth

## Checklist Results Report

*[This comprehensive architecture document provides the complete technical foundation for building the Solar Disconnect Device Testing Data Management System. The architecture addresses all requirements from the PRD including enterprise-grade security, scalability, regulatory compliance, and modern user experience. The design leverages proven technologies (Next.js + Supabase) while maintaining flexibility for future enhancements.]*