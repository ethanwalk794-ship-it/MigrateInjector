# Resume Customizer Pro - Setup Guide

## Simplified App Status

The app has been **SIMPLIFIED** to include only login, signup, and resume upload functionality.

**Current Features:**

- ✅ **Login endpoint working (mock mode)**
- ✅ **Signup endpoint working (mock mode)**
- ✅ **Resume upload functionality**
- ✅ **Basic file validation and storage**
- ✅ **Clean, simplified UI**

**Removed Features:**

- ❌ Dashboard functionality
- ❌ Resume processing and customization
- ❌ Email sending capabilities
- ❌ Settings page
- ❌ Complex processing workflows

## Testing the App

You can test the simplified authentication and upload functionality:

### Register Test:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123","firstName":"Test","lastName":"User"}' \
  http://localhost:3000/api/auth/register
```

### Login Test:

```bash
curl -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpassword123"}' \
  http://localhost:3000/api/auth/login
```

### Available Pages:

- **Home**: `http://localhost:3000/`
- **Login**: `http://localhost:3000/login`
- **Signup**: `http://localhost:3000/signup`
- **Upload**: `http://localhost:3000/resume-upload`

## Simple Development Setup

The app now runs without requiring MongoDB or Redis setup:

### 1. Start the Application

```bash
npm run dev
```

### 2. Environment Configuration (Optional)

Your `.env.local` can be minimal for the simplified version:

```env
# JWT (for mock authentication)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
```

### 3. Development Workflow

1. **Start the app:**

   ```bash
   npm run dev
   ```

2. **Test functionality:**
   - Navigate to `http://localhost:3000`
   - Try registering a new user
   - Try logging in
   - Test resume upload

## Troubleshooting

### Common Issues:

1. **Port 3000 already in use:**

   ```bash
   npx kill-port 3000
   ```

2. **npm install issues:**

   ```bash
   npm cache clean --force
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Build issues:**
   ```bash
   npm run build
   ```

## Next Steps

1. **Test the current simplified version** - Login/Register/Upload should work
2. **Add features as needed** - The simplified structure makes it easy to extend
3. **Set up database integration** if persistent storage is required

The application is ready for basic development and testing!
