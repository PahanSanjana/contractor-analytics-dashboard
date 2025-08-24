# IC Dashboard - Individual Contractor Analytics & Management System

A comprehensive dashboard for managing and analyzing individual contractor information with advanced filtering, analytics, and data entry capabilities.

## 🚀 New Features Added

### 1. **Sector & Designation Analysis** 📊
- **Filter by Sector**: Separate section to retrieve data of consultants in the same field
- **Sector Statistics**: View total consultants, average rates, and total duration per sector
- **Interactive Sector Selection**: Click on sector chips to filter data
- **Visual Sector Cards**: Color-coded sector information with key metrics

### 2. **Accumulative Duration Analysis** ⏱️
- **Total Duration Calculation**: Shows accumulative duration of consultants across different contracts
- **Multi-Contract Support**: Handles consultants who have worked on multiple projects
- **Duration Formatting**: Automatically converts days to months/years for better readability
- **Top Consultants Ranking**: Highlights top 5 consultants by total duration
- **Sortable Data Table**: Sort by name, duration, rate, or number of contracts

### 3. **Enhanced Rate Distribution Chart** 📈
- **Clickable Bars**: Click on any bar to view detailed consultant information for that rate range
- **Consultant Details Dialog**: Comprehensive view of all consultants in selected rate range
- **Improved Chart Design**: Better spacing, colors, and tooltips
- **Rate Range Analysis**: Clear visualization of contractor distribution by daily rates

### 4. **Advanced Search & Filtering** 🔍
- **Search Type Selection**: Choose between All Columns, Name Only, or Designation
- **First & Last Name Search**: Dedicated search functionality for consultant names
- **Real-time Filtering**: Instant results as you type
- **Search Type Indicators**: Clear visual feedback on current search mode

### 5. **Data Entry Form** ➕
- **Add New Entries**: Comprehensive form for adding new contractor data
- **Year Selection**: Choose the year for new entries
- **Sheet Selection**: Select which Excel sheet to add data to
- **Auto-calculation**: Automatically calculates total rates based on duration and daily rates
- **Form Validation**: Built-in validation with helpful error messages
- **Common Designations**: Auto-complete suggestions for common job titles

### 6. **Improved UI/UX Design** 🎨
- **Modern Theme**: Professional color scheme with logo-inspired colors
- **Tabbed Interface**: Organized sections for different dashboard functions
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Enhanced Typography**: Better readability with improved font weights and spacing
- **Gradient Backgrounds**: Subtle gradients for visual appeal
- **Interactive Elements**: Hover effects, smooth transitions, and visual feedback

### 7. **Enhanced Data Table** 📋
- **Better Column Alignment**: Proper spacing and alignment for all data columns
- **Improved Readability**: Clear cell formatting with adequate spacing
- **Sortable Columns**: Click headers to sort data
- **Responsive Grid**: Adapts to different screen sizes
- **Enhanced Styling**: Better borders, hover effects, and color coding

## 🛠️ Technical Improvements

- **Component Architecture**: Modular React components for better maintainability
- **State Management**: Efficient state handling with React hooks
- **Performance Optimization**: Optimized filtering and search algorithms
- **Error Handling**: Comprehensive error handling and user feedback
- **Responsive Design**: Mobile-first approach with Material-UI components

## 📱 Dashboard Sections

### **Data Table Tab**
- Main data view with enhanced search and filtering
- Improved table styling and column management
- Real-time search across all columns or specific fields

### **Sector Analysis Tab**
- Filter contractors by sector/designation
- Sector statistics and metrics
- Visual sector representation with color coding

### **Duration Analysis Tab**
- Accumulative duration calculations
- Top consultants ranking
- Detailed duration analysis table

### **Add New Data Tab**
- Comprehensive data entry form
- Year and sheet selection
- Form validation and auto-calculation

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Dashbord
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Start the backend server**
   ```bash
   cd ../backend
   npm start
   ```

5. **Start the frontend development server**
   ```bash
   cd ../frontend
   npm run dev
   ```

6. **Open your browser**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 📊 Data Structure

The dashboard expects Excel files with the following column structure:
- **No.**: Entry number
- **First Name**: Consultant's first name
- **Last Name**: Consultant's last name
- **Designation**: Job title or role
- **Duration**: Contract duration in days
- **Per day Rate in LKR**: Daily rate in Sri Lankan Rupees
- **Per day Rate in USD**: Daily rate in US Dollars
- **Rate in LKR**: Total rate in LKR
- **Rate in USD**: Total rate in USD

## 🎯 Key Features

- **Multi-sheet Support**: Handle multiple Excel sheets
- **Real-time Search**: Instant filtering and search results
- **Advanced Analytics**: Comprehensive contractor analysis
- **Data Export**: Export filtered data (future enhancement)
- **Responsive Design**: Works on all device sizes
- **Modern UI**: Professional and intuitive interface

## 🔧 Configuration

### Backend Configuration
- Port: 5000 (configurable via environment variables)
- Excel file path: `IC (3).xlsm` (relative to backend folder)
- CORS enabled for development

### Frontend Configuration
- Development server: Port 5173
- API endpoint: http://localhost:5000
- Material-UI theme customization

## 🚀 Future Enhancements

- **Data Export**: Export filtered data to Excel/CSV
- **Advanced Charts**: More visualization options
- **User Authentication**: Secure access control
- **Data Backup**: Automatic data backup and recovery
- **Real-time Updates**: Live data synchronization
- **Mobile App**: Native mobile application

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ using React, Material-UI, and Node.js** 