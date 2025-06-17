import { useState, useEffect, useMemo } from 'react';
import {
  Title,
  Stack,
  Group,
  Box,
  Text,
  Paper,
  Alert,
  Divider,
} from '@mantine/core';
import ParameterChart from "./ParameterChart";
import ChartModal from "./ChartModal";
import {
  fetchParameterValues,
  processParameterData,
} from "../../utils/analysis";

function RightSidebar({
  startDate,
  endDate,
  selectedParameter,
  cloudCover,
}) {
  const [chartData, setChartData] = useState([]);
  const [processedData, setProcessedData] = useState({ chartData: [], stats: {} });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);

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

  useEffect(() => {
    const loadParameterValues = async () => {
      if (startDate && endDate && selectedParameter) {
        try {
          setIsLoading(true);
          setError(null);
          
          // Commented out the actual API call
          // const values = await fetchParameterValues(
          //   selectedParameter,
          //   startDate,
          //   endDate,
          //   cloudCover
          // );
          
          // Generate dummy data instead
          const dummyData = generateDummyData(startDate, endDate, selectedParameter);
          setChartData(dummyData);
          setProcessedData(processParameterData(dummyData, selectedParam));
        } catch (err) {
          console.error("Error with parameter values:", err);
          setError(err.message || "Failed to load parameter data");
          setProcessedData({ chartData: [], stats: {} });
        } finally {
          setIsLoading(false);
        }
      } else {
        setChartData([]);
        setProcessedData({ chartData: [], stats: {} });
        setError(null);
        setIsLoading(false);
      }
    };

    loadParameterValues();
  }, [startDate, endDate, selectedParameter, cloudCover]);

  // Function to generate dummy data
  const generateDummyData = (startDate, endDate, parameter) => {
    const data = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.floor((end - start) / (1000 * 60 * 60 * 24)) || 30; // Default to 30 days if dates are invalid
    
    // Base values for different parameters
    const baseValues = {
      "chlorophyll": { min: 0.5, max: 12, variation: 3 },
      "turbidity": { min: 1, max: 50, variation: 10 },
      "tss": { min: 5, max: 100, variation: 20 }
    };
    
    const params = baseValues[parameter] || { min: 0, max: 10, variation: 2 };
    
    for (let i = 0; i < days; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);
      
      // Format date as YYYY-MM-DD
      const dateStr = date.toISOString().split('T')[0];
      
      // Generate random value within range with some variation
      const baseValue = params.min + (Math.random() * (params.max - params.min));
      const value = baseValue + (Math.random() * params.variation - params.variation/2);
      
      data.push({
        date: dateStr,
        value: parseFloat(value.toFixed(3))
      });
    }
    
    return data;
  };

  return (
    <Stack spacing="lg" p="md" h="100%" style={{ overflowY: 'auto' }}>
      <Paper p="md" radius="md" withBorder style={{ flexShrink: 0 }}>
        <Group justify="center">
          <Title order={5}>Monitoring & Advisory Panel</Title>
        </Group>
      </Paper>

      <ParameterChart
        chartData={processedData.chartData}
        selectedParam={selectedParam}
        onExpandChart={() => setIsChartModalOpen(true)}
        isLoading={isLoading}
        error={error}
        stats={processedData.stats}
      />

      <Paper p="md" radius="md" withBorder style={{ flexShrink: 0 }}>
        <Stack justify="center" align='center'>
          <Title order={4} md={0}>
            Weather Section
          </Title>
          <Text size='xs' c="dimmed" fs="italic">
            <br /> -- Work in progress --
          </Text>
        </Stack>
      </Paper>

      <Paper p="md" radius="md" withBorder style={{ flexShrink: 0 }}>
        <Stack justify="center" align='center'>
          <Title order={4} md={0}>
            Alerts Section
          </Title>
          <Text size='xs' c="dimmed" fs="italic">
            <br /> -- Work in progress --
          </Text>
        </Stack>
      </Paper>

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