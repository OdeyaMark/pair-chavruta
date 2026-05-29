import React, { FC } from 'react';
import { Box, Text, ToggleSwitch } from '@wix/design-system';

interface UsersPageHeaderProps {
  showArchived: boolean;
  onToggleArchived: () => void;
  onAddUser: () => void;
}

export const UsersPageHeader: FC<UsersPageHeaderProps> = ({
  showArchived,
  onToggleArchived,
  onAddUser
}) => {
  return (
    <Box direction="vertical" marginBottom="24px">
      <Box marginBottom="16px">
        <h2 style={{ margin: 0 }}>Users</h2>
      </Box>
      <Box marginBottom="16px">
        <button
          onClick={onAddUser}
          style={{ 
            padding: "8px 20px", 
            background: "#1976d2", 
            color: "#fff", 
            border: "none", 
            borderRadius: 4, 
            fontWeight: "bold", 
            cursor: "pointer", 
            fontSize: 16 
          }}
        >
          Add User
        </button>
      </Box>
      <Box direction="horizontal" verticalAlign="middle">
        <Text size="small" weight="bold" marginRight="12px">
          Active Users
        </Text>
        <Box marginLeft="12px" marginRight="12px">
          <ToggleSwitch
            checked={showArchived}
            onChange={onToggleArchived}
            size="small"
          />
        </Box>
        <Text size="small" weight="bold" marginLeft="12px">
          Archived Users
        </Text>
      </Box>
    </Box>
  );
};
