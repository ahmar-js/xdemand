'use client';

import { useEffect, useState, SyntheticEvent } from 'react';

// next
import { useRouter, useSearchParams } from 'next/navigation';

// material-ui
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import FormControl from '@mui/material/FormControl';
import FormHelperText from '@mui/material/FormHelperText';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import InputLabel from '@mui/material/InputLabel';
import OutlinedInput from '@mui/material/OutlinedInput';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

// third party
import * as Yup from 'yup';
import { Formik } from 'formik';

// project import
import IconButton from 'components/@extended/IconButton';
import AnimateButton from 'components/@extended/AnimateButton';

import { openSnackbar } from 'api/snackbar';
import useScriptRef from 'hooks/useScriptRef';
import { strengthColor, strengthIndicator } from 'utils/password-strength';

// types
import { SnackbarProps } from 'types/snackbar';
import { StringColorProps } from 'types/password';

// assets
import EyeOutlined from '@ant-design/icons/EyeOutlined';
import EyeInvisibleOutlined from '@ant-design/icons/EyeInvisibleOutlined';
import axios from 'utils/axios';

// ============================|| STATIC - RESET PASSWORD ||============================ //



export default function AuthResetPassword() {
  const scriptedRef = useScriptRef();
  const router = useRouter();

  const [level, setLevel] = useState<StringColorProps>();
  const [showPassword, setShowPassword] = useState(false);
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  const handleMouseDownPassword = (event: SyntheticEvent) => {
    event.preventDefault();
  };

  const changePassword = (value: string) => {
    const temp = strengthIndicator(value);
    setLevel(strengthColor(temp));
  };

  useEffect(() => {
    changePassword('');
  }, []);

    //token extraction

    const searchParams = useSearchParams();
    const token = searchParams.get('token');

  return (
    <Formik
      initialValues={{
        newPassword: '',
        confirmPassword: '',
        submit: null
      }}
      validationSchema={Yup.object().shape({
        newPassword: Yup.string().max(255).required('Password is required'),
        confirmPassword: Yup.string()
          .required('Confirm Password is required')
          .test('confirmPassword', 'Both Password must be match!', (confirmPassword, yup) => yup.parent.newPassword === confirmPassword)
      })}
      onSubmit={async (values, { setErrors, setStatus, setSubmitting }) => {
        try {
          console.log(process.env.NEXTAUTH_URL);
          console.log(token);
          console.log(values.newPassword);
          console.log(values.confirmPassword)
          const response = await axios.post(`${process.env.NEXTAUTH_URL}/api/auth/reset-password`,
            {
              token,
              newPassword: values.newPassword,
              confirmPassword: values.confirmPassword
            },
            {
              headers: { "Content-Type": "application/json" }
            }
          );
          setStatus({ success: true });
          setSubmitting(false);

          console.log(response.data);

          if (response) {
            console.log(response.data.message);
          }

          openSnackbar({
            open: true,
            message: 'Password has been changed successfully',
            variant: 'alert',
            alert: {
              color: 'success'
            }
          } as SnackbarProps);

          setTimeout(() => {
            router.push('/login');
          }, 1500);
        } catch (err: any) {
          if (scriptedRef.current) {
            setStatus({ success: false });
            setErrors({ submit: err.message });
            setSubmitting(false);
          }
        }
      }}
    >
      {({ errors, handleBlur, handleChange, handleSubmit, isSubmitting, touched, values }) => (
        <form noValidate onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel htmlFor="password-reset">Password</InputLabel>
                <OutlinedInput
                  fullWidth
                  error={Boolean(touched.newPassword && errors.newPassword)}
                  id="password-reset"
                  type={showPassword ? 'text' : 'password'}
                  value={values.newPassword}
                  name="newPassword"
                  onBlur={handleBlur}
                  onChange={(e) => {
                    handleChange(e);
                    changePassword(e.target.value);
                  }}
                  endAdornment={
                    <InputAdornment position="end">
                      <IconButton
                        aria-label="toggle password visibility"
                        onClick={handleClickShowPassword}
                        onMouseDown={handleMouseDownPassword}
                        edge="end"
                        color="secondary"
                      >
                        {showPassword ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      </IconButton>
                    </InputAdornment>
                  }
                  placeholder="Enter password"
                />
              </Stack>
              {touched.newPassword && errors.newPassword && (
                <FormHelperText error id="helper-text-password-reset">
                  {errors.newPassword}
                </FormHelperText>
              )}
              <FormControl fullWidth sx={{ mt: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item>
                    <Box sx={{ bgcolor: level?.color, width: 85, height: 8, borderRadius: '7px' }} />
                  </Grid>
                  <Grid item>
                    <Typography variant="subtitle1" fontSize="0.75rem">
                      {level?.label}
                    </Typography>
                  </Grid>
                </Grid>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Stack spacing={1}>
                <InputLabel htmlFor="confirm-password-reset">Confirm Password</InputLabel>
                <OutlinedInput
                  fullWidth
                  error={Boolean(touched.confirmPassword && errors.confirmPassword)}
                  id="confirm-password-reset"
                  type="password"
                  value={values.confirmPassword}
                  name="confirmPassword"
                  onBlur={handleBlur}
                  onChange={handleChange}
                  placeholder="Enter confirm password"
                />
              </Stack>
              {touched.confirmPassword && errors.confirmPassword && (
                <FormHelperText error id="helper-text-confirm-password-reset">
                  {errors.confirmPassword}
                </FormHelperText>
              )}
            </Grid>

            {errors.submit && (
              <Grid item xs={12}>
                <FormHelperText error>{errors.submit}</FormHelperText>
              </Grid>
            )}
            <Grid item xs={12}>
              <AnimateButton>
                <Button disableElevation disabled={isSubmitting} fullWidth size="large" type="submit" variant="contained" color="primary">
                  Reset Password
                </Button>
              </AnimateButton>
            </Grid>
          </Grid>
        </form>
      )}
    </Formik>
  );
}
