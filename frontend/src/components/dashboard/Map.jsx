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
}) {
  const mapRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);

  const wqLayerRef = useRef(null);
  const rgbLayerRef = useRef(null);
  const assetLayerRef = useRef(null);

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

  // Effect for Asset Features (FLAs/Polygons)
  useEffect(() => {
    if (!mapInstance) return;

    if (assetLayerRef.current) {
      mapInstance.removeLayer(assetLayerRef.current);
      assetLayerRef.current = null;
    }

    if (assetFeatures && showFishCagesLayer) {
      const vectorSource = new VectorSource({
        features: new GeoJSON().readFeatures(assetFeatures, {
          featureProjection: 'EPSG:3857', // Map projection
        }),
      });

      const assetStyle = new Style({
        fill: new Fill({
          color: 'rgba(52, 152, 219, 0.2)', // Blue fill with some transparency
        }),
        stroke: new Stroke({
          color: '#3498db',
          width: 2,
        }),
        text: new OLText({
            font: '14px Calibri,sans-serif',
            fill: new Fill({ color: '#000' }),
            stroke: new Stroke({ color: '#fff', width: 3 }),
            placement: 'point',
            textBaseline: 'middle',
            textAlign: 'center',
            overflow: true,
        }),
      });

      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: function(feature) {
            const name = feature.get('Name');
            if (name) {
                assetStyle.getText().setText(name);
            } else {
                assetStyle.getText().setText('');
            }
            return assetStyle;
        },
        visible: true,
        zIndex: 2, // Above WQ and RGB layers
      });

      mapInstance.addLayer(vectorLayer);
      assetLayerRef.current = vectorLayer;
    }
  }, [mapInstance, assetFeatures, showFishCagesLayer]);

  // Toggle functions now update parent state
  const toggleWqLayer = () => setShowWqLayer(!showWqLayer);
  const toggleRgbLayer = () => setShowRgbLayer(!showRgbLayer);
  const toggleFishCagesLayer = () => setShowFishCagesLayer(!showFishCagesLayer);
  const toggleLegendVisibility = () => setIsLegendVisible(prev => !prev);

  const getLegendLabels = () => {
    if (wqLegendMin === null || wqLegendMax === null || currentSelectedParamInfo === null) {
      return {
        title: "No Data",
        minLabel: "N/A",
        midLabel: "N/A",
        maxLabel: "N/A",
        unit: ""
      };
    }

    const mid = (wqLegendMin + wqLegendMax) / 2;
    return {
      title: `${currentSelectedParamInfo.label} (${currentSelectedParamInfo.unit})`,
      minLabel: wqLegendMin.toFixed(2),
      midLabel: mid.toFixed(2),
      maxLabel: wqLegendMax.toFixed(2),
      unit: currentSelectedParamInfo.unit
    };
  };

  const legendLabels = getLegendLabels();

  return (
    <div className="map-container">
      {/* Removed the arbitrary isLoading overlay */}
      <div ref={mapRef} className="map"></div>

      {/* Render legend only if it's set to be visible AND map data is not loading */}
      {isLegendVisible && !mapLoading && (
        <div className="map-legend">
          <div className="legend-header">
            <p className="legend-title">{legendLabels.title}</p>
            <p style={{ fontSize: "12px", textAlign: "center", margin: "2px 0" }}>
                {wqMapTileUrl ? "Current View Scale" : "No Parameter Data"}
            </p>
          </div>
          <div className="legend-gradient" style={{ display: wqMapTileUrl ? 'block' : 'none' }}></div>
          <div className="legend-labels" style={{ display: wqMapTileUrl ? 'flex' : 'none' }}>
            <span>{legendLabels.minLabel}</span>
            <span>{legendLabels.midLabel}</span>
            <span>{legendLabels.maxLabel}</span>
          </div>

          <div className="toggles-container">
            <label className="toggle-container">
              <input
                type="checkbox"
                checked={showWqLayer}
                onChange={toggleWqLayer}
                className="toggle-input"
                disabled={!wqMapTileUrl} // Disable if no WQ tile available
              />
              <span className="toggle-switch"></span>
              <span className="toggle-label">Param Layer</span>
            </label>

            <label className="toggle-container">
              <input
                type="checkbox"
                checked={showRgbLayer}
                onChange={toggleRgbLayer}
                className="toggle-input"
                disabled={!rgbMapTileUrl} // Disable if no RGB tile available
              />
              <span className="toggle-switch"></span>
              <span className="toggle-label">RGB Layer</span>
            </label>

            <label className="toggle-container">
              <input
                type="checkbox"
                checked={showFishCagesLayer}
                onChange={toggleFishCagesLayer}
                className="toggle-input"
                disabled={!assetFeatures} // Disable if no asset features
              />
              <span className="toggle-switch"></span>
              <span className="toggle-label">FLA Polygons</span>
            </label>
          </div>
        </div>
      )}
      <div className="legend-toggle-button">
        <Tooltip label={isLegendVisible ? "Hide Legend" : "Show Legend"} position="left" withArrow>
            <ActionIcon
              variant="filled"
              color="blue"
              size="lg"
              onClick={toggleLegendVisibility}
              disabled={mapLoading} // Disable button while map data is loading
            >
              {isLegendVisible ? <EyeOff size={18} /> : <Eye size={18} />}
            </ActionIcon>
        </Tooltip>
      </div>
    </div>
  );
}

export default MapComponent;