import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import LoginPage from './components/ui/animated-sign-in';

function App() {
  return (
    <ThemeProvider>
      <LoginPage />
    </ThemeProvider>
  );
}

export default App;