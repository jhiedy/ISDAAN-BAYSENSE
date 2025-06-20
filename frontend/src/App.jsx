import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { AppShell } from "@mantine/core";
import { Spotlight } from '@mantine/spotlight';
import { Search } from 'lucide-react';
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";
import axios from 'axios';

function App() {
  const [actions, setActions] = useState([]);
  const [selectedFeatureFromSearch, setSelectedFeatureFromSearch] = useState(null);

  const clearSelectedFeature = () => {
    setSelectedFeatureFromSearch(null);
  };

  useEffect(() => {
    const fetchAssetFeatures = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get_asset_features`);
        const features = response.data.features;
        const spotlightActions = features.map((feature, index) => ({
          id: `${feature.properties.Name}-${feature.properties.Barangay}-${index}`,
          label: feature.properties.Name,
          description: `${feature.properties.Barangay}, ${feature.properties.Mun_Name}, ${feature.properties.Province}`,
          onClick: () => {
            setSelectedFeatureFromSearch(feature);
          },
        }));
        setActions(spotlightActions);
      } catch (err) {
        console.error("Error fetching asset features for spotlight:", err);
      }
    };
    fetchAssetFeatures();
  }, []);

  return (
      <Router>
        <Spotlight
          actions={actions}
          shortcut={['mod + K', 'mod + P', '/']}
          nothingFound="Nothing found..."
          scrollable
          maxHeight={350}
          searchProps={{
            // leftSection: <Search size={12} stroke={1.5} />,
            placeholder: 'Search for an FLA...',
          }}
          highlightQuery
        />
        <AppShell header={{ height: 70 }} padding={0}>
          <AppShell.Header>
            <Header />
          </AppShell.Header>

          <AppShell.Main style={{ padding: 0, backgroundColor: "#F7F9F9" }}>
            <Routes>
               <Route
                path="/dashboard"
                element={
                    <Dashboard
                      selectedFeatureFromSearch={selectedFeatureFromSearch}
                      clearSelectedFeature={clearSelectedFeature}
                    />
                }
              />
            </Routes>
          </AppShell.Main>
        </AppShell>
      </Router>
  );
}

export default App;