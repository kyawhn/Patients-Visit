import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Patient, Appointment, TreatmentRecord } from "@shared/schema";
import { useState } from "react";
import { 
  ArrowLeft, 
  Calendar, 
  FileText, 
  Mail, 
  Phone, 
  MapPin,
  Pencil,
  Trash2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDate } from "@/lib/dateUtils";
import AppointmentCard from "@/components/AppointmentCard";
import RecordCard from "@/components/RecordCard";
import { queryClient } from "@/lib/queryClient";
import { deletePatient, updatePatient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientFormSchema } from "@shared/schema";
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

export default function PatientDetail() {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const patientId = parseInt(params.id);

  const form = useForm({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      dateOfBirth: "",
      address: "",
      notes: "",
    },
  });

  // Fetch patient data
  const { data: patient, isLoading: patientLoading } = useQuery<Patient>({
    queryKey: [`/api/patients/${patientId}`],
    onSuccess: (data) => {
      // Populate form with patient data
      form.reset({
        name: data.name,
        phone: data.phone,
        email: data.email || "",
        dateOfBirth: data.dateOfBirth || "",
        address: data.address || "",
        notes: data.notes || "",
      });
    }
  });

  // Fetch patient appointments
  const { data: appointments = [], isLoading: appointmentsLoading } = useQuery<Appointment[]>({
    queryKey: [`/api/patients/${patientId}/appointments`],
    enabled: !!patientId
  });

  // Fetch patient treatment records
  const { data: records = [], isLoading: recordsLoading } = useQuery<TreatmentRecord[]>({
    queryKey: [`/api/patients/${patientId}/records`],
    enabled: !!patientId
  });

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: (data: any) => updatePatient(patientId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/patients/${patientId}`] });
      toast({
        title: "Patient Updated",
        description: "Patient information has been updated successfully",
      });
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update patient information",
        variant: "destructive",
      });
    }
  });

  // Delete patient mutation
  const deletePatientMutation = useMutation({
    mutationFn: () => deletePatient(patientId),
    onSuccess: () => {
      toast({
        title: "Patient Deleted",
        description: "Patient has been removed successfully",
      });
      navigate("/patients");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete patient",
        variant: "destructive",
      });
    }
  });

  const handleGoBack = () => {
    navigate("/patients");
  };

  const handleEditPatient = () => {
    setShowEditDialog(true);
  };

  const handleDeletePatient = () => {
    setShowDeleteAlert(true);
  };

  const confirmDeletePatient = () => {
    deletePatientMutation.mutate();
  };

  const onSubmit = (data: any) => {
    updatePatientMutation.mutate(data);
  };

  if (patientLoading) {
    return (
      <div className="py-4">
        <Button variant="ghost" size="sm" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Button>
        <div className="text-center py-8">Loading patient information...</div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="py-4">
        <Button variant="ghost" size="sm" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Patients
        </Button>
        <Card>
          <CardContent className="py-8 text-center">
            <p>Patient not found</p>
            <Button variant="link" onClick={handleGoBack}>
              Return to patients list
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
        Back to Patients
      </Button>

      {/* Patient info card */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle>{patient.name}</CardTitle>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={handleEditPatient}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDeletePatient} className="text-red-500 hover:text-red-600">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {patient.phone && (
              <div className="flex items-center text-sm">
                <Phone className="h-4 w-4 mr-2 text-neutral-500" />
                <span>{patient.phone}</span>
              </div>
            )}
            {patient.email && (
              <div className="flex items-center text-sm">
                <Mail className="h-4 w-4 mr-2 text-neutral-500" />
                <span>{patient.email}</span>
              </div>
            )}
            {patient.dateOfBirth && (
              <div className="flex items-center text-sm">
                <Calendar className="h-4 w-4 mr-2 text-neutral-500" />
                <span>DOB: {patient.dateOfBirth}</span>
              </div>
            )}
            {patient.address && (
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2 text-neutral-500" />
                <span>{patient.address}</span>
              </div>
            )}
            {patient.lastVisit && (
              <div className="text-sm text-neutral-600 mt-2">
                Last visit: {formatDate(patient.lastVisit)}
              </div>
            )}
            {patient.notes && (
              <div className="mt-4 p-3 bg-neutral-50 rounded-md">
                <div className="text-sm font-medium mb-1">Notes:</div>
                <div className="text-sm">{patient.notes}</div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs for appointments and records */}
      <Tabs defaultValue="appointments">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="appointments" className="flex items-center">
            <Calendar className="h-4 w-4 mr-2" />
            Appointments
            <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
              {appointments.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="records" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Treatment Records
            <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
              {records.length}
            </span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="appointments">
          {appointmentsLoading ? (
            <div className="text-center py-4">Loading appointments...</div>
          ) : appointments.length > 0 ? (
            <div className="space-y-3">
              {appointments.map(appointment => (
                <AppointmentCard 
                  key={appointment.id} 
                  appointment={appointment} 
                  withPatientName={false} 
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-neutral-600 mb-2">No appointments found</p>
                <Button 
                  onClick={() => navigate("/calendar")}
                  className="mt-2"
                >
                  Schedule Appointment
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="records">
          {recordsLoading ? (
            <div className="text-center py-4">Loading treatment records...</div>
          ) : records.length > 0 ? (
            <div className="space-y-3">
              {records.map(record => (
                <RecordCard 
                  key={record.id} 
                  record={record} 
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-neutral-600 mb-2">No treatment records found</p>
                <Button 
                  onClick={() => navigate("/records")}
                  className="mt-2"
                >
                  Add Treatment Record
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Edit Patient Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Patient</DialogTitle>
            <DialogDescription>
              Update patient information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input 
                  id="name" 
                  {...form.register("name")} 
                  className={form.formState.errors.name ? "border-red-500" : ""}
                />
                {form.formState.errors.name && (
                  <p className="text-red-500 text-xs">{form.formState.errors.name.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input 
                  id="phone" 
                  {...form.register("phone")} 
                  className={form.formState.errors.phone ? "border-red-500" : ""}
                />
                {form.formState.errors.phone && (
                  <p className="text-red-500 text-xs">{form.formState.errors.phone.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email"
                  {...form.register("email")} 
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input 
                  id="dateOfBirth" 
                  {...form.register("dateOfBirth")} 
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  {...form.register("address")} 
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input 
                  id="notes" 
                  {...form.register("notes")} 
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updatePatientMutation.isPending || !form.formState.isDirty}
              >
                {updatePatientMutation.isPending ? "Saving..." : "Save Changes"}
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
              This action will permanently delete {patient.name}'s patient record, along with all associated appointments and treatment records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeletePatient}
              className="bg-red-500 hover:bg-red-600"
            >
              {deletePatientMutation.isPending ? "Deleting..." : "Delete Patient"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
