'use client';

import { Button, Card, CardBody, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Input, Textarea, useDisclosure, addToast } from '@heroui/react';
import { useState, useEffect, useCallback } from 'react';
import debounce from 'lodash/debounce';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import Table from '@/components/shared/Table';
import { useAllowedEmails, AllowedEmail } from '@/hooks/useAllowedEmails';
import { Pen, Pencil, Plus, Trash, Search } from 'lucide-react';

// Define the validation schema using Zod
const allowedEmailSchema = z.object({
  id: z.string().optional(),
  email: z.string().email('Please enter a valid email address'),
  description: z.string().optional(),
});

// Infer the TypeScript type from the schema
type AllowedEmailFormValues = z.infer<typeof allowedEmailSchema>;

export function AllowedEmailList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMockData, setIsMockData] = useState(false);
  
  // Create query parameters for the API
  const queryParams = {
    page: currentPage.toString(),
    limit: pageSize.toString(),
    ...(searchTerm ? { search: searchTerm } : {}),
  };
  
  const { 
    data, 
    meta, 
    isLoading, 
    error, 
    addAllowedEmail, 
    updateAllowedEmail, 
    deleteAllowedEmail, 
    isAddLoading, 
    isUpdateLoading, 
    isDeleteLoading 
  } = useAllowedEmails(queryParams);
  
  // Check if we're using mock data
  useEffect(() => {
    // If we have data and the first item has id '1', it's likely mock data
    if (data && data.length > 0 && data[0].id === '1' && data[0].email === 'admin@example.com') {
      setIsMockData(true);
    } else {
      setIsMockData(false);
    }
  }, [data]);
  
  // Initialize React Hook Form
  const { 
    control, 
    handleSubmit: hookFormSubmit, 
    reset, 
    formState: { errors } 
  } = useForm<AllowedEmailFormValues>({
    resolver: zodResolver(allowedEmailSchema),
    defaultValues: {
      id: '',
      email: '',
      description: '',
    }
  });
  
  const [selectedEmail, setSelectedEmail] = useState<AllowedEmail | null>(null);
  
  // Open modal for adding new email
  const handleAddClick = () => {
    setSelectedEmail(null);
    reset({ id: '', email: '', description: '' });
    onOpen();
  };
  
  // Open modal for editing email
  const handleEditClick = (email: AllowedEmail) => {
    setSelectedEmail(email);
    reset({
      id: email.id,
      email: email.email,
      description: email.description || '',
    });
    onOpen();
  };
  
  // Open delete confirmation modal
  const handleDeleteClick = (email: AllowedEmail) => {
    setSelectedEmail(email);
    setIsDeleteModalOpen(true);
  };
  
  // Submit form for add/edit
  const onSubmit = async (data: AllowedEmailFormValues) => {
    try {
      if (data.id) {
        // Update existing email
        await updateAllowedEmail(data.id, {
          email: data.email,
          description: data.description
        });
        addToast({
          title: "Email Updated",
          description: `${data.email} has been successfully updated.`,
          color: "success",
          timeout: 3000,
        });
      } else {
        // Add new email
        await addAllowedEmail(data.email, data.description);
        addToast({
          title: "Email Added",
          description: `${data.email} has been successfully added.`,
          color: "success",
          timeout: 3000,
        });
      }
      onClose();
    } catch (error) {
      console.error('Error saving email:', error);
      addToast({
        title: "Operation Failed",
        description: `There was an error processing your request. Please try again.`,
        color: "danger",
        timeout: 5000,
      });
    }
  };
  
  // Confirm delete
  const handleConfirmDelete = async () => {
    if (selectedEmail) {
      try {
        await deleteAllowedEmail(selectedEmail.id);
        setIsDeleteModalOpen(false);
        addToast({
          title: "Email Deleted",
          description: `${selectedEmail.email} has been successfully removed.`,
          color: "success",
          timeout: 3000,
        });
      } catch (error) {
        console.error('Error deleting email:', error);
        addToast({
          title: "Delete Failed",
          description: `There was an error deleting the email. Please try again.`,
          color: "danger",
          timeout: 5000,
        });
      }
    }
  };

  // Debounced search handler
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((value: string) => {
      setSearchTerm(value);
      setCurrentPage(1); // Reset to first page on new search
    }, 500),
    []
  );

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(e.target.value);
  };

  // Define columns for the shared Table component
  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'description', label: 'Description' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'actions', label: 'Actions' },
  ] as const;

  // Transform the data to match the Row type expected by the shared Table
  const rows = data
    ? data.map((emailItem: AllowedEmail) => ({
        id: Number(emailItem.id) || parseInt(emailItem.id, 10) || Math.random() * 1000,
        email: emailItem.email,
        description: emailItem.description || '-',
        createdAt: new Date(emailItem.createdAt).toLocaleDateString(),
        actions: [
          {
            label: 'Edit',
            icon: <Pen size={18} />,
            tooltipColor: 'primary' as const,
            onClick: () => handleEditClick(emailItem),
          },
          {
            label: 'Delete',
            icon: <Trash size={18} />,
            tooltipColor: 'danger' as const,
            onClick: () => handleDeleteClick(emailItem),
          },
        ],
      }))
    : [];

  if (error) {
    return (
      <Card>
        <CardBody className="pt-6">
          <div className="text-red-500">
            Error loading allowed emails. Please try refreshing the page.
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <>
      {isMockData && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded">
          <p className="font-bold">Using Demo Mode</p>
          <p className="mb-2">
            You are currently viewing demo data because you are not authenticated or don't have permission to access this resource.
          </p>
          <p>
            <strong>What this means:</strong> You can still use all features, but changes will only be saved locally and will be lost when you refresh the page.
            {window.location.pathname.includes('/admin') && (
              <span> To use real data, please ensure you're logged in with an admin account.</span>
            )}
          </p>
        </div>
      )}
    
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <div className="relative w-full md:w-64 order-2 md:order-1">
          <Input
            placeholder="Search emails..."
            radius="sm"
            onChange={handleSearchChange}
            startContent={<Search size={18} className="text-gray-400" />}
            className="w-full"
          />
        </div>
        
        <Button 
          onPress={handleAddClick} 
          color="success" 
          className="text-white order-1 md:order-2" 
          radius="sm" 
          startContent={<Plus size={18} />}
        >
          Add Email
        </Button>
      </div>

      <Table
        columns={columns}
        rows={rows}
        isLoading={isLoading}
        currentPage={currentPage}
        setPage={setCurrentPage}
        totalPages={meta?.total ? Math.ceil(meta.total / pageSize) : 1}
        ariaLabel="Allowed emails table"
        emptyContent="No allowed emails found. Add some emails to get started."
      />
      
      {/* Add/Edit Modal */}
      <Modal isOpen={isOpen} onClose={onClose} radius="sm" size='lg'>
        <ModalContent>
          <form onSubmit={hookFormSubmit(onSubmit)}>
            <ModalHeader>{selectedEmail ? 'Edit Email' : 'Add Email'}</ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email Address
                  </label>
                  <Controller
                    name="email"
                    control={control}
                    render={({ field }) => (
                      <Input
                        radius='sm'
                        id="email"
                        {...field}
                        placeholder="Enter email address"
                        type="email"
                        isInvalid={!!errors.email}
                        errorMessage={errors.email?.message}
                      />
                    )}
                  />
                </div>
                <div>
                  <label htmlFor="description" className="block text-sm font-medium mb-1">
                    Description (Optional)
                  </label>
                  <Controller
                    name="description"
                    control={control}
                    render={({ field }) => (
                      <Textarea
                        radius='sm'
                        id="description"
                        {...field}
                        placeholder="Enter a description"
                        rows={3}
                        isInvalid={!!errors.description}
                        errorMessage={errors.description?.message}
                      />
                    )}
                  />
                </div>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose} radius='sm' type="button">
                Cancel
              </Button>
              <Button 
                color="primary" 
                type="submit"
                isLoading={isAddLoading || isUpdateLoading}
                radius='sm'
                className='text-white'
                startContent={selectedEmail ? <Pencil size={18} /> : <Plus size={18} />}
              >
                {selectedEmail ? 'Update' : 'Add'}
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} radius='sm'>
        <ModalContent>
          <ModalHeader>Confirm Delete</ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to delete the email{' '}
              <strong>{selectedEmail?.email}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button 
              color="default" 
              radius='sm'
              variant="light" 
              onPress={() => setIsDeleteModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              color="danger" 
              radius='sm'
              onPress={handleConfirmDelete}
              isLoading={isDeleteLoading}
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
