import { useState, useEffect, useMemo } from "react";
import {
  Stack,
  Group,
  Paper,
  Select,
  Text,
  Button,
  ActionIcon,
  Title,
  Tooltip as MantineTooltip,
  Slider,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import { HelpCircle, Info } from "lucide-react";
import MapOverlayDatePicker from "./MapOverlayDatePicker";
import HelpGuideModal from "./HelpGuideModal";

function LeftSidebar({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  selectedParameter,
  setSelectedParameter,
  // Removed parameterType and setParameterType props as they are not used in Dashboard.jsx
  // Removed updateParameterWithType prop as it's not used in Dashboard.jsx
  selectedOverlayDate,
  setSelectedOverlayDate,
  cloudCover,
  setCloudCover,
  isCompositeMode,
  setIsCompositeMode,
  availableDates, // New prop
  setMapLoading, // New prop to indicate map loading
  setMapError, // New prop to indicate map error
}) {
  const [tempSelectedParameter, setTempSelectedParameter] = useState(selectedParameter);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [tempCloudCover, setTempCloudCover] = useState(cloudCover);
  const [tempCompositeMode, setTempCompositeMode] = useState(isCompositeMode);
  // Renamed to localSelectedOverlayDate to avoid confusion with prop
  const [localSelectedOverlayDate, setLocalSelectedOverlayDate] = useState(selectedOverlayDate);

  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false); // Local loading for analysis button
  const [analysisError, setAnalysisError] = useState(null); // Local error for analysis button

  const parameters = {
    "water-quality": [
      { value: "chlorophyll", label: "Chlorophyll-a", unit: "µg/L" },
      { value: "turbidity", label: "Turbidity", unit: "NTU" },
      { value: "tss", label: "Suspended Sediments", unit: "mg/L" },
    ],
  };

  useEffect(() => {
    // Sync internal temp states with props
    setTempSelectedParameter(selectedParameter);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempCloudCover(cloudCover);
    setTempCompositeMode(isCompositeMode);
    setLocalSelectedOverlayDate(selectedOverlayDate); // Sync local state with prop
  }, [
    selectedParameter,
    startDate,
    endDate,
    cloudCover,
    isCompositeMode,
    selectedOverlayDate,
  ]);

  useEffect(() => {
    // If in single mode and availableDates are loaded, ensure localSelectedOverlayDate is valid
    if (!tempCompositeMode && availableDates.length > 0) {
      const formattedSelectedDate = localSelectedOverlayDate ? localSelectedOverlayDate.toISOString().split('T')[0] : null;
      if (!formattedSelectedDate || !availableDates.includes(formattedSelectedDate)) {
        // Find the latest available date
        const latestDateStr = availableDates[availableDates.length - 1];
        setLocalSelectedOverlayDate(new Date(latestDateStr));
      }
    } else if (tempCompositeMode) {
      setLocalSelectedOverlayDate(null); // Clear selection in composite mode
    }
  }, [availableDates, tempCompositeMode, localSelectedOverlayDate]); // Depend on availableDates and tempCompositeMode

  // This useEffect ensures the selected parameter matches the type if changed.
  // It relies on parameters object, which is local, so no prop dependencies here.
  useEffect(() => {
    if (parameters["water-quality"] && parameters["water-quality"].length > 0) {
      const paramBelongsToType = parameters["water-quality"].some(
        (p) => p.value === tempSelectedParameter
      );
      if (!paramBelongsToType) {
        setTempSelectedParameter(parameters["water-quality"][0].value);
      }
    }
  }, [tempSelectedParameter]);

  const runAnalysis = async () => {
    setIsAnalysisLoading(true); // Start local loading
    setAnalysisError(null);     // Clear local error

    // These setters will trigger the main useEffect in Dashboard.jsx
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setSelectedParameter(tempSelectedParameter);
    setCloudCover(tempCloudCover);
    setIsCompositeMode(tempCompositeMode);

    // Only update selectedOverlayDate if in single mode and a date is selected
    if (!tempCompositeMode) {
        setSelectedOverlayDate(localSelectedOverlayDate);
    } else {
        setSelectedOverlayDate(null); // Ensure null in composite mode
    }
    
    // Propagate loading and error states up to Dashboard
    // This is optional, but helps Dashboard show overall map loading
    setMapLoading(true);
    setMapError(null);

    // Since the actual data fetching is in Dashboard's useEffect,
    // we just manage local UI feedback here.
    // The Dashboard's useEffect will eventually setMapLoading(false)
    // and setMapError if there's an issue with fetching map data.
    // We can't await the Dashboard's useEffect here, so we just set loading.
    // For now, setting local loading to false immediately after triggering parent update.
    setIsAnalysisLoading(false);
  };

  return (
    <>
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Stack
          gap="xs"
          style={{
            height: "calc(100% - 60px)",
            overflowY: "auto",
            paddingRight: 8,
            marginBottom: 10,
          }}
        >
          <Paper p="md" radius="md" withBorder>
            <Group position="apart" justify="center">
              <Title order={4}>Water Quality Analysis Panel</Title>
            </Group>
          </Paper>

          <Group grow>
            <DatePickerInput
              label="Start Date"
              placeholder="Select date"
              value={tempStartDate}
              onChange={setTempStartDate}
              minDate={new Date(2020, 0, 1)}
              maxDate={new Date()}
            />

            <DatePickerInput
              label="End Date"
              placeholder="Select date"
              value={tempEndDate}
              onChange={setTempEndDate}
              minDate={tempStartDate}
              maxDate={new Date()}
            />
          </Group>

          <Group grow>
            <Select
              label="Parameter"
              value={tempSelectedParameter}
              onChange={setTempSelectedParameter}
              data={parameters["water-quality"]}
            />

            <Select
              label={
                <Group gap={5}>
                  <Text size="sm">Image Mode</Text>
                  <MantineTooltip
                    label="Choose 'Composite' to use a blended image from all available dates, or 'Single' to select a specific date."
                    withArrow
                  >
                    <ActionIcon size="sm" variant="transparent">
                      <Info size={16} />
                    </ActionIcon>
                  </MantineTooltip>
                </Group>
              }
              value={tempCompositeMode.toString()}
              onChange={(value) => {
                setTempCompositeMode(value === "true");
                if (value === "true") {
                    setLocalSelectedOverlayDate(null);
                } else if (availableDates.length > 0) {
                    setLocalSelectedOverlayDate(new Date(availableDates[availableDates.length - 1]));
                }
              }}
              data={[
                { value: "true", label: "Composite (median)" },
                { value: "false", label: "Single" },
              ]}
            />
          </Group>

          <Paper p="md" radius="md" withBorder>
            <Group gap={5}>
              <Text pb={5} size="sm" weight={200}>
                Cloud Cover (%) - {tempCloudCover}%
              </Text>
              <MantineTooltip
                label="Higher % = more images (may be cloudy). Lower % = clearer images (fewer available)."
                withArrow
              >
                <ActionIcon size="sm" variant="transparent">
                  <Info size={16} />
                </ActionIcon>
              </MantineTooltip>
            </Group>
            <Slider
              pb={25}
              value={tempCloudCover}
              onChange={setTempCloudCover}
              min={10}
              max={100}
              step={10}
              marks={[
                { value: 10, label: "10%" },
                { value: 100, label: "100%" },
              ]}
            />
          </Paper>

          <div
            style={{
              position: "sticky",
              bottom: 0,
              backgroundColor: "#F7F9F9",
              padding: "10px 0",
              zIndex: 1,
            }}
          >
            <Button
              fullWidth
              variant="filled"
              color="blue"
              onClick={runAnalysis}
              loading={isAnalysisLoading}
            >
              Run Analysis
            </Button>
            {analysisError && (
                <Text color="red" size="sm" mt="xs" ta="center">
                    Error: {analysisError}
                </Text>
            )}
          </div>

          <MapOverlayDatePicker
            selectedOverlayDate={localSelectedOverlayDate}
            setSelectedOverlayDate={setLocalSelectedOverlayDate} // Local state setter
            availableDates={availableDates} // Prop from Dashboard
            disabled={tempCompositeMode}
          />
          <Text size="xs" c="dimmed" ta="center" mt="auto" pt="md" pb="xs">
            Remote data provided by{" "}
            <Text
              component="a"
              href="https://earthengine.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              c="blue"
            >
              Google Earth Engine
            </Text>{" "}
            and{" "}
            <Text
              component="a"
              href="https://sentinel.esa.int/web/sentinel/missions/sentinel-2"
              target="_blank"
              rel="noopener noreferrer"
              c="blue"
            >
              Sentinel-2
            </Text>
          </Text>
        </Stack>
      </div>

      <HelpGuideModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </>
  );
}

export default LeftSidebar;