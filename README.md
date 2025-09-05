# Photovoltaic Disconnect Device Testing System

An industrial-grade data management system for testing photovoltaic disconnect devices, built with Next.js 15, Supabase, and deployed on Netlify.

## 🚀 Features

### Core Functionality
- **Device Management**: Add, edit, and manage PV disconnect devices with detailed specifications
- **Test Session Management**: Create and monitor test sessions with real-time data collection
- **Excel Data Import/Export**: Import test data from Excel files and export comprehensive reports
- **Real-time Dashboard**: Monitor system status, test progress, and key metrics
- **Role-based Access Control**: Engineer and Viewer roles with appropriate permissions

### Technical Features
- **Industrial UI Design**: Professional, high-end interface suitable for industrial environments
- **Real-time Updates**: Live data synchronization with Supabase
- **Comprehensive API**: RESTful API for all system operations
- **Data Validation**: Robust validation for test measurements and device specifications
- **Standards Compliance**: Support for IEC 60947-3 and UL 98B standards

## 🏗️ Architecture

### Frontend
- **Next.js 15**: React framework with App Router
- **Custom CSS**: Professional utility-first CSS system (Tailwind-like)
- **React Context**: State management for authentication and global state

### Backend
- **Supabase**: PostgreSQL database with real-time subscriptions
- **Row Level Security**: Database-level security policies
- **File Storage**: Excel file storage with Supabase Storage

### Deployment
- **Netlify**: Serverless deployment with edge functions
- **Environment Variables**: Secure credential management

## 📊 Database Schema

### Core Tables
- `devices`: PV disconnect device specifications
- `test_sessions`: Testing session metadata and status
- `test_measurements`: Individual measurement records
- `users`: User accounts and roles

### Key Relationships
- Users → Test Sessions (one-to-many)
- Devices → Test Sessions (one-to-many)
- Test Sessions → Measurements (one-to-many)

## 🛠️ Development Setup

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account

### Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Installation
```bash
# Clone repository
git clone <repository-url>
cd solartestdatacl

# Install dependencies
npm install

# Start development server
npm run dev
```

### Database Setup
1. Create a new Supabase project
2. Run the SQL migrations in `/docs/architecture.md`
3. Configure Row Level Security policies
4. Set up storage buckets for Excel files

## 🚀 Deployment

### Netlify Deployment
1. Connect repository to Netlify
2. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `.next`
3. Set environment variables
4. Deploy

### Production Configuration
- Custom domain setup
- SSL certificate configuration
- Environment variable management
- Monitoring and logging setup

## 📋 API Endpoints

### Devices
- `GET /api/devices` - List devices with filtering
- `POST /api/devices` - Create new device
- `GET /api/devices/[id]` - Get device details
- `PUT /api/devices/[id]` - Update device
- `DELETE /api/devices/[id]` - Delete device

### Test Sessions
- `GET /api/test-sessions` - List test sessions
- `POST /api/test-sessions` - Create test session
- `GET /api/test-sessions/[id]` - Get session details
- `PUT /api/test-sessions/[id]` - Update session
- `DELETE /api/test-sessions/[id]` - Delete session

### Measurements
- `GET /api/measurements` - Get measurements by session
- `POST /api/measurements` - Add measurement

### Data Import/Export
- `POST /api/excel/upload` - Import Excel data
- `GET /api/excel/export` - Export session data

## 🔐 Security

### Authentication
- Supabase Auth with email/password
- Session management with HTTP-only cookies
- Role-based access control

### Data Protection
- Row Level Security (RLS) policies
- Input validation and sanitization
- CORS and CSP headers
- Encrypted data transmission

## 📈 Testing Standards

### Supported Standards
- **IEC 60947-3**: International standard for low-voltage switchgear
- **UL 98B**: US standard for enclosed switches

### Measurement Types
- Normal operation measurements
- Calibration measurements
- Verification measurements

### Data Validation
- Voltage and current range validation
- Measurement sequence tracking
- Data integrity checks

## 🎯 User Roles

### Engineer Role
- Full system access
- Create/edit devices and test sessions
- Import/export data
- System administration

### Viewer Role
- Read-only access to data
- View dashboards and reports
- Export capabilities only

## 📊 Dashboard Features

### System Overview
- Total devices count
- Active test sessions
- Recent measurements
- System health status

### Quick Actions
- Add new device
- Create test session
- Import Excel data
- View recent activity

## 🔧 Maintenance

### Database Maintenance
- Regular backup procedures
- Performance monitoring
- Index optimization
- Storage cleanup

### System Monitoring
- Error tracking and logging
- Performance metrics
- User activity monitoring
- API usage statistics

## 📝 License

Industrial use license - Contact system administrator for details.

## 🤝 Support

For technical support or feature requests, contact the development team.

---

**Built with Next.js 15, Supabase, and deployed on Netlify**
