import { Routes, Route, Navigate } from 'react-router-dom';
import RequireRole from './components/RequireRole';

import Login from './pages/Login';
import Register from './pages/Register';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Courts from './pages/Courts';
import CourtDetail from './pages/CourtDetail';
import MyBookings from './pages/MyBookings';
import Payment from './pages/Payment';

import AdminDashboard from './pages/admin/AdminDashboard';
import AdminCourts from './pages/admin/AdminCourts';
import AdminSlots from './pages/admin/AdminSlots';
import AdminBookings from './pages/admin/AdminBookings';
import AdminPayments from './pages/admin/AdminPayments';
import AdminReports from './pages/admin/AdminReports';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={<RequireRole role="customer"><Home /></RequireRole>} />
      <Route path="/profile" element={<RequireRole role="customer"><Profile /></RequireRole>} />
      <Route path="/courts" element={<RequireRole role="customer"><Courts /></RequireRole>} />
      <Route path="/courts/:id" element={<RequireRole role="customer"><CourtDetail /></RequireRole>} />
      <Route path="/my-bookings" element={<RequireRole role="customer"><MyBookings /></RequireRole>} />
      <Route path="/pay/:requestId" element={<RequireRole role="customer"><Payment /></RequireRole>} />

      <Route path="/admin" element={<RequireRole role="admin"><AdminDashboard /></RequireRole>} />
      <Route path="/admin/courts" element={<RequireRole role="admin"><AdminCourts /></RequireRole>} />
      <Route path="/admin/slots" element={<RequireRole role="admin"><AdminSlots /></RequireRole>} />
      <Route path="/admin/bookings" element={<RequireRole role="admin"><AdminBookings /></RequireRole>} />
      <Route path="/admin/payments" element={<RequireRole role="admin"><AdminPayments /></RequireRole>} />
      <Route path="/admin/reports" element={<RequireRole role="admin"><AdminReports /></RequireRole>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
