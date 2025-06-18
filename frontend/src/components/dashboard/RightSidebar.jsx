import { useState, useEffect, useMemo } from 'react';
import {
  Title,
  Stack,
  Group,
  Text,
  Paper,
  Divider,
  Badge,
  Tabs,
  ThemeIcon,
  Box,
  SimpleGrid,
  LoadingOverlay,
} from '@mantine/core';
import { MapPin, Calendar, LandPlot, Info, Droplets, Thermometer, Wind, Gauge } from 'lucide-react';
import ParameterChart from "./ParameterChart";
import ChartModal from "./ChartModal";
import {
  processParameterData,
} from "../../utils/analysis";

const FeatureDetails = ({ feature }) => {
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            if (isNaN(date.getTime())) return 'Invalid Date';
            const options = { year: 'numeric', month: 'short', day: 'numeric' };
            return date.toLocaleDateString('en-US', options);
        } catch (error) {
            return 'N/A';
        }
    };

    const status = feature.Status?.toLowerCase() || 'unknown';
    let statusColor = 'gray';
    if (status.includes('expired')) statusColor = 'red';
    else if (status.includes('for renewal')) statusColor = 'orange';
    else if (status.includes('valid')) statusColor = 'green';

    return (
        <Stack gap="xs">
            <Group justify="space-between" align="center">
                <Title order={6}>{feature.Name || 'FLA Information'}</Title>
                <Badge color={statusColor} variant="filled" size="md" radius="xs">
                    {feature.Status || 'N/A'}
                </Badge>
            </Group>
            
            <Divider />

            <SimpleGrid cols={2} spacing="md" verticalSpacing="sm">
                <Group wrap="nowrap" gap="xs">
                    <ThemeIcon variant="light" size="md" radius="md"><MapPin size={14} /></ThemeIcon>
                    <Box>
                        <Text size="xs" c="dimmed">Location</Text>
                        <Text size="xs" fw={500}>{feature.Barangay || 'N/A'}</Text>
                    </Box>
                </Group>
                <Group wrap="nowrap" gap="xs">
                    <ThemeIcon variant="light" size="md" radius="md"><LandPlot size={14} /></ThemeIcon>
                    <Box>
                        <Text size="xs" c="dimmed">Area</Text>
                        <Text size="xs" fw={500}>{feature.Area ? `${feature.Area} ha` : 'N/A'}</Text>
                    </Box>
                </Group>
                <Group wrap="nowrap" gap="xs">
                    <ThemeIcon variant="light" size="md" radius="md"><Calendar size={14} /></ThemeIcon>
                    <Box>
                        <Text size="xs" c="dimmed">Approved</Text>
                        <Text size="xs" fw={500}>{formatDate(feature['Date Apprv'])}</Text>
                    </Box>
                </Group>
                <Group wrap="nowrap" gap="xs">
                    <ThemeIcon variant="light" size="md" radius="md"><Calendar size={14} /></ThemeIcon>
                    <Box>
                        <Text size="xs" c="dimmed">Expiring</Text>
                        <Text size="xs" fw={500}>{formatDate(feature['Date Exp'])}</Text>
                    </Box>
                </Group>
            </SimpleGrid>
        </Stack>
    );
};

const WeatherDisplay = ({ weatherData, isLoading }) => {
    if (isLoading) {
        return (
            <Box style={{ position: 'relative', height: 100 }} m={-10}>
                <Text ta='center' size='xs' mb={-30}>Fetching Weather Data</Text>
                <LoadingOverlay visible={true} overlayProps={{ radius: "xs", blur: 0 }} loaderProps={{ size: "xs", color: "blue" }} m={0}/>
            </Box>
        );
    }

    if (!weatherData) {
        return (
            <Stack justify="center" align='center' gap={0}>
                <Text size='xs' c="dimmed" fs="italic">
                    Weather data not available
                </Text>
            </Stack>
        );
    }

    // Get the most recent forecast entry
    const currentWeather = weatherData.forecast[0];

    return (
        <SimpleGrid cols={2} spacing="md" verticalSpacing="sm">
            <Group wrap="nowrap" gap="xs">
                <ThemeIcon variant="light" size="md" radius="md"><Thermometer size={14} /></ThemeIcon>
                <Box>
                    <Text size="xs" c="dimmed">Temperature</Text>
                    <Text size="xs" fw={500}>{currentWeather.temperature} °C</Text>
                </Box>
            </Group>
            <Group wrap="nowrap" gap="xs">
                <ThemeIcon variant="light" size="md" radius="md"><Droplets size={14} /></ThemeIcon>
                <Box>
                    <Text size="xs" c="dimmed">Humidity</Text>
                    <Text size="xs" fw={500}>{currentWeather.humidity}%</Text>
                </Box>
            </Group>
            <Group wrap="nowrap" gap="xs">
                <ThemeIcon variant="light" size="md" radius="md"><Droplets size={14} /></ThemeIcon>
                <Box>
                    <Text size="xs" c="dimmed">Rainfall (3h)</Text>
                    <Text size="xs" fw={500}>{currentWeather.rainfall} mm</Text>
                </Box>
            </Group>
            <Group wrap="nowrap" gap="xs">
                <ThemeIcon variant="light" size="md" radius="md"><Wind size={14} /></ThemeIcon>
                <Box>
                    <Text size="xs" c="dimmed">Wind Gust</Text>
                    <Text size="xs" fw={500}>{currentWeather.gust_speed} m/s</Text>
                </Box>
            </Group>
        </SimpleGrid>
    );
};

function RightSidebar({
  startDate,
  endDate,
  selectedParameter,
  cloudCover,
  selectedAssetFeature,
}) {
  const [processedData, setProcessedData] = useState({ chartData: [], stats: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [weatherData, setWeatherData] = useState(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  const parameters = {
    "water-quality": [
      { value: "chlorophyll", label: "Chlorophyll-a", unit: "µg/L" },
      { value: "turbidity", label: "Turbidity", unit: "NTU" },
      { value: "tss", label: "Suspended Sediments", unit: "mg/L" },
    ],
  };

  const selectedParam = useMemo(() => {
    for (const type in parameters) {
      const found = parameters[type].find((p) => p.value === selectedParameter);
      if (found) return found;
    }
    return { label: "Unknown", unit: "" };
  }, [selectedParameter]);

  // Function to calculate midpoint of GeoJSON polygon
  const calculateMidpoint = (feature) => {
    if (!feature || !feature.geometry || feature.geometry.type !== 'Polygon') {
      return null;
    }

    const coordinates = feature.geometry.coordinates[0]; // First ring of polygon
    let sumLat = 0;
    let sumLng = 0;
    let count = 0;

    for (const coord of coordinates) {
      sumLng += coord[0];
      sumLat += coord[1];
      count++;
    }

    return count > 0 ? [sumLng / count, sumLat / count] : null;
  };

  // Fetch weather data when selected asset changes
  useEffect(() => {
    const fetchWeatherData = async () => {
      if (!selectedAssetFeature) {
        setWeatherData(null);
        return;
      }

      const midpoint = calculateMidpoint(selectedAssetFeature);
      if (!midpoint) {
        setWeatherData(null);
        return;
      }

      try {
        setWeatherLoading(true);
        const [lon, lat] = midpoint;
        const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/get_weather?lat=${lat}&lon=${lon}`);
        if (!response.ok) throw new Error('Failed to fetch weather data');
        const data = await response.json();
        setWeatherData(data);
      } catch (err) {
        console.error('Error fetching weather data:', err);
        setWeatherData(null);
      } finally {
        setWeatherLoading(false);
      }
    };

    fetchWeatherData();
  }, [selectedAssetFeature]);

  useEffect(() => {
    const loadParameterValues = async () => {
      if (startDate && endDate && selectedParameter) {
        try {
          setIsLoading(true);
          setError(null);
          
          const dummyData = generateDummyData(startDate, endDate, selectedParameter);
          setProcessedData(processParameterData(dummyData, selectedParam));
        } catch (err) {
          console.error("Error with parameter values:", err);
          setError(err.message || "Failed to load parameter data");
          setProcessedData({ chartData: [], stats: {} });
        } finally {
          setIsLoading(false);
        }
      } else {
        setProcessedData({ chartData: [], stats: {} });
        setError(null);
        setIsLoading(false);
      }
    };

    loadParameterValues();
  }, [startDate, endDate, selectedParameter, cloudCover, selectedParam]);

  const generateDummyData = (start, end, parameter) => {
    const data = [];
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) || 30;
    
    const baseValues = {
      "chlorophyll": { min: 0.5, max: 12, variation: 3 },
      "turbidity": { min: 1, max: 50, variation: 10 },
      "tss": { min: 5, max: 100, variation: 20 }
    };
    
    const params = baseValues[parameter] || { min: 0, max: 10, variation: 2 };
    
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const baseValue = params.min + (Math.random() * (params.max - params.min));
      const value = baseValue + (Math.random() * params.variation - params.variation/2);
      
      data.push({
        date: dateStr,
        value: parseFloat(Math.max(0, value).toFixed(3))
      });
    }
    
    return data;
  };

  return (
    <Stack spacing="xs" p="md" h="100%">
      <Paper p="md" radius="md" withBorder style={{ flexShrink: 0 }}>
          <Stack gap="md">
              {selectedAssetFeature ? (
                  <FeatureDetails feature={selectedAssetFeature.properties} />
              ) : (
                  <Stack align="center" gap="xs" p="xs">
                      <ThemeIcon variant="light" radius="xl" size="lg">
                          <Info size={20} />
                      </ThemeIcon>
                      <Title order={5}>Monitoring Panel</Title>
                      <Text size="xs" c="dimmed" ta="center">
                          Click a polygon on the map to view FLA details.
                      </Text>
                  </Stack>
              )}
              
              <Divider />

              <Stack gap="xs">
                  <WeatherDisplay weatherData={weatherData} isLoading={weatherLoading} />
              </Stack>
          </Stack>
      </Paper>

      <Tabs defaultValue="chart" radius="md" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <Tabs.List grow>
          <Tabs.Tab value="chart">Chart</Tabs.Tab>
          <Tabs.Tab value="alerts">Alerts</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="chart" pt="md" style={{ flex: 1, minHeight: 0 }}>
           <ParameterChart
              chartData={processedData.chartData}
              selectedParam={selectedParam}
              onExpandChart={() => setIsChartModalOpen(true)}
              isLoading={isLoading}
              error={error}
              stats={processedData.stats}
          />
        </Tabs.Panel>

        <Tabs.Panel value="alerts" pt="md" style={{ flex: 1, minHeight: 0 }}>
          <Paper p="md" radius="md" withBorder style={{ height: '100%' }}>
              <Stack justify="center" align='center' gap="xs">
                  <Title order={5}>
                      Alerts Section
                  </Title>
                  <Text size='xs' c="dimmed" fs="italic">
                      -- Work in progress --
                  </Text>
              </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <ChartModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        chartData={processedData.chartData}
        selectedParam={selectedParam}
      />
    </Stack>
  );
}

export default RightSidebar;