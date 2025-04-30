// third-party
import { FormattedMessage } from 'react-intl';

// assets
import LineChartOutlined from '@ant-design/icons/LineChartOutlined';

// type
import { NavItemType } from 'types/menu';
import { BulbOutlined, DatabaseOutlined, DollarOutlined, DotChartOutlined, FileSearchOutlined, UsergroupAddOutlined } from '@ant-design/icons';

// icons
const icons = { LineChartOutlined, DotChartOutlined, DollarOutlined, DatabaseOutlined, FileSearchOutlined, BulbOutlined, UsergroupAddOutlined};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const adminGroup: NavItemType = {
  id: 'group-adminGroup',
  title: <FormattedMessage id="admin-group" />,
  type: 'group',
  children: [
    {
      id: 'tenants',
      title: <FormattedMessage id="Tenants"/>,
      type: 'item',
      url: '/tenant-management',
      icon: icons.UsergroupAddOutlined
    }, 
  ]
};

export default adminGroup;