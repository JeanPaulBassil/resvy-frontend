'use client';

import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Tab,
  Tabs,
} from '@heroui/react';
import debounce from 'lodash/debounce';
import { useCallback, useEffect, useState, useMemo } from 'react';

import Table from '@/components/shared/Table';
import { Client, useClients } from '@/hooks/useClients';
import { Check, Search, UserCheck, UserX, X } from 'lucide-react';

export function ClientsList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [isMockData, setIsMockData] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isAllowModalOpen, setIsAllowModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all');

  // Create query parameters for the API
  const queryParams = {
    page: currentPage.toString(),
    limit: pageSize.toString(),
    role: 'USER', // Only fetch users with role USER
    ...(searchTerm ? { search: searchTerm } : {}),
    ...(activeTab === 'allowed' ? { isAllowed: 'true' } : {}),
    ...(activeTab === 'pending' ? { isAllowed: 'false' } : {}),
  };

  const { 
    apiResponse,
    isLoading, 
    error, 
    updateMutation,
  } = useClients(queryParams);

  // Memoize data and meta to prevent unnecessary re-renders
  const data = useMemo(() => apiResponse?.payload || [], [apiResponse]);
  const meta = useMemo(() => apiResponse?.meta, [apiResponse]);
  const isUpdateLoading = updateMutation.isPending;

  // Log data to verify isAllowed status
  useEffect(() => {
    if (data && data.length > 0) {
      console.log('Client data with isAllowed status:', data);
    }
  }, [data]);

  console.log('data', data);
  // Helper function to update a client's allowed status
  const updateClientAllowedStatus = async (id: string, isAllowed: boolean) => {
    return await updateMutation.mutateAsync({ id, data: { isAllowed } });
  };

  // Check if we're using mock data
  useEffect(() => {
    // If we have data and the first item has id '1', it's likely mock data
    if (data && data.length > 0 && data[0].id === '1' && data[0].email === 'client1@example.com') {
      setIsMockData(true);
    } else {
      setIsMockData(false);
    }
  }, [data]);

  // Reset to first page when changing tabs
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Open allow/disallow confirmation modal
  const handleAllowClick = (client: Client) => {
    setSelectedClient(client);
    setIsAllowModalOpen(true);
  };

  // Confirm allow/disallow
  const handleConfirmAllowChange = async () => {
    if (selectedClient) {
      try {
        const newStatus = !selectedClient.isAllowed;
        await updateClientAllowedStatus(selectedClient.id, newStatus);
        
        // Close the modal after successful update
        setIsAllowModalOpen(false);
      } catch (error: unknown) {
        console.error('Error updating client status:', error);
        // The error toast will be handled by the mutation
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
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'createdAt', label: 'Created At' },
    { key: 'actions', label: 'Actions' },
  ] as const;

  // Transform the data to match the Row type expected by the shared Table
  const rows = data
    ? data.map((clientItem: Client) => {
        return {
          id: Number(clientItem.id) || parseInt(clientItem.id, 10) || Math.random() * 1000,
          name: clientItem.name || '-',
          email: clientItem.email,
          status: (
            <Chip
              color={clientItem.isAllowed ? 'success' : 'warning'}
              variant="flat"
              startContent={clientItem.isAllowed ? <Check size={14} /> : <X size={14} />}
            >
              {clientItem.isAllowed ? 'Allowed' : 'Pending Approval'}
            </Chip>
          ),
          createdAt: new Date(clientItem.createdAt).toLocaleDateString(),
          actions: [
            {
              label: clientItem.isAllowed ? 'Disallow' : 'Allow',
              icon: clientItem.isAllowed ? <UserX size={18} /> : <UserCheck size={18} />,
              tooltipColor: clientItem.isAllowed ? ('danger' as const) : ('success' as const),
              onClick: () => handleAllowClick(clientItem),
            },
          ],
        };
      })
    : [];

  if (error) {
    return (
      <Card>
        <CardBody className="pt-6">
          <div className="text-red-500">Error loading clients. Please try refreshing the page.</div>
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
            You are currently viewing demo data because you are not authenticated or don't have
            permission to access this resource.
          </p>
          <p>
            <strong>What this means:</strong> You can still use all features, but changes will only
            be saved locally and will be lost when you refresh the page.
            {window.location.pathname.includes('/admin') && (
              <span> To use real data, please ensure you're logged in with an admin account.</span>
            )}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-4">
        <Tabs
          selectedKey={activeTab}
          onSelectionChange={(key) => setActiveTab(key as string)}
          variant="underlined"
          color="primary"
          className="mb-2"
        >
          <Tab key="all" title="All Users" />
          <Tab key="allowed" title="Allowed Users" />
          <Tab key="pending" title="Pending Approval" />
        </Tabs>

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
          <div className="relative w-full md:w-64 order-2 md:order-1">
            <Input
              placeholder="Search clients..."
              radius="sm"
              onChange={handleSearchChange}
              startContent={<Search size={18} className="text-gray-400" />}
              className="w-full"
            />
          </div>
        </div>

        <Table
          columns={columns}
          rows={rows}
          isLoading={isLoading}
          currentPage={currentPage}
          setPage={setCurrentPage}
          totalPages={meta?.total ? Math.ceil(meta.total / pageSize) : 1}
          ariaLabel="Clients table"
          emptyContent={
            activeTab === 'pending'
              ? 'No users pending approval.'
              : activeTab === 'allowed'
                ? 'No allowed users found.'
                : 'No clients found.'
          }
        />
      </div>

      {/* Allow/Disallow Confirmation Modal */}
      <Modal isOpen={isAllowModalOpen} onClose={() => setIsAllowModalOpen(false)} radius="sm">
        <ModalContent>
          <ModalHeader>
            {selectedClient && selectedClient.isAllowed ? 'Disallow Client' : 'Allow Client'}
          </ModalHeader>
          <ModalBody>
            <p>
              Are you sure you want to{' '}
              {selectedClient && selectedClient.isAllowed ? 'disallow' : 'allow'} the client{' '}
              <strong>{selectedClient?.email}</strong>?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {selectedClient && selectedClient.isAllowed
                ? 'This client will no longer be able to access the system and will be logged out immediately if currently using the application.'
                : 'This client will be able to access the system after approval.'}
            </p>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="flat"
              color="danger"
              onClick={() => setIsAllowModalOpen(false)}
              disabled={isUpdateLoading}
            >
              Cancel
            </Button>
            <Button
              color={selectedClient && selectedClient.isAllowed ? 'danger' : 'success'}
              onClick={handleConfirmAllowChange}
              isLoading={isUpdateLoading}
            >
              Confirm
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
