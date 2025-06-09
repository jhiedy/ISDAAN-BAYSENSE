import { ActionIcon, Tooltip } from '@mantine/core';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function WeatherToggleButton({ onClick, isSidebarOpen }) {
  return (
    <Tooltip label={isSidebarOpen ? "Hide" : "Show"} position="left" withArrow>
      <ActionIcon
        variant="filled"
        color="blue"
        size="lg"
        onClick={onClick}
        style={{
          position: 'fixed',
          top: '50%',
          right: isSidebarOpen ? '350px' : '0px', 
          transform: 'translateY(-50%)',
          zIndex: 100, 
          boxShadow: '0 0 10px rgba(0,0,0,0.2)',
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          transition: 'right 0.1 ease-in-out'
        }}
      >
        {isSidebarOpen ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </ActionIcon>
    </Tooltip>
  );
}

export default WeatherToggleButton;
