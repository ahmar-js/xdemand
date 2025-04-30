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
import { CloseOutlined } from '@ant-design/icons';

interface Props {
  open: boolean;
  handleClose: () => void;
}

const datasetSelect = [
  {
    label: 'sales_data'
  },
  {
    label: 'inventory_data'
  },
  {
    label: 'price_data'
  },
 
];

export default function ViewDatasetModal({ open, handleClose }: Props) {
  return (
    <Modal open={open} onClose={handleClose} aria-labelledby="view-dataset-modal-title" aria-describedby="view-dataset-modal-description">
      <Card
        sx={{
          width: 600,
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
              Choose Dataset
            </Typography>
          }
          action={
            <Button onClick={handleClose} sx={{ minWidth: 'unset' }}>
              <CloseOutlined style={{ fontSize: 18, color: 'gray' }} />
            </Button>
          }
        />

        <CardContent>
          <Grid container spacing={2} alignItems="center">
            {/* Email */}
            <Grid item xs={6} display="flex" alignItems="center">
              <Typography variant="body1">Dataset:</Typography>
            </Grid>

            {/* Group Name */}
            <Grid item xs={6} display="flex" alignItems="center">
              <Autocomplete
                id="group-type-autocomplete"
                options={datasetSelect}
                getOptionLabel={(option) => option.label} // Display label as the suggestion
                fullWidth
                renderInput={(params) => <TextField {...params} label="Choose Dataset" variant="standard" />}
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
            OK
          </Button>
        </Stack>
      </Card>
    </Modal>
  );
}
