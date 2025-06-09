import { useRef, useEffect, useState } from "react";
import { ActionIcon, Tooltip } from '@mantine/core';
import { Eye, EyeOff } from 'lucide-react';
import { fromLonLat } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import XYZ from "ol/source/XYZ";
import View from "ol/View";
import Map from "ol/Map";
import "./Map.css";


function MapComponent({
  centerCoordinates = [121.3301436972315, 14.078182532529903],
  zoomLevel = 16.7,
}) {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(true); 
  const [showLayer1, setShowLayer1] = useState(true); 
  const [showLayer2, setShowLayer2] = useState(true); 
  const [showGenericCages, setShowGenericCages] = useState(true); 
  const [isLegendVisible, setIsLegendVisible] = useState(true); 

  // Refs for generic layers
  const genericLayer1Ref = useRef(null);
  const genericLayer2Ref = useRef(null);


  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    if (!mapRef.current || mapInstance) return;
    const center = fromLonLat(centerCoordinates);
    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }) // Base OSM layer
      ],
      view: new View({ center: center, zoom: zoomLevel }),
    });
    setMapInstance(map);

    // Initialize generic layers
    const layer1 = new TileLayer({
      source: new XYZ({ url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png' }),
      visible: true,
    });
    const layer2 = new TileLayer({
      source: new XYZ({ url: 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png' }),
      visible: true,
    });

    map.addLayer(layer1);
    map.addLayer(layer2);
    genericLayer1Ref.current = layer1;
    genericLayer2Ref.current = layer2;

    return () => {
      if (map) {
        map.setTarget(undefined);
      }
      clearTimeout(timer); // Clear the loading timer on unmount
    };
  }, []);

 useEffect(() => {
    if (!mapInstance) return;
    const resizeObserver = new ResizeObserver(() => {
      mapInstance.updateSize();
    });
    if (mapRef.current) {
      resizeObserver.observe(mapRef.current);
    }
    return () => {
      if (mapRef.current) {
        resizeObserver.unobserve(mapRef.current);
      }
    };
  }, [mapInstance]);

  // Effects for toggling generic layer visibility
  useEffect(() => {
    if (genericLayer1Ref.current) {
      genericLayer1Ref.current.setVisible(showLayer1);
    }
  }, [showLayer1]);

  useEffect(() => {
    if (genericLayer2Ref.current) {
      genericLayer2Ref.current.setVisible(showLayer2);
    }
  }, [showLayer2]);


  const toggleLayer1 = () => setShowLayer1(!showLayer1);
  const toggleLayer2 = () => setShowLayer2(!showLayer2);
  const toggleGenericCages = () => setShowGenericCages(!showGenericCages); // Placeholder toggle
  const toggleLegendVisibility = () => setIsLegendVisible(prev => !prev);


  return (
    <div className="map-container">
      {isLoading && (
        <div className="map-loading">
          <p>Loading Map...</p>
        </div>
      )}
      <div ref={mapRef} className="map"></div>

      {isLegendVisible && (
        <div className="map-legend">
          <div className="legend-header">
            <p className="legend-title">Visualization Layer</p>
            <p style={{ fontSize: "12px", textAlign: "center", margin: "2px 0" }}>
                Dates placeholder
            </p>
          </div>
          <div className="legend-gradient"></div> {/* Generic gradient */}
          <div className="legend-labels">
            <span>Low</span>
            <span>Medium</span>
            <span>High</span>
          </div>

          <div className="toggles-container">
            <label className="toggle-container">
              <input
                type="checkbox"
                checked={showLayer1}
                onChange={toggleLayer1}
                className="toggle-input"
              />
              <span className="toggle-switch"></span>
              <span className="toggle-label">Param Layer</span>
            </label>

            <label className="toggle-container">
              <input
                type="checkbox"
                checked={showLayer2}
                onChange={toggleLayer2}
                className="toggle-input"
              />
              <span className="toggle-switch"></span>
              <span className="toggle-label">RGB Layer</span>
            </label>

            <label className="toggle-container">
              <input
                type="checkbox"
                checked={showGenericCages}
                onChange={toggleGenericCages}
                className="toggle-input"
              />
              <span className="toggle-switch"></span>
              <span className="toggle-label">Fish Pens</span>
            </label>
          </div>
        </div>
      )}
      <div>
        <Tooltip label={isLegendVisible ? "Hide Legend" : "Show Legend"} position="left" withArrow>
            <ActionIcon
              variant="filled"
              color="blue"
              size="lg"
              onClick={toggleLegendVisibility}
              style={{
                position: 'fixed',
                left: '23%',
                top: '77%',
                zIndex: 100,
                boxShadow: '0 0 10px rgba(0,0,0,0.2)',
              }}
            >
              {isLegendVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </ActionIcon>
        </Tooltip>
      </div>
    </div>
  );
}

export default MapComponent;