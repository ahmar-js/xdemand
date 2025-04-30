'use client';

import { ReactElement } from 'react';

// next
import { SessionProvider } from 'next-auth/react';

// mui datepicker adapter
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

// project import
import ThemeCustomization from 'themes';
import Locales from 'components/Locales';
import ScrollTop from 'components/ScrollTop';
import Snackbar from 'components/@extended/Snackbar';
import Notistack from 'components/third-party/Notistack';

// tanstack query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

// ==============================|| APP - THEME, ROUTER, LOCAL ||============================== //

export default function ProviderWrapper({ children }: { children: ReactElement }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeCustomization>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Locales>
            <ScrollTop>
              <SessionProvider refetchInterval={0}>
                <Notistack>
                  <Snackbar />
                  {children}
                </Notistack>
              </SessionProvider>
            </ScrollTop>
          </Locales>
        </LocalizationProvider>
      </ThemeCustomization>
    </QueryClientProvider>
  );
}
