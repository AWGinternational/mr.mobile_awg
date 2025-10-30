'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, Users, Settings, Save, X } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { BusinessSidebar } from '@/components/layout/BusinessSidebar';
import { TopNavigation } from '@/components/layout/TopNavigation';

interface ShiftTime {
  day: string;
  startTime: string;
  endTime: string;
  isEnabled: boolean;
}

const DAYS_OF_WEEK = [
  { value: 'MONDAY', label: 'Monday' },
  { value: 'TUESDAY', label: 'Tuesday' },
  { value: 'WEDNESDAY', label: 'Wednesday' },
  { value: 'THURSDAY', label: 'Thursday' },
  { value: 'FRIDAY', label: 'Friday' },
  { value: 'SATURDAY', label: 'Saturday' },
  { value: 'SUNDAY', label: 'Sunday' },
];

export default function ShiftSettingsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [workers, setWorkers] = useState<any[]>([]);
  const [selectedWorker, setSelectedWorker] = useState('');
  const [shifts, setShifts] = useState<ShiftTime[]>([]);

  // Fetch workers (only for shop owners)
  useEffect(() => {
    const fetchWorkers = async () => {
      if (session?.user?.role !== 'SHOP_OWNER') return;

      try {
        const response = await fetch('/api/shops');
        const data = await response.json();
        
        if (data.shops && data.shops.length > 0) {
          const shopWorkers = data.shops[0].workers || [];
          setWorkers(shopWorkers);
          
          // Select first worker by default
          if (shopWorkers.length > 0 && !selectedWorker) {
            setSelectedWorker(shopWorkers[0].userId);
          }
        }
      } catch (error) {
        console.error('Error fetching workers:', error);
        toast({
          title: 'Error',
          description: 'Failed to load workers',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWorkers();
  }, [session, toast]);

  // Fetch shift settings when worker is selected
  useEffect(() => {
    const fetchShiftSettings = async () => {
      if (!selectedWorker) return;

      try {
        const response = await fetch(`/api/workers/${selectedWorker}/shifts`);
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.shifts) {
            setShifts(data.shifts);
          } else {
            // Initialize with default empty shifts
            initializeDefaultShifts();
          }
        } else {
          // Initialize with default empty shifts
          initializeDefaultShifts();
        }
      } catch (error) {
        console.error('Error fetching shift settings:', error);
        initializeDefaultShifts();
      }
    };

    fetchShiftSettings();
  }, [selectedWorker]);

  const initializeDefaultShifts = () => {
    const defaultShifts = DAYS_OF_WEEK.map(day => ({
      day: day.value,
      startTime: '09:00',
      endTime: '18:00',
      isEnabled: day.value !== 'SUNDAY', // Disable Sunday by default
    }));
    setShifts(defaultShifts);
  };

  const handleShiftChange = (index: number, field: keyof ShiftTime, value: any) => {
    const updatedShifts = [...shifts];
    updatedShifts[index] = {
      ...updatedShifts[index],
      [field]: value,
    };
    setShifts(updatedShifts);
  };

  const handleSaveShifts = async () => {
    if (!selectedWorker) {
      toast({
        title: 'Error',
        description: 'Please select a worker',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(`/api/workers/${selectedWorker}/shifts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ shifts }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Success',
          description: 'Shift settings saved successfully',
        });
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to save shift settings',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving shift settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to save shift settings',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (session?.user?.role !== 'SHOP_OWNER') {
    return (
      <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
        <BusinessSidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <TopNavigation />
          <main className="flex-1 overflow-y-auto p-6">
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  Only shop owners can manage worker shifts.
                </p>
              </CardContent>
            </Card>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <BusinessSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNavigation />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Worker Shift Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage working hours and schedules for your workers
              </p>
            </div>

            {/* Worker Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Select Worker
                </CardTitle>
                <CardDescription>
                  Choose a worker to manage their shift settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading workers...</p>
                ) : workers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No workers found. Add workers to your shop first.
                  </p>
                ) : (
                  <Select value={selectedWorker} onValueChange={setSelectedWorker}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a worker" />
                    </SelectTrigger>
                    <SelectContent>
                      {workers.map((worker) => (
                        <SelectItem key={worker.userId} value={worker.userId}>
                          {worker.user?.name || worker.user?.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </CardContent>
            </Card>

            {/* Shift Schedule */}
            {selectedWorker && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Weekly Schedule
                  </CardTitle>
                  <CardDescription>
                    Set working hours for each day of the week
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {shifts.map((shift, index) => {
                    const dayLabel = DAYS_OF_WEEK.find(d => d.value === shift.day)?.label || shift.day;
                    
                    return (
                      <div
                        key={shift.day}
                        className={`p-4 rounded-lg border transition-colors ${
                          shift.isEnabled
                            ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                            : 'bg-gray-50 dark:bg-gray-900 border-gray-100 dark:border-gray-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          {/* Day Name */}
                          <div className="flex items-center gap-3 min-w-[120px]">
                            <input
                              type="checkbox"
                              checked={shift.isEnabled}
                              onChange={(e) => handleShiftChange(index, 'isEnabled', e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className={`font-medium ${
                              shift.isEnabled ? 'text-gray-900 dark:text-white' : 'text-gray-400 dark:text-gray-600'
                            }`}>
                              {dayLabel}
                            </span>
                          </div>

                          {/* Time Inputs */}
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              <input
                                type="time"
                                value={shift.startTime}
                                onChange={(e) => handleShiftChange(index, 'startTime', e.target.value)}
                                disabled={!shift.isEnabled}
                                className={`px-3 py-2 border rounded-md ${
                                  shift.isEnabled
                                    ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                }`}
                              />
                            </div>

                            <span className="text-gray-400">to</span>

                            <div className="flex items-center gap-2">
                              <input
                                type="time"
                                value={shift.endTime}
                                onChange={(e) => handleShiftChange(index, 'endTime', e.target.value)}
                                disabled={!shift.isEnabled}
                                className={`px-3 py-2 border rounded-md ${
                                  shift.isEnabled
                                    ? 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white'
                                    : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Status Badge */}
                          <Badge variant={shift.isEnabled ? 'default' : 'secondary'} className="min-w-[70px]">
                            {shift.isEnabled ? 'Active' : 'Off'}
                          </Badge>
                        </div>
                      </div>
                    );
                  })}

                  {/* Save Button */}
                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={initializeDefaultShifts}
                      disabled={saving}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Reset to Default
                    </Button>
                    <Button
                      onClick={handleSaveShifts}
                      disabled={saving}
                    >
                      {saving ? (
                        <>
                          <div className="mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="mr-2 h-4 w-4" />
                          Save Schedule
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <Settings className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2">
                    <p className="font-medium text-blue-900 dark:text-blue-100">
                      Shift Management Tips
                    </p>
                    <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                      <li>Uncheck a day to mark it as a day off for the worker</li>
                      <li>Set appropriate start and end times for each working day</li>
                      <li>Changes are saved immediately when you click "Save Schedule"</li>
                      <li>Workers will only be able to access the system during their shift hours</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
