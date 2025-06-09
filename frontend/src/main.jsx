import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from "@mantine/notifications";
import App from './App';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/charts/styles.css';
import '@mantine/notifications/styles.css';

const theme = createTheme({
  primaryColor: 'blue',
  colors: {
    'app-blue': ['#e6f2ff', '#cfe8ef', '#c6dbf0', '#aed1e6', '#a0c4e2', '#85c7de', '#3498db', '#2980b9', '#2c3e50', '#1a2530'],
  },
  fontFamily: 'Arial, sans-serif',
  defaultRadius: 'md',
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="light">
      <Notifications position="bottom-right"/>
      <App />
    </MantineProvider>
  </React.StrictMode>
);