import { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';

function AssetFeaturesLayer({ map, assetFeatures, visible, showTooltips, onFeatureSelect, selectedAssetFeature }) {
  const layerRef = useRef(null);
  const tooltipRef = useRef(null);
  const tooltipOverlayRef = useRef(null);
  const hoveredFeatureRef = useRef(null);

  // This centralized style function handles all states: default, hover, and selected.
  const styleFunction = (feature) => {
    const isSelected = selectedAssetFeature && feature.get('Name') === selectedAssetFeature.properties.Name;
    const isHovered = hoveredFeatureRef.current && hoveredFeatureRef.current.getId() === feature.getId();

    // Selected style takes highest priority
    if (isSelected) {
      return new Style({
        fill: new Fill({ color: 'rgba(255, 255, 0, 0.5)' }),
        stroke: new Stroke({ color: 'rgba(255, 215, 0, 1)', width: 4 }),
        zIndex: 2,
      });
    }

    // Get base colors from status for default and hover styles
    const status = feature.get('Status')?.toLowerCase() || '';
    let fillColor = 'rgba(52, 152, 219, 0.2)';
    let strokeColor = 'rgba(52, 152, 219)';

    if (status.includes('expired')) {
      fillColor = 'rgba(231, 76, 60, 0.2)';
      strokeColor = 'rgba(231, 76, 60)';
    } else if (status.includes('for renewal')) {
      fillColor = 'rgba(230, 126, 34, 0.2)';
      strokeColor = 'rgba(230, 126, 34)';
    }

    // Hover style
    if (isHovered) {
      return new Style({
        fill: new Fill({ color: fillColor.replace('0.2', '0.4') }),
        stroke: new Stroke({ color: strokeColor, width: 4, lineDash: [] }),
        zIndex: 1,
      });
    }

    // Default style
    return new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: 2, lineDash: [5, 5] }),
      zIndex: 0,
    });
  };

  // Effect to create and manage the layer
  useEffect(() => {
    if (!map || !assetFeatures) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
    }

    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(assetFeatures, { featureProjection: 'EPSG:3857' }),
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: styleFunction,
      visible,
      zIndex: 2,
    });

    map.addLayer(vectorLayer);
    layerRef.current = vectorLayer;

    // Cleanup on unmount
    return () => {
      if (map && layerRef.current) {
        map.removeLayer(layerRef.current);
        layerRef.current = null;
      }
    };
  }, [map, assetFeatures, visible, selectedAssetFeature]);

  // Effect to redraw the layer when the selected feature changes
  useEffect(() => {
    if (layerRef.current) {
      layerRef.current.getSource().changed();
    }
  }, [selectedAssetFeature]);

  // Effect to set up and tear down event listeners
  useEffect(() => {
    if (!map) return;

    const pointerMoveHandler = (evt) => {
      if (!visible || !layerRef.current) return;
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, {
        layerFilter: (l) => l === layerRef.current,
      });

      if ((feature ? feature.getId() : null) !== (hoveredFeatureRef.current ? hoveredFeatureRef.current.getId() : null)) {
        hoveredFeatureRef.current = feature;
        layerRef.current.getSource().changed(); // Force redraw to apply hover style
      }
      // Tooltip logic
      const element = tooltipRef.current;
      if (feature && showTooltips) {
        const properties = feature.getProperties();
        element.innerHTML = `
            <div class="asset-tooltip">
            <div class="tooltip-arrow"></div>
            <h4>${properties.Name || 'N/A'}</h4>
            <div class="tooltip-row"><span class="tooltip-label">Location:</span> ${properties.Barangay || 'N/A'}, ${properties.Mun_Name || 'N/A'}, ${properties.Province || 'N/A'}</div>
            <div class="tooltip-row"><span class="tooltip-label">Area:</span> ${properties.Area ? `${properties.Area} ha` : 'N/A'}</div>
            <div class="tooltip-row"><span class="tooltip-label">Approved:</span> ${properties["DATE APPRO"]}</div>
            <div class="tooltip-row"><span class="tooltip-label">Expires:</span> ${properties["EXPIRATION"]}</div>
            <div class="tooltip-row"><span class="tooltip-label">Status:</span> <span class="status-${properties.Status?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}">${properties.Status || 'N/A'}</span></div>
            </div>
        `;
        tooltipOverlayRef.current.setPosition(evt.coordinate);
        element.style.display = 'block';
      } else {
        element.style.display = 'none';
      }
    };

    const clickHandler = (evt) => {
      if (!visible) return;
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f, {
        layerFilter: (layer) => layer === layerRef.current,
        hitTolerance: 5,
      });
      if (onFeatureSelect) {
        onFeatureSelect(feature);
      }
    };

    map.on('pointermove', pointerMoveHandler);
    map.on('click', clickHandler);

    return () => {
      map.un('pointermove', pointerMoveHandler);
      map.un('click', clickHandler);
    };
  }, [map, visible, showTooltips, onFeatureSelect]);

  // Effect to manage the tooltip overlay
  useEffect(() => {
    if (!map) return;
    tooltipOverlayRef.current = new Overlay({
      element: tooltipRef.current,
      positioning: 'bottom-center',
      offset: [0, -15],
      stopEvent: false,
    });
    map.addOverlay(tooltipOverlayRef.current);
    return () => {
      if (map && tooltipOverlayRef.current) {
        map.removeOverlay(tooltipOverlayRef.current);
      }
    };
  }, [map]);

  return (
    <div ref={tooltipRef} className="asset-feature-tooltip"></div>
  );
}

export default AssetFeaturesLayer;