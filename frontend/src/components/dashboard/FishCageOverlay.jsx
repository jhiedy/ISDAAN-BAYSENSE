import { useEffect, useState, useRef } from "react";
import {
  Modal,
  Group,
  Text,
  Title,
  Badge,
  Divider,
  Button,
  Box,
  Stack,
  Paper,
} from "@mantine/core";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { Vector as VectorSource } from "ol/source";
import { Vector as VectorLayer } from "ol/layer";
import { Style, Icon } from "ol/style";
import { fromLonLat } from "ol/proj";
import axios from "axios";
import Overlay from "ol/Overlay";
import { useNavigate } from "react-router-dom";
import { showErrorNotification } from "../../utils/notifications";
import { AlertTriangle, Building, CheckCircle2, Fish, MapPin } from "lucide-react";

// Fish species display name mapping
const fishTypeDisplayMap = {
  "Tilapia": "Tilapia (Oreochromis)",
  "Catfish": "Catfish (Siluriformes)",
  "Mudfish": "Mudfish (Channa striata)",
  "Shrimp": "Freshwater Prawn / Ulang (Macrobrachium rosenbergii)",
  "Ayungin": "Silver Perch / Ayungin (Leiopotherapon plumbeus)",
  "Dulong": "Goby Fry / Dulong (Gobiopterus lacustris)",
  "Snail": "Golden Apple Snail (Pomacea canaliculata)",
};

const getDisplaySpeciesName = (farmedValue) => {
  if (!farmedValue) return 'N/A';
  return fishTypeDisplayMap[farmedValue] || farmedValue;
};

// Standard Pin Icon
const PIN_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="32" height="42">
  <path d="M12 0 C7.03 0 3 4.03 3 9 C3 14.25 12 32 12 32 S 21 14.25 21 9 C21 4.03 16.97 0 12 0 Z" fill="#6c2fa8" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="12" cy="9" r="4" fill="#ffffff"/>
</svg>
`;

// Highlighted Pin Icon
const HIGHLIGHTED_PIN_ICON_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="32" height="42">
  <path d="M12 0 C7.03 0 3 4.03 3 9 C3 14.25 12 32 12 32 S 21 14.25 21 9 C21 4.03 16.97 0 12 0 Z" fill="#007bff" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="12" cy="9" r="4" fill="#ffffff"/>
</svg>
`;

const svgToDataUrl = (svg) => {
  const encodedSvg = encodeURIComponent(svg.replace(/\s+/g, ' '));
  return `data:image/svg+xml;charset=utf-8,${encodedSvg}`;
};

function FishCageOverlay({ mapInstance, showCageLayer, selectedFarms }) { // showCageLayer is now a prop
  const [cages, setCages] = useState([]);
  const [selectedCage, setSelectedCage] = useState(null);
  const [modalOpened, setModalOpened] = useState(false);
  const cageLayerRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const tooltipRef = useRef(null);
  const tooltipOverlayRef = useRef(null);
  const [hoveredCage, setHoveredCage] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCages = async () => {
      if (!mapInstance) return;
      setLoading(true);
      setError(null);
      try {
        const adminToken = localStorage.getItem("adminToken");
        const userToken = localStorage.getItem("authToken");
        let userData = null;
        let isAdminUser = false;
        let authToken = null;

        if (adminToken) {
          try {
            const adminResponse = await axios.get(
              `${import.meta.env.VITE_API_BASE_URL}/api/admin/me`,
              { headers: { Authorization: adminToken } }
            );
            if (adminResponse.data && adminResponse.data.admin_id) {
              userData = adminResponse.data;
              isAdminUser = true;
              authToken = adminToken;
            }
          } catch (err) { console.log("Not admin, trying user"); }
        }

        if (!isAdminUser && userToken) {
          try {
            const userResponse = await axios.get(
              `${import.meta.env.VITE_API_BASE_URL}/api/me`,
              { headers: { Authorization: userToken } }
            );
            if (userResponse.data) {
              userData = userResponse.data;
              isAdminUser = false;
              authToken = userToken;
            }
          } catch (err) {
            console.error("Auth failed:", err);
            setError("Auth failed.");
            setLoading(false);
            return;
          }
        }

        if (!userData) {
          setError("Not authenticated.");
          setLoading(false);
          return;
        }
        setIsAdmin(isAdminUser);

        let cagesResponse;
        if (isAdminUser) {
          if (selectedFarms && selectedFarms.length > 0) {
            cagesResponse = await axios.post(
              `${import.meta.env.VITE_API_BASE_URL}/api/retrieve-filtered-cages`,
              { farm_ids: selectedFarms },
              { headers: { Authorization: authToken } }
            );
          } else {
            cagesResponse = await axios.get(
              `${import.meta.env.VITE_API_BASE_URL}/api/retrieve-cages`,
              { headers: { Authorization: authToken } }
            );
          }
        } else if (userData.farm_affiliation?.farm_id) {
          const farmId = userData.farm_affiliation.farm_id;
          const response = await axios.get(
            `${import.meta.env.VITE_API_BASE_URL}/api/retrieve-cages-by-farm/${farmId}`,
            { headers: { Authorization: authToken } }
          );
          cagesResponse = { data: response.data.cages || [] };
        } else {
          console.error("User has no farm affiliation");
          setError("User has no farm affiliation");
          setCages([]);
          setLoading(false);
          return;
        }
        
        setCages(cagesResponse.data || []);
        setInitialLoadComplete(true);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching cages:", err);
        showErrorNotification("Failed to load fish cages.");
        setError("Failed to load fish cages");
        setLoading(false);
      }
    };
    fetchCages();
  }, [mapInstance, selectedFarms]);

  useEffect(() => {
    if (!mapInstance || tooltipOverlayRef.current) return;

    const tooltip = document.createElement("div");
    tooltip.className = "fish-cage-tooltip";
    tooltip.style.position = 'absolute';
    tooltip.style.background = 'rgba(255, 255, 255, 0.9)';
    tooltip.style.border = '1px solid #ccc';
    tooltip.style.borderRadius = '4px';
    tooltip.style.padding = '4px 8px';
    tooltip.style.fontSize = '12px';
    tooltip.style.whiteSpace = 'nowrap';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.transform = 'translateY(-100%) translateX(-50%)';
    tooltip.style.display = 'none';
    tooltipRef.current = tooltip;

    const overlay = new Overlay({
      element: tooltip,
      positioning: "bottom-center",
      stopEvent: false,
      offset: [0, -15],
    });
    mapInstance.addOverlay(overlay);
    tooltipOverlayRef.current = overlay;

    return () => {
      if (mapInstance && tooltipOverlayRef.current) {
          mapInstance.removeOverlay(tooltipOverlayRef.current);
          tooltipOverlayRef.current = null;
      }
      if(tooltipRef.current) {
          tooltipRef.current = null;
      }
    };
  }, [mapInstance]);

  useEffect(() => {
    if (!mapInstance || !initialLoadComplete) return;

    if (cageLayerRef.current) {
      mapInstance.removeLayer(cageLayerRef.current);
      cageLayerRef.current = null;
    }

    if (!cages.length) {
      if (tooltipRef.current) tooltip.current.style.display = 'none'; // Fixed typo: tooltip to tooltipRef
      setHoveredCage(null);
      return;
    }

    const features = cages.map((cage) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([cage.lon, cage.lat])),
        properties: cage,
      });
      feature.setId(cage.cage_id);
      return feature;
    });

    const vectorSource = new VectorSource({ features });

    const defaultStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: svgToDataUrl(PIN_ICON_SVG),
        scale: 0.9,
      }),
    });

    const highlightedStyle = new Style({
      image: new Icon({
        anchor: [0.5, 1],
        anchorXUnits: 'fraction',
        anchorYUnits: 'fraction',
        src: svgToDataUrl(HIGHLIGHTED_PIN_ICON_SVG),
        scale: 1.1,
      }),
      zIndex: 1,
    });

    const vectorLayer = new VectorLayer({
      source: vectorSource,
      style: function (feature) {
        return hoveredCage && feature.getId() === hoveredCage.cage_id
          ? highlightedStyle
          : defaultStyle;
      },
      visible: true,
      zIndex: 2,
    });

    mapInstance.addLayer(vectorLayer);
    cageLayerRef.current = vectorLayer;

    const clickListenerKey = mapInstance.on("click", function (evt) {
      const feature = mapInstance.forEachFeatureAtPixel(evt.pixel, (feature) => feature, {
        layerFilter: (layer) => layer === vectorLayer
      });
      if (feature && feature.getProperties().properties) {
        const cageData = feature.getProperties().properties;
        setSelectedCage(cageData);
        setModalOpened(true);
      }
    });

    const pointerMoveListenerKey = mapInstance.on("pointermove", function (evt) {
      if (!tooltipRef.current || !tooltipOverlayRef.current) return;

      const feature = mapInstance.forEachFeatureAtPixel(evt.pixel, (feature) => feature, {
        layerFilter: (layer) => layer === vectorLayer
      });
      const targetElement = mapInstance.getTargetElement();

      if (feature) {
        const cageData = feature.getProperties().properties;
        if (!hoveredCage || hoveredCage.cage_id !== cageData.cage_id) {
           setHoveredCage(cageData);
        }
        tooltipRef.current.innerHTML = cageData.cage_name;
        tooltipRef.current.style.display = 'block';
        tooltipOverlayRef.current.setPosition(evt.coordinate);
        if (targetElement) targetElement.style.cursor = 'pointer';
      } else {
        if (hoveredCage) {
            setHoveredCage(null);
        }
        tooltipRef.current.style.display = 'none';
        if (targetElement) targetElement.style.cursor = '';
      }
    });

    return () => {
      if (mapInstance) {
          mapInstance.un('click', clickListenerKey.listener);
          mapInstance.un('pointermove', pointerMoveListenerKey.listener);
      }
    };
  }, [mapInstance, cages, hoveredCage, initialLoadComplete]);

  useEffect(() => {
    if (cageLayerRef.current) {
      cageLayerRef.current.setVisible(showCageLayer);
      if (!showCageLayer && tooltipRef.current) {
        tooltipRef.current.style.display = 'none';
      }
    }
  }, [showCageLayer]);

  const getStatusColor = (status) => {
    return status === 'good' ? 'green' : 'orange';
  };

  const handleViewProfile = () => {
    if (selectedCage) {
      localStorage.setItem("selectedCageId", selectedCage.cage_id);
      navigate("/profile");
    }
  };

  return (
    <>
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={<Title order={4}>Fish Cage Details</Title>}
        size="md"
        centered
        overlayProps={{ blur: 2 }}
      >
        {selectedCage ? (
          <Stack gap="md">
            <Paper withBorder p="sm" radius="sm" bg={'#f8f9fa'}>
              <Group justify="space-between" align="center">
                <Box>
                  <Title order={5}>Cage Name: {selectedCage.cage_name}</Title>
                  {isAdmin && (
                    <Group gap="xs" mt={4} align="center">
                      <Building size={14} />
                      <Text size="sm" fw={500} c="blue">
                        Farm ID: {selectedCage.farm_id || 'N/A'}
                      </Text>
                    </Group>
                  )}
                </Box>
                <Badge
                  color={getStatusColor(selectedCage.status)}
                  size="lg"
                  variant="light"
                  radius="sm"
                  leftSection={selectedCage.status === 'good' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                >
                  {selectedCage.status === 'at risk' ? 'At Risk' : selectedCage.status.charAt(0).toUpperCase() + selectedCage.status.slice(1)}
                </Badge>
              </Group>
            </Paper>

            <Paper withBorder p="md" radius="sm">
              <Stack gap="lg">
                <Box>
                  <Group gap="xs" mb={4}>
                    <Fish size={16} />
                    <Text size="sm" c="dimmed">Farmed Species</Text>
                  </Group>
                  <Text ml={25} fw={600} size="lg">
                    {getDisplaySpeciesName(selectedCage.fish_farmed)}
                  </Text>
                </Box>

                <Divider />

                <Box>
                  <Group gap="xs" mb={4}>
                    <MapPin size={16} />
                    <Text size="sm" c="dimmed">Coordinates</Text>
                  </Group>
                  <Text ml={25} fw={600} size="lg" ff="monospace">
                    {selectedCage.lat?.toFixed(6) || 'N/A'}, {selectedCage.lon?.toFixed(6) || 'N/A'}
                  </Text>
                </Box>
              </Stack>
            </Paper>

            {isAdmin ? (
              <Button
                fullWidth
                variant="outline"
                color="gray"
                onClick={() => setModalOpened(false)}
                mt="md"
              >
                Close
              </Button>
            ) : (
              <Button
                fullWidth
                variant="filled"
                color="blue"
                onClick={handleViewProfile}
                mt="md"
                leftSection={<Building size={16} />}
              >
                View Cage Measurements in Profile
              </Button>
            )}
          </Stack>
        ) : (
          <Text c="dimmed" ta="center">No cage data selected.</Text>
        )}
      </Modal>

      {loading && (
        <div style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.8)",
          padding: "8px 16px",
          borderRadius: "4px",
          zIndex: 1000,
        }}>
          Loading cages...
        </div>
      )}
      {error && (
        <div style={{
          position: "absolute",
          bottom: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(255,255,255,0.8)",
          padding: "8px 16px",
          borderRadius: "4px",
          color: "red",
          zIndex: 1000,
        }}>
          {error}
        </div>
      )}
    </>
  );
}

export default FishCageOverlay;