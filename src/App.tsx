import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Protected } from './components/Protected';
import { Home } from './pages/Home';
import { Plans } from './pages/Plans';
import { Simulator } from './pages/Simulator';
import { AuthPage } from './pages/AuthPage';
import { Checkout } from './pages/Checkout';
import { Confirmation } from './pages/Confirmation';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';

export default function App(){return <BrowserRouter><AuthProvider><Routes><Route path="/" element={<Home/>}/><Route path="/planos" element={<Plans/>}/><Route path="/simulador" element={<Simulator/>}/><Route path="/login" element={<AuthPage mode="login"/>}/><Route path="/cadastro" element={<AuthPage mode="register"/>}/><Route path="/checkout" element={<Protected role="CUSTOMER"><Checkout/></Protected>}/><Route path="/confirmacao" element={<Protected role="CUSTOMER"><Confirmation/></Protected>}/><Route path="/app" element={<Protected role="CUSTOMER"><CustomerDashboard/></Protected>}/><Route path="/admin" element={<Protected role="ADMIN"><AdminDashboard/></Protected>}/></Routes></AuthProvider></BrowserRouter>}
