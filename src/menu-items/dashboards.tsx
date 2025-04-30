// third-party
import { FormattedMessage } from 'react-intl';

// assets
import DashboardOutlined from '@ant-design/icons/DashboardOutlined';

// type
import { NavItemType } from 'types/menu';

// icons
const icons = { DashboardOutlined };

// ==============================|| MENU ITEMS - PAGES ||============================== //

const dashboards: NavItemType = {
  id: 'group-dashboards',
  title: <FormattedMessage id="dashboards" />,
  type: 'group',
  children: [
    {
      id: 'dashboard',
      title: <FormattedMessage id="dashboards" />,
      type: 'item',
      url: '/dashboard-1',
      icon: icons.DashboardOutlined,
      target: true
    }
  ]
};

export default dashboards;

