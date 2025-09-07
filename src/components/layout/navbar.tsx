'use client';

import { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Menu,
  MenuItem,
  Avatar,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Upload as UploadIcon,
  Speed as SpeedIcon,
  Email as EmailIcon,
  Settings as SettingsIcon,
  AccountCircle as AccountCircleIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  Help as HelpIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { useAuth } from '@/lib/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

interface NavbarProps {
  title?: string;
}

export default function Navbar({ title = 'Resume Customizer Pro' }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
    handleProfileMenuClose();
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileDrawerOpen(false);
  };

  const navigationItems = [
    { label: 'Dashboard', path: '/dashboard', icon: <DashboardIcon /> },
    { label: 'Upload', path: '/resume-upload', icon: <UploadIcon /> },
    { label: 'Processor', path: '/resume-processor', icon: <SpeedIcon /> },
    { label: 'Email Sender', path: '/email-sender', icon: <EmailIcon /> },
    { label: 'Settings', path: '/settings', icon: <SettingsIcon /> },
  ];

  const NavbarContent = () => (
    <>
      {/* Logo and Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', mr: 4 }}>
        <Typography
          variant="h6"
          component="div"
          sx={{
            fontWeight: 700,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            cursor: 'pointer'
          }}
          onClick={() => router.push('/')}
        >
          {title}
        </Typography>
      </Box>

      {/* Desktop Navigation */}
      {!isMobile && (
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1 }}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => handleNavigation(item.path)}
              sx={{ mr: 1 }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      )}

      {/* Right Side Actions */}
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        {/* Notifications */}
        <Tooltip title="Notifications">
          <IconButton
            color="inherit"
            onClick={handleNotificationMenuOpen}
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Tooltip>

        {/* Help */}
        <Tooltip title="Help">
          <IconButton
            color="inherit"
            onClick={() => router.push('/help')}
            sx={{ mr: 1 }}
          >
            <HelpIcon />
          </IconButton>
        </Tooltip>

        {/* Profile Menu */}
        <Tooltip title="Account">
          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ p: 0, ml: 1 }}
          >
            <Avatar
              sx={{ width: 32, height: 32, bgcolor: 'primary.main' }}
              src={user?.avatar}
            >
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </Avatar>
          </IconButton>
        </Tooltip>

        {/* Mobile Menu Button */}
        {isMobile && (
          <IconButton
            color="inherit"
            onClick={() => setMobileDrawerOpen(true)}
            sx={{ ml: 1 }}
          >
            <MenuIcon />
          </IconButton>
        )}
      </Box>
    </>
  );

  return (
    <>
      <AppBar position="sticky" elevation={1}>
        <Toolbar>
          <NavbarContent />
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={() => { handleNavigation('/profile'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Profile</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleNavigation('/settings'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Settings</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Logout</ListItemText>
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemText primary="Resume processing completed" secondary="2 minutes ago" />
        </MenuItem>
        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemText primary="Email sent successfully" secondary="1 hour ago" />
        </MenuItem>
        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemText primary="New feature available" secondary="1 day ago" />
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleNotificationMenuClose}>
          <ListItemText primary="View all notifications" />
        </MenuItem>
      </Menu>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Menu
            </Typography>
            <IconButton onClick={() => setMobileDrawerOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          
          <Divider sx={{ mb: 2 }} />
          
          <List>
            {navigationItems.map((item) => (
              <ListItem
                key={item.path}
                button
                onClick={() => handleNavigation(item.path)}
                sx={{ borderRadius: 1, mb: 0.5 }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
          
          <Divider sx={{ my: 2 }} />
          
          <List>
            <ListItem button onClick={() => { handleNavigation('/profile'); setMobileDrawerOpen(false); }}>
              <ListItemIcon>
                <AccountCircleIcon />
              </ListItemIcon>
              <ListItemText primary="Profile" />
            </ListItem>
            <ListItem button onClick={() => { handleNavigation('/settings'); setMobileDrawerOpen(false); }}>
              <ListItemIcon>
                <SettingsIcon />
              </ListItemIcon>
              <ListItemText primary="Settings" />
            </ListItem>
            <ListItem button onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
