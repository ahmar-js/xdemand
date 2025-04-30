// project import
import dashboard from './dashboard';
import aim0dels from './ai-models';
import adminGroup from './administration';

// import pages from './pages';

// types
import { NavItemType } from 'types/menu';

// ==============================|| MENU ITEMS ||============================== //

const menuItems: { items: NavItemType[] } = {
  items: [dashboard, aim0dels, adminGroup]
};

export default menuItems;
