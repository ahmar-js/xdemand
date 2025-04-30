// This is example of menu item without group for horizontal layout. There will be no children.

// third-party
import { FormattedMessage } from 'react-intl';


// type
import { NavItemType } from 'types/menu';
import { DashboardOutlined } from '@ant-design/icons';

// icons
const icons = { DashboardOutlined };

// ==============================|| MENU ITEMS - SAMPLE PAGE ||============================== //

const samplePage: NavItemType = {
  id: 'xdemand-sample-page',
  title: <FormattedMessage id="dashboard" />,
  type: 'item',
  url: '/',
  icon: icons.DashboardOutlined
};

export default samplePage;
