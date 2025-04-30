import React, { useState, useMemo } from 'react';
import {
  Paper,
  Box,
  Typography,
  Chip,
  Card,
  CardContent,
  IconButton,
  Grid,
  Tabs,
  Tab,
  Button,
  Avatar,
  Divider,
  useTheme,
  alpha,
  TextField,
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ShareIcon from '@mui/icons-material/Share';
import TimelineIcon from '@mui/icons-material/Timeline';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import InventoryIcon from '@mui/icons-material/Inventory';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  category: 'market' | 'inventory' | 'logistics' | 'revenue';
  date: string;
  author: {
    name: string;
    avatar: string;
  };
  trend: 'up' | 'down' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  stats: {
    label: string;
    value: string;
    change: number;
  }[];
}

const generateSampleNews = (): NewsItem[] => {
  const categories: ('market' | 'inventory' | 'logistics' | 'revenue')[] = ['market', 'inventory', 'logistics', 'revenue'];
  const trends: ('up' | 'down' | 'neutral')[] = ['up', 'down', 'neutral'];
  const impacts: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];

  return Array.from({ length: 12 }, (_, index) => {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const trend = trends[Math.floor(Math.random() * trends.length)];
    const impact = impacts[Math.floor(Math.random() * impacts.length)];

    return {
      id: `news-${index + 1}`,
      title: getCategorySpecificTitle(category),
      summary: getCategorySummary(category),
      content: getDetailedContent(category),
      category,
      date: getRandomRecentDate(),
      author: {
        name: ['Alex Johnson', 'Sarah Smith', 'Mike Brown', 'Emma Davis'][Math.floor(Math.random() * 4)],
        avatar: `https://i.pravatar.cc/150?img=${index + 1}`,
      },
      trend,
      impact,
      stats: generateCategoryStats(category),
    };
  });
};

const getCategorySpecificTitle = (category: 'market' | 'inventory' | 'logistics' | 'revenue'): string => {
  const titles = {
    market: [
      'Global Combat Sports Equipment Market Analysis Q2 2024',
      'Emerging Trends in Professional Boxing Equipment',
      'MMA Gear Market: Supply Chain Impact Report'
    ],
    inventory: [
      'Critical Stock Level Alert: Premium Boxing Gloves',
      'Inventory Optimization Strategy Results',
      'Stock Management System Performance Review'
    ],
    logistics: [
      'Supply Chain Efficiency Metrics Q2 2024',
      'Warehouse Operations Optimization Report',
      'Distribution Network Performance Analysis'
    ],
    revenue: [
      'Revenue Impact Analysis: Stock Management',
      'Financial Performance: Q2 2024 Overview',
      'Profit Margin Optimization Results'
    ]
  };
  return titles[category][Math.floor(Math.random() * 3)];
};

const getCategorySummary = (category: 'market' | 'inventory' | 'logistics' | 'revenue'): string => {
  const summaries = {
    market: 'Market analysis reveals significant shifts in combat sports equipment demand patterns, with notable impact on inventory planning.',
    inventory: 'Latest inventory analysis indicates critical stock levels requiring immediate attention and strategic restocking decisions.',
    logistics: 'Supply chain optimization initiatives show measurable improvements in delivery efficiency and cost reduction.',
    revenue: 'Financial analysis demonstrates the direct correlation between inventory management and revenue performance.'
  };
  return summaries[category];
};

const getDetailedContent = (category: 'market' | 'inventory' | 'logistics' | 'revenue'): string => {
  const content = {
    market: 'Comprehensive market analysis indicates a 15% increase in demand for professional-grade combat sports equipment. Key findings suggest a shift towards premium products, with particular emphasis on safety features and durability. Supply chain disruptions have affected 23% of global manufacturers, impacting delivery timelines.',
    inventory: 'Current inventory levels for premium boxing gloves have reached critical thresholds, with stock levels at 35% below optimal. Analysis suggests a 45% increase in demand for professional-grade equipment, requiring immediate restocking action. Smart inventory management systems have identified optimal reorder points.',
    logistics: 'Implementation of new logistics protocols has resulted in a 23% improvement in delivery times and 15% reduction in shipping costs. Warehouse optimization has increased storage efficiency by 18%. Distribution network analysis reveals opportunities for further cost optimization.',
    revenue: 'Revenue streams show consistent growth across all product categories, with notable performance in premium fight gear (28% increase). Profit margins have improved by 12% through optimized inventory management. Analysis indicates potential for additional 15% growth through strategic stock level adjustments.'
  };
  return content[category];
};

const generateCategoryStats = (category: 'market' | 'inventory' | 'logistics' | 'revenue'): { label: string; value: string; change: number; }[] => {
  const baseStats = {
    market: [
      { label: 'Market Growth', value: '15.2%', change: 2.5 },
      { label: 'Demand Trend', value: '+18.3%', change: 1.8 }
    ],
    inventory: [
      { label: 'Stock Level', value: '65.3%', change: -12.2 },
      { label: 'Reorder Rate', value: '2.8x', change: 0.3 }
    ],
    logistics: [
      { label: 'Delivery Time', value: '2.3 days', change: -0.5 },
      { label: 'Cost Efficiency', value: '94.8%', change: 3.2 }
    ],
    revenue: [
      { label: 'Revenue Growth', value: '18.5%', change: 4.5 },
      { label: 'Margin Impact', value: '12.3%', change: 2.1 }
    ]
  };
  return baseStats[category];
};

const getRandomRecentDate = (): string => {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * 7));
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

const getCategoryIcon = (category: 'market' | 'inventory' | 'logistics' | 'revenue'): JSX.Element => {
  const icons: Record<'market' | 'inventory' | 'logistics' | 'revenue', JSX.Element> = {
    market: <TimelineIcon />,
    inventory: <InventoryIcon />,
    logistics: <LocalShippingIcon />,
    revenue: <AttachMoneyIcon />
  };
  return icons[category];
};

const NewsSection: React.FC = () => {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<'market' | 'inventory' | 'logistics' | 'revenue'>('market');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNews, setExpandedNews] = useState<Set<string>>(new Set());
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());

  const news = generateSampleNews();

  const filteredNews = useMemo(() => {
    return news.filter(item => {
      const matchesCategory = selectedCategory === item.category;
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.content.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [news, selectedCategory, searchTerm]);

  const handleCategoryChange = (_event: React.SyntheticEvent, newValue: 'market' | 'inventory' | 'logistics' | 'revenue') => {
    setSelectedCategory(newValue);
  };

  const toggleBookmark = (id: string): void => {
    const newBookmarked = new Set(bookmarked);
    if (newBookmarked.has(id)) {
      newBookmarked.delete(id);
    } else {
      newBookmarked.add(id);
    }
    setBookmarked(newBookmarked);
  };

  const toggleExpand = (id: string): void => {
    const newExpanded = new Set(expandedNews);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNews(newExpanded);
  };

  const handleShare = (event: React.MouseEvent<HTMLButtonElement>): void => {
    // Share functionality can be implemented here
    console.log('Share clicked');
  };

  return (
    <Paper 
      elevation={3}
      sx={{ 
        p: 3,
        background: theme.palette.background.paper,
        borderRadius: 2
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            Business Insights & Analytics
          </Typography>
          <TextField
            size="small"
            placeholder="Search insights..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ width: 200 }}
          />
        </Box>
        <Tabs
          value={selectedCategory}
          onChange={handleCategoryChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              minWidth: 120,
              textTransform: 'none',
              fontWeight: 500,
            }
          }}
        >
          <Tab 
            label="Market Analysis" 
            value="market"
            icon={<TimelineIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Inventory Status" 
            value="inventory"
            icon={<InventoryIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Supply Chain" 
            value="logistics"
            icon={<LocalShippingIcon />}
            iconPosition="start"
          />
          <Tab 
            label="Financial Impact" 
            value="revenue"
            icon={<AttachMoneyIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {filteredNews.map((item) => (
          <Grid item xs={12} md={6} key={item.id}>
            <Card 
              elevation={2}
              sx={{ 
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[4],
                }
              }}
            >
              <CardContent sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                  <Chip 
                    icon={getCategoryIcon(item.category)}
                    label={item.category.charAt(0).toUpperCase() + item.category.slice(1)}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  <Chip 
                    icon={item.trend === 'up' ? <TrendingUpIcon /> : <TrendingDownIcon />}
                    label={item.trend.toUpperCase()}
                    size="small"
                    color={item.trend === 'up' ? 'success' : 'error'}
                    variant="outlined"
                  />
                  <Chip 
                    label={`Impact: ${item.impact.toUpperCase()}`}
                    size="small"
                    color={
                      item.impact === 'high' ? 'error' : 
                      item.impact === 'medium' ? 'warning' : 
                      'success'
                    }
                    variant="outlined"
                  />
                </Box>

                <Typography variant="h6" gutterBottom sx={{ 
                  fontWeight: 600,
                  color: theme.palette.text.primary,
                  mb: 1,
                  fontSize: '1.1rem'
                }}>
                  {item.title}
                </Typography>

                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  sx={{ 
                    mb: 2,
                    display: '-webkit-box',
                    WebkitLineClamp: expandedNews.has(item.id) ? 'none' : 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    lineHeight: 1.6
                  }}
                >
                  {expandedNews.has(item.id) ? item.content : item.summary}
                </Typography>

                <Box sx={{ 
                  display: 'flex', 
                  gap: 2, 
                  mb: 2,
                  flexWrap: 'wrap'
                }}>
                  {item.stats.map((stat, index) => (
                    <Box 
                      key={index}
                      sx={{ 
                        p: 1.5,
                        borderRadius: 1,
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        minWidth: '120px'
                      }}
                    >
                      <Typography variant="caption" display="block" color="text.secondary">
                        {stat.label}
                      </Typography>
                      <Typography variant="body2" fontWeight="bold">
                        {stat.value}
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{
                            color: stat.change > 0 ? 'success.main' : 'error.main',
                            ml: 0.5
                          }}
                        >
                          {stat.change > 0 ? '+' : ''}{stat.change}%
                        </Typography>
                      </Typography>
                    </Box>
                  ))}
                </Box>

                <Box sx={{ 
                  mt: 'auto', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  pt: 2,
                  borderTop: `1px solid ${theme.palette.divider}`
                }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={item.author.avatar} sx={{ width: 24, height: 24 }} />
                    <Typography variant="caption" color="text.secondary">{item.author.name}</Typography>
                    <Divider orientation="vertical" flexItem />
                    <Typography variant="caption" color="text.secondary">{item.date}</Typography>
                  </Box>
                  
                  <Box>
                    <IconButton 
                      size="small" 
                      onClick={() => toggleBookmark(item.id)}
                      color={bookmarked.has(item.id) ? 'primary' : 'default'}
                    >
                      {bookmarked.has(item.id) ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                    </IconButton>
                    <IconButton 
                      size="small"
                      onClick={handleShare}
                    >
                      <ShareIcon />
                    </IconButton>
                    <Button 
                      size="small" 
                      onClick={() => toggleExpand(item.id)}
                      sx={{ ml: 1 }}
                    >
                      {expandedNews.has(item.id) ? 'Show Less' : 'Read More'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Paper>
  );
};

export default NewsSection; 