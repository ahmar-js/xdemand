// material-ui
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Modal from '@mui/material/Modal';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';

// Icons
import { CloseOutlined } from '@ant-design/icons';

interface Props {
  open: boolean;
  handleClose: () => void
}

const groupTypeSelect = [
  {
    label: 'Admin'
  },
  {
    label: 'Write'
  },
  {
    label: 'Read'
  }
];

const accessLevelSelect = [
  {
    label: 'Read and Write'
  },
  {
    label: 'Read Only'
  },
  {
    label: 'Read + Write Access with Sales Data'
  }
];

export default function UserGroupModal({ open, handleClose }: Props) {
  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="user-groups-modal-title" aria-describedby="user-groups-modal-description">
      <Card
        sx={{
          width: 780,
          mx: 'auto',
          mt: 10,
          borderRadius: 3,
          boxShadow: 6,
          p: 2,
          bgcolor: 'background.paper'
        }}
      >
        {/* Header with Avatar */}
        <CardHeader
          title={
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              Enter new group details
            </Typography>
          }
          action={
            <Button onClick={handleClose} sx={{ minWidth: 'unset' }}>
              <CloseOutlined style={{ fontSize: 18, color: 'gray' }} />
            </Button>
          }
        />

        {/* Profile Details - Email and Group Name on the Same Line */}
        <CardContent>
          <Grid container spacing={6} alignItems="center">
            {/* Email */}
            <Grid item xs={6} display="flex" alignItems="center">
              <Typography variant="body1">New Group Name</Typography>
            </Grid>

            {/* Group Name */}
            <Grid item xs={6} display="flex" alignItems="center">
              <TextField id="standard-multiline-flexible" multiline style={{ width: '90%' }} maxRows={1} variant="standard" />
            </Grid>
          </Grid>

          <Grid container spacing={6} alignItems="center" paddingTop={5}>
            {/* Email */}
            <Grid item xs={6} display="flex" alignItems="center">
              <Typography variant="body1">Group Type</Typography>
            </Grid>

            <Grid item xs={6} display="flex" alignItems="center">
              <Autocomplete
                id="group-type-autocomplete"
                options={groupTypeSelect}
                getOptionLabel={(option) => option.label} // Display label as the suggestion
                fullWidth
                renderInput={(params) => <TextField {...params} label="Choose Group Type" variant="standard" />}
              />
            </Grid>
          </Grid>

          <Grid container spacing={6} alignItems="center" paddingTop={5}>
            {/* Email */}
            <Grid item xs={6} display="flex" alignItems="center">
              <Typography variant="body1">Access Level Permissions</Typography>
            </Grid>

            {/* Group Name */}
            <Grid item xs={6} display="flex" alignItems="center">
            <Autocomplete
                id="access-level-autocomplete"
                options={accessLevelSelect}
                getOptionLabel={(option) => option.label} // Display label as the suggestion
                fullWidth
                renderInput={(params) => <TextField {...params} label="Choose Access Permissions" variant="standard" />}
              />
            </Grid>
          </Grid>
        </CardContent>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ p: 2 }}>
          <Button variant="contained" color="error" onClick={handleClose}>
            Close
          </Button>
          <Button variant="contained" color="primary" onClick={handleClose}>
            Create Group
          </Button>
        </Stack>
      </Card>
    </Modal>
  );
}
