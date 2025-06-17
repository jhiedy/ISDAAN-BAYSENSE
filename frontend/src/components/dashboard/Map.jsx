import { useRef, useEffect, useState } from "react";
import { ActionIcon, Tooltip } from '@mantine/core';
import { Eye, EyeOff } from 'lucide-react';
import { fromLonLat } from "ol/proj";
import TileLayer from "ol/layer/Tile";
import StadiaMaps from 'ol/source/StadiaMaps';
import XYZ from "ol/source/XYZ";
import View from "ol/View";
import Map from "ol/Map";
import Zoom from 'ol/control/Zoom';
import Rotate from 'ol/control/Rotate';
import Attribution from 'ol/control/Attribution';
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Fill, Stroke, Text as OLText } from 'ol/style';
import "./Map.css";
import MapControls from "./MapControls";
import AssetFeaturesLayer from "./AssetFeaturesLayer";

function MapComponent({
  rgbMapTileUrl,
  wqMapTileUrl,
  wqLegendMin,
  wqLegendMax,
  selectedParameter,
  currentSelectedParamInfo,
  assetFeatures,
  showWqLayer, setShowWqLayer,
  showRgbLayer, setShowRgbLayer,
  showFishCagesLayer, setShowFishCagesLayer,
  isLegendVisible, setIsLegendVisible,
  onMapInstanceReady,
  mapLoading,
  centerCoordinates = [122.104577, 13.763949],
  zoomLevel = 12.7,
  onFeatureSelect,
  selectedAssetFeature
}) {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [isControlsOpen, setIsControlsOpen] = useState(true);
  const [showTooltips, setShowTooltips] = useState(true);

  const wqLayerRef = useRef(null);
  const rgbLayerRef = useRef(null);

  useEffect(() => {
  if (!mapRef.current || mapInstance) return;
  const center = fromLonLat(centerCoordinates);

  const baseMapLayer = new TileLayer({
    source: new StadiaMaps({
      layer: 'alidade_smooth',
      retina: true,
      attributions: [
        '<a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>',
        '<a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
        '<a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
      ]
    }),
    visible: true,
  });

  const map = new Map({
    target: mapRef.current,
    layers: [baseMapLayer],
    view: new View({ center: center, zoom: zoomLevel }),
    controls: []
  });

  // Add custom controls (including attribution)
  map.addControl(new Zoom());
  map.addControl(new Rotate());
  map.addControl(new Attribution({
    collapsible: true,
    collapsed: true,
    tipLabel: 'Attribution'
  }));

  setMapInstance(map);
  if (onMapInstanceReady) {
    onMapInstanceReady(map);
  }

  return () => {
    if (map) {
      map.setTarget(undefined);
    }
  };
}, []);

  // Update map size on container resize
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

  // Effect for Water Quality Layer
  useEffect(() => {
    if (!mapInstance) return;

    if (wqLayerRef.current) {
      mapInstance.removeLayer(wqLayerRef.current);
      wqLayerRef.current = null;
    }

    if (wqMapTileUrl) {
      const wqLayer = new TileLayer({
        source: new XYZ({ url: wqMapTileUrl }),
        visible: showWqLayer,
        zIndex: 1, // Ensure it's above base map
      });
      mapInstance.addLayer(wqLayer);
      wqLayerRef.current = wqLayer;
    }
  }, [mapInstance, wqMapTileUrl, showWqLayer]);

  // Effect for RGB Layer
  useEffect(() => {
    if (!mapInstance) return;

    if (rgbLayerRef.current) {
      mapInstance.removeLayer(rgbLayerRef.current);
      rgbLayerRef.current = null;
    }

    if (rgbMapTileUrl) {
      const rgbLayer = new TileLayer({
        source: new XYZ({ url: rgbMapTileUrl }),
        visible: showRgbLayer,
        zIndex: 0, // Should be below WQ layer
      });
      mapInstance.addLayer(rgbLayer);
      rgbLayerRef.current = rgbLayer;
    }
  }, [mapInstance, rgbMapTileUrl, showRgbLayer]);

  // Toggle functions now update parent state
  const toggleWqLayer = () => setShowWqLayer(!showWqLayer);
  const toggleRgbLayer = () => setShowRgbLayer(!showRgbLayer);
  const toggleFishCagesLayer = () => setShowFishCagesLayer(!showFishCagesLayer);
  const toggleLegendVisibility = () => setIsLegendVisible(prev => !prev);
  const toggleControlsVisibility = () => setIsControlsOpen(prev => !prev);
  const toggleTooltips = () => setShowTooltips(prev => !prev);

  // Helper to calculate intermediate legend labels
  const getIntermediateLabels = (min, max, count = 5) => {
    if (min === null || max === null || typeof min !== 'number' || typeof max !== 'number' || min >= max) {
      // Fallback to default -1 to 1 if dynamic values are invalid or not yet loaded
      return {
      title: "No Data",
      labels: ["-1.00", "-0.50", "0.00", "0.50", "1.00"],
      unit: ""
    };
    }
    const labels = [];
    const step = (max - min) / (count - 1);
    for (let i = 0; i < count; i++) {
      labels.push((min + i * step).toFixed(2));
    }
    return {
      title: `${currentSelectedParamInfo.label}`,
      labels: labels,
      unit: currentSelectedParamInfo.unit
    };
  };

  const legendLabels = getIntermediateLabels(wqLegendMin, wqLegendMax, 5);

  return (
    <div className="map-container">
      <div ref={mapRef} className="map"></div>

      <AssetFeaturesLayer
        map={mapInstance}
        assetFeatures={assetFeatures}
        visible={showFishCagesLayer}
        showTooltips={showTooltips}
        onFeatureSelect={onFeatureSelect}
        selectedAssetFeature={selectedAssetFeature}
      />

      {/* Render legend only if it's set to be visible AND map data is not loading */}
      {isLegendVisible && !mapLoading && (
        <div className="map-legend">
          <div className="legend-header">
            <p className="legend-title">{legendLabels.title}</p>
            <p style={{ fontSize: "12px", textAlign: "center", margin: "-5px" }}>
                {wqMapTileUrl ? "Concentration Scale" : "No Parameter Data"}
            </p>
          </div>
          <div className="legend-labels" style={{ display: wqMapTileUrl ? 'flex' : 'none' }}>
            <span>Low</span>
            <span>High</span>
          </div>
          <div className="legend-gradient" style={{ display: wqMapTileUrl ? 'block' : 'none' }}></div>
          <div className="legend-labels">
            {legendLabels.labels.map((label, index) => (
              <span key={index}>{label}</span>
            ))}
          </div>

          {/* Asset Feature Layer Legend */}
          {showFishCagesLayer && (
            <div className="asset-legend">
              <p className="legend-title">FLA Legend</p>
              <div className="legend-item">
                <div className="legend-color-box dashed-border"></div>
                <span>FLA region</span>
              </div>
              <div className="legend-item">
                <div className="legend-color-box solid-border"></div>
                <span>Hovered</span>
              </div>
              <div className="legend-item">
                <div className="legend-color-box blue-fill"></div>
                <span>Valid</span>
              </div>
              <div className="legend-item">
                <div className="legend-color-box red-fill"></div>
                <span>Expired</span>
              </div>
              <div className="legend-item">
                <div className="legend-color-box orange-fill"></div>
                <span>For Renewal</span>
              </div>
              <div className="legend-item">
                <div className="legend-color-box yellow-fill"></div>
                <span>Selected</span>
              </div>
            </div>
          )}
        </div>
      )}
      <div className="legend-toggle-button">
        <Tooltip label={isLegendVisible ? "Hide Legend" : "Show Legend"} position="left" withArrow>
            <ActionIcon
              variant="filled"
              color="blue"
              size="lg"
              onClick={toggleLegendVisibility}
              disabled={mapLoading}
            >
              {isLegendVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </ActionIcon>
        </Tooltip>
      </div>

      <MapControls
        showWqLayer={showWqLayer}
        toggleWqLayer={toggleWqLayer}
        disableWq={!wqMapTileUrl}
        showRgbLayer={showRgbLayer}
        toggleRgbLayer={toggleRgbLayer}
        disableRgb={!rgbMapTileUrl}
        showFishCagesLayer={showFishCagesLayer}
        toggleFishCagesLayer={toggleFishCagesLayer}
        disableFishCages={!assetFeatures}
        isControlsOpen={isControlsOpen}
        toggleControls={toggleControlsVisibility}
        showTooltips={showTooltips}
        toggleTooltips={toggleTooltips}
      />
    </div>
  );
}

export default MapComponent;