import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { AppShell, LoadingOverlay } from "@mantine/core";
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";

function App() {
    return (
    <Router>
      <AppShell header={{ height: 70 }} padding={0}>
        <AppShell.Header>
          <Header/>
        </AppShell.Header>

        <AppShell.Main style={{ padding: 0, backgroundColor: "#F7F9F9" }}>
          <Routes>
            {/* Dashboard Route - Accessible to both authenticated users and admins */}
             <Route
              path="/dashboard"
              element={
                  <Dashboard /> // Protect dashboard
              }
            />
          </Routes>
        </AppShell.Main>
      </AppShell>
    </Router>
  );
}

export default App;