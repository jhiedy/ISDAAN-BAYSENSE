import {
  BrowserRouter as Router,
  Routes,
  Route,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { AppShell } from "@mantine/core";
import Dashboard from "./pages/Dashboard";
import Header from "./components/Header";
import axios from 'axios';

function App() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [assetFeatures, setAssetFeatures] = useState(null);
  const [selectedFeatureFromSearch, setSelectedFeatureFromSearch] = useState(null);

  useEffect(() => {
    const fetchAssetFeatures = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get_asset_features`);
        setAssetFeatures(response.data);
      } catch (err) {
        console.error("Error fetching asset features:", err);
      }
    };
    fetchAssetFeatures();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.trim() === "") {
      setSearchResults([]);
      return;
    }
    if (assetFeatures) {
      const lowerCaseTerm = term.toLowerCase();
      const results = assetFeatures.features.filter(feature => {
        const { Name, Mun_Name, Province, Barangay } = feature.properties;
        return (
          Name?.toLowerCase().includes(lowerCaseTerm) ||
          Mun_Name?.toLowerCase().includes(lowerCaseTerm) ||
          Province?.toLowerCase().includes(lowerCaseTerm) ||
          Barangay?.toLowerCase().includes(lowerCaseTerm)
        );
      });
      setSearchResults(results);
    }
  };

  const handleSearchResultClick = (feature) => {
    setSelectedFeatureFromSearch(feature);
    setSearchTerm("");
    setSearchResults([]);
  };

  const clearSelectedFeature = () => {
    setSelectedFeatureFromSearch(null);
  }

  return (
    <Router>
      <AppShell header={{ height: 70 }} padding={0}>
        <AppShell.Header>
          <Header
            searchTerm={searchTerm}
            onSearchChange={handleSearch}
            searchResults={searchResults}
            onResultClick={handleSearchResultClick}
          />
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