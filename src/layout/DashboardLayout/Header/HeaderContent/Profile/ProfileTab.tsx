import { useState } from 'react';

// material-ui
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// assets

import LogoutOutlined from '@ant-design/icons/LogoutOutlined';
import UserOutlined from '@ant-design/icons/UserOutlined';

import ViewProfileModal from './modal/view-profile-modal'

// ==============================|| HEADER PROFILE - PROFILE TAB ||============================== //

interface Props {
  handleLogout: () => void;
}

export default function ProfileTab({ handleLogout }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number>();
  const [openModal, setOpenModal] = useState<boolean>(false); // Modal state
  const handleListItemClick = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
    setSelectedIndex(index);
    console.log(index);
    if(index===0)
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
      <ListItemButton selected={selectedIndex === 0} onClick={(event: React.MouseEvent<HTMLDivElement>) => handleListItemClick(event, 0)}>
        <ListItemIcon>
          <UserOutlined />
        </ListItemIcon>
        <ListItemText primary="View Profile" />
      </ListItemButton>

      <ListItemButton selected={selectedIndex === 1} onClick={handleLogout}>
        <ListItemIcon>
          <LogoutOutlined />
        </ListItemIcon>
        <ListItemText primary="Logout" />
      </ListItemButton>
    </List>

     <ViewProfileModal open={openModal} handleClose={handleCloseModal} />
     </>
  );
} 
