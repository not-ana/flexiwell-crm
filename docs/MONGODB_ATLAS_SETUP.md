# How to Connect to MongoDB Atlas

This guide explains how to configure MongoDB Atlas for FlexiWell CRM.

## Step 1: Create a MongoDB Atlas Account

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" or "Start Free"
3. Create your account (you can use Google, GitHub, or email)

## Step 2: Create a Cluster

1. After logging in, click "Build a Database"
2. Choose the **FREE (M0)** plan - sufficient for development and small projects
3. Choose the provider (AWS, Google Cloud, or Azure) and the region closest to you
   - For Brazil: choose `South America (São Paulo)` if available
4. Name your cluster (e.g., `flexiwell-cluster`)
5. Click "Create"

## Step 3: Configure Access

### 3.1 Create Database User

1. In the sidebar menu, go to **Database Access**
2. Click "Add New Database User"
3. Choose "Password" as the authentication method
4. Set:
   - **Username**: `flexiwell_admin` (or another of your choice)
   - **Password**: Generate a strong password (click "Autogenerate Secure Password")
   - **IMPORTANT**: Copy and save this password!
5. Under "Database User Privileges", select "Read and write to any database"
6. Click "Add User"

### 3.2 Configure IP Access (Network Access)

1. In the sidebar menu, go to **Network Access**
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
   - Warning: In production, configure only your server's IPs
4. Click "Confirm"

## Step 4: Get the Connection String

1. Go back to **Database** in the sidebar menu
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select:
   - Driver: `Node.js`
   - Version: `6.0 or later`
5. Copy the connection string. It will look something like:

```
mongodb+srv://flexiwell_admin:<password>@flexiwell-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
```

## Step 5: Configure in FlexiWell

1. In the FlexiWell project, create/edit the `.env.local` file:

```bash
# Replace <password> with the password you saved
# Add the database name (/flexiwell) before the ?

MONGODB_URI=mongodb+srv://flexiwell_admin:YOUR_PASSWORD_HERE@flexiwell-cluster.xxxxx.mongodb.net/flexiwell?retryWrites=true&w=majority
```

2. **IMPORTANT**: Replace:
   - `YOUR_PASSWORD_HERE` with the user password
   - `flexiwell-cluster.xxxxx` with your actual cluster address
   - Add `/flexiwell` before the `?` to specify the database

## Step 6: Test the Connection

### Option A: Run the Seed Script

```bash
# Install dependencies if needed
npm install mongodb bcryptjs dotenv

# Run the seed
npx ts-node scripts/seed.ts
```

If everything is correct, you'll see:
```
Starting database seed...
Connected to MongoDB
...
Database seed completed successfully!
```

### Option B: Test via Application

```bash
npm run dev
```

Go to `http://localhost:3000/login` and try logging in with:
- Email: `admin@flexiwell.com`
- Password: `password123`

## Step 7: Verify Data in Atlas

1. In MongoDB Atlas, go to **Database** > **Browse Collections**
2. You'll see the `flexiwell` database with collections:
   - `users`
   - `staff`
   - `clients`
   - `classes`
   - `units`

## Troubleshooting

### Error: "MongoServerError: bad auth"
- Verify the password is correct
- Make sure there are no unescaped special characters in the password
- If the password has `@`, `#`, or other special characters, use URL encoding

### Error: "MongoNetworkError: connection timed out"
- Check if your IP is in the Network Access list
- Try temporarily adding 0.0.0.0/0 to test

### Error: "MongoServerSelectionError"
- Check if the cluster is active (not paused)
- Free M0 clusters pause after 60 days of inactivity

## Next Steps

After configuring MongoDB:

1. [ ] Run the seed script to populate initial data
2. [ ] Test login in the application
3. [ ] Configure Stripe variables for payments
4. [ ] Configure the OpenAI API for AI chat

---

## Production Configuration

For production, consider:

1. **Cluster Upgrade**: M0 is limited to 512MB. For production, consider M10+
2. **IP Whitelist**: Configure only your server's IPs (Vercel/Railway)
3. **Backup**: Configure automatic backups (available on paid plans)
4. **Indexes**: Create additional indexes based on query patterns
5. **Monitoring**: Enable alerts in Atlas to monitor performance

## Pricing

- **M0 (Free)**: Free, 512MB, ideal for development
- **M10**: ~$57/month, 10GB, for small production
- **M20**: ~$120/month, 20GB, for medium production

For more details: [MongoDB Atlas Pricing](https://www.mongodb.com/pricing)
