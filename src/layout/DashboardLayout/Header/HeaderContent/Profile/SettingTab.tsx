import { useState } from 'react';
import Link from 'next/link';

// material-ui
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// assets
import UserSwitchOutlined from '@ant-design/icons/UserSwitchOutlined';
import AuditOutlined from '@ant-design/icons/AuditOutlined';
import TeamOutlined from '@ant-design/icons/TeamOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';
import { DatabaseOutlined } from '@ant-design/icons';

import ViewDatasetModal from './modal/view-dataset-modal';


// ==============================|| HEADER PROFILE - SETTING TAB ||============================== //


interface Props {
  handleLogout: () => void;
}

export default function SettingTab({ handleLogout }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const [openModal, setOpenModal] = useState<boolean>(false); // Modal state
  const handleListItemClick = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
    setSelectedIndex(index);
    if(index===1)
    {
      setOpenModal(true); 

    }
  };
  const handleCloseModal = () => {
    setOpenModal(false);
  };

  return (
    <>
    <List component="nav" sx={{ p: 0, '& .MuiListItemIcon-root': { minWidth: 32 } }}>
      <ListItemButton selected={selectedIndex === 1} onClick={(event: React.MouseEvent<HTMLDivElement>) => handleListItemClick(event, 1)}>
        <ListItemIcon>
          <DatabaseOutlined />
        </ListItemIcon>
        <ListItemText primary="Choose Dataset" />
      </ListItemButton>
      <Link href="/user-groups" passHref legacyBehavior>
      <ListItemButton selected={selectedIndex === 2} onClick={(event: React.MouseEvent<HTMLDivElement>) => handleListItemClick(event, 2)}>
        <ListItemIcon>
          <TeamOutlined />
        </ListItemIcon>
        <ListItemText primary="Manage Groups" />
      </ListItemButton>
      </Link>
      <Link href="/manage-users" passHref legacyBehavior>
      <ListItemButton selected={selectedIndex === 4} onClick={(event: React.MouseEvent<HTMLDivElement>) => handleListItemClick(event, 4)}>
        <ListItemIcon>
          <UserOutlined />
        </ListItemIcon>
        <ListItemText primary="Manage Users" />
      </ListItemButton>
      </Link>
      <Link href='/user-specific-access' passHref legacyBehavior>
      <ListItemButton selected={selectedIndex === 5} onClick={(event: React.MouseEvent<HTMLDivElement>) => handleListItemClick(event, 5)}>
        <ListItemIcon>
          <UserSwitchOutlined />
        </ListItemIcon>
        <ListItemText primary="User Specific Access" />
      </ListItemButton>
      </Link>
      <Link href='/user-activities' passHref legacyBehavior>
      <ListItemButton selected={selectedIndex === 6} onClick={(event: React.MouseEvent<HTMLDivElement>) => handleListItemClick(event, 6)}>
        <ListItemIcon>
          <AuditOutlined />
        </ListItemIcon>
        <ListItemText primary="User Activities" />
      </ListItemButton>
      </Link>
    </List>
    <ViewDatasetModal open={openModal} handleClose={handleCloseModal} />
    </>
  );
}
 