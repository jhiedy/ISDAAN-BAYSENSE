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
          const values = await fetchParameterValues(
            selectedParameter,
            startDate,
            endDate,
            cloudCover
          );
          setChartData(values);
          setProcessedData(processParameterData(values, selectedParam));
        } catch (err) {
          console.error("Error fetching parameter values:", err);
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