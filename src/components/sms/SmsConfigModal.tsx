'use client';

import React, { useState, useEffect } from 'react';
import {
  Modal,
  ModalContent,
  Button,
  Input,
  Switch,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Textarea,
  Progress,
  Tabs,
  Tab,
  Badge,
  Spacer,
} from '@heroui/react';
import { Icon } from '@iconify/react';
import { useToast } from '@/contexts/ToastContext';
import { useRestaurant } from '@/components/providers/RestaurantProvider';
import { smsApi } from '@/api/sms';

interface SmsConfig {
  enabled: boolean;
  username: string;
  password: string;
  senderId: string;
  confirmationEnabled: boolean;
  cancellationEnabled: boolean;
}

interface SmsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SmsConfigModal({
  isOpen,
  onClose,
  onSuccess,
}: SmsConfigModalProps) {
  const { currentRestaurant } = useRestaurant();
  const toast = useToast();
  
  const [config, setConfig] = useState<SmsConfig>({
    enabled: false,
    username: '',
    password: '',
    senderId: '',
    confirmationEnabled: true,
    cancellationEnabled: true,
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testNumber, setTestNumber] = useState('');
  const [testMessage, setTestMessage] = useState('Test message from your restaurant system');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState('setup');
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');

  // Load current SMS configuration
  useEffect(() => {
    if (isOpen && currentRestaurant?.id) {
      loadSmsConfig();
    }
  }, [isOpen, currentRestaurant]);

  const loadSmsConfig = async () => {
    if (!currentRestaurant?.id) return;

    try {
      setIsLoading(true);
      const response = await smsApi.getConfig(currentRestaurant.id);
      console.log("response", response);
      setConfig({
        enabled: response.enabled || false,
        username: response.username || '',
        password: response.password || '',
        senderId: response.senderId || '',
        confirmationEnabled: response.confirmationEnabled ?? true,
        cancellationEnabled: response.cancellationEnabled ?? true,
      });
      if (response.enabled && response.username && response.password) {
        setConnectionStatus('success');
      }
    } catch (error) {
      console.error('Failed to load SMS config:', error);
      
      if (error instanceof Error) {
        if (error.message.includes('401') || error.message.includes('403') || 
            error.message.includes('Unauthorized') || error.message.includes('Forbidden')) {
          console.warn('Authentication error in SMS config - using default config to prevent redirect');
          
          setConfig({
            enabled: false,
            username: '',
            password: '',
            senderId: '',
            confirmationEnabled: true,
            cancellationEnabled: true,
          });
          
          toast.error('Unable to load SMS configuration. Please check your permissions.');
          return;
        }
      }
      
      setConfig({
        enabled: false,
        username: '',
        password: '',
        senderId: '',
        confirmationEnabled: true,
        cancellationEnabled: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (config.enabled) {
      if (!config.username || !config.username.trim()) {
        newErrors.username = 'Username is required';
      }
      if (!config.password || !config.password.trim()) {
        newErrors.password = 'Password is required';
      }
      if (!config.senderId || !config.senderId.trim()) {
        newErrors.senderId = 'Sender ID is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!currentRestaurant?.id) return;

    try {
      setIsLoading(true);
      console.log('=== Frontend Save Debug ===');
      console.log('Current config state:', config);
      
      // Prepare the data to send to the API
      const configToSend = {
        enabled: config.enabled,
        username: config.username,
        password: config.password,
        senderId: config.senderId,
        confirmationEnabled: config.confirmationEnabled,
        cancellationEnabled: config.cancellationEnabled,
      };
      
      console.log('Data being sent to API:', {
        enabled: configToSend.enabled,
        username: configToSend.username ? '[REDACTED]' : 'EMPTY',
        password: configToSend.password ? '[REDACTED]' : 'EMPTY',
        senderId: configToSend.senderId,
        confirmationEnabled: configToSend.confirmationEnabled,
        cancellationEnabled: configToSend.cancellationEnabled,
      });
      
      const response = await smsApi.updateConfig(currentRestaurant.id, configToSend);
      console.log('Save response:', response);
      
      // Update local state with the saved configuration
      if (response) {
        setConfig({
          enabled: response.enabled || false,
          username: response.username || '',
          password: response.password || '',
          senderId: response.senderId || '',
          confirmationEnabled: response.confirmationEnabled ?? true,
          cancellationEnabled: response.cancellationEnabled ?? true,
        });
        
        // Update connection status if credentials are saved
        if (response.enabled && response.username && response.password) {
          setConnectionStatus('success');
        }
      }
      
      toast.success('SMS configuration saved successfully');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to save SMS config:', error);
      toast.error('Failed to save SMS configuration');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testNumber.trim()) {
      toast.error('Please enter a test phone number');
      return;
    }

    if (!currentRestaurant?.id) return;

    try {
      setIsTesting(true);
      setConnectionStatus('testing');
      
      const response = await smsApi.sendSms(currentRestaurant.id, {
        numbers: testNumber,
        message: testMessage,
        textType: 'text',
      });
      
      console.log('SMS Test Response:', response);
      
      // Check if the response indicates success
      if (response.success) {
        setConnectionStatus('success');
        toast.success(`✅ Test SMS sent successfully to ${testNumber}`);
      } else {
        setConnectionStatus('error');
        toast.error(`❌ Failed to send SMS: ${response.message || 'Unknown error'}`);
      }
    } catch (error: any) {
      console.error('Failed to send test SMS:', error);
      setConnectionStatus('error');
      
      // Provide more specific error messages
      let errorMessage = 'Failed to send test SMS';
      if (error.response?.status === 400) {
        errorMessage = 'Invalid SMS configuration or phone number';
      } else if (error.response?.status === 401) {
        errorMessage = 'SMS credentials are invalid';
      } else if (error.response?.status === 403) {
        errorMessage = 'SMS service not authorized';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(`❌ ${errorMessage}`);
    } finally {
      setIsTesting(false);
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'success': return 'success';
      case 'error': return 'danger';
      case 'testing': return 'warning';
      default: return 'default';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'success': return 'Connected';
      case 'error': return 'Connection Failed';
      case 'testing': return 'Testing...';
      default: return 'Not Connected';
    }
  };

  // Don't render modal if no restaurant is selected
  if (!currentRestaurant?.id) {
    return null;
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      size="full"
      scrollBehavior="inside"
      hideCloseButton={true}
      classNames={{
        base: "bg-gradient-to-br from-background to-default-50",
        backdrop: "bg-black/80 backdrop-blur-sm",
      }}
    >
      <ModalContent className="m-0 h-screen max-h-screen rounded-none">
        {(onClose) => (
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-divider bg-gradient-to-r from-primary-50 to-secondary-50">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 text-white shadow-lg">
                  <Icon icon="solar:smartphone-bold" className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    SMS Configuration
                  </h1>
                  <p className="text-default-600 text-lg">
                    Configure SMS notifications for {currentRestaurant.name}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Badge 
                  color={getConnectionStatusColor()} 
                  variant="flat" 
                  size="lg"
                  className="px-4 py-2"
                >
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'success' ? 'bg-success-500' :
                      connectionStatus === 'error' ? 'bg-danger-500' :
                      connectionStatus === 'testing' ? 'bg-warning-500 animate-pulse' :
                      'bg-default-400'
                    }`} />
                    {getConnectionStatusText()}
                  </div>
                </Badge>
                
                <Button
                  isIconOnly
                  variant="light"
                  size="lg"
                  onPress={onClose}
                  className="text-default-500 hover:text-default-700"
                >
                  <Icon icon="solar:close-circle-linear" className="h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex overflow-hidden">
              {/* Sidebar Navigation */}
              <div className="w-80 border-r border-divider bg-gradient-to-b from-default-50 to-default-100 p-6">
                <Tabs
                  selectedKey={activeTab}
                  onSelectionChange={(key) => setActiveTab(key as string)}
                  classNames={{
                    tabList: "gap-4 w-full flex-col",
                    tab: "h-16 justify-start px-6 data-[selected=true]:bg-primary-100 data-[selected=true]:text-primary-700",
                    tabContent: "group-data-[selected=true]:text-primary-700 text-left",
                  }}
                >
                  <Tab
                    key="setup"
                    title={
                      <div className="flex items-center gap-3">
                        <Icon icon="solar:settings-bold-duotone" className="h-5 w-5" />
                        <div>
                          <div className="font-semibold">Setup</div>
                          <div className="text-xs text-default-500">Configure credentials</div>
                        </div>
                      </div>
                    }
                  />
                  <Tab
                    key="test"
                    title={
                      <div className="flex items-center gap-3">
                        <Icon icon="solar:test-tube-bold-duotone" className="h-5 w-5" />
                        <div>
                          <div className="font-semibold">Test</div>
                          <div className="text-xs text-default-500">Send test messages</div>
                        </div>
                      </div>
                    }
                  />
                </Tabs>

                <Spacer y={8} />
              </div>

              {/* Main Content */}
              <div className="flex-1 p-8 overflow-y-auto">
                {activeTab === 'setup' && (
                  <div className="max-w-4xl mx-auto space-y-8">
                    {/* Service Toggle */}
                    <Card className="border-none shadow-lg bg-gradient-to-br from-white to-default-50">
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-success-100 to-success-200">
                              <Icon icon="solar:power-bold" className="h-6 w-6 text-success-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold">SMS Service</h3>
                              <p className="text-default-600">Enable SMS notifications for your restaurant</p>
                            </div>
                          </div>
                          <Switch
                            isSelected={config.enabled}
                            onValueChange={(enabled) => 
                              setConfig(prev => ({ ...prev, enabled }))
                            }
                            color="success"
                            size="lg"
                            classNames={{
                              wrapper: "group-data-[selected=true]:bg-gradient-to-r group-data-[selected=true]:from-success-400 group-data-[selected=true]:to-success-600"
                            }}
                          />
                        </div>
                      </CardHeader>
                    </Card>

                    {/* Credentials Section */}
                    {config.enabled && (
                      <Card className="border-none shadow-lg bg-gradient-to-br from-white to-default-50">
                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200">
                              <Icon icon="solar:key-bold" className="h-6 w-6 text-primary-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold">SMS Service Credentials</h3>
                              <p className="text-default-600">Enter your SMS service account details</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardBody className="space-y-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input
                              label="Username"
                              placeholder="Enter your SMS service username"
                              value={config.username}
                              onValueChange={(value) =>
                                setConfig(prev => ({ ...prev, username: value }))
                              }
                              isInvalid={!!errors.username}
                              errorMessage={errors.username}
                              startContent={
                                <Icon icon="solar:user-bold" className="text-primary-400" />
                              }
                              classNames={{
                                input: "text-base",
                                inputWrapper: "h-12 bg-default-50 border-2 border-transparent data-[focus=true]:border-primary-300",
                                label: "text-sm font-medium"
                              }}
                            />
                            
                            <Input
                              label="Password"
                              placeholder="Enter your SMS service password"
                              type="password"
                              value={config.password}
                              onValueChange={(value) =>
                                setConfig(prev => ({ ...prev, password: value }))
                              }
                              isInvalid={!!errors.password}
                              errorMessage={errors.password}
                              startContent={
                                <Icon icon="solar:lock-password-bold" className="text-primary-400" />
                              }
                              classNames={{
                                input: "text-base",
                                inputWrapper: "h-12 bg-default-50 border-2 border-transparent data-[focus=true]:border-primary-300",
                                label: "text-sm font-medium"
                              }}
                            />
                          </div>
                          
                          <Input
                            label="Sender ID"
                            placeholder="Enter approved sender ID"
                            value={config.senderId}
                            onValueChange={(value) =>
                              setConfig(prev => ({ ...prev, senderId: value }))
                            }
                            isInvalid={!!errors.senderId}
                            errorMessage={errors.senderId}
                            startContent={
                              <Icon icon="solar:card-bold" className="text-primary-400" />
                            }
                            classNames={{
                              input: "text-base",
                              inputWrapper: "h-12 bg-default-50 border-2 border-transparent data-[focus=true]:border-primary-300",
                              label: "text-sm font-medium"
                            }}
                          />
                        </CardBody>
                      </Card>
                    )}

                    {/* Notification Settings */}
                    {config.enabled && (
                      <Card className="border-none shadow-lg bg-gradient-to-br from-white to-default-50 relative overflow-hidden">
                        {/* Coming Soon Overlay */}
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center">
                          <div className="text-center p-8">
                            <div className="p-4 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                              <Icon icon="solar:hourglass-bold-duotone" className="h-10 w-10 text-primary-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-primary-700 mb-2">Coming Soon</h3>
                            <p className="text-default-600 max-w-sm">
                              Individual SMS notification controls are currently under development. 
                              All SMS notifications are currently enabled by default.
                            </p>
                            <div className="mt-4 px-4 py-2 bg-primary-50 rounded-lg border border-primary-200">
                              <p className="text-sm text-primary-700 font-medium">
                                ✨ Feature launching soon!
                              </p>
                            </div>
                          </div>
                        </div>

                        <CardHeader className="pb-4">
                          <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-secondary-100 to-secondary-200">
                              <Icon icon="solar:notification-bold" className="h-6 w-6 text-secondary-600" />
                            </div>
                            <div>
                              <h3 className="text-xl font-semibold">Notification Settings</h3>
                              <p className="text-default-600">Choose which SMS notifications to send</p>
                            </div>
                          </div>
                        </CardHeader>
                        <CardBody className="space-y-6">
                          <div className="space-y-4">
                            {/* Confirmation SMS Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-default-50 border border-default-200">
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-success-100">
                                  <Icon icon="solar:check-circle-bold" className="h-5 w-5 text-success-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-default-800">Confirmation SMS</h4>
                                  <p className="text-sm text-default-600">Send SMS when reservations are confirmed</p>
                                </div>
                              </div>
                              <Switch
                                isSelected={config.confirmationEnabled}
                                onValueChange={(confirmationEnabled) => 
                                  setConfig(prev => ({ ...prev, confirmationEnabled }))
                                }
                                color="success"
                                size="lg"
                                isDisabled
                              />
                            </div>

                            {/* Cancellation SMS Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-lg bg-default-50 border border-default-200">
                              <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-danger-100">
                                  <Icon icon="solar:close-circle-bold" className="h-5 w-5 text-danger-600" />
                                </div>
                                <div>
                                  <h4 className="font-semibold text-default-800">Cancellation SMS</h4>
                                  <p className="text-sm text-default-600">Send SMS when reservations are cancelled</p>
                                </div>
                              </div>
                              <Switch
                                isSelected={config.cancellationEnabled}
                                onValueChange={(cancellationEnabled) => 
                                  setConfig(prev => ({ ...prev, cancellationEnabled }))
                                }
                                color="danger"
                                size="lg"
                                isDisabled
                              />
                            </div>
                          </div>
                        </CardBody>
                      </Card>
                    )}
                  </div>
                )}

                {activeTab === 'test' && config.enabled && (
                  <div className="max-w-4xl mx-auto space-y-8">
                    <Card className="border-none shadow-lg bg-gradient-to-br from-white to-default-50">
                      <CardHeader className="pb-4">
                        <div className="flex items-center gap-4">
                          <div className="p-3 rounded-xl bg-gradient-to-br from-warning-100 to-warning-200">
                            <Icon icon="solar:test-tube-bold" className="h-6 w-6 text-warning-600" />
                          </div>
                          <div>
                            <h3 className="text-xl font-semibold">Test SMS</h3>
                            <p className="text-default-600">Send a test message to verify your configuration</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardBody className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <Input
                            label="Test Phone Number"
                            placeholder="e.g. 96171096633"
                            value={testNumber}
                            onValueChange={setTestNumber}
                            startContent={
                              <Icon icon="solar:phone-bold" className="text-warning-400" />
                            }
                            classNames={{
                              input: "text-base",
                              inputWrapper: "h-12 bg-default-50 border-2 border-transparent data-[focus=true]:border-warning-300",
                              label: "text-sm font-medium"
                            }}
                          />
                          
                          <Button
                            color="warning"
                            variant="flat"
                            onPress={handleTest}
                            isLoading={isTesting}
                            className="h-12 text-base font-semibold"
                            startContent={<Icon icon="solar:paper-plane-bold" />}
                          >
                            Send Test SMS
                          </Button>
                        </div>
                        
                        <Textarea
                          label="Test Message"
                          placeholder="Enter test message"
                          value={testMessage}
                          onValueChange={setTestMessage}
                          minRows={4}
                          maxRows={6}
                          classNames={{
                            input: "text-base",
                            inputWrapper: "bg-default-50 border-2 border-transparent data-[focus=true]:border-warning-300",
                            label: "text-sm font-medium"
                          }}
                        />
                      </CardBody>
                    </Card>
                  </div>
                )}

                {!config.enabled && activeTab !== 'setup' && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Icon icon="solar:smartphone-linear" className="h-24 w-24 text-default-300 mb-6" />
                    <h3 className="text-2xl font-semibold text-default-500 mb-2">SMS Service Disabled</h3>
                    <p className="text-default-400 mb-6">Enable SMS service in the Setup tab to access this feature</p>
                    <Button
                      color="primary"
                      variant="flat"
                      onPress={() => setActiveTab('setup')}
                      startContent={<Icon icon="solar:settings-bold" />}
                    >
                      Go to Setup
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-divider bg-gradient-to-r from-default-50 to-default-100 p-6">
              <div className="flex justify-end items-center max-w-4xl mx-auto">
                <div className="flex gap-3">
                  <Button 
                    variant="flat" 
                    onPress={onClose}
                    className="h-12 px-8"
                  >
                    Cancel
                  </Button>
                  <Button
                    color="primary"
                    onPress={handleSave}
                    isLoading={isLoading}
                    className="h-12 px-8 bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-semibold"
                    startContent={<Icon icon="solar:check-circle-bold" />}
                  >
                    Save Configuration
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </ModalContent>
    </Modal>
  );
} 