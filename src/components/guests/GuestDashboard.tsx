'use client';

import { Guest } from '@/api/guest';
import { useGuests } from '@/hooks/useGuest';
import { classNames } from '@/lib/utils';
import {
  Avatar,
  Badge,
  Button,
  Card,
  CardBody,
  Chip,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownSection,
  DropdownTrigger,
  Input,
  Pagination,
  Skeleton,
} from '@heroui/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  Clock,
  Filter,
  Grid,
  Info,
  List,
  Mail,
  Phone,
  Plus,
  Search,
  User,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRestaurant } from '../providers/RestaurantProvider';
import AddGuestModal from './AddGuestModal';
import GuestDetailView from './GuestDetailView';

// Available tags for filtering
const availableTags = ['VIP', 'Regular', 'First-time', 'Vegetarian', 'Birthday'];

// Define the ColorType based on HeroUI Chip props
type ChipColorType = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'danger';

// Define tag color mapping
const getTagColor = (tag: string): ChipColorType => {
  const colorMap: Record<string, ChipColorType> = {
    VIP: 'warning',
    Regular: 'primary',
    'First-time': 'success',
    Vegetarian: 'secondary',
    Birthday: 'danger',
  };

  return colorMap[tag] || 'default';
};

export default function GuestDashboard() {
  const { currentRestaurant } = useRestaurant();
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [filteredGuests, setFilteredGuests] = useState<Guest[]>([]);
  const [isTagsDropdownOpen, setIsTagsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Fetch guests using React Query
  console.log('restaurantId', currentRestaurant?.id);
  const { data: guests, isLoading, isError, error } = useGuests(currentRestaurant?.id as string);

  // Filter guests based on search query and tags
  useEffect(() => {
    if (!guests) {
      setFilteredGuests([]);
      return;
    }

    let result = [...guests];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (guest) =>
          guest.name.toLowerCase().includes(query) ||
          (guest.email?.toLowerCase() || '').includes(query) ||
          guest.phone.toLowerCase().includes(query)
      );
    }

    if (selectedTags.length > 0) {
      result = result.filter((guest) => selectedTags.some((tag) => guest.tags.includes(tag)));
    }

    setFilteredGuests(result);
    setCurrentPage(1);
  }, [searchQuery, selectedTags, guests]);

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedTags([]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const paginatedGuests = filteredGuests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredGuests.length / itemsPerPage);

  // If a guest is selected, show detailed view
  if (selectedGuest) {
    return <GuestDetailView guest={selectedGuest} onBack={() => setSelectedGuest(null)} />;
  }

  return (
    <div className="space-y-6">
      {/* Header with title and add button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
            Guest Management
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your restaurant's guest database
          </p>
        </div>
        <Button
          color="success"
          size="md"
          radius="sm"
          endContent={<Plus className="h-4 w-4" />}
          onClick={() => setIsAddModalOpen(true)}
          className="font-medium self-start sm:self-auto text-white"
        >
          Add Guest
        </Button>
      </div>

      {/* Search and filter controls */}
      <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
        <CardBody className="p-4">
          <div className="grid gap-4 sm:grid-cols-[1fr,auto,auto]">
            <div className="relative">
              <Input
                fullWidth
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search guests by name, email, or phone..."
                startContent={<Search className="h-4 w-4 text-gray-400 flex-shrink-0" />}
                endContent={
                  searchQuery ? (
                    <button onClick={() => setSearchQuery('')}>
                      <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                    </button>
                  ) : null
                }
                radius="sm"
                variant="bordered"
                className="min-w-0"
              />
            </div>

            <Dropdown
              isOpen={isTagsDropdownOpen}
              onOpenChange={setIsTagsDropdownOpen}
              classNames={{
                content: 'p-0 border border-gray-200 dark:border-gray-700 shadow-sm',
              }}
            >
              <DropdownTrigger>
                <Button
                  variant="bordered"
                  radius="sm"
                  endContent={
                    selectedTags.length > 0 ? (
                      <Badge content={selectedTags.length} color="primary" size="sm">
                        <span className="sr-only">Selected tags</span>
                      </Badge>
                    ) : null
                  }
                  startContent={<Filter className="h-4 w-4" />}
                >
                  Filter Tags
                </Button>
              </DropdownTrigger>
              <DropdownMenu
                aria-label="Filter by tags"
                closeOnSelect={false}
                className="p-0"
                disallowEmptySelection
                selectionMode="multiple"
                selectedKeys={new Set(selectedTags)}
                onAction={(key) => {
                  if (key === 'clear') {
                    clearFilters();
                  }
                }}
                onSelectionChange={(keys) => {
                  const keysArray = Array.from(keys as Set<string>);
                  if (!keysArray.includes('header') && !keysArray.includes('clear')) {
                    setSelectedTags(keysArray);
                  }
                }}
              >
                <DropdownItem
                  key="header"
                  className="border-b border-gray-200 dark:border-gray-700"
                  isReadOnly
                >
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium">Filter by Tags</span>
                    {selectedTags.length > 0 && (
                      <Button
                        size="sm"
                        variant="light"
                        color="primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearFilters();
                        }}
                      >
                        Clear
                      </Button>
                    )}
                  </div>
                </DropdownItem>

                <DropdownSection aria-label="Available Tags">
                  {/* Generate dropdown items from availableTags array */}
                  {availableTags.map((tag) => (
                    <DropdownItem key={tag} className="py-2" textValue={tag}>
                      <div className="flex items-center gap-2">
                        <Chip size="sm" variant="flat" color={getTagColor(tag)}>
                          {tag}
                        </Chip>
                      </div>
                    </DropdownItem>
                  ))}
                </DropdownSection>
              </DropdownMenu>
            </Dropdown>

            <div className="bg-gray-100 dark:bg-gray-800 rounded-md flex items-center">
              <Button
                isIconOnly
                variant={view === 'grid' ? 'solid' : 'flat'}
                color={view === 'grid' ? 'success' : 'default'}
                onClick={() => setView('grid')}
                radius="none"
                className={`rounded-l-md ${view === 'grid' ? 'text-white' : ''}`}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                isIconOnly
                variant={view === 'list' ? 'solid' : 'flat'}
                color={view === 'list' ? 'success' : 'default'}
                onClick={() => setView('list')}
                radius="none"
                className={`rounded-r-md ${view === 'list' ? 'text-white' : ''}`}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Empty state */}
      {!isLoading && filteredGuests.length === 0 && (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardBody className="py-16 flex flex-col items-center justify-center text-center">
            <div className="mb-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-full">
              <User className="h-10 w-10 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No guests found
            </h3>
            <p className="max-w-md text-gray-500 dark:text-gray-400">
              {searchQuery || selectedTags.length > 0
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Add your first guest to get started with managing your restaurant's guests."}
            </p>
            {(searchQuery || selectedTags.length > 0) && (
              <Button onClick={clearFilters} className="mt-4" variant="flat" radius="sm">
                Clear filters
              </Button>
            )}
          </CardBody>
        </Card>
      )}

      {/* Loading state */}
      {isLoading && (
        <div
          className={
            view === 'grid'
              ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6'
              : ''
          }
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <Card
              key={index}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm h-full"
            >
              <CardBody className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex gap-3 items-center">
                    <Skeleton className="rounded-full w-10 h-10" />
                    <div>
                      <Skeleton className="w-24 h-4 rounded-lg mb-2" />
                      <Skeleton className="w-32 h-3 rounded-lg" />
                    </div>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <Skeleton className="w-full h-8 rounded-lg" />
                  <Skeleton className="w-full h-8 rounded-lg" />
                </div>
                <div className="space-y-2 border-t pt-3 mt-2">
                  <div className="flex gap-2">
                    <Skeleton className="w-16 h-6 rounded-full" />
                    <Skeleton className="w-20 h-6 rounded-full" />
                  </div>
                  <Skeleton className="w-full h-3 rounded-lg" />
                  <Skeleton className="w-2/3 h-3 rounded-lg" />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Error state with improved details */}
      {isError && (
        <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm">
          <CardBody className="py-12 flex flex-col items-center justify-center text-center">
            <div className="mb-4 p-4 bg-danger-50 dark:bg-danger-900/30 rounded-full">
              <AlertTriangle className="h-10 w-10 text-danger-500 dark:text-danger-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              Failed to load guests
            </h3>
            <p className="max-w-md text-gray-500 dark:text-gray-400 mb-6">
              {error instanceof Error
                ? error.message
                : 'An unexpected error occurred while fetching the guest list. Please check your network connection and try again.'}
            </p>
            <div className="flex gap-3">
              <Button
                color="default"
                variant="flat"
                radius="sm"
                onPress={() => window.history.back()}
              >
                Go Back
              </Button>
              <Button
                color="success"
                radius="sm"
                onPress={() => {
                  // Refetch the guests
                  window.location.reload();
                }}
                className="text-white"
              >
                Try Again
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Grid View */}
      {!isLoading && view === 'grid' && filteredGuests.length > 0 && (
        <motion.div layout className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {paginatedGuests.map((guest) => {
                return (
                  <motion.div
                    key={guest.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    <Card
                      isPressable
                      onPress={() => setSelectedGuest(guest)}
                      className={classNames(
                        'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm h-full w-full transition-all duration-200 hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800 overflow-hidden group'
                      )}
                    >
                      {/* Card header with gradient overlay */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-primary-50/30 to-transparent dark:from-primary-900/20 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="p-5 flex justify-between items-start relative z-10">
                          <div className="flex gap-3 items-center">
                            <Avatar
                              name={guest.name}
                              className="bg-primary-100 text-primary-500 dark:bg-primary-900/30 dark:text-primary-400 group-hover:scale-105 transition-transform duration-300"
                              size="md"
                              isBordered
                              color="primary"
                            />
                            <div>
                              <h3 className="text-base font-medium text-gray-900 dark:text-gray-100 line-clamp-1">
                                {guest.name}
                              </h3>
                              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                                <Clock className="inline-block h-3.5 w-3.5 mr-1 text-gray-400 dark:text-gray-500" />
                                {guest.lastVisit
                                  ? new Date(guest.lastVisit).toLocaleDateString()
                                  : 'No visits yet'}
                              </div>
                            </div>
                          </div>
                          {guest.tags.includes('VIP') && (
                            <Chip
                              size="sm"
                              color="warning"
                              variant="flat"
                              className="group-hover:shadow-sm transition-shadow"
                            >
                              VIP
                            </Chip>
                          )}
                        </div>
                      </div>

                      {/* Card content with contact info */}
                      <div className="px-5 py-3 space-y-3 flex-grow">
                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 p-2 pl-0 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 rounded-md transition-colors duration-300">
                          <Phone className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors duration-300" />
                          <span className="truncate">{guest.phone}</span>
                        </div>

                        <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 p-2 pl-0 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 rounded-md transition-colors duration-300">
                          <Mail className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors duration-300" />
                          <span className="truncate">{guest.email || 'No email'}</span>
                        </div>
                      </div>

                      {/* Card footer with tags and info */}
                      <div className="p-5 pt-2 mt-auto border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30 group-hover:bg-gray-50 dark:group-hover:bg-gray-800/50 transition-colors duration-300 flex flex-col">
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {guest.tags
                            .filter((tag) => tag !== 'VIP')
                            .map((tag) => (
                              <Chip
                                key={tag}
                                size="sm"
                                variant="flat"
                                color={getTagColor(tag)}
                                className="group-hover:scale-105 transition-transform duration-200"
                              >
                                {tag}
                              </Chip>
                            ))}
                          {guest.tags.filter((tag) => tag !== 'VIP').length === 0 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500 italic">
                              No additional tags
                            </span>
                          )}
                        </div>

                        {guest.notes && (
                          <div className="flex items-start mb-3">
                            <Info className="flex-shrink-0 h-4 w-4 text-gray-400 dark:text-gray-500 mt-0.5 mr-2 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors duration-300" />
                            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors duration-300">
                              {guest.notes}
                            </p>
                          </div>
                        )}

                        <div className="flex justify-between items-center mt-auto pt-2">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <Button
                              size="sm"
                              variant="light"
                              color="primary"
                              className="px-2 py-1 min-w-0 h-auto font-normal"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGuest(guest);
                              }}
                              isIconOnly
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </div>
                          <Badge
                            color="primary"
                            variant="flat"
                            size="sm"
                            className="ml-auto group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors duration-300"
                          >
                            {guest.visitCount} {guest.visitCount === 1 ? 'visit' : 'visits'}
                          </Badge>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                total={totalPages}
                initialPage={1}
                page={currentPage}
                onChange={handlePageChange}
                showControls
                showShadow
                color="primary"
                radius="sm"
                size="sm"
              />
            </div>
          )}
        </motion.div>
      )}

      {/* List View */}
      {!isLoading && view === 'list' && filteredGuests.length > 0 && (
        <motion.div layout className="space-y-6">
          <Card className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                  <tr>
                    <th
                      scope="col"
                      className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 dark:text-gray-100 sm:pl-6"
                    >
                      Guest
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                    >
                      Contact
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                    >
                      Tags
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                    >
                      Last Visit
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-gray-100"
                    >
                      Visits
                    </th>
                    <th
                      scope="col"
                      className="px-3 py-3.5 text-right text-sm font-semibold text-gray-900 dark:text-gray-100"
                    >
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                  <AnimatePresence mode="wait">
                    {paginatedGuests.map((guest) => {
                      return (
                        <motion.tr
                          key={guest.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => setSelectedGuest(guest)}
                          className={classNames(
                            'cursor-pointer hover:bg-gray-50/80 dark:hover:bg-gray-700/20 transition-colors group relative'
                          )}
                        >
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center gap-3">
                              <Avatar
                                name={guest.name}
                                className="bg-primary-100 text-primary-500 dark:bg-primary-900/30 dark:text-primary-400 group-hover:scale-105 transition-transform"
                                size="sm"
                                isBordered={guest.tags.includes('VIP')}
                                color="primary"
                              />
                              <div>
                                <div className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                  {guest.name}
                                  {guest.tags.includes('VIP') && (
                                    <Chip
                                      size="sm"
                                      color="warning"
                                      variant="flat"
                                      className="group-hover:shadow-sm transition-shadow"
                                    >
                                      VIP
                                    </Chip>
                                  )}
                                </div>
                                <div className="text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors max-w-xs">
                                  {guest.notes
                                    ? guest.notes.length > 30
                                      ? guest.notes.substring(0, 30) + '...'
                                      : guest.notes
                                    : 'No notes'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="flex flex-col gap-1.5">
                              <div className="flex items-center group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                <Phone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" />
                                <span>{guest.phone}</span>
                              </div>
                              <div className="flex items-center group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                                <Mail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors" />
                                <span>{guest.email || 'No email'}</span>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              <Clock className="inline-block h-3.5 w-3.5 mr-1 text-gray-400 dark:text-gray-500" />
                              {guest.lastVisit
                                ? new Date(guest.lastVisit).toLocaleDateString()
                                : 'No visits yet'}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 dark:text-gray-400">
                            <Badge
                              color="primary"
                              variant="flat"
                              size="sm"
                              className="group-hover:bg-primary-100 dark:group-hover:bg-primary-900/30 transition-colors"
                            >
                              {guest.visitCount}
                            </Badge>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-right">
                            <div className="flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="light"
                                color="primary"
                                className="min-w-0 h-8 w-8 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedGuest(guest);
                                }}
                                isIconOnly
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <Pagination
                total={totalPages}
                initialPage={1}
                page={currentPage}
                onChange={handlePageChange}
                showControls
                showShadow
                color="primary"
                radius="sm"
                size="sm"
              />
            </div>
          )}
        </motion.div>
      )}

      {/* Add Guest Modal */}
      <AnimatePresence mode="wait">
        {isAddModalOpen && (
          <AddGuestModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
