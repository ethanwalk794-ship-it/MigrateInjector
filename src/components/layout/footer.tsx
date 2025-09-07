'use client';

import {
  Box,
  Container,
  Typography,
  Link,
  Stack,
  IconButton,
  Divider,
  Grid
} from '@mui/material';
import {
  GitHub as GitHubIcon,
  Twitter as TwitterIcon,
  LinkedIn as LinkedInIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon
} from '@mui/icons-material';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { label: 'Features', href: '/features' },
      { label: 'Pricing', href: '/pricing' },
      { label: 'API', href: '/api-docs' },
      { label: 'Integrations', href: '/integrations' }
    ],
    company: [
      { label: 'About Us', href: '/about' },
      { label: 'Careers', href: '/careers' },
      { label: 'Blog', href: '/blog' },
      { label: 'Press', href: '/press' }
    ],
    support: [
      { label: 'Help Center', href: '/help' },
      { label: 'Documentation', href: '/docs' },
      { label: 'Contact', href: '/contact' },
      { label: 'Status', href: '/status' }
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Cookie Policy', href: '/cookies' },
      { label: 'GDPR', href: '/gdpr' }
    ]
  };

  const socialLinks = [
    { icon: <GitHubIcon />, href: 'https://github.com', label: 'GitHub' },
    { icon: <TwitterIcon />, href: 'https://twitter.com', label: 'Twitter' },
    { icon: <LinkedInIcon />, href: 'https://linkedin.com', label: 'LinkedIn' },
    { icon: <EmailIcon />, href: 'mailto:support@example.com', label: 'Email' }
  ];

  return (
    <Box
      component="footer"
      sx={{
        bgcolor: 'background.paper',
        borderTop: 1,
        borderColor: 'divider',
        mt: 'auto',
        py: 6
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Company Info */}
          <Grid item xs={12} md={4}>
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2
              }}
            >
              Resume Customizer Pro
            </Typography>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Transform your resume with AI-powered customization, intelligent formatting, 
              and automated optimization for maximum impact.
            </Typography>

            {/* Contact Info */}
            <Stack spacing={1}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmailIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  support@resumecustomizer.com
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PhoneIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  +1 (555) 123-4567
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  San Francisco, CA
                </Typography>
              </Box>
            </Stack>
          </Grid>

          {/* Product Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 2 }}>
              Product
            </Typography>
            <Stack spacing={1}>
              {footerLinks.product.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Company Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 2 }}>
              Company
            </Typography>
            <Stack spacing={1}>
              {footerLinks.company.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Support Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 2 }}>
              Support
            </Typography>
            <Stack spacing={1}>
              {footerLinks.support.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          {/* Legal Links */}
          <Grid item xs={12} sm={6} md={2}>
            <Typography variant="h6" component="div" sx={{ fontWeight: 600, mb: 2 }}>
              Legal
            </Typography>
            <Stack spacing={1}>
              {footerLinks.legal.map((link) => (
                <Link
                  key={link.label}
                  href={link.href}
                  variant="body2"
                  color="text.secondary"
                  sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4 }} />

        {/* Bottom Section */}
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            © {currentYear} Resume Customizer Pro. All rights reserved.
          </Typography>

          {/* Social Links */}
          <Stack direction="row" spacing={1} sx={{ mt: { xs: 2, md: 0 } }}>
            {socialLinks.map((social) => (
              <IconButton
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                size="small"
                sx={{ color: 'text.secondary' }}
                aria-label={social.label}
              >
                {social.icon}
              </IconButton>
            ))}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
