import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Appointment } from "@shared/schema";
import { format, parse, isValid } from "date-fns";
import CalendarGrid from "@/components/CalendarGrid";
import AppointmentCard from "@/components/AppointmentCard";
import AddButton from "@/components/AddButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentFormSchema } from "@shared/schema";
import { createAppointment } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Calendar() {
  const params = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  
  // Parse the date from URL or use today
  const initialDate = params.date && isValid(parse(params.date, 'yyyy-MM-dd', new Date())) 
    ? parse(params.date, 'yyyy-MM-dd', new Date()) 
    : new Date();
  
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate);
  const [showAddAppointmentDialog, setShowAddAppointmentDialog] = useState(false);
  
  // Fetch patients for the dropdown
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients']
  });
  
  // Fetch appointments for the selected date
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/date', selectedDate.toISOString()]
  });
  
  // Form setup
  const form = useForm({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: 0,
      date: format(selectedDate, "yyyy-MM-dd'T'HH:mm"),
      duration: 30,
      treatmentType: "Consultation",
      notes: "",
    },
  });
  
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    
    // Update the URL to reflect the selected date
    navigate(`/calendar/${format(date, 'yyyy-MM-dd')}`);
  };
  
  const handleAddAppointment = () => {
    // Set the default appointment date to the selected date at 9:00 AM
    const defaultDateTime = new Date(selectedDate);
    defaultDateTime.setHours(9, 0, 0, 0);
    
    form.setValue("date", format(defaultDateTime, "yyyy-MM-dd'T'HH:mm"));
    setShowAddAppointmentDialog(true);
  };
  
  const onSubmit = async (data: any) => {
    try {
      // Ensure patientId is a number
      data.patientId = Number(data.patientId);
      
      await createAppointment(data);
      form.reset();
      setShowAddAppointmentDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/appointments'] });
      toast({
        title: "Success",
        description: "Appointment added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add appointment",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-neutral-800">Calendar</h2>
        <AddButton onClick={handleAddAppointment} />
      </div>

      {/* Calendar Grid Component */}
      <CalendarGrid 
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
      />

      {/* Selected Day Appointments */}
      <div>
        <h3 className="font-medium mb-3">
          {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        
        {appointments.length > 0 ? (
          appointments.map(appointment => (
            <AppointmentCard 
              key={appointment.id} 
              appointment={appointment} 
            />
          ))
        ) : (
          <div className="text-center py-8 bg-white rounded-lg shadow">
            <p className="text-neutral-600">No appointments for this day</p>
            <Button 
              variant="link" 
              className="mt-2" 
              onClick={handleAddAppointment}
            >
              Add an appointment
            </Button>
          </div>
        )}
      </div>
      
      {/* Add Appointment Dialog */}
      <Dialog open={showAddAppointmentDialog} onOpenChange={setShowAddAppointmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Appointment</DialogTitle>
            <DialogDescription>
              Schedule an appointment for {format(selectedDate, 'MMMM d, yyyy')}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="patientId">Patient *</Label>
                <Select 
                  onValueChange={(value) => form.setValue("patientId", Number(value))}
                  defaultValue={form.getValues("patientId").toString()}
                >
                  <SelectTrigger className={form.formState.errors.patientId ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select a patient" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id.toString()}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.formState.errors.patientId && (
                  <p className="text-red-500 text-xs">Please select a patient</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="date">Date & Time *</Label>
                <Input 
                  id="date" 
                  type="datetime-local"
                  {...form.register("date")} 
                  className={form.formState.errors.date ? "border-red-500" : ""}
                />
                {form.formState.errors.date && (
                  <p className="text-red-500 text-xs">{form.formState.errors.date.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Select 
                  onValueChange={(value) => form.setValue("duration", Number(value))}
                  defaultValue={form.getValues("duration").toString()}
                >
                  <SelectTrigger className={form.formState.errors.duration ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="90">1.5 hours</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.duration && (
                  <p className="text-red-500 text-xs">{form.formState.errors.duration.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="treatmentType">Treatment Type *</Label>
                <Select 
                  onValueChange={(value) => form.setValue("treatmentType", value)}
                  defaultValue={form.getValues("treatmentType")}
                >
                  <SelectTrigger className={form.formState.errors.treatmentType ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select treatment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Initial Assessment">Initial Assessment</SelectItem>
                    <SelectItem value="Follow-up Consultation">Follow-up Consultation</SelectItem>
                    <SelectItem value="Therapy Session">Therapy Session</SelectItem>
                    <SelectItem value="Treatment Session">Treatment Session</SelectItem>
                    <SelectItem value="Checkup">Checkup</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.treatmentType && (
                  <p className="text-red-500 text-xs">{form.formState.errors.treatmentType.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input 
                  id="notes" 
                  {...form.register("notes")} 
                  placeholder="Any additional information"
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddAppointmentDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Add Appointment
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
