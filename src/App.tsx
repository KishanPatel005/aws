import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import DeviceDebug from './components/DeviceDebug';
import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Expenses from './pages/Expenses';
import SalaryBooking from './pages/SalaryBooking';
import Builders from './pages/Builders';
import Projects from './pages/Projects';
import Inventory from './pages/Inventory';
import Bookings from './pages/Bookings';
import BookingApproval from './pages/BookingApproval';
import PaymentCollection from './pages/PaymentCollection';
import BrokerageMapping from './pages/BrokerageMapping';
import BrokerageDistribution from './pages/BrokerageDistribution';
import Lands from './pages/Lands';
import LandBookings from './pages/LandBookings';
import LandPayments from './pages/LandPayments';
import ResaleProperties from './pages/ResaleProperties';
import ResaleBookings from './pages/ResaleBookings';
import ResalePayments from './pages/ResalePayments';
import SalaryManagement from './pages/SalaryManagement';
import SalaryMobile from './pages/SalaryMobile';

function App() {
  return (
    <AuthProvider>
      <Router>
        <DeviceDebug />
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          
          {/* Protected routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />                                    
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout>
                <Dashboard />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/users" element={
            <ProtectedRoute requiredPermission={{ module: 'employee_master', action: 'R' }}>
              <DashboardLayout>
                <Users />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/expenses" element={
            <ProtectedRoute requiredPermission={{ module: 'expense_salary', action: 'R' }} requiredDevice={['desktop', 'tablet']}>
              <DashboardLayout>
                <Expenses />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/salary-booking" element={
            <ProtectedRoute requiredPermission={{ module: 'expense_salary', action: 'R' }} requiredDevice={['desktop', 'tablet']}>
              <DashboardLayout>
                <SalaryBooking />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/builders" element={
            <ProtectedRoute requiredPermission={{ module: 'builder', action: 'R' }}>
              <DashboardLayout>
                <Builders />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/projects" element={
            <ProtectedRoute requiredPermission={{ module: 'project', action: 'R' }}>
              <DashboardLayout>
                <Projects />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/inventory" element={
            <ProtectedRoute requiredPermission={{ module: 'inventory', action: 'R' }}>
              <DashboardLayout>
                <Inventory />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/bookings" element={
            <ProtectedRoute requiredPermission={{ module: 'booking', action: 'R' }}>
              <DashboardLayout>
                <Bookings />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/bookings/approve/:id" element={
            <ProtectedRoute requiredPermission={{ module: 'booking_approval', action: 'R' }}>
              <DashboardLayout>
                <BookingApproval />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/payments" element={
            <ProtectedRoute requiredPermission={{ module: 'payment_collection', action: 'R' }}>
              <DashboardLayout>
                <PaymentCollection />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/brokerage/mapping" element={
            <ProtectedRoute requiredPermission={{ module: 'brokerage_mapping', action: 'R' }}>
              <DashboardLayout>
                <BrokerageMapping />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/brokerage/distribution" element={
            <ProtectedRoute requiredPermission={{ module: 'brokerage_distribution', action: 'R' }}>
              <DashboardLayout>
                <BrokerageDistribution />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/lands" element={
            <ProtectedRoute requiredPermission={{ module: 'land_management', action: 'R' }}>
              <DashboardLayout>
                <Lands />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/land-bookings" element={
            <ProtectedRoute requiredPermission={{ module: 'land_booking', action: 'R' }}>
              <DashboardLayout>
                <LandBookings />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/land-payments" element={
            <ProtectedRoute requiredPermission={{ module: 'payment_collection', action: 'R' }}>
              <DashboardLayout>
                <LandPayments />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/resale-properties" element={
            <ProtectedRoute requiredPermission={{ module: 'resale_property', action: 'R' }}>
              <DashboardLayout>
                <ResaleProperties />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/resale-bookings" element={
            <ProtectedRoute requiredPermission={{ module: 'resale_booking', action: 'R' }}>
              <DashboardLayout>
                <ResaleBookings />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/resale-payments" element={
            <ProtectedRoute requiredPermission={{ module: 'payment_collection', action: 'R' }}>
              <DashboardLayout>
                <ResalePayments />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/salary-management" element={
            <ProtectedRoute requiredDevice="desktop">
              <DashboardLayout>
                <SalaryManagement />
              </DashboardLayout>
            </ProtectedRoute>
          } />
          
          <Route path="/salary-mobile" element={
            <ProtectedRoute requiredDevice="mobile">
              <SalaryMobile />
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
