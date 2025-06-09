import { Modal, Button, Group, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

export const showSuccessNotification = (message) => {
  notifications.show({
    title: "Success",
    message,
    color: "teal",
    icon: <CheckCircle2 size={18} />,
    withCloseButton: true,
  });
};

export const showErrorNotification = (message) => {
  notifications.show({
    title: "Error",
    message,
    color: "red",
    icon: <XCircle size={18} />,
    withCloseButton: true,
  });
};

export const showWarningNotification = (message) => {
  notifications.show({
    title: "Warning",
    message,
    color: "orange",
    icon: <AlertTriangle size={18} />,
    withCloseButton: true,
  });
};

export const useConfirmation = () => {
  const [opened, setOpened] = useState(false);
  const [config, setConfig] = useState({});

  const showConfirmation = (config) => {
    setConfig(config);
    setOpened(true);
  };

  const ConfirmationModal = () => (
    <Modal
      opened={opened}
      onClose={() => setOpened(false)}
      title={config.title || "Confirmation"}
      centered
      size="md"
      overlayProps={{ blur: 3 }}
    >
      <Text size="sm" mb="xl">
        {config.message || "Are you sure you want to perform this action?"}
      </Text>

      <Group position="right">
        <Button variant="default" onClick={() => {
          setOpened(false);
          config.onCancel?.();
        }}>
          Cancel
        </Button>
        <Button color="red" onClick={() => {
          setOpened(false);
          config.onConfirm();
        }}>
          Confirm
        </Button>
      </Group>
    </Modal>
  );

  return { showConfirmation, ConfirmationModal };
};