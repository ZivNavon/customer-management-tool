'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { customerApi, Customer } from '@/lib/api';
import { mockApi } from '@/lib/mockApi';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

interface Contact {
  id?: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  notes: string;
}

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer;
}

export function CustomerModal({ isOpen, onClose, customer }: CustomerModalProps) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    arr_usd: customer?.arr_usd || 0,
    notes: customer?.notes || '',
    logo_url: customer?.logo_url || '',
  });
  
  const [contacts, setContacts] = useState<Contact[]>(
    customer?.contacts && customer.contacts.length > 0 
      ? customer.contacts 
      : [{ name: '', title: '', email: '', phone: '', notes: '' }]
  );
  
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoSource, setLogoSource] = useState<'file' | 'url'>('url');

  // Update form data when customer prop changes (for editing)
  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        arr_usd: customer.arr_usd,
        notes: customer.notes || '',
        logo_url: customer.logo_url || '',
      });
      setContacts(
        customer.contacts && customer.contacts.length > 0 
          ? customer.contacts 
          : [{ name: '', title: '', email: '', phone: '', notes: '' }]
      );
    }
  }, [customer]);

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; logo_url?: string; arr_usd: number; notes?: string; contacts?: Contact[] }) => {
      try {
        return await customerApi.create(data);
      } catch (error) {
        console.log('Backend not available, using mock data');
        return await mockApi.customers.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      resetForm();
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Customer> }) => {
      try {
        return await customerApi.update(id, data);
      } catch (error) {
        console.log('Backend not available, using mock data');
        return await mockApi.customers.update(id, data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      resetForm();
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      contacts: contacts.filter(contact => 
        contact.name.trim() || contact.email.trim() || contact.phone.trim()
      )
    };
    
    if (customer) {
      updateMutation.mutate({ id: customer.id, data: submitData });
    } else {
      createMutation.mutate(submitData);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', arr_usd: 0, notes: '', logo_url: '' });
    setContacts([{ name: '', title: '', email: '', phone: '', notes: '' }]);
    setLogoFile(null);
    setLogoSource('url');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'arr_usd' ? parseFloat(value) || 0 : value,
    }));
  };

  const handleContactChange = (index: number, field: keyof Contact, value: string) => {
    setContacts(prev => prev.map((contact, i) => 
      i === index ? { ...contact, [field]: value } : contact
    ));
  };

  const addContact = () => {
    setContacts(prev => [...prev, { name: '', title: '', email: '', phone: '', notes: '' }]);
  };

  const removeContact = (index: number) => {
    if (contacts.length > 1) {
      setContacts(prev => prev.filter((_, i) => i !== index));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      // Create a local URL for preview
      const fileUrl = URL.createObjectURL(file);
      setFormData(prev => ({ ...prev, logo_url: fileUrl }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50" 
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            {customer ? t('Edit Customer') : t('action.addCustomer')}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              {t('customer.name')} *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              required
              value={formData.name}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label htmlFor="arr_usd" className="block text-sm font-medium text-gray-700">
              {t('customer.arr')} (USD)
            </label>
            <input
              type="number"
              id="arr_usd"
              name="arr_usd"
              min="0"
              step="1000"
              value={formData.arr_usd}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('customer.logo')}
            </label>
            <div className="space-y-3">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="logoSource"
                    value="url"
                    checked={logoSource === 'url'}
                    onChange={(e) => setLogoSource(e.target.value as 'file' | 'url')}
                    className="mr-2"
                  />
                  URL from Google
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="logoSource"
                    value="file"
                    checked={logoSource === 'file'}
                    onChange={(e) => setLogoSource(e.target.value as 'file' | 'url')}
                    className="mr-2"
                  />
                  Upload from Computer
                </label>
              </div>
              
              {logoSource === 'url' ? (
                <input
                  type="url"
                  id="logo_url"
                  name="logo_url"
                  placeholder="https://example.com/logo.png"
                  value={formData.logo_url}
                  onChange={handleChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              ) : (
                <input
                  type="file"
                  id="logo_file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              )}
            </div>
          </div>

          {/* Contacts Section */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Contacts
              </label>
              <button
                type="button"
                onClick={addContact}
                className="flex items-center px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-1" />
                Add Contact
              </button>
            </div>
            
            <div className="space-y-4">
              {contacts.map((contact, index) => (
                <div key={index} className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Contact {index + 1}</h4>
                    {contacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeContact(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Name</label>
                      <input
                        type="text"
                        value={contact.name}
                        onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Title</label>
                      <input
                        type="text"
                        value={contact.title}
                        onChange={(e) => handleContactChange(index, 'title', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Email</label>
                      <input
                        type="email"
                        value={contact.email}
                        onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600">Phone</label>
                      <input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) => handleContactChange(index, 'phone', e.target.value)}
                        className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600">Notes</label>
                    <textarea
                      value={contact.notes}
                      onChange={(e) => handleContactChange(index, 'notes', e.target.value)}
                      rows={2}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              {t('customer.notes')}
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {t('action.cancel')}
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : t('action.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
