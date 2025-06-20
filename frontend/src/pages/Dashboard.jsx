import { useState, useEffect } from 'react';
import { AppShell, Burger, Group, useMantineTheme, LoadingOverlay, Modal, Text } from "@mantine/core";
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import LeftSidebar from "../components/dashboard/LeftSidebar";
import MapComponent from "../components/dashboard/Map";
import RightSidebar from "../components/dashboard/RightSidebar";
import RightSidebarToggleButton from "../components/dashboard/RightSidebarToggle";
import GeoJSON from 'ol/format/GeoJSON';
import axios from 'axios';
import { calculateMidpoint } from '../utils/map-utils';

function Dashboard({ selectedFeatureFromSearch, clearSelectedFeature }) {
    // State for dashboard parameters
    const [startDate, setStartDate] = useState(new Date(2025, 0, 1));
    const [endDate, setEndDate] = useState(new Date());
    const [selectedParameter, setSelectedParameter] = useState('chlorophyll');
    const [selectedOverlayDate, setSelectedOverlayDate] = useState(null);
    const [cloudCover, setCloudCover] = useState(20);
    const [isCompositeMode, setIsCompositeMode] = useState(true);

    // States for map and asset data
    const [rgbMapTileUrl, setRgbMapTileUrl] = useState(null);
    const [wqMapTileUrl, setWqMapTileUrl] = useState(null);
    const [wqLegendMin, setWqLegendMin] = useState(null);
    const [wqLegendMax, setWqLegendMax] = useState(null);
    const [assetFeatures, setAssetFeatures] = useState(null); 
    const [availableDates, setAvailableDates] = useState([]);
    const [mapLoading, setMapLoading] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [mapInstance, setMapInstance] = useState(null);
    const [selectedAssetFeature, setSelectedAssetFeature] = useState(null);
    const [mapCenter, setMapCenter] = useState([121.64355545857632, 13.81529622721097]);
    const [mapZoom, setMapZoom] = useState(9.7);

    // Responsive State
    const theme = useMantineTheme();
    const [mobileNavOpened, { toggle: toggleMobileNav }] = useDisclosure(false);
    const [isRightSidebarVisible, { toggle: toggleRightSidebar, open: openRightSidebar, close: closeRightSidebar }] = useDisclosure(false);
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    // Map Layer visibility states
    const [showWqLayer, setShowWqLayer] = useState(true);
    const [showRgbLayer, setShowRgbLayer] = useState(true);
    const [showFishCagesLayer, setShowFishCagesLayer] = useState(true);
    const [isLegendVisible, setIsLegendVisible] = useState(true);

    // Helper for parameter info
    const parameterInfo = {
      chlorophyll: { label: "Chlorophyll-a", unit: "µg/L" },
      turbidity: { label: "Turbidity", unit: "NTU" },
      tss: { label: "Suspended Sediments", unit: "mg/L" },
    };
    const currentSelectedParamInfo = parameterInfo[selectedParameter];

    useEffect(() => {
        if (selectedFeatureFromSearch) {
            const olFeature = new GeoJSON().readFeature(selectedFeatureFromSearch, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });
            handleFeatureSelect(olFeature);
        }
    }, [selectedFeatureFromSearch]);

    const handleFeatureSelect = (feature) => {
        if (!feature) {
             setSelectedAssetFeature(null);
             if (isRightSidebarVisible) closeRightSidebar();
             clearSelectedFeature();
             return;
        }

        const featureObject = new GeoJSON().writeFeatureObject(feature, {
            featureProjection: 'EPSG:3857',
            dataProjection: 'EPSG:4326'
        });

        const isSameFeature = selectedAssetFeature && selectedAssetFeature.properties["FLA Number"] === featureObject.properties["FLA Number"];

        if (isSameFeature) {
            setSelectedAssetFeature(null);
            if (isRightSidebarVisible) closeRightSidebar();
            clearSelectedFeature();
        } else {
            setSelectedAssetFeature(featureObject);
            const midpoint = calculateMidpoint(featureObject);
            if (midpoint) {
                setMapCenter(midpoint);
                setMapZoom(15);
            }
            if (!isRightSidebarVisible) openRightSidebar();
        }
    };

    const handleRightSidebarToggle = () => {
        if (isRightSidebarVisible) {
            setSelectedAssetFeature(null);
            clearSelectedFeature();
        }
        toggleRightSidebar();
    };

    useEffect(() => {
        const fetchAssetFeatures = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get_asset_features`);
                setAssetFeatures(response.data);
            } catch (err) {
                console.error("Error fetching asset features:", err);
                setMapError(err.message || "Failed to load asset features.");
            }
        };
        fetchAssetFeatures();
    }, []);

    useEffect(() => {
        const fetchMapTilesAndDates = async () => {
            setMapLoading(true);
            setMapError(null);
            try {
                const datesResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get_available_dates`, {
                    params: {
                        start_date: startDate.toISOString().split('T')[0],
                        end_date: endDate.toISOString().split('T')[0],
                        cloud_cover: cloudCover,
                    }
                });
                setAvailableDates(datesResponse.data.available_dates || []);

                let effectiveOverlayDate = selectedOverlayDate;
                if (!isCompositeMode && !selectedOverlayDate && datesResponse.data.available_dates.length > 0) {
                    const latestDate = new Date(datesResponse.data.available_dates[datesResponse.data.available_dates.length - 1]);
                    setSelectedOverlayDate(latestDate);
                    effectiveOverlayDate = latestDate;
                } else if (isCompositeMode) {
                    setSelectedOverlayDate(null);
                    effectiveOverlayDate = null;
                }
                
                let wqTileUrl = null, wqMin = null, wqMax = null;
                if (isCompositeMode) {
                    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get_composite_tile`, { params: { parameter: selectedParameter, start_date: startDate.toISOString().split('T')[0], end_date: endDate.toISOString().split('T')[0], cloud_cover: cloudCover }});
                    wqTileUrl = res.data.tile_url; wqMin = res.data.legend_min; wqMax = res.data.legend_max;
                } else if (effectiveOverlayDate) {
                    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get_specific_date_tile`, { params: { parameter: selectedParameter, date: effectiveOverlayDate.toISOString().split('T')[0], cloud_cover: cloudCover }});
                    wqTileUrl = res.data.tile_url; wqMin = res.data.legend_min; wqMax = res.data.legend_max;
                }
                setWqMapTileUrl(wqTileUrl); setWqLegendMin(wqMin); setWqLegendMax(wqMax);

                let rgbTileUrl = null;
                if (isCompositeMode) {
                    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get_composite_rgb_tile_for_polygons`, { params: { start_date: startDate.toISOString().split('T')[0], end_date: endDate.toISOString().split('T')[0], cloud_cover: cloudCover }});
                    rgbTileUrl = res.data.tile_url;
                } else if (effectiveOverlayDate) {
                    const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/get_specific_date_rgb_tile_for_polygons`, { params: { date: effectiveOverlayDate.toISOString().split('T')[0], cloud_cover: cloudCover }});
                    rgbTileUrl = res.data.tile_url;
                }
                setRgbMapTileUrl(rgbTileUrl);

            } catch (err) {
                console.error("Error fetching map data:", err);
                setMapError(err.message || "Failed to load map data.");
            } finally {
                setMapLoading(false);
            }
        };
        fetchMapTilesAndDates();
    }, [startDate, endDate, selectedParameter, cloudCover, isCompositeMode, selectedOverlayDate]);

    return (
        <div style={{ height: 'calc(100vh - 70px)', width: '100%' }}>
            <AppShell
                padding="md"
                navbar={{ width: { base: '100%', sm: 350, lg: 400 }, breakpoint: 'sm', collapsed: { mobile: !mobileNavOpened, desktop: false } }}
                aside={{ width: { base: '100%', sm: 300, lg: 350 }, breakpoint: 'sm', collapsed: { mobile: true, desktop: !isRightSidebarVisible } }}
                style={{ height: '100%' }}
            >
                <AppShell.Navbar p="md" style={{ backgroundColor: '#F7F9F9', height: '100%', borderRight: `1px solid ${theme.colors.gray[3]}` }}>
                    {isMobile && <Group justify="flex-end" mb="sm"><Burger opened={mobileNavOpened} onClick={toggleMobileNav} size="sm" /></Group>}
                    <LeftSidebar {...{ startDate, setStartDate, endDate, setEndDate, selectedParameter, setSelectedParameter, selectedOverlayDate, setSelectedOverlayDate, cloudCover, setCloudCover, isCompositeMode, setIsCompositeMode, availableDates, setMapLoading, setMapError }} />
                </AppShell.Navbar>

                <AppShell.Main style={{ backgroundColor: 'white', height: '100%', position: 'relative' }}>
                    {mapLoading && (
                        <Modal opened={mapLoading} onClose={() => {}} withCloseButton={false} closeOnClickOutside={false} closeOnEscape={false} centered overlayProps={{ blur: 2, opacity: 0.5 }} radius="md" size="xs">
                            <Text fw={700} ta="center" size="lg" mb={30}>Fetching Map Data...</Text>
                            <Text size="sm" ta="center" c="dimmed">Please wait while we load the latest satellite imagery.</Text>
                            <LoadingOverlay visible={true} overlayProps={{ radius: "xs", blur: 0 }} loaderProps={{ size: "xs", color: "blue" }} />
                        </Modal>
                    )}
                    {mapError && <div style={{ position: "absolute", top: "20px", left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.8)", padding: "8px 16px", borderRadius: "4px", color: "red", zIndex: 1002, textAlign: 'center' }}>Error loading map: {mapError}</div>}
                    <MapComponent {...{ rgbMapTileUrl, wqMapTileUrl, wqLegendMin, wqLegendMax, selectedParameter, currentSelectedParamInfo, assetFeatures, showWqLayer, setShowWqLayer, showRgbLayer, setShowRgbLayer, showFishCagesLayer, setShowFishCagesLayer, isLegendVisible, setIsLegendVisible, onMapInstanceReady: setMapInstance, mapLoading, centerCoordinates: mapCenter, zoomLevel: mapZoom, onFeatureSelect: handleFeatureSelect, selectedAssetFeature }} />
                    {!isMobile && <RightSidebarToggleButton onClick={handleRightSidebarToggle} isSidebarOpen={isRightSidebarVisible} />}
                </AppShell.Main>

                <AppShell.Aside style={{ backgroundColor: '#F7F9F9', borderLeft: `1px solid ${theme.colors.gray[3]}` }}>
                    <RightSidebar {...{ startDate, endDate, selectedParameter, cloudCover, selectedAssetFeature }} />
                </AppShell.Aside>
            </AppShell>
        </div>
    );
}

export default Dashboard;