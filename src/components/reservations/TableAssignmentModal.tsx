'use client';

import { AssignTableDto, Reservation } from '@/api/reservation';
import { useAssignTable } from '@/hooks/useReservation';
import { useTables } from '@/hooks/useTable';
import { TableStatus } from '@/types/table';
import { Button, Card, Chip, Spinner, Textarea } from '@heroui/react';
import { useEffect, useRef, useState } from 'react';
import FloorPlan from '../floor-plan/floor-plan';
import { useRestaurant } from '../providers/RestaurantProvider';

interface TableAssignmentModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
}

export default function TableAssignmentModal({
  reservation,
  onClose,
  onSuccess,
}: TableAssignmentModalProps) {
  const { currentRestaurant } = useRestaurant();
  const restaurantId = currentRestaurant?.id || '';
  const [selectedTable, setSelectedTable] = useState<string>(reservation.tableId || '');
  const [previousSelectedTable, setPreviousSelectedTable] = useState<string>(
    reservation.tableId || ''
  );
  const [notes, setNotes] = useState<string>(reservation.note || '');
  const floorPlanRef = useRef<HTMLDivElement>(null);

  // Get tables data
  const { data: tables = [], isLoading: isLoadingTables } = useTables(restaurantId);

  // Filter tables based on capacity
  const availableTables = tables.filter(
    (table) =>
      (table.status === TableStatus.AVAILABLE || table.id === reservation.tableId) &&
      table.capacity >= reservation.numberOfGuests
  );

  // Setup mutation
  const assignTableMutation = useAssignTable(reservation.id);

  // Update selectedTable when reservation changes
  useEffect(() => {
    if (reservation.tableId) {
      setSelectedTable(reservation.tableId);
      setPreviousSelectedTable(reservation.tableId);
    }
  }, [reservation.tableId]);

  // Handle table selection
  const handleTableSelection = (tableId: string) => {
    setSelectedTable(tableId === selectedTable ? '' : tableId);
  };

  // Handle table assignment
  const handleAssignTable = async () => {
    if (!selectedTable && !previousSelectedTable) {
      onClose();
      return;
    }

    const assignData: AssignTableDto = {
      tableId: selectedTable || null, // Pass null to remove table assignment
      notes: notes || undefined,
    };

    try {
      await assignTableMutation.mutateAsync(assignData);
      onSuccess();
    } catch (error) {
      console.error('Error assigning table:', error);
    }
  };

  if (isLoadingTables) {
    return (
      <div className="p-10 flex justify-center items-center">
        <Spinner size="lg" color="primary" />
      </div>
    );
  }

  const getSelectedTableDetails = () => {
    if (!selectedTable) return null;
    return tables.find((table) => table.id === selectedTable);
  };

  const selectedTableDetails = getSelectedTableDetails();

  return (
    <div className="flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-gray-500">Reservation for</span>
          <span className="text-sm font-semibold">
            {reservation.guest?.name || 'Unknown Guest'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Party Size:</span>
          <span className="text-sm font-semibold">{reservation.numberOfGuests} people</span>
        </div>
      </div>

      <div className="p-6 flex flex-col gap-6">
        <div className="bg-gray-50/80 dark:bg-gray-800/30 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Select a Table
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Click on a table in the floor plan to assign it to this reservation.
            {availableTables.length === 0 && (
              <span className="text-amber-600 block mt-1">
                No tables with sufficient capacity are currently available.
              </span>
            )}
          </p>

          <div
            ref={floorPlanRef}
            className="w-full h-[400px] border border-gray-200 dark:border-gray-700 rounded-lg mb-4 overflow-hidden"
          >
            <FloorPlan
              tables={tables}
              selectedTableIds={selectedTable ? [selectedTable] : []}
              onSelectTable={handleTableSelection}
              onUpdateTablePosition={() => {}}
              onEditTable={() => {}}
              onMergeTables={() => {}}
            />
          </div>

          {selectedTableDetails && (
            <Card className="p-3 bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-medium">
                    Selected Table: {selectedTableDetails.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    Capacity: {selectedTableDetails.capacity} people
                  </p>
                </div>
                <Chip
                  size="sm"
                  variant="flat"
                  color={
                    selectedTableDetails.status === TableStatus.AVAILABLE ? 'success' : 'warning'
                  }
                >
                  {selectedTableDetails.status.charAt(0) +
                    selectedTableDetails.status.slice(1).toLowerCase()}
                </Chip>
              </div>
            </Card>
          )}

          {!selectedTable && previousSelectedTable && (
            <div className="text-sm text-amber-600 mt-3">
              <p>You are about to remove the current table assignment.</p>
            </div>
          )}
        </div>

        <div>
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Notes (Optional)
          </h3>
          <Textarea
            placeholder="Add any special notes or requests for this table assignment"
            value={notes}
            onValueChange={setNotes}
            radius="sm"
            variant="flat"
            rows={3}
            classNames={{
              inputWrapper: 'bg-gray-50/50 dark:bg-gray-800/30 shadow-sm',
              input: 'text-sm',
            }}
          />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            variant="flat"
            radius="sm"
            onPress={onClose}
            disabled={assignTableMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            color="success"
            radius="sm"
            className="text-white"
            onPress={handleAssignTable}
            isLoading={assignTableMutation.isPending}
          >
            {assignTableMutation.isPending
              ? 'Assigning...'
              : !selectedTable && previousSelectedTable
                ? 'Remove Assignment'
                : 'Assign Table'}
          </Button>
        </div>
      </div>
    </div>
  );
}
