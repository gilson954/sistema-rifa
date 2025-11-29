// src/main.tsx
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ThemeProvider } from './context/ThemeContext.tsx';
import './index.css';
import 'react-quill/dist/quill.snow.css';

createRoot(document.getElementById('root')!).render(
  // Remova ou comente <StrictMode> e </StrictMode>
  // <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  // </StrictMode>
);
