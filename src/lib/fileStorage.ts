// File storage utilities for exporting/importing customer data
import { Customer } from './api';

export interface CustomerExportData {
  customers: Customer[];
  exportDate: string;
  version: string;
}

// Export customers to a downloadable JSON file
export const exportCustomersToFile = (customers: Customer[]) => {
  const exportData: CustomerExportData = {
    customers,
    exportDate: new Date().toISOString(),
    version: '1.0'
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataBlob = new Blob([dataStr], { type: 'application/json' });
  
  const url = URL.createObjectURL(dataBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `customers-backup-${new Date().toISOString().split('T')[0]}.json`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};

// Import customers from a JSON file
export const importCustomersFromFile = (): Promise<Customer[]> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const importData: CustomerExportData = JSON.parse(content);
          
          if (!importData.customers || !Array.isArray(importData.customers)) {
            reject(new Error('Invalid file format'));
            return;
          }
          
          resolve(importData.customers);
        } catch (error) {
          reject(new Error('Failed to parse JSON file'));
        }
      };
      
      reader.readAsText(file);
    };
    
    input.click();
  });
};

// Auto-backup functionality - saves to downloads folder
export const createAutoBackup = (customers: Customer[]) => {
  if (customers.length > 0) {
    exportCustomersToFile(customers);
  }
};

// Validate imported customer data
export const validateCustomerData = (customers: unknown[]): customers is Customer[] => {
  return customers.every(customer => 
    customer &&
    typeof customer === 'object' &&
    'id' in customer &&
    'name' in customer &&
    'arr_usd' in customer &&
    typeof (customer as Customer).arr_usd === 'number' &&
    'created_at' in customer &&
    'updated_at' in customer
  );
};
