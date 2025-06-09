import { useState } from 'react';
import {
  Modal,
  Stepper,
  Button,
  Group,
  Text,
  Title,
  Stack,
  Paper,
  List,
  Highlight,
  Code,
  ThemeIcon,
  rem,
  useMantineTheme,
  Divider,
  Accordion,
} from '@mantine/core';
import {
  FishSymbol,
  SlidersHorizontal,
  Map,
  CloudSun,
  Check,
  Download,
  Maximize2,
  RefreshCcw,
  HelpCircle,
  Palette,
  MapPin,
  MapIcon,
  Layers,
  ZoomIn,
  Eye,
} from 'lucide-react';

const PIN_ICON_SVG_STRING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32"><path d="M12 0 C7.03 0 3 4.03 3 9 C3 14.25 12 32 12 32 S 21 14.25 21 9 C21 4.03 16.97 0 12 0 Z" fill="#6c2fa8" stroke="#ffffff" stroke-width="1.5"/><circle cx="12" cy="9" r="4" fill="#ffffff"/></svg>`;
const HIGHLIGHTED_PIN_ICON_SVG_STRING = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="24" height="32"><path d="M12 0 C7.03 0 3 4.03 3 9 C3 14.25 12 32 12 32 S 21 14.25 21 9 C21 4.03 16.97 0 12 0 Z" fill="#007bff" stroke="#ffffff" stroke-width="1.5"/><circle cx="12" cy="9" r="4" fill="#ffffff"/></svg>`;

const svgToDataUrl = (svgString) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgString.replace(/\s+/g, ' '))}`;


function HelpGuideModal({ isOpen, onClose }) {
  const [activeStep, setActiveStep] = useState(0);
  const theme = useMantineTheme();

  const nextStep = () =>
    setActiveStep((current) => (current < 3 ? current + 1 : current));
  const prevStep = () =>
    setActiveStep((current) => (current > 0 ? current - 1 : current));

  return (
    <Modal
      opened={isOpen}
      onClose={onClose}
      title={<Title order={4}><HelpCircle size={16} color='gray'/> Help Guide</Title>}
      size="xl"
      centered
      overlayProps={{ blur: 2 }}
      closeOnClickOutside={activeStep === 0}
      closeOnEscape={activeStep === 0}
      styles={{
        title: { fontWeight: 600 },
        body: { maxHeight: '70vh', overflowY: 'auto' },
      }}
    >
      <Stepper
        active={activeStep}
        onStepClick={setActiveStep}
        breakpoint="sm"
        allowNextStepsSelect={false}
        styles={(theme) => ({
          steps: {
            position: 'sticky',
            top: -16, // Adjust based on modal padding (usually negative padding)
            backgroundColor: theme.white, // Match modal background
            zIndex: 10, // Ensure it's above scrolling content
            paddingTop: theme.spacing.md, // Add padding to prevent overlap with modal title
            paddingBottom: theme.spacing.md, // Add padding below stepper
            marginLeft: `calc(-1 * ${theme.spacing.md})`, // Counteract modal padding
            marginRight: `calc(-1 * ${theme.spacing.md})`,// Counteract modal padding
            paddingLeft: theme.spacing.md, // Re-apply padding inside sticky element
            paddingRight: theme.spacing.md,// Re-apply padding inside sticky element
            borderBottom: `1px solid ${theme.colors.gray[3]}`, // Add separator line
          },
        })}
      >
        {/* Step 1: Welcome */}
        <Stepper.Step
          label="Welcome"
          description="Introduction"
          icon={<FishSymbol style={{ width: rem(18), height: rem(18) }} />}
        >
          <Stack gap="md">
            <Title align="center" order={3} c={theme.colors.blue[7]}>Welcome to BAYSENSE!</Title>
            <Text align="center" size="sm" fw={700}>
              Your integrated platform for monitoring key environmental factors impacting aquaculture in Sampaloc Lake.
            </Text>
            <Paper withBorder p="md" radius="md" bg={theme.colors.blue[0]}>
              <Text size="sm">
                <Highlight
                  highlight={[
                    'optically active',
                    'Sentinel-2 satellite data',
                    'real-time weather information',
                    'Chlorophyll-a', 'Turbidity', 'Suspended Sediments',
                    'Rainfall', 'Wind Gust'
                  ]}
                >
                  BAYSENSE utilizes the power of Sentinel-2 satellite data via Google Earth Engine and real-time weather information from OpenWeatherMap. 
                  BAYSENSE aims to  provide valuable insights into crucial optically active water quality parameters (Chlorophyll-a, Turbidity, Suspended Sediments) and 
                  relevant meteorological conditions (Rainfall, Wind Gust) to support informed decision-making.
                </Highlight>
              </Text>
            </Paper>
            <Text align="center" size="xs" fw={500} c={theme.colors.blue[7]}>
              Use the buttons below to navigate through the guide sections.
            </Text>
          </Stack>
        </Stepper.Step>

        {/* Step 3: Map Interface */}
        <Stepper.Step
          label="Map Interface"
          description="Visualization"
          icon={<MapIcon style={{ width: rem(18), height: rem(18) }} />}
        >
          <Stack mt="md" gap="md">
            <Title order={3} c={theme.colors.blue[7]}>Using the Map</Title>
            
            {/* First Paper: Map Location & Layers Overview */}
            <Paper
              withBorder
              pt="md" 
              pb="md" 
              pl="md" 
              pr={30} 
              radius="md"
              shadow="sm"
            >
              <Group gap="xs" mb="sm">
                <MapIcon size={18} color={theme.colors.blue[8]} /> {/* Using imported MapIcon */}
                <Text fw={600} c={theme.colors.blue[7]}>Map Focus: Sampaloc Lake</Text>
              </Group>
              <Text size="sm" lh="md" mb="md">
                <Highlight
                  highlight={[
                    'Sampaloc Lake',
                  ]}
                  highlightStyles={{ fontWeight: 700, backgroundColor: theme.colors.yellow[1], padding: '1px 2px' }}
                >
                  The BAYSENSE application is specifically designed to monitor Sampaloc Lake. This significant volcanic crater lake is located in San Pablo City, Laguna, Philippines, and is distinguished as the largest of the city's famed Seven Lakes.                   
                  </Highlight>
              </Text>
              <Text fw={600} mb="xs" c={theme.colors.blue[8]}>Key Map Layers:</Text>

              <Text size="sm" mb="sm" lh="md">
                <Highlight
                  highlight={[
                    'toggle switches',
                    'eye icon',
                  ]}
                >
                  You can control the visibility of these layers using the toggle switches in the legend area (typically bottom-left, and the legend itself can be shown or hidden using the eye icon button on the map):
                </Highlight>
              </Text>
              <List spacing="sm" size="sm" withPadding listStyleType='none'>
                <List.Item icon={<ThemeIcon color="cyan" size={20} radius="xl"><Layers size={12}/></ThemeIcon>} styles={{ itemWrapper: { alignItems: 'flex-start' } }}>
                  <Text fw={600}>Parameter Layer (Water Quality Visualization):</Text>
                    This is the core data visualization. When you select a parameter (e.g., <Code>Chlorophyll-a</Code>, <Code>Turbidity</Code>, <Code>TSS</Code>) in the Analysis Panel and run the analysis, this layer displays the calculated concentration or index values of that parameter spatially across Sampaloc Lake. The colors you see directly correspond to the gradient legend, showing how the chosen water quality indicator varies in different parts of the lake.
                </List.Item>
                <List.Item icon={<ThemeIcon color="teal" size={20} radius="xl"><ZoomIn size={12}/></ThemeIcon>} styles={{ itemWrapper: { alignItems: 'flex-start' } }}>
                  <Text fw={600}>True Color View (RGB Layer):</Text>
                  This layer provides a natural-looking satellite image of the lake and surroundings, much like what you might see with the naked eye from above. It is created using Sentinel-2 satellite Bands 4 (Red), 3 (Green), and 2 (Blue). This view is helpful for contextualizing the parameter data, allowing you to see the lake's actual appearance, nearby land use, and any visible features like cloud cover or sediment plumes.
                </List.Item>
                <List.Item icon={<ThemeIcon color="gray" size={20} radius="xl"><MapIcon size={12}/></ThemeIcon>} styles={{ itemWrapper: { alignItems: 'flex-start' } }}>
                  <Text fw={600}>Base Map:</Text>
                  The underlying map, sourced from OpenStreetMap, provides geographical context like roads, place names, and general land features. While it may offer street-level details in some areas, BAYSENSE's primary analytical strength lies in the satellite-derived Parameter and RGB layers for water quality assessment.
                </List.Item>
              </List>
            </Paper>
            
            {/* Second Paper: Gradient Legend Explanation */}
            <Paper
              withBorder
              pt="md" 
              pb="md" 
              pl="md" 
              pr={20}
              radius="md"
              shadow="sm"
            >
              <Group gap="xs" mb="sm">
                <Palette size={18} color={theme.colors.blue[8]} />
                <Text fw={600} c={theme.colors.blue[7]}>Interpreting the Map Legend</Text>
              </Group>
              
              <Text size="sm" lh="md" mb="xs">
                The interactive legend (bottom-left of the map) helps you understand the water quality data visualization. 
                Toggle its visibility using the <ThemeIcon size="xs" variant="transparent"><Eye size={14} /></ThemeIcon> eye icon.
              </Text>

              <Divider my="sm" />

              {/* <Title order={5} mb="sm" c={theme.colors.blue[7]}>Key Features</Title> */}
              
              <List listStyleType="disc" size="sm" spacing={8} pl="lg">
                <List.Item>
                  <Text fw={600}>Dynamic Color Scaling:</Text> 
                  <Text mt={3}>
                    <Highlight highlight={['percentile stretch', 'relative spread of data values']}> 
                      The map utilizes a "percentile stretch" (usually 5th to 95th percentile) for its color scale. This means the colors represent the relative spread of data values currently visible or under analysis, enhancing visual contrast for that specific dataset.
                    </Highlight>
                  </Text>
                  
                  <Paper withBorder p="sm" mt="sm" mr={20} radius="sm" bg={theme.colors.blue[0]}>
                    <Text size="xs" fw={600} mb={4}>What This Means:</Text>
                    <List size="xs" spacing={3}>
                      <List.Item>
                        While "red" always indicates high values <Text size="xs" component="i">relative to that specific view</Text>, the exact numerical value represented by red may differ between dates
                      </List.Item>
                      <List.Item>
                        <Text size="xs" component="span">Effective analysis strategy:</Text>
                        <List size="xs" withPadding listStyleType="circle" spacing={2} mt={4} pl="lg">
                          <List.Item>Check the legend's numerical anchors for each view</List.Item>
                          <List.Item>Focus on spatial patterns <Text size="xs" component="i">within</Text> a single date/view first</List.Item>
                          <List.Item>Use the time-series charts for comparing absolute values across different dates</List.Item>
                        </List>
                      </List.Item>
                    </List>
                    
                    <Text size="xs" mt="sm" c="dimmed">
                      Tip: The map excels at showing spatial patterns at a given time, while the charts are better for tracking value trends over time.
                    </Text>
                  </Paper>
                </List.Item>
                
                <List.Item>
                  <Text fw={600}>Color Meaning:</Text> The gradient (blue → green → yellow → red) represents:
                  <List listStyleType="circle" spacing={4} mt={4} pl="lg">
                    <List.Item>
                      <Text component="span" c={theme.colors.blue[7]} fw={500}>Blue/cool shades:</Text> Lower values (-1 to 0)
                    </List.Item>
                    <List.Item>
                      <Text component="span" c={theme.colors.red[7]} fw={500}>Red/warm shades:</Text> Higher values (0 to +1)
                    </List.Item>
                  </List>
                </List.Item>
              </List>

              <Divider my="sm" />

              <Title order={5} mb="sm" c={theme.colors.blue[7]}>Parameter-Specific Guidance</Title>
              
              <Accordion variant="contained" chevronPosition="left">
                <Accordion.Item value="chlorophyll">
                  <Accordion.Control>
                    <Text fw={600}>Chlorophyll-a (Algae Indicator)</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <List listStyleType="disc" spacing={4} pl="lg">
                      <List.Item>
                        <Text component="span" c={theme.colors.red[7]} fw={500}>High values (red/yellow):</Text> 
                        Suggest algal blooms. Watch for:
                        <List listStyleType="circle" spacing={2} mt={4} pl="lg">
                          <List.Item>Potential oxygen depletion at night</List.Item>
                          <List.Item>Fish gasping at surface</List.Item>
                          <List.Item>Possible fish kills if sustained</List.Item>
                        </List>
                      </List.Item>
                      <List.Item>
                        <Text component="span" c={theme.colors.blue[7]} fw={500}>Low values (blue/green):</Text> 
                        Normal conditions. Extremely low values may indicate nutrient limitation.
                      </List.Item>
                    </List>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="turbidity">
                  <Accordion.Control>
                    <Text fw={600}>Turbidity (Water Clarity)</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <List listStyleType="disc" spacing={4} pl="lg">
                      <List.Item>
                        <Text component="span" c={theme.colors.red[7]} fw={500}>High values (red/yellow):</Text> 
                        May indicate:
                        <List listStyleType="circle" spacing={2} mt={4} pl="lg">
                          <List.Item>Recent heavy rainfall/runoff</List.Item>
                          <List.Item>Bottom sediment disturbance</List.Item>
                          <List.Item>Potential gill irritation in fish</List.Item>
                        </List>
                      </List.Item>
                      <List.Item>
                        <Text component="span" c={theme.colors.blue[7]} fw={500}>Low values (blue/green):</Text> 
                        Clear water conditions ideal for light penetration.
                      </List.Item>
                    </List>
                  </Accordion.Panel>
                </Accordion.Item>

                <Accordion.Item value="sediments">
                  <Accordion.Control>
                    <Text fw={600}>Suspended Sediments</Text>
                  </Accordion.Control>
                  <Accordion.Panel>
                    <List listStyleType="disc" spacing={4} pl="lg">
                      <List.Item>
                        <Text component="span" c={theme.colors.red[7]} fw={500}>High values (red/yellow):</Text> 
                        Could signal:
                        <List listStyleType="circle" spacing={2} mt={4} pl="lg">
                          <List.Item>Erosion in the watershed</List.Item>
                          <List.Item>Construction activity nearby</List.Item>
                          <List.Item>Potential pollutant transport</List.Item>
                        </List>
                      </List.Item>
                      <List.Item>
                        <Text component="span" c={theme.colors.blue[7]} fw={500}>Low values (blue/green):</Text> 
                        Normal conditions with minimal suspended particles.
                      </List.Item>
                    </List>
                  </Accordion.Panel>
                </Accordion.Item>
              </Accordion>

              <Divider my="sm" />

              <Text size="sm" fw={500} c="dimmed">
                Tip: Compare with weather data (especially rainfall) to identify correlations between 
                weather events and water quality changes.
              </Text>

              <Divider my="sm" />
              <Text size="sm" fw={500} c="dimmed">
                Note: While the legend provides a general guide, interpreting these values should always be done considering historical trends, recent weather events, and specific local knowledge of Sampaloc Lake. The values are indicators, and extreme readings may warrant further investigation or correlation with on-site measurements if available.
              </Text>
            </Paper>
            
            {/* Third Paper: Fish Cage Markers & Info */}
            <Paper
              withBorder
              pt="md" 
              pb="md" 
              pl="md" 
              pr={20} 
              radius="md"
              shadow="sm"
            >
              <Group gap="xs" mb="sm">
                 <MapPin size={18} color={theme.colors.blue[8]} />
                 <Text fw={600} c={theme.colors.blue[7]}>Fish Cage Markers & Info:</Text>
              </Group>
              <Text size="sm" lh="md" mb="xs">
                When the 'Fish Cages' layer is active (toggled on via its switch in the legend area), distinct markers pinpoint the locations of registered fish cages on the map.
              </Text>
              <List listStyleType="disc" size="sm" mt="xs" spacing={5} pl="lg">
                <List.Item>
                  <Text fw={500}>Pin Appearance & Interaction:</Text>
                  <Group mt={2} gap={4} align="center">
                    Each fish cage is marked by a pin: standard 
                    <img src={svgToDataUrl(PIN_ICON_SVG_STRING)} alt="purple pin" style={{ width: '14px', height: '19px', verticalAlign: 'middle', display: 'inline-block' }} />
                     (purple), which turns 
                    <img src={svgToDataUrl(HIGHLIGHTED_PIN_ICON_SVG_STRING)} alt="blue pin" style={{ width: '16px', height: '21px', verticalAlign: 'middle', display: 'inline-block' }} />
                     (blue and slightly larger) on hover for clear identification.
                  </Group>
                </List.Item>
                <List.Item>Hovering over a pin displays a tooltip with the cage's name.</List.Item>
                <List.Item>Clicking a pin opens a modal with detailed information: Cage Name, Fish Species, current Status, and exact Coordinates.</List.Item>
              </List>
            </Paper>
          </Stack>
        </Stepper.Step>

        {/* Step 2: Left Sidebar (Analysis Panel) */}
        <Stepper.Step
          label="Analysis Panel"
          description="Water Quality"
          icon={<SlidersHorizontal style={{ width: rem(18), height: rem(18) }} />}
        >
          <Stack mt="md" gap="md">
            <Title order={3} c={theme.colors.blue[7]}>Understanding the Analysis Panel</Title>
            
            <Paper
              withBorder
              pt="md" 
              pb="md" 
              pl="md" 
              pr={50}  
              radius="md"
              shadow="sm"
            >
              <Text fw={600} mb="sm" c={theme.colors.blue[7]}>1. Set Analysis Parameters:</Text>
              <List spacing="xs" size="sm" withPadding>
                <List.Item icon={
                  <ThemeIcon color="blue" size={24} radius="xl">
                    <Text size="xs">1</Text>
                  </ThemeIcon>
                  }
                  styles={{ itemWrapper: { alignItems: 'flex-start' } }}
                >
                  <Highlight highlight={['Date Range']} highlightStyles={{
                    backgroundColor: theme.colors.blue[1],
                    fontWeight: 600,
                    padding: 2,
                  }}>
                    Date Range
                  </Highlight> Select the <Code fw={600}>Start Date</Code> and<Code fw={600}>End Date</Code> to define the time period for historical data analysis shown in the chart.
                </List.Item>
                
                <List.Item icon={
                  <ThemeIcon color="blue" size={24} radius="xl">
                    <Text size="xs">2</Text>
                  </ThemeIcon>
                  }
                  styles={{ itemWrapper: { alignItems: 'flex-start' } }}
                >
                  <Highlight highlight={['Parameter']} highlightStyles={{
                    backgroundColor: theme.colors.blue[1],
                    fontWeight: 600,
                    padding: 2,
                  }}>
                    Parameter
                  </Highlight> Choose the water quality indicator you want to analyze.
                  <List withPadding listStyleType="disc" size="sm" mt={5} spacing={4}>
                    <List.Item>
                      <Code fw={600}>Chlorophyll-a</Code>: An indicator of algae concentration. Derived using a method similar to the Normalized Difference Chlorophyll Index (NDCI). High levels can indicate potential algal blooms.
                    </List.Item>
                    <List.Item>
                      <Code fw={600}>Turbidity</Code>: Measures water clarity. High turbidity can affect light penetration and fish health. Derived using a method similar to the Normalized Difference Turbidity Index (NDTI).
                    </List.Item>
                    <List.Item>
                      <Code fw={600}>Suspended Sediments</Code>: Represents the amount of particles in the water. Derived using a method similar to the Normalized Difference Suspended Sediment Index (NDSSI). High levels can stress fish and indicate erosion or runoff.
                    </List.Item>
                  </List>
                </List.Item>
                
                <List.Item icon={
                  <ThemeIcon color="blue" size={24} radius="xl">
                    <Text size="xs">3</Text>
                  </ThemeIcon>
                  }
                  styles={{ itemWrapper: { alignItems: 'flex-start' } }}
                >
                  <Highlight highlight={['Image Mode']} highlightStyles={{
                    backgroundColor: theme.colors.blue[1],
                    fontWeight: 600,
                    padding: 2,
                  }}>
                    Image Mode
                  </Highlight>
                  <List withPadding listStyleType="disc" size="sm" mt={5} spacing={4}>
                    <List.Item>
                      <Code fw={600}>Composite (median)</Code>: Creates an average, often clearer, image from all available satellite passes within your selected date range. Good for general trends and reducing cloud impact.
                    </List.Item>
                    <List.Item>
                      <Code fw={600}>Single</Code>: Allows you to select a specific date (from available dates) to view the map overlay for that exact day. Use the 'Map Overlay Date' picker that appears below when this mode is selected.
                    </List.Item>
                  </List>
                </List.Item>
                
                <List.Item icon={
                  <ThemeIcon color="blue" size={24} radius="xl">
                    <Text size="xs">4</Text>
                  </ThemeIcon>
                  }
                  styles={{ itemWrapper: { alignItems: 'flex-start' } }}
                >
                  <Highlight highlight={['Cloud Cover (%)']} highlightStyles={{
                    backgroundColor: theme.colors.blue[1],
                    fontWeight: 600,
                    padding: 2,
                  }}>
                    Cloud Cover (%)
                  </Highlight> Filter satellite images based on the maximum allowed cloud percentage. Lower values mean clearer images but potentially fewer available dates. Higher values allow more images but some might be obscured by clouds.
                </List.Item>
              </List>
            </Paper>
            
            <Paper
              withBorder
              pt="md" 
              pb="md" 
              pl="md" 
              pr={30}  
              radius="md"
              shadow="sm"
            >
              <Text fw={600} mb="sm" c={theme.colors.blue[7]}>2. Apply Your Settings:</Text>
              <Text size="sm">
                Click the <Button size="xs">Run Analysis</Button> button after setting your desired parameters. This action processes your request and updates the following components with the relevant data:
              </Text>
              <List spacing={4} size="sm" withPadding listStyleType="disc" mt={5}>
                <List.Item>
                  <Highlight highlight={['Map Overlay Date Picker']} highlightStyles={{ backgroundColor: theme.colors.blue[1], fontWeight: 600, padding: '1px 3px', }}>
                    Map Overlay Date Picker
                  </Highlight> Visualizes the selected parameter across the lake for your chosen date(s).
                </List.Item>
                <List.Item>
                  <Highlight highlight={['Parameter Chart']} highlightStyles={{ backgroundColor: theme.colors.blue[1], fontWeight: 600, padding: '1px 3px', }}>
                    Parameter Chart
                  </Highlight> Displays a time-series graph of the parameter's average value within the region of interest for each available satellite image date in your selected range.
                </List.Item>
              </List>
            </Paper>
            
            <Paper
              withBorder
              pt="md" 
              pb="md" 
              pl="md" 
              pr={20}  
              radius="md"
              shadow="sm"
            >
              <Text fw={600} mb="sm" c={theme.colors.blue[7]}>3. Parameter Chart:</Text>
              <Text size="sm">
                This chart shows the trend of the selected water quality parameter over your chosen date range. Hover over points to see specific values. Use the <Download size={14} style={{ marginBottom: -2 }} color={theme.colors.blue[6]} /> icon to download the chart data (CSV) and the <Maximize2 size={14} style={{ marginBottom: -2 }} color={theme.colors.blue[6]} /> icon to view a larger version. Basic statistics (Min, Max, Average, Samples) are shown below the chart.
              </Text>
            </Paper>
          </Stack>
        </Stepper.Step>

        {/* Step 4: Weather Forecast Panel */}
        <Stepper.Step
          label="Weather Panel"
          description="Forecast"
          icon={<CloudSun style={{ width: rem(18), height: rem(18) }} />}
        >
          <Stack mt="md" gap="md">
            <Title order={3} c={theme.colors.blue[7]}>Weather Forecast Panel</Title>
            
            <Paper
              withBorder
              pt="md" 
              pb="md" 
              pl="md" 
              pr={30}  
              radius="md"
              shadow="sm"
            >
              <Text fw={600} mb="sm" c={theme.colors.blue[7]}>Overview:</Text>
              <Text size="sm">
                The panel on the right provides a 5-day / 3-hour weather forecast specifically for the Sampaloc Lake area, powered by OpenWeatherMap. It shows current conditions (Temperature, Humidity) and forecasts for Rainfall and Wind Gusts.
              </Text>
            </Paper>
            
            <Paper
              withBorder
              pt="md" 
              pb="md" 
              pl="md" 
              pr={30}  
              radius="md"
              shadow="sm"
            >
              <Text fw={600} mb="sm" c={theme.colors.blue[7]}>Forecast Chart:</Text>
              <Text size="sm">
                Visualizes the forecasted Rainfall (mm) and Wind Gust (m/s) over the next 5 days. Hover over points for details. Use the <Download size={14} style={{ marginBottom: -2 }} color={theme.colors.blue[6]} /> icon to download data and <Maximize2 size={14} style={{ marginBottom: -2 }} color={theme.colors.blue[6]} /> to expand the chart.
              </Text>
            </Paper>
            
            <Paper
              withBorder
              pt="md" 
              pb="md" 
              pl="md" 
              pr={50}  
              radius="md"
              shadow="sm"
            >
              <Text fw={600} mb="sm" c={theme.colors.blue[7]}>Meteorological Parameters for Fish Pens:</Text>
              <List spacing={4} size="sm" withPadding listStyleType="disc">
                <List.Item>
                  <Highlight highlight={['Rainfall']} highlightStyles={{
                    backgroundColor: theme.colors.blue[1],
                    fontWeight: 600,
                    padding: 2,
                  }}>
                    Rainfall
                  </Highlight> Heavy rainfall can lead to runoff from surrounding areas, potentially carrying pollutants or excess nutrients into the lake, which can drastically affect water quality (e.g., lower dissolved oxygen, increase turbidity). Monitoring rainfall helps anticipate these events. Rainfall warnings (Yellow, Orange, Red) indicate potential flooding risks.
                </List.Item>
                <List.Item>
                  <Highlight highlight={['Wind Gust']} highlightStyles={{
                    backgroundColor: theme.colors.blue[1],
                    fontWeight: 600,
                    padding: 2,
                  }}>
                    Wind Gust
                  </Highlight> Strong wind gusts can damage fish pen structures (nets, anchors) and equipment. High winds also increase water turbulence, which can stress fish and affect feeding patterns. Warnings appear if gusts exceed a critical threshold (e.g., 13 m/s).
                </List.Item>
              </List>
            </Paper>
            
            <Paper
              withBorder
              pt="md" 
              pb="md" 
              pl="md" 
              pr={40}  
              radius="md"
              shadow="sm"
            >
              <Text fw={600} mb="sm" c={theme.colors.blue[7]}>Refresh & Toggle:</Text>
              <Text size="sm">
                Use the <RefreshCcw size={14} style={{ marginBottom: -2 }} color={theme.colors.blue[6]} /> button to fetch the latest forecast. You can hide/show this panel using the arrow button on its left edge.
              </Text>
            </Paper>
          </Stack>
        </Stepper.Step>
      </Stepper>

      <Group justify="center" mt="xl">
        {activeStep > 0 && (
          <Button variant="default" onClick={prevStep}>
            Back
          </Button>
        )}
        {activeStep < 3 ? (
          <Button color="blue" onClick={nextStep}>Next step</Button>
        ) : (
          <Button onClick={onClose} color="green" leftSection={<Check size={16} />}>
            Finish Guide
          </Button>
        )}
      </Group>
    </Modal>
  );
}

export default HelpGuideModal;