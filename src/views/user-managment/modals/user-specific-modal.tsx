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
import {  CloseOutlined } from '@ant-design/icons';

interface Props {
  open: boolean;
  handleClose: () => void;
}

//dummy data for drop down 

const scopeSelect = [
  {
    label: 'OMS'
  }
]

const userSelect = [
  {
    label: 'demo@xdemand.ai'
  }
]

const accessSelect = [
  {
    label: 'Read and Write'
  }, 
  {
    label: 'Read Only'
  }, 
  {
    label: 'Not Allowed'
  }, 
]


export default function UserSpecificModal({ open, handleClose }: Props) {
  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="user-specific-modal-title" aria-describedby="user-specific-modal-description">
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
              Add User Specific Access
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
            <Grid item xs={4} display="flex" alignItems="center">
              {/* add static object for select  */}
              <Autocomplete
                id="user-autocomplete"
                options={userSelect}
                getOptionLabel={(option) => option.label} // Display label as the suggestion
                fullWidth
                renderInput={(params) => <TextField {...params} label="Select User" variant="standard" />}
              />
            </Grid>

            {/* Group Name */}
            <Grid item xs={4} display="flex" alignItems="center">
              <Autocomplete
                id="scope-autocomplete"
                options={scopeSelect}
                getOptionLabel={(option) => option.label} // Display label as the suggestion
                fullWidth
                renderInput={(params) => <TextField {...params} label="Select Scope" variant="standard" />}
              />
            </Grid>

            <Grid item xs={4} display="flex" alignItems="center">
              <Autocomplete
                id="access-autocomplete"
                options={accessSelect}
                getOptionLabel={(option) => option.label} // Display label as the suggestion
                fullWidth
                renderInput={(params) => <TextField {...params} label="Select Access" variant="standard" />}
              />
            </Grid>
          </Grid>
        </CardContent>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} justifyContent="center" sx={{ p: 2 }}>
          <Button variant="contained" color="error" onClick={handleClose}>
            Close
          </Button>
          <Button variant="contained" color="primary" onClick={handleClose}>
            Commit
          </Button>
        </Stack>
      </Card>
    </Modal>
  );
}
