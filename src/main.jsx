import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/base.css';
import './styles/components.css';

// React.StrictMode is intentionally not used here: it double-mounts components
// in development, which can double-initialise the board's drag-and-drop backend.
createRoot(document.getElementById('root')).render(<App />);
