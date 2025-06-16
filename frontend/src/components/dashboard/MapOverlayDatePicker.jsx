import { Paper, Text, Button, Group, ActionIcon, Flex, Badge, Select, Tooltip } from '@mantine/core';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useState, useEffect } from 'react';

function MapOverlayDatePicker({
  selectedOverlayDate,
  setSelectedOverlayDate,
  availableDates,
  disabled
}) {
  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);
  const [days, setDays] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);

  // Sync internal state with prop
  useEffect(() => {
    if (selectedOverlayDate && isValid(selectedOverlayDate)) {
      setSelectedYear(format(selectedOverlayDate, 'yyyy'));
      setSelectedMonth(format(selectedOverlayDate, 'MM'));
      setSelectedDay(format(selectedOverlayDate, 'dd'));
    } else {
        // Clear internal selections if prop is null/invalid
        setSelectedYear(null);
        setSelectedMonth(null);
        setSelectedDay(null);
    }
  }, [selectedOverlayDate]);

  // Extract unique years from available dates
  useEffect(() => {
    if (!availableDates || availableDates.length === 0) {
      setYears([]);
      setMonths([]);
      setDays([]);
      setSelectedYear(null);
      setSelectedMonth(null);
      setSelectedDay(null);
      return;
    }

    const uniqueYears = [...new Set(availableDates.map(date => {
      const dateObj = parseISO(date); // Use parseISO for string dates
      return isValid(dateObj) ? format(dateObj, 'yyyy') : null;
    }).filter(Boolean))].sort();

    setYears(uniqueYears);

    // If a year is selected but no longer available, reset it
    if (selectedYear && !uniqueYears.includes(selectedYear)) {
        setSelectedYear(uniqueYears[0] || null); // Default to first available if exists
    } else if (!selectedYear && uniqueYears.length > 0) {
        setSelectedYear(format(selectedOverlayDate || parseISO(availableDates[availableDates.length - 1]), 'yyyy')); // Set to the year of selectedOverlayDate or latest
    }

  }, [availableDates, selectedYear, selectedOverlayDate]);


  // Update months when year changes
  useEffect(() => {
    if (!availableDates || availableDates.length === 0 || !selectedYear) {
      setMonths([]);
      setSelectedMonth(null);
      return;
    }

    const filteredMonths = [...new Set(availableDates
      .filter(date => {
        const dateObj = parseISO(date);
        return isValid(dateObj) && format(dateObj, 'yyyy') === selectedYear;
      })
      .map(date => format(parseISO(date), 'MM')))].sort();

    setMonths(filteredMonths);

    // If current month isn't in the filtered list, select the first available
    if (selectedMonth && !filteredMonths.includes(selectedMonth)) {
      setSelectedMonth(filteredMonths[0] || null);
    } else if (!selectedMonth && filteredMonths.length > 0) {
        setSelectedMonth(format(selectedOverlayDate || parseISO(availableDates[availableDates.length - 1]), 'MM')); // Set to month of selectedOverlayDate or latest
    }
  }, [availableDates, selectedYear, selectedMonth, selectedOverlayDate]);


  // Update days when year or month changes
  useEffect(() => {
    if (!availableDates || availableDates.length === 0 || !selectedYear || !selectedMonth) {
      setDays([]);
      setSelectedDay(null);
      return;
    }

    const filteredDays = [...new Set(availableDates
      .filter(date => {
        const dateObj = parseISO(date);
        return isValid(dateObj) &&
               format(dateObj, 'yyyy') === selectedYear &&
               format(dateObj, 'MM') === selectedMonth;
      })
      .map(date => format(parseISO(date), 'dd')))].sort((a, b) => parseInt(a) - parseInt(b));

    setDays(filteredDays);

    // If current day isn't in the filtered list, select the first available
    if (selectedDay && !filteredDays.includes(selectedDay)) {
      setSelectedDay(filteredDays[0] || null);
    } else if (!selectedDay && filteredDays.length > 0) {
        setSelectedDay(format(selectedOverlayDate || parseISO(availableDates[availableDates.length - 1]), 'dd')); // Set to day of selectedOverlayDate or latest
    }
  }, [availableDates, selectedYear, selectedMonth, selectedDay, selectedOverlayDate]);


  // Handle year change
  const handleYearChange = (year) => {
    setSelectedYear(year);
  };

  // Handle month change
  const handleMonthChange = (month) => {
    setSelectedMonth(month);
  };

  // Handle day change
  const handleDayChange = (day) => {
    setSelectedDay(day);
  };

  // Navigate to next available date
  const navigateToNextDate = () => {
    if (!selectedOverlayDate || availableDates.length === 0) return;

    const currentDateStr = format(selectedOverlayDate, 'yyyy-MM-dd');
    const sortedDates = [...availableDates].sort();
    const currentIndex = sortedDates.indexOf(currentDateStr);

    if (currentIndex < sortedDates.length - 1) {
      const nextDate = parseISO(sortedDates[currentIndex + 1]);
      if (isValid(nextDate)) {
        setSelectedOverlayDate(nextDate);
      }
    }
  };

  // Navigate to previous available date
  const navigateToPrevDate = () => {
    if (!selectedOverlayDate || availableDates.length === 0) return;

    const currentDateStr = format(selectedOverlayDate, 'yyyy-MM-dd');
    const sortedDates = [...availableDates].sort();
    const currentIndex = sortedDates.indexOf(currentDateStr);

    if (currentIndex > 0) {
      const prevDate = parseISO(sortedDates[currentIndex - 1]);
      if (isValid(prevDate)) {
        setSelectedOverlayDate(prevDate);
      }
    }
  };

  // Update the overlay date with the selected date
  const updateOverlayDate = () => {
    if (selectedYear && selectedMonth && selectedDay) {
      const dateStr = `${selectedYear}-${selectedMonth}-${selectedDay}`;
      if (availableDates.includes(dateStr)) {
        const newDate = parseISO(`${dateStr}T00:00:00`); // Parse with time to avoid timezone issues
        if (isValid(newDate)) {
          setSelectedOverlayDate(newDate);
        }
      }
    }
  };

  const isCurrentDateAvailable = selectedOverlayDate &&
    availableDates.includes(format(selectedOverlayDate, 'yyyy-MM-dd'));

  return (
    <Paper p="md" radius="md" withBorder style={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <Flex justify="space-between" align="center" mb="xs">
        <Badge>Map Overlay Date Picker</Badge>
        <Group gap="xs">
          <Tooltip label="Select from a list of dates with available images to show on the map." withArrow>
            <ActionIcon variant="transparent">
              <Info size={16} />
            </ActionIcon>
          </Tooltip>
          <ActionIcon
            variant="light"
            color="blue"
            onClick={navigateToPrevDate}
            disabled={!selectedOverlayDate || !isCurrentDateAvailable || availableDates.indexOf(format(selectedOverlayDate, 'yyyy-MM-dd')) <= 0}
          >
            <ChevronLeft size={16} />
          </ActionIcon>
          <ActionIcon
            variant="light"
            color="blue"
            onClick={navigateToNextDate}
            disabled={!selectedOverlayDate || !isCurrentDateAvailable || availableDates.indexOf(format(selectedOverlayDate, 'yyyy-MM-dd')) >= availableDates.length - 1}
          >
            <ChevronRight size={16} />
          </ActionIcon>
        </Group>
      </Flex>

      <Group grow mb="md">
        <Select
          label="Year"
          value={selectedYear}
          onChange={handleYearChange}
          data={years.map(year => ({ value: year, label: year }))}
          clearable={false}
          disabled={disabled || years.length === 0}
        />
        <Select
          label="Month"
          value={selectedMonth}
          onChange={handleMonthChange}
          data={months.map(month => ({
            value: month,
            label: new Date(`2000-${month}-01`).toLocaleString('default', { month: 'short' })
          }))}
          disabled={disabled || months.length === 0}
          clearable={false}
        />
        <Select
          label="Day"
          value={selectedDay}
          onChange={handleDayChange}
          data={days.map(day => ({ value: day, label: day }))}
          disabled={disabled || days.length === 0}
          clearable={false}
        />
      </Group>

      <Button
        fullWidth
        variant="light"
        onClick={updateOverlayDate}
        disabled={disabled || !selectedYear || !selectedMonth || !selectedDay || !isCurrentDateAvailable}
      >
        Update Map Overlay
      </Button>
    </Paper>
  );
}

export default MapOverlayDatePicker;