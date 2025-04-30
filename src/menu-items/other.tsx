// third-party
import { FormattedMessage } from 'react-intl';

// assets
import QuestionOutlined from '@ant-design/icons/QuestionOutlined';
import StopOutlined from '@ant-design/icons/StopOutlined';

// type
import { NavItemType } from 'types/menu';

// icons
const icons = {
  QuestionOutlined,
  StopOutlined
};

// ==============================|| MENU ITEMS - SUPPORT ||============================== //

const other: NavItemType = {
  id: 'other',
  title: <FormattedMessage id="others" />,
  type: 'group',
  children: [
    {
      id: 'disabled-menu',
      title: <FormattedMessage id="disabled-menu" />,
      type: 'item',
      url: '#',
      icon: icons.StopOutlined,
      disabled: true
    },
    {
      id: 'documentation',
      title: <FormattedMessage id="documentation" />,
      type: 'item',
      url: 'https://codedthemes.gitbook.io/mantis/',
      icon: icons.QuestionOutlined,
      external: true,
      target: true,
      chip: {
        label: 'gitbook',
        color: 'secondary',
        size: 'small'
      }
    }
  ]
};

export default other;
