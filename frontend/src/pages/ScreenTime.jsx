 
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { getControlSettings, addSchedule, updateSchedule, deleteSchedule } from "@/services/api";

// A simple placeholder for the schedule form
const ScheduleForm = ({ schedule, onSave, onCancel }) => {
  // In a real app, this would be a full form with inputs for name, days, times, etc.
  const [name, setName] = useState(schedule ? schedule.name : "New Schedule");

  const handleSave = () => {
    // Basic validation
    if (!name) return;
    onSave({ ...schedule, name });
  };

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-2">{schedule ? "Edit Schedule" : "Add Schedule"}</h3>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full p-2 border rounded"
        placeholder="Schedule Name (e.g., School Hours)"
      />
      {/* Inputs for days, start_time, end_time would go here */}
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSave}>Save</Button>
      </div>
    </div>
  );
};


const ScreenTime = () => {
  const { childId } = useParams();
  const { toast } = useToast();
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false); // Can be an ID for editing, or true for adding
  
  useEffect(() => {
    const fetchSchedules = async () => {
      try {
        const settings = await getControlSettings(childId);
        setSchedules(settings.screen_time_schedules || []);
      } catch (error) {
        toast({ title: "Error", description: "Could not fetch screen time settings.", variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };
    fetchSchedules();
  }, [childId, toast]);

  const handleSaveSchedule = async (scheduleData) => {
    try {
      let savedSchedule;
      if (scheduleData.id) {
        // Update existing schedule
        savedSchedule = await updateSchedule(childId, scheduleData.id, scheduleData);
        setSchedules(schedules.map(s => s.id === savedSchedule.id ? savedSchedule : s));
        toast({ title: "Success", description: "Schedule updated successfully." });
      } else {
        // Add new schedule
        savedSchedule = await addSchedule(childId, scheduleData);
        setSchedules([...schedules, savedSchedule]);
        toast({ title: "Success", description: "Schedule added successfully." });
      }
      setIsEditing(false); // Close the form
    } catch (error) {
      toast({ title: "Error", description: "Failed to save schedule.", variant: "destructive" });
    }
  };
  
  const handleDeleteSchedule = async (scheduleId) => {
    try {
      await deleteSchedule(childId, scheduleId);
      setSchedules(schedules.filter(s => s.id !== scheduleId));
      toast({ title: "Success", description: "Schedule deleted successfully." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete schedule.", variant: "destructive" });
    }
  };

  if (isLoading) {
    return <div>Loading schedules...</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>Screen Time Schedules</CardTitle>
          <p className="text-sm text-muted-foreground">
            Set specific times when the child's device will be locked.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schedules.map(schedule => (
              <div key={schedule.id} className="flex justify-between items-center p-3 border rounded-lg">
                <div>
                  <p className="font-semibold">{schedule.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {/* Placeholder for days and times */}
                    Mon, Wed, Fri from 9:00 AM to 3:00 PM
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(schedule)}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => handleDeleteSchedule(schedule.id)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>

          {!isEditing && (
            <div className="mt-6">
              <Button onClick={() => setIsEditing(true)}>Add New Schedule</Button>
            </div>
          )}

          {isEditing && (
            <div className="mt-6">
              <ScheduleForm 
                schedule={typeof isEditing === 'object' ? isEditing : null}
                onSave={handleSaveSchedule}
                onCancel={() => setIsEditing(false)}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ScreenTime;
