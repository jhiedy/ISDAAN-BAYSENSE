import { Button, Modal } from '@mantine/core';
import { Download } from 'lucide-react';
import { LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line, ResponsiveContainer } from 'recharts';

function ChartModal({ isOpen, onClose, chartData, selectedParam }) {
  
  const downloadData = () => {
    const csvContent = [
      ['Date', 'Value'],
      ...chartData.map(row => [row.date, row.value])
    ]
      .map(e => e.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${selectedParam.label}_data.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  return (
    <Modal 
      opened={isOpen} 
      onClose={onClose} 
      size="90%" 
      centered 
      title={`${selectedParam.label} Chart`}
    >
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={chartData} margin={{ left: 10, right: 10, top: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis 
            label={{ value: selectedParam.unit, angle: -90, position: 'insideLeft', dy: -5 }} 
            tickMargin={5} 
          />
          <Tooltip />
          <Line type="monotone" dataKey="value" stroke="#3498db" strokeWidth={2} dot={{ r: 5 }} activeDot={{ r: 8 }} />
        </LineChart>
      </ResponsiveContainer>
      <Button fullWidth leftSection={<Download size={16} />} variant="outline" mt="md" onClick={downloadData}>
        Download Data
      </Button>
    </Modal>
  );
}

export default ChartModal;