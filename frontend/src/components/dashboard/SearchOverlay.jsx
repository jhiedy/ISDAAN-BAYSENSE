import React from 'react';
import { Input, Paper, List, Text } from '@mantine/core';
import { Search } from 'lucide-react';
import './SearchOverlay.css';

function SearchOverlay({ searchTerm, onSearchChange, searchResults, onResultClick }) {
  return (
    <div className="search-overlay">
      <Input
        icon={<Search size={16} />}
        placeholder="Search by name, municipality, province, or barangay"
        value={searchTerm}
        onChange={(event) => onSearchChange(event.currentTarget.value)}
      />
      {searchResults.length > 0 && (
        <Paper shadow="md" withBorder className="search-results-container">
          <List>
            {searchResults.map((result) => (
              <List.Item
                key={result.properties['FLA Number']}
                onClick={() => onResultClick(result)}
                className="search-result-item"
              >
                <Text size="sm">{result.properties.Name}</Text>
                <Text size="xs" color="dimmed">
                  {result.properties.Barangay}, {result.properties.Mun_Name}
                </Text>
              </List.Item>
            ))}
          </List>
        </Paper>
      )}
    </div>
  );
}

export default SearchOverlay;