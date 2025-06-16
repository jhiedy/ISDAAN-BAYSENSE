import { useState } from 'react';
import { AppShell, Burger, Group, useMantineTheme } from "@mantine/core";
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import LeftSidebar from "../components/dashboard/LeftSidebar";
import MapComponent from "../components/dashboard/Map";
import RightSidebar from "../components/dashboard/RightSidebar";
import RightSidebarToggleButton from "../components/dashboard/RightSidebarToggle";

function Dashboard() {
    // State for dashboard parameters
    const [startDate, setStartDate] = useState(new Date(2025, 0, 1));
    const [endDate, setEndDate] = useState(new Date());
    const [selectedParameter, setSelectedParameter] = useState('chlorophyll');
    const [parameterType, setParameterType] = useState('water-quality');
    const [selectedOverlayDate, setSelectedOverlayDate] = useState(null);
    const [cloudCover, setCloudCover] = useState(20);
    const [isCompositeMode, setIsCompositeMode] = useState(true);

    // --- Responsive State ---
    const theme = useMantineTheme();
    const [mobileNavOpened, { toggle: toggleMobileNav }] = useDisclosure(false);
    const [isRightSidebarVisible, { toggle: toggleRightSidebar }] = useDisclosure(true);
    const isMobile = useMediaQuery(`(max-width: ${theme.breakpoints.sm})`);

    const updateParameterWithType = (newParameter) => {
        setSelectedParameter(newParameter);
    };

    return (
        <div style={{ height: 'calc(100vh - 70px)', width: '100%' }}>
            <AppShell
                padding="md" 
                navbar={{
                    width: { base: '100%', sm: 350, lg: 400 },
                    breakpoint: 'sm',
                    collapsed: { mobile: !mobileNavOpened, desktop: false },
                }}
                aside={{
                    width: { base: '100%', sm: 300, lg: 350 },
                    breakpoint: 'sm',
                    collapsed: { mobile: true, desktop: !isRightSidebarVisible },
                }}
                style={{ height: '100%' }}
            >
                {/* --- Left Sidebar (Navbar Content) --- */}
                <AppShell.Navbar
                    p="md"
                    style={{ backgroundColor: '#F7F9F9', height: '100%', borderRight: `1px solid ${theme.colors.gray[3]}` }}
                >
                    {/* Show close button only in mobile drawer view */}
                    {isMobile && (
                        <Group justify="flex-end" mb="sm">
                            <Burger opened={mobileNavOpened} onClick={toggleMobileNav} size="sm" />
                        </Group>
                    )}
                    {/* Render the LeftSidebar component */}
                    <LeftSidebar
                        startDate={startDate}
                        endDate={endDate}
                        setStartDate={setStartDate}
                        setEndDate={setEndDate}
                        selectedParameter={selectedParameter}
                        setSelectedParameter={setSelectedParameter}
                        parameterType={parameterType}
                        setParameterType={setParameterType}
                        updateParameterWithType={updateParameterWithType}
                        selectedOverlayDate={selectedOverlayDate}
                        setSelectedOverlayDate={setSelectedOverlayDate}
                        cloudCover={cloudCover}
                        setCloudCover={setCloudCover}
                        isCompositeMode={isCompositeMode}
                        setIsCompositeMode={setIsCompositeMode}
                    />
                </AppShell.Navbar>

                {/* --- Main Content (Map) --- */}
                <AppShell.Main style={{ backgroundColor: 'white', height: '100%' }}>
                    <MapComponent
                        startDate={startDate}
                        endDate={endDate}
                        parameter={selectedParameter}
                        selectedOverlayDate={selectedOverlayDate}
                        cloudCover={cloudCover}
                        isCompositeMode={isCompositeMode}
                    />
                    {!isMobile && (
                        <RightSidebarToggleButton
                            onClick={toggleRightSidebar}
                            isSidebarOpen={isRightSidebarVisible}
                        />
                    )}
                </AppShell.Main>

                <AppShell.Aside
                     style={{ backgroundColor: '#F7F9F9', borderLeft: `1px solid ${theme.colors.gray[3]}` }}
                >
                    <RightSidebar />
                </AppShell.Aside>
            </AppShell>
        </div>
    );
}

export default Dashboard;
