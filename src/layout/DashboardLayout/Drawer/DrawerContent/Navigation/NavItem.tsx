import React, { useEffect } from 'react';

// next
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// material-ui
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

// project import
import Dot from 'components/@extended/Dot';
import IconButton from 'components/@extended/IconButton';

import { MenuOrientation, ThemeMode, NavActionType } from 'config';
import useConfig from 'hooks/useConfig';
import { handlerHorizontalActiveItem, handlerActiveItem, handlerDrawerOpen, useGetMenuMaster } from 'api/menu';

// types
import { LinkTarget, NavItemType } from 'types/menu';

// ==============================|| NAVIGATION - LIST ITEM ||============================== //

interface Props {
  item: NavItemType;
  level: number;
  isParents?: boolean;
}

export default function NavItem({ item, level, isParents = false }: Props) {
  const theme = useTheme();

  const { menuMaster } = useGetMenuMaster();
  const drawerOpen = menuMaster.isDashboardDrawerOpened;
  const openItem = menuMaster.openedItem;

  const downLG = useMediaQuery(theme.breakpoints.down('lg'));

  const { mode, menuOrientation } = useConfig();
  let itemTarget: LinkTarget = '_self';
  if (item.target) {
    itemTarget = '_blank';
  }

  const Icon = item.icon!;
  const itemIcon = item.icon ? (
    <Icon
      style={{
        fontSize: drawerOpen ? '1rem' : '1.25rem',
        ...(menuOrientation === MenuOrientation.HORIZONTAL && isParents && { fontSize: 20, stroke: '1.5' })
      }}
    />
  ) : (
    false
  );

  const isSelected = openItem === item.id;

  const pathname = usePathname();

  // active menu item on page load
  useEffect(() => {
    if (pathname === item.url) handlerActiveItem(item.id!);
    // eslint-disable-next-line
  }, [pathname]);

  const textColor = mode === ThemeMode.DARK ? 'grey.400' : 'text.primary';
  const iconSelectedColor = mode === ThemeMode.DARK && drawerOpen ? 'text.primary' : 'primary.main';

  const itemHandler = (id: string) => {
    handlerActiveItem(id);
  };

  const listItemProps = {
    component: item.url ? Link : 'button',
    href: item.url || '',
    target: itemTarget
  };

  const navItemContent = (
    <ListItemButton
      {...listItemProps}
      disabled={item.disabled}
      onClick={() => itemHandler(item.id!)}
      selected={isSelected}
      sx={{
        zIndex: 1201,
        pl: drawerOpen ? `${level * 28}px` : 1.5,
        py: !drawerOpen && level === 1 ? 1.25 : 1,
        ...(drawerOpen && {
          '&:hover': {
            bgcolor: mode === ThemeMode.DARK ? 'divider' : 'primary.lighter'
          },
          '&.Mui-selected': {
            bgcolor: mode === ThemeMode.DARK ? 'divider' : 'primary.lighter',
            borderRight: `2px solid ${theme.palette.primary.main}`,
            color: iconSelectedColor,
            '&:hover': {
              color: iconSelectedColor,
              bgcolor: mode === ThemeMode.DARK ? 'divider' : 'primary.lighter'
            }
          }
        }),
        ...(!drawerOpen && {
          '&:hover': {
            bgcolor: 'transparent'
          },
          '&.Mui-selected': {
            '&:hover': {
              bgcolor: 'transparent'
            },
            bgcolor: 'transparent'
          }
        })
      }}
    >
      {itemIcon && (
        <ListItemIcon
          sx={{
            minWidth: 28,
            color: isSelected ? iconSelectedColor : textColor,
            ...(!drawerOpen && {
              borderRadius: 1.5,
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center',
              '&:hover': {
                bgcolor: mode === ThemeMode.DARK ? 'divider' : 'primary.lighter'
              }
            }),
            ...(!drawerOpen &&
              isSelected && {
                bgcolor: mode === ThemeMode.DARK ? 'divider' : 'primary.lighter',
                '&:hover': {
                  bgcolor: mode === ThemeMode.DARK ? 'divider' : 'primary.lighter'
                }
              })
          }}
        >
          {itemIcon}
        </ListItemIcon>
      )}
      {(drawerOpen || (!drawerOpen && level !== 1)) && (
        <ListItemText
          primary={item.title}
          sx={{
            color: isSelected ? iconSelectedColor : textColor
          }}
        />
      )}
    </ListItemButton>
  );

  return (
    <>
      {!drawerOpen ? (
        <Tooltip title={item.title} placement="right">
          {navItemContent}
        </Tooltip>
      ) : (
        navItemContent
      )}
    </>
  );
}
