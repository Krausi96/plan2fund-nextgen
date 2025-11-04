// Database Integration Layer
// This provides a unified interface for database operations
// Currently uses localStorage as fallback, but can be easily swapped to real database

export interface DatabaseConfig {
  type: 'localStorage' | 'postgresql' | 'mongodb' | 'airtable';
  connectionString?: string;
  apiKey?: string;
}

class DatabaseManager {
  private config: DatabaseConfig;
  private isInitialized = false;

  constructor(config?: DatabaseConfig) {
    this.config = config || {
      type: 'localStorage' // Default to localStorage
    };
  }

  async initialize() {
    if (this.isInitialized) return;

    // Initialize database connection based on config
    if (this.config.type === 'localStorage') {
      // localStorage is always available in browser
      this.isInitialized = true;
      return;
    }

    // TODO: Initialize other database types
    // if (this.config.type === 'postgresql') { ... }
    // if (this.config.type === 'mongodb') { ... }

    this.isInitialized = true;
  }

  // User Operations
  async createUser(userData: any): Promise<any> {
    await this.initialize();
    if (this.config.type === 'localStorage') {
      return this.localStorageCreateUser(userData);
    }
    // TODO: Implement for other databases
    throw new Error(`Database type ${this.config.type} not implemented`);
  }

  async getUser(userId: string): Promise<any | null> {
    await this.initialize();
    if (this.config.type === 'localStorage') {
      return this.localStorageGetUser(userId);
    }
    // TODO: Implement for other databases
    throw new Error(`Database type ${this.config.type} not implemented`);
  }

  async updateUser(userId: string, updates: any): Promise<boolean> {
    await this.initialize();
    if (this.config.type === 'localStorage') {
      return this.localStorageUpdateUser(userId, updates);
    }
    // TODO: Implement for other databases
    throw new Error(`Database type ${this.config.type} not implemented`);
  }

  async deleteUser(userId: string): Promise<boolean> {
    await this.initialize();
    if (this.config.type === 'localStorage') {
      return this.localStorageDeleteUser(userId);
    }
    // TODO: Implement for other databases
    throw new Error(`Database type ${this.config.type} not implemented`);
  }

  // Plan Operations
  async createPlan(planData: any): Promise<any> {
    await this.initialize();
    if (this.config.type === 'localStorage') {
      return this.localStorageCreatePlan(planData);
    }
    // TODO: Implement for other databases
    throw new Error(`Database type ${this.config.type} not implemented`);
  }

  async getPlans(userId: string, clientId?: string): Promise<any[]> {
    await this.initialize();
    if (this.config.type === 'localStorage') {
      return this.localStorageGetPlans(userId, clientId);
    }
    // TODO: Implement for other databases
    throw new Error(`Database type ${this.config.type} not implemented`);
  }

  async updatePlan(planId: string, updates: any): Promise<boolean> {
    await this.initialize();
    if (this.config.type === 'localStorage') {
      return this.localStorageUpdatePlan(planId, updates);
    }
    // TODO: Implement for other databases
    throw new Error(`Database type ${this.config.type} not implemented`);
  }

  // Payment Operations
  async createPayment(paymentData: any): Promise<any> {
    await this.initialize();
    if (this.config.type === 'localStorage') {
      return this.localStorageCreatePayment(paymentData);
    }
    // TODO: Implement for other databases
    throw new Error(`Database type ${this.config.type} not implemented`);
  }

  async getPayments(userId: string): Promise<any[]> {
    await this.initialize();
    if (this.config.type === 'localStorage') {
      return this.localStorageGetPayments(userId);
    }
    // TODO: Implement for other databases
    throw new Error(`Database type ${this.config.type} not implemented`);
  }

  // localStorage implementations (fallback)
  private localStorageCreateUser(userData: any): any {
    const users = JSON.parse(localStorage.getItem('db_users') || '[]');
    users.push({ ...userData, createdAt: new Date().toISOString() });
    localStorage.setItem('db_users', JSON.stringify(users));
    return userData;
  }

  private localStorageGetUser(userId: string): any | null {
    const users = JSON.parse(localStorage.getItem('db_users') || '[]');
    return users.find((u: any) => u.id === userId) || null;
  }

  private localStorageUpdateUser(userId: string, updates: any): boolean {
    const users = JSON.parse(localStorage.getItem('db_users') || '[]');
    const index = users.findIndex((u: any) => u.id === userId);
    if (index >= 0) {
      users[index] = { ...users[index], ...updates, updatedAt: new Date().toISOString() };
      localStorage.setItem('db_users', JSON.stringify(users));
      return true;
    }
    return false;
  }

  private localStorageDeleteUser(userId: string): boolean {
    const users = JSON.parse(localStorage.getItem('db_users') || '[]');
    const filtered = users.filter((u: any) => u.id !== userId);
    localStorage.setItem('db_users', JSON.stringify(filtered));
    
    // Also delete related data
    const plans = JSON.parse(localStorage.getItem('userPlans') || '[]');
    localStorage.setItem('userPlans', JSON.stringify(plans.filter((p: any) => p.userId !== userId)));
    
    const payments = JSON.parse(localStorage.getItem('userPayments') || '[]');
    localStorage.setItem('userPayments', JSON.stringify(payments.filter((p: any) => p.userId !== userId)));
    
    return true;
  }

  private localStorageCreatePlan(planData: any): any {
    const plans = JSON.parse(localStorage.getItem('userPlans') || '[]');
    plans.push({ ...planData, createdAt: new Date().toISOString() });
    localStorage.setItem('userPlans', JSON.stringify(plans));
    return planData;
  }

  private localStorageGetPlans(userId: string, clientId?: string): any[] {
    const plans = JSON.parse(localStorage.getItem('userPlans') || '[]');
    let filtered = plans.filter((p: any) => p.userId === userId);
    if (clientId) {
      filtered = filtered.filter((p: any) => p.clientId === clientId);
    }
    return filtered;
  }

  private localStorageUpdatePlan(planId: string, updates: any): boolean {
    const plans = JSON.parse(localStorage.getItem('userPlans') || '[]');
    const index = plans.findIndex((p: any) => p.id === planId);
    if (index >= 0) {
      plans[index] = { ...plans[index], ...updates, lastModified: new Date().toISOString() };
      localStorage.setItem('userPlans', JSON.stringify(plans));
      return true;
    }
    return false;
  }

  private localStorageCreatePayment(paymentData: any): any {
    const payments = JSON.parse(localStorage.getItem('userPayments') || '[]');
    payments.push({ ...paymentData, createdAt: new Date().toISOString() });
    localStorage.setItem('userPayments', JSON.stringify(payments));
    return paymentData;
  }

  private localStorageGetPayments(userId: string): any[] {
    const payments = JSON.parse(localStorage.getItem('userPayments') || '[]');
    return payments.filter((p: any) => p.userId === userId);
  }
}

// Export singleton instance
export const database = new DatabaseManager({
  type: process.env.DATABASE_TYPE === 'postgresql' ? 'postgresql' :
       process.env.DATABASE_TYPE === 'mongodb' ? 'mongodb' :
       'localStorage'
});

// Export for use in API routes
export default database;

