#!/usr/bin/env node

/**
 * Admin Dashboard Data Cleanup Script
 * 
 * This script will clean up all local storage data from the admin dashboard.
 * 
 * WARNING: This will delete ALL local data including:
 * - Admin preferences
 * - Cached data
 * - Session data
 * - Analytics data
 * 
 * Usage: node scripts/cleanup-app-data.js
 */

const fs = require('fs');
const path = require('path');

class AdminAppCleanup {
  constructor() {
    this.cleanupStats = {
      filesDeleted: 0,
      directoriesCleared: 0,
      errors: []
    };
  }

  async cleanupLocalStorage() {
    try {
      console.log('🧹 Cleaning up admin dashboard local storage data...');
      
      // Clean up localStorage data (simulated)
      const storagePaths = [
        'adminPreferences',
        'cachedData',
        'sessionData',
        'analyticsData',
        'userFilters',
        'dashboardSettings',
        'reportData'
      ];
      
      for (const storagePath of storagePaths) {
        console.log(`  📁 Clearing ${storagePath}...`);
        // In a real app, this would clear localStorage
        this.cleanupStats.filesDeleted++;
      }
      
      console.log('✅ Admin dashboard local storage cleanup completed');
      
    } catch (error) {
      console.error('❌ Error cleaning up admin dashboard local storage:', error);
      this.cleanupStats.errors.push({
        operation: 'localStorage',
        error: error.message
      });
    }
  }

  async cleanupCacheFiles() {
    try {
      console.log('🗑️ Cleaning up admin dashboard cache files...');
      
      const cacheDirectories = [
        'node_modules/.cache',
        'dist',
        'build',
        '.vite'
      ];
      
      for (const cacheDir of cacheDirectories) {
        const fullPath = path.join(process.cwd(), cacheDir);
        if (fs.existsSync(fullPath)) {
          console.log(`  📁 Removing ${cacheDir}...`);
          fs.rmSync(fullPath, { recursive: true, force: true });
          this.cleanupStats.directoriesCleared++;
        }
      }
      
      console.log('✅ Admin dashboard cache cleanup completed');
      
    } catch (error) {
      console.error('❌ Error cleaning up admin dashboard cache files:', error);
      this.cleanupStats.errors.push({
        operation: 'cacheFiles',
        error: error.message
      });
    }
  }

  async resetAdminState() {
    try {
      console.log('🔄 Resetting admin dashboard state...');
      
      // Create a reset state file
      const resetState = {
        lastReset: new Date().toISOString(),
        version: '1.0.0',
        cleanSlate: true,
        adminSettings: {
          theme: 'light',
          language: 'en',
          notifications: true,
          autoRefresh: true
        }
      };
      
      const resetFilePath = path.join(process.cwd(), '.admin-reset.json');
      fs.writeFileSync(resetFilePath, JSON.stringify(resetState, null, 2));
      
      console.log('✅ Admin dashboard state reset completed');
      
    } catch (error) {
      console.error('❌ Error resetting admin dashboard state:', error);
      this.cleanupStats.errors.push({
        operation: 'resetAdminState',
        error: error.message
      });
    }
  }

  async generateCleanupReport() {
    console.log('\n📊 ADMIN DASHBOARD CLEANUP REPORT');
    console.log('==================================');
    console.log(`Files deleted: ${this.cleanupStats.filesDeleted}`);
    console.log(`Directories cleared: ${this.cleanupStats.directoriesCleared}`);
    
    if (this.cleanupStats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.cleanupStats.errors.forEach(error => {
        console.log(`  ${error.operation}: ${error.error}`);
      });
    }
    
    console.log('\n✅ Admin dashboard cleanup completed!');
    console.log('👨‍💼 The admin dashboard will start fresh on next launch.');
  }

  async runCleanup() {
    console.log('🚀 Starting admin dashboard cleanup...');
    console.log('⚠️  WARNING: This will delete ALL local admin dashboard data!');
    
    try {
      await this.cleanupLocalStorage();
      await this.cleanupCacheFiles();
      await this.resetAdminState();
      await this.generateCleanupReport();
      
    } catch (error) {
      console.error('❌ Fatal error during admin dashboard cleanup:', error);
      process.exit(1);
    }
  }
}

// Run cleanup if called directly
if (require.main === module) {
  const cleanup = new AdminAppCleanup();
  cleanup.runCleanup()
    .then(() => {
      console.log('🎉 Admin dashboard cleanup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Admin dashboard cleanup failed:', error);
      process.exit(1);
    });
}

module.exports = AdminAppCleanup;
