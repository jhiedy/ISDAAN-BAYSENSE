import { useState } from "react";
import {
  Group,
  Menu,
  UnstyledButton,
  Box,
  Text,
  Avatar,
  Button,
  useMantineTheme,
  Input,
  Paper,
  List,
} from "@mantine/core";
import { ChevronDown, HelpCircle, Search } from "lucide-react";
import HelpGuideModal from "../components/dashboard/HelpGuideModal";
import './Header.css';

function Header({ searchTerm, onSearchChange, searchResults, onResultClick }) {
  const [menuOpened, setMenuOpened] = useState(false);
  const theme = useMantineTheme();
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const toggleHelpModal = () => setIsHelpModalOpen(prev => !prev);

  const displayName = "User";
  const userInitial = displayName ? displayName[0].toUpperCase() : "?";

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "short", day: "numeric", year: "numeric",
  });

  return (
    <>
       <Group
        justify="space-between"
        h="100%"
        px="xl"
        style={{ backgroundColor: "#3498db", position: 'relative' }}
        wrap="nowrap"
      >
        <Group
            style={{ flexShrink: 1, overflow: 'hidden' }}
            gap="xs"
            wrap="nowrap"
            align="center"
        >
            <Group 
                style={{ cursor: 'pointer' }}
                gap="xs"
                wrap="nowrap"
                mt={10} 
            >
                <img
                  src="/baysense-logo-t.svg"
                  alt="BAYSENSE Logo"
                  style={{ height: '90px', display: 'block' }} 
                />
            </Group>
            <Button
              variant="light" 
              color="rgba(255, 255, 255, 0.9)" 
              leftSection={<HelpCircle size={18} />}
              onClick={toggleHelpModal}
              size="sm"
              style={{ fontWeight: 500 }}
            >
              Help Guide
            </Button>
        </Group>

        <Box className="header-search-container">
            <Input
              icon={<Search size={16} />}
              placeholder="Search for an FLA..."
              value={searchTerm}
              onChange={(event) => onSearchChange(event.currentTarget.value)}
              radius="xl"
              style={{ width: '100%' }}
            />
            {searchResults.length > 0 && (
            <Paper shadow="md" withBorder className="header-search-results">
              <List>
                {searchResults.map((result) => (
                  <List.Item
                    key={result.properties['FLA Number']}
                    onClick={() => onResultClick(result)}
                    className="header-search-result-item"
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
        </Box>

        <Group
            gap="lg"
            wrap="nowrap"
            style={{ flexShrink: 0 }} 
        >
            <Menu
                width={200}
                position="bottom-end"
                opened={menuOpened}
                onChange={setMenuOpened}
                shadow="md"
                withArrow
                style={{ marginBottom: "5px" }}
            >
                <Menu.Target>
                <UnstyledButton>
                    <Group wrap="nowrap">
                    <Avatar radius="xl" size="md" color={theme.colors.blue[1]} c={theme.colors.blue[8]}>
                        {userInitial}
                    </Avatar>
                    <Box style={{ textAlign: "left" }}>
                        <Text size="sm" fw={700} c="white" lineClamp={1}> {displayName} </Text>
                        <Text size="xs" c={theme.colors.blue[1]} opacity={0.9}> {currentDate} </Text>
                    </Box>
                    <ChevronDown size={16} color={theme.white} opacity={0.8}/>
                    </Group>
                </UnstyledButton>
                </Menu.Target>
            </Menu>
        </Group>
      </Group>

      <HelpGuideModal
        isOpen={isHelpModalOpen}
        onClose={toggleHelpModal}
      />
    </>
  );
}

export default Header;