// third-party
import { FormattedMessage } from 'react-intl';

// type
import { NavItemType } from 'types/menu';
import { DashboardOutlined } from '@ant-design/icons';

// ==============================|| MENU ITEMS - DASHBOARD ||============================== //

const dashboard: NavItemType = {
  id: 'navigation',
  title: <FormattedMessage id="navigation" />,
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: <FormattedMessage id="dashboard" />,
      type: 'item',
      url: '/',
      icon: DashboardOutlined
    }
  ]
};

export default dashboard; 