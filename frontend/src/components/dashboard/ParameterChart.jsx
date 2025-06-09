import { Paper, Text, ActionIcon, Badge, Loader, Group, Box, SimpleGrid, Tooltip as MantineTooltip } from '@mantine/core'; // Import SimpleGrid
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ResponsiveContainer, Legend } from 'recharts'; // Import Legend
import { Maximize2, Download, AlertTriangle } from 'lucide-react';
import { downloadParameterData } from '../../utils/analysis';
import { format, parseISO } from 'date-fns'; // Import date-fns for potential formatting

function ParameterChart({
  chartData,
  selectedParam,
  onExpandChart,
  isLoading,
  error,
  stats = {}
}) {

  const handleDownload = () => {
    // Use the original date format for download if available
    const dataToDownload = chartData.map(item => ({ date: item.date, value: item.value }));
    downloadParameterData(dataToDownload, selectedParam.label);
  };

  // Custom Tooltip for chart
  const CustomChartTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      // Attempt to parse the label back to a Date object for better formatting
      let formattedLabel = label;
      try {
          // Assuming label is in 'yyyy-MM-dd' format from processing
          const dateObj = parseISO(label);
          formattedLabel = format(dateObj, 'MMM d, yyyy');
      } catch (e) {
          // Fallback if parsing fails
          console.warn("Could not parse tooltip label date:", label);
      }

      return (
        <Paper px="md" py="sm" withBorder shadow="md" radius="md">
          <Text fw={700} mb={5}>{formattedLabel}</Text>
          <Text size="sm">
            {selectedParam.label}: {payload[0].value?.toFixed(5)}
          </Text>
        </Paper>
      );
    }
    return null;
  };

  // Formatter for XAxis ticks (show only month/day for brevity)
  const formatXAxis = (tickItem) => {
      try {
          // Assuming tickItem is in 'yyyy-MM-dd' format
          return format(parseISO(tickItem), 'MMM d');
      } catch (e) {
          return tickItem; // Fallback
      }
  };


  return (
    // Use theme padding and ensure consistent height
    <Paper p="md" radius="md" withBorder style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header with Title and Actions */}
      <Group justify="space-between" mb="sm">
        <Badge>{selectedParam.label} Trend</Badge>
        <Group gap="xs">
           <MantineTooltip label="Download Chart Data (CSV)" withArrow position="bottom">
              <ActionIcon
                variant="light"
                color="blue"
                size="lg"
                onClick={handleDownload}
                disabled={isLoading || !chartData || chartData.length === 0}
              >
                <Download size={18} />
              </ActionIcon>
            </MantineTooltip>
            <MantineTooltip label="Expand Chart" withArrow position="bottom">
              <ActionIcon
                variant="light"
                color="blue"
                size="lg"
                onClick={onExpandChart}
                disabled={isLoading || !chartData || chartData.length === 0} // Disable if no data
              >
                <Maximize2 size={18} />
              </ActionIcon>
          </MantineTooltip>
        </Group>
      </Group>

      {/* Error Message */}
      {error && (
        <Group gap="xs" mb="sm" c="red">
          <AlertTriangle size={16} />
          <Text size="sm">{error}</Text>
        </Group>
      )}

      {/* Chart Area */}
      <Box style={{ flexGrow: 1, minHeight: 180 }}>
        {isLoading ? (
          <Group justify="center" align="center" style={{ height: '100%' }}>
            <Loader size="md" />
          </Group>
        ) : !chartData || chartData.length === 0 ? (
          <Group justify="center" align="center" style={{ height: '100%' }}>
            <Text size="sm" c="dimmed">No data available for selected range/parameter</Text>
          </Group>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}> 
              <CartesianGrid strokeDasharray="3 3" stroke="#ccc" />
              <XAxis
                dataKey="date" 
                tickFormatter={formatXAxis}
                tick={{ fontSize: 10 }} 
                dy={5} 
              />
              <YAxis
                tick={{ fontSize: 10 }} 
                tickMargin={5}
                width={45} 
                domain={['auto', 'auto']} 
              />
              <Tooltip content={<CustomChartTooltip />} cursor={{ stroke: '#3498db', strokeWidth: 1, strokeDasharray: '3 3' }}/>
              <Legend verticalAlign="top" height={30} iconSize={10}/> {/* Added Legend */}
              <Line
                type="monotone"
                dataKey="value"
                name={selectedParam.label} // Name for Legend/Tooltip
                stroke="#3498db"
                strokeWidth={2}
                dot={{ r: 2, strokeWidth: 1, fill: '#3498db' }} // Smaller dots
                activeDot={{ r: 5, strokeWidth: 1, stroke: '#fff', fill: '#2980b9' }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </Box>

      {/* Statistics Summary - Improved Layout */}
      {stats && stats.count > 0 && !isLoading && (
         // Use SimpleGrid for better layout control
        <SimpleGrid cols={{ base: 2, xs: 4 }} spacing="sm" mt="md" pt="sm" style={{ borderTop: `1px solid`}}>
          <Box ta="center">
            <Text size="xs" c="dimmed">Min</Text>
            <Text size="sm" fw={600}>{stats.min}</Text>
          </Box>
          <Box ta="center">
            <Text size="xs" c="dimmed">Max</Text>
            <Text size="sm" fw={600}>{stats.max}</Text>
          </Box>
          <Box ta="center">
            <Text size="xs" c="dimmed">Average</Text>
            <Text size="sm" fw={600}>{stats.avg}</Text>
          </Box>
          <Box ta="center">
            <Text size="xs" c="dimmed">Samples</Text>
            <Text size="sm" fw={600}>{stats.count}</Text>
          </Box>
        </SimpleGrid>
      )}
    </Paper>
  );
}

export default ParameterChart;