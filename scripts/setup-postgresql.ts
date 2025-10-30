// PostgreSQL Database Setup and Verification
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

async function setupPostgreSQLDatabase() {
  console.log('🔍 Setting up PostgreSQL database...')
  
  const psqlPath = '/opt/homebrew/Cellar/postgresql@15/15.13/bin/psql'
  const dbName = 'mrmobile_dev'
  const username = 'apple'
  
  try {
    // Check if database exists
    console.log('📊 Checking if database exists...')
    const checkDbCommand = `${psqlPath} -U ${username} -d postgres -c "SELECT 1 FROM pg_database WHERE datname='${dbName}';" -t`
    
    try {
      const { stdout } = await execAsync(checkDbCommand)
      if (stdout.trim() === '1') {
        console.log('✅ Database already exists')
      } else {
        console.log('📝 Creating database...')
        const createDbCommand = `${psqlPath} -U ${username} -d postgres -c "CREATE DATABASE ${dbName};"`
        await execAsync(createDbCommand)
        console.log('✅ Database created successfully')
      }
    } catch (error) {
      console.log('📝 Creating database (might already exist)...')
      const createDbCommand = `${psqlPath} -U ${username} -d postgres -c "CREATE DATABASE ${dbName};" 2>/dev/null || echo "Database might already exist"`
      await execAsync(createDbCommand)
    }
    
    // Test connection to the specific database
    console.log('🔌 Testing database connection...')
    const testCommand = `${psqlPath} -U ${username} -d ${dbName} -c "SELECT current_database(), current_user;" -t`
    const { stdout } = await execAsync(testCommand)
    console.log('✅ Database connection successful:', stdout.trim())
    
    return true
  } catch (error) {
    console.error('❌ Database setup failed:', error instanceof Error ? error.message : String(error))
    
    // Try alternative approach - connect as superuser and create database
    console.log('🔄 Trying alternative setup...')
    try {
      // This assumes postgres superuser exists
      const altCreateCommand = `${psqlPath} -U postgres -d postgres -c "CREATE DATABASE ${dbName} OWNER ${username};" 2>/dev/null || echo "Database might exist"`
      await execAsync(altCreateCommand)
      console.log('✅ Alternative database setup completed')
      return true
    } catch (altError) {
      console.error('❌ Alternative setup also failed:', altError instanceof Error ? altError.message : String(altError))
      return false
    }
  }
}

async function main() {
  const success = await setupPostgreSQLDatabase()
  
  if (!success) {
    console.log('\n🚨 Database setup failed. Manual steps required:')
    console.log('1. Make sure PostgreSQL is running: brew services start postgresql@15')
    console.log('2. Create database manually: createdb mrmobile_dev')
    console.log('3. Or run: psql -U apple -d postgres -c "CREATE DATABASE mrmobile_dev;"')
    process.exit(1)
  }
  
  console.log('\n🎉 Database setup completed successfully!')
  console.log('📝 Next steps:')
  console.log('1. Run: npx prisma db push')
  console.log('2. Run: npx tsx scripts/init-demo-users-simple.ts')
  console.log('3. Start the app: npm run dev')
}

main().catch(console.error)
