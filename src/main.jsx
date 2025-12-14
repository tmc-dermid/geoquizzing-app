import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter} from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthProvider.jsx';
import App from './App.jsx';
import 'react-toastify/dist/ReactToastify.css';
import './styles/App.less';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ToastContainer />
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
