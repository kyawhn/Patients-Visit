import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Appointment } from "@shared/schema";
import { useState } from "react";
import { 
  ArrowLeft, 
  User, 
  Calendar,
  Clock,
  FileText,
  Pencil,
  Trash2,
  CheckCircle,
  ArrowRight,
  AlarmClock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTime, formatDuration } from "@/lib/dateUtils";
import { queryClient } from "@/lib/queryClient";
import { deleteAppointment, updateAppointment, createTreatmentRecord } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { appointmentFormSchema, treatmentRecordFormSchema } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AppointmentDetail() {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showAddRecordDialog, setShowAddRecordDialog] = useState(false);
  const appointmentId = parseInt(params.id);

  // Form for editing appointment
  const appointmentForm = useForm({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patientId: 0,
      date: "",
      duration: 30,
      treatmentType: "",
      notes: "",
      completed: false,
    },
  });

  // Form for adding treatment record
  const recordForm = useForm({
    resolver: zodResolver(treatmentRecordFormSchema),
    defaultValues: {
      patientId: 0,
      date: "",
      treatmentType: "",
      notes: "",
      followUpNeeded: false,
      followUpDate: undefined,
    },
  });

  // Fetch appointment data
  const { data: appointment, isLoading: appointmentLoading } = useQuery<Appointment>({
    queryKey: [`/api/appointments/${appointmentId}`],
    onSuccess: (data) => {
      // Populate appointment form with appointment data
      appointmentForm.reset({
        patientId: data.patientId,
        date: data.date ? new Date(data.date).toISOString().slice(0, 16) : "",
        duration: data.duration,
        treatmentType: data.treatmentType,
        notes: data.notes || "",
        completed: data.completed,
      });
      
      // Populate record form with appointment data
      recordForm.reset({
        patientId: data.patientId,
        date: data.date ? new Date(data.date).toISOString().slice(0, 16) : "",
        treatmentType: data.treatmentType,
        notes: data.notes || "",
        followUpNeeded: false,
      });
    }
  });

  // Fetch patient data associated with the appointment
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: appointment ? [`/api/patients/${appointment.patientId}`] : null,
    enabled: !!appointment
  });

  // Fetch patients for the dropdown
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
    enabled: showEditDialog
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: (data: any) => updateAppointment(appointmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/appointments/${appointmentId}`] });
      toast({
        title: "Appointment Updated",
        description: "Appointment has been updated successfully",
      });
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update appointment",
        variant: "destructive",
      });
    }
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: () => deleteAppointment(appointmentId),
    onSuccess: () => {
      toast({
        title: "Appointment Deleted",
        description: "Appointment has been removed successfully",
      });
      navigate("/calendar");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete appointment",
        variant: "destructive",
      });
    }
  });

  // Create treatment record mutation
  const createRecordMutation = useMutation({
    mutationFn: (data: any) => createTreatmentRecord(data),
    onSuccess: (data) => {
      // Mark appointment as completed
      updateAppointment(appointmentId, { completed: true });
      queryClient.invalidateQueries({ queryKey: [`/api/appointments/${appointmentId}`] });
      
      toast({
        title: "Treatment Record Created",
        description: "Record has been added successfully",
      });
      
      setShowAddRecordDialog(false);
      
      // Navigate to the new record
      navigate(`/records/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create treatment record",
        variant: "destructive",
      });
    }
  });

  const handleGoBack = () => {
    navigate("/calendar");
  };

  const handleViewPatient = () => {
    if (appointment) {
      navigate(`/patients/${appointment.patientId}`);
    }
  };

  const handleEditAppointment = () => {
    setShowEditDialog(true);
  };

  const handleDeleteAppointment = () => {
    setShowDeleteAlert(true);
  };

  const handleAddRecord = () => {
    setShowAddRecordDialog(true);
  };

  const confirmDeleteAppointment = () => {
    deleteAppointmentMutation.mutate();
  };

  const markAsCompleted = () => {
    updateAppointmentMutation.mutate({ completed: true });
  };

  const onAppointmentSubmit = (data: any) => {
    // Ensure patientId is a number
    data.patientId = Number(data.patientId);
    
    updateAppointmentMutation.mutate(data);
  };

  const onRecordSubmit = (data: any) => {
    // Ensure patientId is a number
    data.patientId = Number(data.patientId);
    
    // If followUpNeeded is false, remove followUpDate
    if (!data.followUpNeeded) {
      data.followUpDate = null;
    }
    
    createRecordMutation.mutate(data);
  };

  if (appointmentLoading || patientLoading) {
    return (
      <div className="py-4">
        <Button variant="ghost" size="sm" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Calendar
        </Button>
        <div className="text-center py-8">Loading appointment details...</div>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="py-4">
        <Button variant="ghost" size="sm" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Calendar
        </Button>
        <Card>
          <CardContent className="py-8 text-center">
            <p>Appointment not found</p>
            <Button variant="link" onClick={handleGoBack}>
              Return to calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-4">
      <Button variant="ghost" size="sm" onClick={handleGoBack} className="mb-4">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Calendar
      </Button>

      {/* Appointment info card */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{appointment.treatmentType}</CardTitle>
              <p className="text-sm text-neutral-600 mt-1">
                {formatDate(appointment.date)}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={handleEditAppointment}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDeleteAppointment} className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center text-sm">
                <User className="h-4 w-4 mr-2 text-neutral-500" />
                <span className="font-medium">Patient:</span>
                <Button
                  variant="link"
                  className="p-0 h-auto ml-1 text-primary"
                  onClick={handleViewPatient}
                >
                  {patient ? patient.name : "Loading..."}
                </Button>
              </div>
              <Badge variant={appointment.completed ? "secondary" : "outline"} className={
                appointment.completed 
                  ? "bg-status-success bg-opacity-10 text-status-success border-green-500" 
                  : "bg-primary bg-opacity-10 text-primary border-primary"
              }>
                {appointment.completed ? "Completed" : "Scheduled"}
              </Badge>
            </div>
            
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 mr-2 text-neutral-500" />
              <span className="font-medium">Time:</span>
              <span className="ml-1">{formatTime(appointment.date)}</span>
            </div>
            
            <div className="flex items-center text-sm">
              <AlarmClock className="h-4 w-4 mr-2 text-neutral-500" />
              <span className="font-medium">Duration:</span>
              <span className="ml-1">{formatDuration(appointment.duration)}</span>
            </div>
            
            {appointment.notes && (
              <div className="mt-4 bg-neutral-50 rounded-md p-4">
                <div className="flex items-start mb-2">
                  <FileText className="h-4 w-4 mr-2 text-neutral-500 mt-0.5" />
                  <span className="font-medium">Notes:</span>
                </div>
                <p className="text-sm pl-6 whitespace-pre-line">{appointment.notes}</p>
              </div>
            )}
            
            {!appointment.completed && (
              <div className="flex gap-2 pt-4">
                <Button onClick={markAsCompleted} className="flex-1">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed
                </Button>
                <Button onClick={handleAddRecord} className="flex-1">
                  <FileText className="h-4 w-4 mr-2" />
                  Add Treatment Record
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Appointment Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Appointment</DialogTitle>
            <DialogDescription>
              Update the appointment information.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={appointmentForm.handleSubmit(onAppointmentSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="patientId">Patient *</Label>
                <Select 
                  onValueChange={(value) => appointmentForm.setValue("patientId", Number(value))}
                  defaultValue={appointmentForm.getValues("patientId").toString()}
                >
                  <SelectTrigger className={appointmentForm.formState.errors.patientId ? "border-red-500" : ""}>
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
                {appointmentForm.formState.errors.patientId && (
                  <p className="text-red-500 text-xs">Please select a patient</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="date">Date & Time *</Label>
                <Input 
                  id="date" 
                  type="datetime-local"
                  {...appointmentForm.register("date")} 
                  className={appointmentForm.formState.errors.date ? "border-red-500" : ""}
                />
                {appointmentForm.formState.errors.date && (
                  <p className="text-red-500 text-xs">{appointmentForm.formState.errors.date.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="duration">Duration (minutes) *</Label>
                <Select 
                  onValueChange={(value) => appointmentForm.setValue("duration", Number(value))}
                  defaultValue={appointmentForm.getValues("duration").toString()}
                >
                  <SelectTrigger className={appointmentForm.formState.errors.duration ? "border-red-500" : ""}>
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
                {appointmentForm.formState.errors.duration && (
                  <p className="text-red-500 text-xs">{appointmentForm.formState.errors.duration.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="treatmentType">Treatment Type *</Label>
                <Select 
                  onValueChange={(value) => appointmentForm.setValue("treatmentType", value)}
                  defaultValue={appointmentForm.getValues("treatmentType")}
                >
                  <SelectTrigger className={appointmentForm.formState.errors.treatmentType ? "border-red-500" : ""}>
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
                {appointmentForm.formState.errors.treatmentType && (
                  <p className="text-red-500 text-xs">{appointmentForm.formState.errors.treatmentType.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  {...appointmentForm.register("notes")} 
                  placeholder="Any additional information"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="completed" 
                  checked={appointmentForm.watch("completed")}
                  onCheckedChange={(checked) => {
                    appointmentForm.setValue("completed", checked as boolean);
                  }}
                />
                <Label htmlFor="completed">Mark as Completed</Label>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateAppointmentMutation.isPending || !appointmentForm.formState.isDirty}
              >
                {updateAppointmentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Treatment Record Dialog */}
      <Dialog open={showAddRecordDialog} onOpenChange={setShowAddRecordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Treatment Record</DialogTitle>
            <DialogDescription>
              Create a treatment record for this appointment.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={recordForm.handleSubmit(onRecordSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="treatmentType">Treatment Type *</Label>
                <Select 
                  onValueChange={(value) => recordForm.setValue("treatmentType", value)}
                  defaultValue={recordForm.getValues("treatmentType")}
                >
                  <SelectTrigger className={recordForm.formState.errors.treatmentType ? "border-red-500" : ""}>
                    <SelectValue placeholder="Select treatment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Initial Assessment">Initial Assessment</SelectItem>
                    <SelectItem value="Follow-up Consultation">Follow-up Consultation</SelectItem>
                    <SelectItem value="Therapy Session">Therapy Session</SelectItem>
                    <SelectItem value="Treatment Session">Treatment Session</SelectItem>
                    <SelectItem value="Surgical Procedure">Surgical Procedure</SelectItem>
                    <SelectItem value="Medication Review">Medication Review</SelectItem>
                    <SelectItem value="Emergency Care">Emergency Care</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {recordForm.formState.errors.treatmentType && (
                  <p className="text-red-500 text-xs">{recordForm.formState.errors.treatmentType.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  {...recordForm.register("notes")} 
                  rows={4}
                  placeholder="Treatment details, observations, etc."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="followUpNeeded" 
                  checked={recordForm.watch("followUpNeeded")}
                  onCheckedChange={(checked) => {
                    recordForm.setValue("followUpNeeded", checked as boolean);
                  }}
                />
                <Label htmlFor="followUpNeeded">Follow-up Required</Label>
              </div>
              
              {recordForm.watch("followUpNeeded") && (
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="followUpDate">Follow-up Date</Label>
                  <Input 
                    id="followUpDate" 
                    type="date"
                    {...recordForm.register("followUpDate")} 
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowAddRecordDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createRecordMutation.isPending}
                className="ml-2"
              >
                {createRecordMutation.isPending ? "Creating..." : "Create Record"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will permanently delete this appointment.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteAppointment}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteAppointmentMutation.isPending ? "Deleting..." : "Delete Appointment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
