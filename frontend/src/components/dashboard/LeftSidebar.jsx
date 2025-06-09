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
import {
  fetchAvailableDates,
  getLatestAvailableDate,
  isDateAvailable,
} from "../../utils/dates";

function LeftSidebar({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  selectedParameter,
  setSelectedParameter,
  parameterType = "water-quality",
  setParameterType,
  updateParameterWithType,
  selectedOverlayDate,
  setSelectedOverlayDate,
  cloudCover,
  setCloudCover,
  isCompositeMode,
  setIsCompositeMode,
}) {
  const [tempParameterType, setTempParameterType] = useState(parameterType);
  const [tempSelectedParameter, setTempSelectedParameter] =
    useState(selectedParameter);
  const [tempStartDate, setTempStartDate] = useState(startDate);
  const [tempEndDate, setTempEndDate] = useState(endDate);
  const [tempCloudCover, setTempCloudCover] = useState(cloudCover);
  const [tempCompositeMode, setTempCompositeMode] = useState(isCompositeMode);
  const [tempSelectedOverlayDate, setTempSelectedOverlayDate] =
    useState(selectedOverlayDate);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [availableDates, setAvailableDates] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const parameters = {
    "water-quality": [
      { value: "chlorophyll", label: "Chlorophyll-a", unit: "µg/L" },
      { value: "turbidity", label: "Turbidity", unit: "NTU" },
      { value: "tss", label: "Suspended Sediments", unit: "mg/L" },
    ],
  };

  useEffect(() => {
    setTempParameterType(parameterType);
    setTempSelectedParameter(selectedParameter);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempCloudCover(cloudCover);
    setTempCompositeMode(isCompositeMode);
    setTempSelectedOverlayDate(selectedOverlayDate);
  }, [
    parameterType,
    selectedParameter,
    startDate,
    endDate,
    cloudCover,
    isCompositeMode,
    selectedOverlayDate,
  ]);

  useEffect(() => {
    const loadAvailableDates = async () => {
      if (tempStartDate && tempEndDate && tempCloudCover) {
        try {
          const dates = await fetchAvailableDates(
            tempStartDate,
            tempEndDate,
            tempCloudCover
          );
          setAvailableDates(dates);

          if (dates.length > 0) {
            const latestDate = getLatestAvailableDate(dates);
            if (
              !tempSelectedOverlayDate ||
              !isDateAvailable(tempSelectedOverlayDate, dates)
            ) {
              setTempSelectedOverlayDate(latestDate);
            }
          }
        } catch (err) {
          console.error("Error loading available dates:", err);
        }
      }
    };

    loadAvailableDates();
  }, [tempStartDate, tempEndDate, tempCloudCover, tempSelectedOverlayDate]);

  useEffect(() => {
    if (
      tempParameterType &&
      parameters[tempParameterType] &&
      parameters[tempParameterType].length > 0
    ) {
      const paramBelongsToType = parameters[tempParameterType].some(
        (p) => p.value === tempSelectedParameter
      );
      if (!paramBelongsToType) {
        setTempSelectedParameter(parameters[tempParameterType][0].value);
      }
    }
  }, [tempParameterType, tempSelectedParameter]);

  const runAnalysis = async () => {
    try {
      setIsLoading(true);
      setError(null);

      setStartDate(tempStartDate);
      setEndDate(tempEndDate);
      setCloudCover(tempCloudCover);
      setIsCompositeMode(tempCompositeMode);

      if (!tempCompositeMode) {
        const dates = await fetchAvailableDates(
          tempStartDate,
          tempEndDate,
          tempCloudCover
        );
        setAvailableDates(dates);

        if (tempSelectedOverlayDate) {
          setSelectedOverlayDate(tempSelectedOverlayDate);
        } else if (dates.length > 0) {
          const latestDate = getLatestAvailableDate(dates);
          setSelectedOverlayDate(latestDate);
          setTempSelectedOverlayDate(latestDate);
        } else {
            setSelectedOverlayDate(null);
            setTempSelectedOverlayDate(null);
        }
      } else {
          setSelectedOverlayDate(null);
          setTempSelectedOverlayDate(null);
      }


      if (updateParameterWithType) {
        updateParameterWithType(tempSelectedParameter, tempParameterType);
      } else {
        setSelectedParameter(tempSelectedParameter);
        if (setParameterType) {
          setParameterType(tempParameterType);
        }
      }
    } catch (err) {
      console.error("Error running analysis:", err);
      setError(err.message || "Analysis failed");
    } finally {
      setIsLoading(false);
    }
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
              data={parameters[tempParameterType]}
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
              onChange={(value) => setTempCompositeMode(value === "true")}
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
              loading={isLoading}
            >
              Run Analysis
            </Button>
            {error && (
                <Text color="red" size="sm" mt="xs" ta="center">
                    Error: {error}
                </Text>
            )}
          </div>

          <MapOverlayDatePicker
            selectedOverlayDate={tempSelectedOverlayDate}
            setSelectedOverlayDate={setSelectedOverlayDate}
            availableDates={availableDates}
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