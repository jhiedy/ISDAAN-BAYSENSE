import { Paper, Text, Button, Group, ActionIcon, Flex, Badge, Select, Tooltip } from '@mantine/core';
import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { useState, useEffect } from 'react';

function MapOverlayDatePicker({ 
  selectedOverlayDate, 
  setSelectedOverlayDate, 
  availableDates, 
}) {
  const [years, setYears] = useState([]);
  const [months, setMonths] = useState([]);
  const [days, setDays] = useState([]);
  const [selectedYear, setSelectedYear] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [tempSelectedOverlayDate, setTempSelectedOverlayDate] = useState(selectedOverlayDate);

  useEffect(() => {
    if (selectedOverlayDate && isValid(selectedOverlayDate)) {
      setSelectedYear(format(selectedOverlayDate, 'yyyy'));
      setSelectedMonth(format(selectedOverlayDate, 'MM'));
      setSelectedDay(format(selectedOverlayDate, 'dd'));
      setTempSelectedOverlayDate(selectedOverlayDate);
    }
  }, [selectedOverlayDate]);

  // Extract unique years from available dates
  useEffect(() => {
    if (!availableDates || availableDates.length === 0) return;
    
    const uniqueYears = [...new Set(availableDates.map(date => {
      const dateObj = new Date(date);
      return isValid(dateObj) ? format(dateObj, 'yyyy') : null;
    }).filter(Boolean))].sort();
    
    setYears(uniqueYears);
  }, [availableDates]);

  // Update months when year changes
  useEffect(() => {
    if (!availableDates || availableDates.length === 0 || !selectedYear) return;
    
    const filteredMonths = [...new Set(availableDates
      .filter(date => {
        const dateObj = new Date(date);
        return isValid(dateObj) && format(dateObj, 'yyyy') === selectedYear;
      })
      .map(date => format(new Date(date), 'MM')))].sort();
    
    setMonths(filteredMonths);
    
    // If current month isn't in the filtered list, select the first available
    if (filteredMonths.length > 0 && (!selectedMonth || !filteredMonths.includes(selectedMonth))) {
      setSelectedMonth(filteredMonths[0]);
    }
  }, [availableDates, selectedYear, selectedMonth]);

  // Update days when year or month changes
  useEffect(() => {
    if (!availableDates || availableDates.length === 0 || !selectedYear || !selectedMonth) return;
    
    const filteredDays = [...new Set(availableDates
      .filter(date => {
        const dateObj = new Date(date);
        return isValid(dateObj) && 
               format(dateObj, 'yyyy') === selectedYear && 
               format(dateObj, 'MM') === selectedMonth;
      })
      .map(date => format(new Date(date), 'dd')))].sort((a, b) => parseInt(a) - parseInt(b));
    
    setDays(filteredDays);
    
    // If current day isn't in the filtered list, select the first available
    if (filteredDays.length > 0 && (!selectedDay || !filteredDays.includes(selectedDay))) {
      setSelectedDay(filteredDays[0]);
    }
  }, [availableDates, selectedYear, selectedMonth, selectedDay]);

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
    if (!tempSelectedOverlayDate || availableDates.length === 0) return;
    
    const currentDateStr = format(tempSelectedOverlayDate, 'yyyy-MM-dd');
    const sortedDates = [...availableDates].sort();
    const currentIndex = sortedDates.indexOf(currentDateStr);
    
    if (currentIndex < sortedDates.length - 1) {
      const nextDate = new Date(sortedDates[currentIndex + 1]);
      if (isValid(nextDate)) {
        setSelectedYear(format(nextDate, 'yyyy'));
        setSelectedMonth(format(nextDate, 'MM'));
        setSelectedDay(format(nextDate, 'dd'));
        setTempSelectedOverlayDate(nextDate); // Update temp state
      }
    }
  };

  // Navigate to previous available date
  const navigateToPrevDate = () => {
    if (!tempSelectedOverlayDate || availableDates.length === 0) return;
    
    const currentDateStr = format(tempSelectedOverlayDate, 'yyyy-MM-dd');
    const sortedDates = [...availableDates].sort();
    const currentIndex = sortedDates.indexOf(currentDateStr);
    
    if (currentIndex > 0) {
      const prevDate = new Date(sortedDates[currentIndex - 1]);
      if (isValid(prevDate)) {
        setSelectedYear(format(prevDate, 'yyyy'));
        setSelectedMonth(format(prevDate, 'MM'));
        setSelectedDay(format(prevDate, 'dd'));
        setTempSelectedOverlayDate(prevDate); // Update temp state
      }
    }
  };
  
  // Update the overlay date with the selected date
  const updateOverlayDate = () => {
    if (selectedYear && selectedMonth && selectedDay) {
      const dateStr = `${selectedYear}-${selectedMonth}-${selectedDay}`;
      if (availableDates.includes(dateStr)) {
        const newDate = new Date(`${dateStr}T00:00:00`);
        if (isValid(newDate)) {
          setSelectedOverlayDate(newDate);
        }
      }
    }
  };

  const isCurrentDateAvailable = tempSelectedOverlayDate && 
    availableDates.includes(format(tempSelectedOverlayDate, 'yyyy-MM-dd'));

  return (
    <Paper p="md" radius="md" withBorder>
      <Flex justify="space-between" align="center" mb="xs">
        <Badge>Map Overlay Date</Badge>
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
            disabled={!tempSelectedOverlayDate || !isCurrentDateAvailable || availableDates.indexOf(format(tempSelectedOverlayDate, 'yyyy-MM-dd')) <= 0}
          >
            <ChevronLeft size={16} />
          </ActionIcon>
          <ActionIcon 
            variant="light" 
            color="blue" 
            onClick={navigateToNextDate}
            disabled={!tempSelectedOverlayDate || !isCurrentDateAvailable || availableDates.indexOf(format(tempSelectedOverlayDate, 'yyyy-MM-dd')) >= availableDates.length - 1}
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
        />
        <Select
          label="Month"
          value={selectedMonth}
          onChange={handleMonthChange}
          data={months.map(month => ({ 
            value: month, 
            label: new Date(`2000-${month}-01`).toLocaleString('default', { month: 'short' }) 
          }))}
          disabled={months.length === 0}
          clearable={false}
        />
        <Select
          label="Day"
          value={selectedDay}
          onChange={handleDayChange}
          data={days.map(day => ({ value: day, label: day }))}
          disabled={days.length === 0}
          clearable={false}
        />
      </Group>
      
      <Button 
        fullWidth 
        variant="light" 
        onClick={updateOverlayDate}
        disabled={!selectedYear || !selectedMonth || !selectedDay}
      >
        Update Map Overlay
      </Button>
    </Paper>
  );
}

export default MapOverlayDatePicker;