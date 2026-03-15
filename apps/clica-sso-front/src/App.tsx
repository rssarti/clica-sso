import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import { RealTimeNotifications } from './components/RealTimeNotifications';
import Login from './pages/Login';
import Register from './pages/Register';
import RegisterSuccess from './pages/RegisterSuccess';
import Dashboard from './pages/Dashboard';
import AccountInfo from './pages/AccountInfo';
import Privacy from './pages/Privacy';
import Billing from './pages/Billing';
import ConnectedApps from './pages/ConnectedApps';
import ProductDetails from './pages/ProductDetails';
import PaymentConfirmation from './pages/PaymentConfirmation';
import SSOExample from './pages/SSOExample';
import SSOTest from './pages/SSOTest';
import SocketTest from './pages/SocketTest';
import Logout from './pages/Logout';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Router>
          <RealTimeNotifications />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/register-success" element={<RegisterSuccess />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/account" element={<AccountInfo />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/billing" element={<Billing />} />
            <Route path="/connected-apps" element={<ConnectedApps />} />
            <Route path="/product/:slug" element={<ProductDetails />} />
            <Route path="/payment-confirmation/:contractId" element={<PaymentConfirmation />} />
            <Route path="/example" element={<SSOExample />} />
            <Route path="/sso-test" element={<SSOTest />} />
            <Route path="/socket-test" element={<SocketTest />} />
            <Route path="/logout" element={<Logout />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Routes>
        </Router>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
