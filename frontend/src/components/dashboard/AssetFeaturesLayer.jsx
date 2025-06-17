import { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Fill, Stroke } from 'ol/style';
import Overlay from 'ol/Overlay';

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  } catch (error) {
    console.error("Error formatting date:", dateString, error);
    return 'N/A';
  }
};

function AssetFeaturesLayer({ map, assetFeatures, visible, showTooltips }) {
  const layerRef = useRef(null);
  const tooltipRef = useRef(null);
  const tooltipOverlayRef = useRef(null);
  const hoveredFeatureRef = useRef(null);
  const highlightLayerRef = useRef(null);

  // Get style based on feature status
  const getFeatureStyle = (feature, hover = false) => {
    const status = feature.get('Status')?.toLowerCase() || '';
    let fillColor = 'rgba(52, 152, 219, 0.2)'; // Default blue
    let strokeColor = 'rgba(52, 152, 219)'; // Default blue

    if (status.includes('expired')) {
      fillColor = 'rgba(231, 76, 60, 0.2)'; // Red
      strokeColor = 'rgba(231, 76, 60)'; // Red
    } else if (status.includes('for renewal')) {
      fillColor = 'rgba(230, 126, 34, 0.2)'; // Orange
      strokeColor = 'rgba(230, 126, 34)'; // Orange
    }

    return new Style({
      fill: new Fill({
        color: hover ? fillColor.replace('0.2', '0.4') : fillColor,
      }),
      stroke: new Stroke({
        color: strokeColor,
        width: hover ? 4 : 2,
        lineDash: hover ? [] : [5, 5],
      }),
      zIndex: hover ? 1 : 0,
    });
  };

  // Create a separate highlight layer for the hover effect
  const createHighlightLayer = () => {
    if (highlightLayerRef.current) {
      map.removeLayer(highlightLayerRef.current);
    }
    
    const highlightLayer = new VectorLayer({
      source: new VectorSource(),
      style: new Style({
        fill: new Fill({
          color: 'rgba(255, 255, 255, 0.3)',
        }),
        stroke: new Stroke({
          color: 'rgba(0, 0, 0, 0.7)',
          width: 4,
        }),
        zIndex: 10,
      }),
      zIndex: 100,
    });
    
    map.addLayer(highlightLayer);
    highlightLayerRef.current = highlightLayer;
    return highlightLayer;
  };

  useEffect(() => {
    if (!map) return;

    // Create tooltip overlay with new positioning
    const tooltipOverlay = new Overlay({
      element: tooltipRef.current,
      positioning: 'bottom-center',
      offset: [0, -15],
      stopEvent: false,
    });
    map.addOverlay(tooltipOverlay);
    tooltipOverlayRef.current = tooltipOverlay;

    // Create highlight layer
    const highlightLayer = createHighlightLayer();

    return () => {
      map.removeOverlay(tooltipOverlay);
      map.removeLayer(highlightLayer);
    };
  }, [map]);

  useEffect(() => {
    if (!map || !assetFeatures) return;

    if (layerRef.current) {
      map.removeLayer(layerRef.current);
      layerRef.current = null;
    }

    const vectorSource = new VectorSource({
      features: new GeoJSON().readFeatures(assetFeatures, {
        featureProjection: 'EPSG:3857',
      }),
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: (feature) => getFeatureStyle(feature),
      visible,
      zIndex: 2,
    });

    map.addLayer(vectorLayer);
    layerRef.current = vectorLayer;

    // Add pointermove event for hover effects
    const pointerMoveHandler = (evt) => {
      if (!visible) return;

      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      const element = tooltipRef.current;
      const highlightLayer = highlightLayerRef.current;

      if (feature !== hoveredFeatureRef.current) {
        // Reset previous hovered feature style
        if (hoveredFeatureRef.current) {
          hoveredFeatureRef.current.setStyle(getFeatureStyle(hoveredFeatureRef.current));
        }

        // Clear highlight layer
        if (highlightLayer) {
          highlightLayer.getSource().clear();
        }

        // Set new hovered feature style
        if (feature) {
          feature.setStyle(getFeatureStyle(feature, true));
          hoveredFeatureRef.current = feature;

          // Add to highlight layer
          if (highlightLayer) {
            const highlightSource = highlightLayer.getSource();
            highlightSource.clear();
            highlightSource.addFeature(feature.clone());
          }
        } else {
          hoveredFeatureRef.current = null;
        }
      }

      if (feature && showTooltips) {
        const properties = feature.getProperties();
        const formattedDateApprv = formatDate(properties['Date Apprv']);
        const formattedDateExp = formatDate(properties['Date Exp']);

        const tooltipContent = `
            <div class="asset-tooltip">
            <div class="tooltip-arrow"></div>
            <h4>${properties.Name || 'N/A'}</h4>
            <div class="tooltip-row"><span class="tooltip-label">Location:</span> ${properties.Barangay || 'N/A'}, ${properties.Mun_Name || 'N/A'}, ${properties.Province || 'N/A'}</div>
            <div class="tooltip-row"><span class="tooltip-label">Area:</span> ${properties.Area ? `${properties.Area} ha` : 'N/A'}</div>
            <div class="tooltip-row"><span class="tooltip-label">Approved:</span> ${formattedDateApprv}</div>
            <div class="tooltip-row"><span class="tooltip-label">Expires:</span> ${formattedDateExp}</div>
            <div class="tooltip-row"><span class="tooltip-label">Status:</span> <span class="status-${properties.Status?.toLowerCase().replace(/\s+/g, '-') || 'unknown'}">${properties.Status || 'N/A'}</span></div>
            </div>
        `;
        element.innerHTML = tooltipContent;
        tooltipOverlayRef.current.setPosition(evt.coordinate);
        element.style.display = 'block';
        } else {
        element.style.display = 'none';
        }
    };

    map.on('pointermove', pointerMoveHandler);

    // Add click event for feature selection
    const clickHandler = (evt) => {
      if (!visible) return;
      
      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f);
      if (feature) {
        // You can add custom click behavior here
        console.log('Feature clicked:', feature.getProperties());
        
        // Flash animation on click
        const originalStyle = feature.getStyle();
        feature.setStyle(new Style({
          fill: new Fill({
            color: 'rgba(255, 255, 0, 0.5)',
          }),
          stroke: new Stroke({
            color: 'rgba(255, 215, 0, 1)',
            width: 4,
          }),
          zIndex: 100,
        }));
        
        setTimeout(() => {
          feature.setStyle(originalStyle);
        }, 300);
      }
    };

    map.on('click', clickHandler);

    return () => {
      map.un('pointermove', pointerMoveHandler);
      map.un('click', clickHandler);
      if (layerRef.current) {
        map.removeLayer(layerRef.current);
      }
      if (highlightLayerRef.current) {
        map.removeLayer(highlightLayerRef.current);
      }
    };
  }, [map, assetFeatures, visible, showTooltips]);

  return (
    <div ref={tooltipRef} className="asset-feature-tooltip"></div>
  );
}

export default AssetFeaturesLayer;