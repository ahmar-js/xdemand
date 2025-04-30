// material-ui
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Modal from '@mui/material/Modal';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import {TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';

// Icons
import {  CloseOutlined } from '@ant-design/icons';

interface Props {
  open: boolean;
  handleClose: () => void;
}

const groupSelect =[
    {
        label: "Yes"
    }, 
    {
        label: "No"
    }, 
]


export default function ManageTenantsModal({ open, handleClose }: Props) {
  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="manage-users-modal-title" aria-describedby="manage-users-modal-description">
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
            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
              New Tenant Registration
            </Typography>
          }
          action={
            <Button  onClick={handleClose} sx={{ minWidth: 'unset' }}>
              <CloseOutlined style={{ fontSize: 18, color: 'gray' }} />
            </Button>
          }
        />

        {/* Profile Details - Email and Group Name on the Same Line */}
        <CardContent>
          <Grid container spacing={6} alignItems="center" paddingBottom={3}>
            {/* Email */}
            <Grid item xs={6} display="flex" sx={{ paddingBottom: '1px' }} alignItems="center">
              <Typography variant="body1">Tenant Name</Typography>
            </Grid>

            {/* Group Name */}
            <Grid item xs={6} display="flex" paddingBottom="17px" alignItems="center">
              <TextField
                id="standard-multiline-flexible"
                multiline
                style={{ width: '100%' }}
                maxRows={1}
                variant="standard"
              />
            </Grid>
          </Grid>

          <Grid container spacing={6} paddingBottom={3} alignItems="center">
            {/* Email */}
            <Grid item xs={6} display="flex" sx={{ paddingBottom: '1px' }} alignItems="center">
              <Typography variant="body1">Email</Typography>
            </Grid>

            {/* Group Name */}
            <Grid item xs={6} display="flex" paddingBottom="17px"  alignItems="center">
              <TextField
                id="standard-multiline-flexible"
                multiline
                InputProps={{
                  endAdornment: <span style={{ marginRight: '10px' }}>@xdemand.ai</span>
                }}
                style={{ width: '100%' }}
                maxRows={1}
                variant="standard"
              />
            </Grid>
          </Grid>

          <Grid container spacing={6} display="flex" paddingBottom="17px"  alignItems="center">
            <Grid item xs={6} sx={{ paddingTop: '1px' }} display="flex" alignItems="center">
              <Typography variant="body1">Active</Typography>
            </Grid>

            <Grid item xs={6} display="flex" alignItems="center">
              <Autocomplete
                id="group-name-autocomplete"
                options={groupSelect}
                getOptionLabel={(option) => option.label} // Display label as the suggestion
                fullWidth
                renderInput={(params) => <TextField {...params} variant="standard" />}
              />
            </Grid>
          </Grid>
        </CardContent>

        {/* Action Buttons */}
        <Stack direction="row" spacing={1} justifyContent="flex-end" sx={{ p: 2 }}>
          <Button variant="contained" color="error"  onClick={handleClose}>
            Close
          </Button>
          <Button variant="contained" color="primary" onClick={handleClose}>
            Create Tenant
          </Button>
        </Stack>
      </Card>
    </Modal>
  );
}