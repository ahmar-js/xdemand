// material-ui
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Modal from '@mui/material/Modal';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';


// Icons
import { MailOutlined, TeamOutlined, CheckCircleOutlined, CloseOutlined } from '@ant-design/icons';

interface Props {
  open: boolean;
  handleClose: () => void; 
}

// ✅ Static Permissions Object (Can be removed later)
const PERMISSIONS = {
  VIEW_DASHBOARD: 'Sales data',
 
};

// Example Default User Permissions
const DEFAULT_USER_PERMISSIONS = [
  PERMISSIONS.VIEW_DASHBOARD,
];

const email = 'admin@123.com';
const groupName = 'admin';


export default function viewprofilemodal({ open, handleClose }: Props)
{
    
    return (
 
      <Modal open={open} onClose={handleClose} aria-labelledby="view-profile-modal-title" aria-describedby="view-profile-modal-description">
      <Card 
        sx={{
          width: 500,
          mx: 'auto',
          mt: 10,
          borderRadius: 3,
          boxShadow: 6,
          p: 2,
          bgcolor: 'background.paper',
        }}
      >
        {/* Header with Avatar */}
        <CardHeader
          avatar={<Avatar sx={{ bgcolor: 'primary.main' }}>{email.charAt(0).toUpperCase()}</Avatar>}
          title={<Typography variant="h6" sx={{ fontWeight: 'bold' }}>Profile Details</Typography>}
          action={
            <Button onClick={handleClose} sx={{ minWidth: 'unset' }}>
              <CloseOutlined style={{ fontSize: 18, color: 'gray' }} />
            </Button>
          }
        />
        <Divider />

        {/* Profile Details - Email and Group Name on the Same Line */}
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Email */}
            <Grid item xs={6} display="flex" alignItems="center">
              <MailOutlined style={{ fontSize: 20, color: '#1890ff', marginRight: 8 }} />
              <Typography variant="body1"><strong>Email:</strong> {email}</Typography>
            </Grid>

            {/* Group Name */}
            <Grid item xs={6} display="flex" alignItems="center">
              <TeamOutlined style={{ fontSize: 20, color: '#faad14', marginRight: 8 }} />
              <Typography variant="body1"><strong>Group:</strong> {groupName}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Permissions - List (On Next Line) */}
          <Typography variant="body1" sx={{ fontWeight: 'bold', mb: 1 }}>Permissions:</Typography>
          <List>
            {DEFAULT_USER_PERMISSIONS.length > 0 ? (
              DEFAULT_USER_PERMISSIONS.map((permission, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    <CheckCircleOutlined style={{ fontSize: 18, color: 'green' }} />
                  </ListItemIcon>
                  <ListItemText primary={permission} />
                </ListItem>
              ))
            ) : (
              <Typography>No Permissions Assigned</Typography>
            )}
          </List>
        </CardContent>

        <Divider />

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ p: 2 }}>
          <Button variant="contained" color="error" onClick={handleClose}>
            Close
          </Button>
        </Stack>
      </Card>
    </Modal>
      );

}