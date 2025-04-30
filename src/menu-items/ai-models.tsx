// third-party
import { FormattedMessage } from 'react-intl';

// assets
import LineChartOutlined from '@ant-design/icons/LineChartOutlined';

// type
import { NavItemType } from 'types/menu';
import { BulbOutlined, DatabaseOutlined, DollarOutlined, DotChartOutlined, FileSearchOutlined } from '@ant-design/icons';

// icons
const icons = { LineChartOutlined, DotChartOutlined, DollarOutlined, DatabaseOutlined, FileSearchOutlined, BulbOutlined};

// ==============================|| MENU ITEMS - PAGES ||============================== //

const aimodels: NavItemType = {
  id: 'group-aimodels',
  title: <FormattedMessage id="ai-models" />,
  type: 'group',
  children: [
    {
      id: 'demand-forcasting',
      title: <FormattedMessage id="demand-forcasting"/>,
      type: 'item',
      url: '/demand-forcasting',
      icon: icons.LineChartOutlined,
      target: true
    }, 

    {
      id: 'demand-analysis', 
      title: <FormattedMessage id="demand-analysis" />,
      type: 'item', 
      url: '/demand-analysis',
      icon: icons.DotChartOutlined, 
      target: true
    }, 

    {
      id: 'price-sensing', 
      title: <FormattedMessage id="price-sensing" />,
      type: 'item', 
      url: '/price-sensing',
      icon: icons.DollarOutlined, 
      target: true
    }, 

    {
      id: 'inventory-planning', 
      title: <FormattedMessage id="inventory-planning" />,
      type: 'item', 
      url: '/inventory-planning',
      icon: icons.DatabaseOutlined, 
      target: true
    }, 

    {
      id: 'product-research', 
      title: <FormattedMessage id="product-research" />,
      type: 'item', 
      url: '/product-research',
      icon: icons.FileSearchOutlined, 
      target: true
    }, 

    {
      id: 'ask-ai', 
      title: <FormattedMessage id="ask-ai" />,
      type: 'item', 
      url: '/ask-ai',
      icon: icons.BulbOutlined, 
      target: true
    }
  ]
};

export default aimodels;
