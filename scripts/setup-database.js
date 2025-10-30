#!/usr/bin/env node
/**
 * Database connection test and setup
 * Tests if we can connect to PostgreSQL and creates the database if needed
 */

const { exec } = require('child_process');
const path = require('path');

// Database configuration
const DB_USER = 'apple';
const DB_NAME = 'mrmobile_dev';
const POSTGRES_PATH = '/opt/homebrew/Cellar/postgresql@15/15.13/bin';

console.log('🔗 Testing database connection...');

// Test if we can connect to PostgreSQL as the user
function testConnection() {
  return new Promise((resolve, reject) => {
    const testCmd = `${POSTGRES_PATH}/psql -U ${DB_USER} -d postgres -c "SELECT version();" -t`;
    
    exec(testCmd, { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Cannot connect to PostgreSQL as user:', DB_USER);
        console.log('Creating database user and database...');
        createUserAndDatabase().then(resolve).catch(reject);
      } else {
        console.log('✅ PostgreSQL connection successful');
        checkDatabase().then(resolve).catch(reject);
      }
    });
  });
}

// Create user and database using superuser access
function createUserAndDatabase() {
  return new Promise((resolve, reject) => {
    const commands = [
      `CREATE USER ${DB_USER} WITH CREATEDB;`,
      `CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};`,
      `GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};`
    ];
    
    const createCmd = `${POSTGRES_PATH}/psql -d postgres -c "${commands.join(' ')}"`;
    
    exec(createCmd, (error, stdout, stderr) => {
      if (error && !error.message.includes('already exists')) {
        reject(new Error(`Failed to create user/database: ${error.message}`));
      } else {
        console.log('✅ Database user and database created');
        resolve();
      }
    });
  });
}

// Check if our target database exists
function checkDatabase() {
  return new Promise((resolve, reject) => {
    const checkCmd = `${POSTGRES_PATH}/psql -U ${DB_USER} -d ${DB_NAME} -c "SELECT current_database();" -t`;
    
    exec(checkCmd, { timeout: 5000 }, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Cannot access database:', DB_NAME);
        console.log('Creating database...');
        createDatabase().then(resolve).catch(reject);
      } else {
        console.log('✅ Database exists and accessible');
        resolve();
      }
    });
  });
}

// Create the database
function createDatabase() {
  return new Promise((resolve, reject) => {
    const createCmd = `${POSTGRES_PATH}/createdb -U ${DB_USER} ${DB_NAME}`;
    
    exec(createCmd, (error, stdout, stderr) => {
      if (error && !error.message.includes('already exists')) {
        reject(new Error(`Failed to create database: ${error.message}`));
      } else {
        console.log('✅ Database created successfully');
        resolve();
      }
    });
  });
}

// Run the setup
async function main() {
  try {
    await testConnection();
    console.log('🎉 Database setup complete!');
    console.log(`   Database: ${DB_NAME}`);
    console.log(`   User: ${DB_USER}`);
    console.log(`   Connection: postgresql://${DB_USER}:@localhost:5432/${DB_NAME}`);
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('\n🔧 Manual steps to try:');
    console.log(`1. ${POSTGRES_PATH}/createuser -s ${DB_USER}`);
    console.log(`2. ${POSTGRES_PATH}/createdb -U ${DB_USER} ${DB_NAME}`);
    process.exit(1);
  }
}

main();
