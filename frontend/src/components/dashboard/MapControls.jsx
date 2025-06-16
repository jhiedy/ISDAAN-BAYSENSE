import React from 'react';
import { ActionIcon, Tooltip, Collapse } from '@mantine/core';
import { Droplet, Layers, Layers2, MapPin, Satellite } from 'lucide-react';
import './MapControls.css';

function MapControls({
  showWqLayer, toggleWqLayer, disableWq,
  showRgbLayer, toggleRgbLayer, disableRgb,
  showFishCagesLayer, toggleFishCagesLayer, disableFishCages,
  isControlsOpen, toggleControls
}) {
  return (
    <div className="map-controls-container">
      <div className={`toggle-button-container ${isControlsOpen ? 'controls-open' : ''}`}>
        <Tooltip label={isControlsOpen ? "Hide Layer Controls" : "Show Layer Controls"} position="top" withArrow>
          <ActionIcon
            variant="white"
            color="black"
            size="lg"
            onClick={toggleControls}
            className="controls-toggle-button"
          >
            {isControlsOpen ? <Layers2 size={20} /> : <Layers size={20} />}
          </ActionIcon>
        </Tooltip>
      </div>

      <Collapse in={isControlsOpen}>
        <div className="controls-overlay">
          <div className="control-item">
            <Tooltip label={showWqLayer ? "Hide Water Quality Layer" : "Show Water Quality Layer"} position="right" withArrow>
              <ActionIcon
                variant={showWqLayer ? "filled" : "light"}
                color={showWqLayer ? "blue" : "gray"}
                size="md"
                onClick={toggleWqLayer}
                disabled={disableWq}
              >
                <Droplet size={20} />
              </ActionIcon>
            </Tooltip>
            <span className="control-label">WQ</span>
          </div>

          <div className="control-item">
            <Tooltip label={showRgbLayer ? "Hide True Color Layer" : "Show True Color Layer"} position="right" withArrow>
              <ActionIcon
                variant={showRgbLayer ? "filled" : "light"}
                color={showRgbLayer ? "blue" : "gray"}
                size="md"
                onClick={toggleRgbLayer}
                disabled={disableRgb}
              >
                <Satellite size={20} />
              </ActionIcon>
            </Tooltip>
            <span className="control-label">RGB</span>
          </div>

          <div className="control-item">
            <Tooltip label={showFishCagesLayer ? "Hide FLA Details" : "Show FLA Polygons"} position="right" withArrow>
              <ActionIcon
                variant={showFishCagesLayer ? "filled" : "light"}
                color={showFishCagesLayer ? "blue" : "gray"}
                size="md"
                onClick={toggleFishCagesLayer}
                disabled={disableFishCages}
              >
                <MapPin size={20} />
              </ActionIcon>
            </Tooltip>
            <span className="control-label">FLA</span>
          </div>
        </div>
      </Collapse>
    </div>
  );
}

export default MapControls;