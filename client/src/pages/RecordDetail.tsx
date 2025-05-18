import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { TreatmentRecord } from "@shared/schema";
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
  AlertCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatRelativeDate } from "@/lib/dateUtils";
import { queryClient } from "@/lib/queryClient";
import { deleteTreatmentRecord, updateTreatmentRecord } from "@/lib/api";
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
import { treatmentRecordFormSchema } from "@shared/schema";
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

export default function RecordDetail() {
  const params = useParams<{ id: string }>();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const recordId = parseInt(params.id);

  const form = useForm({
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

  // Fetch record data
  const { data: record, isLoading: recordLoading } = useQuery<TreatmentRecord>({
    queryKey: [`/api/records/${recordId}`],
    onSuccess: (data) => {
      // Populate form with record data
      form.reset({
        patientId: data.patientId,
        date: data.date ? new Date(data.date).toISOString().slice(0, 16) : "",
        treatmentType: data.treatmentType,
        notes: data.notes || "",
        followUpNeeded: data.followUpNeeded,
        followUpDate: data.followUpDate ? new Date(data.followUpDate).toISOString().slice(0, 10) : undefined,
      });
    }
  });

  // Fetch patient data associated with the record
  const { data: patient, isLoading: patientLoading } = useQuery({
    queryKey: record ? [`/api/patients/${record.patientId}`] : null,
    enabled: !!record
  });

  // Fetch patients for the dropdown
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients'],
    enabled: showEditDialog
  });

  // Update record mutation
  const updateRecordMutation = useMutation({
    mutationFn: (data: any) => updateTreatmentRecord(recordId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/records/${recordId}`] });
      toast({
        title: "Record Updated",
        description: "Treatment record has been updated successfully",
      });
      setShowEditDialog(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update treatment record",
        variant: "destructive",
      });
    }
  });

  // Delete record mutation
  const deleteRecordMutation = useMutation({
    mutationFn: () => deleteTreatmentRecord(recordId),
    onSuccess: () => {
      toast({
        title: "Record Deleted",
        description: "Treatment record has been removed successfully",
      });
      navigate("/records");
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete treatment record",
        variant: "destructive",
      });
    }
  });

  const handleGoBack = () => {
    navigate("/records");
  };

  const handleEditRecord = () => {
    setShowEditDialog(true);
  };

  const handleDeleteRecord = () => {
    setShowDeleteAlert(true);
  };

  const confirmDeleteRecord = () => {
    deleteRecordMutation.mutate();
  };

  const onSubmit = (data: any) => {
    // Ensure patientId is a number
    data.patientId = Number(data.patientId);
    
    // If followUpNeeded is false, remove followUpDate
    if (!data.followUpNeeded) {
      data.followUpDate = null;
    }
    
    updateRecordMutation.mutate(data);
  };

  if (recordLoading || patientLoading) {
    return (
      <div className="py-4">
        <Button variant="ghost" size="sm" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Records
        </Button>
        <div className="text-center py-8">Loading treatment record...</div>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="py-4">
        <Button variant="ghost" size="sm" onClick={handleGoBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Records
        </Button>
        <Card>
          <CardContent className="py-8 text-center">
            <p>Treatment record not found</p>
            <Button variant="link" onClick={handleGoBack}>
              Return to records list
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
        Back to Records
      </Button>

      {/* Record info card */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>{record.treatmentType}</CardTitle>
              <p className="text-sm text-neutral-600 mt-1">
                {formatDate(record.date)}
              </p>
            </div>
            <div className="flex space-x-2">
              <Button variant="ghost" size="icon" onClick={handleEditRecord}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDeleteRecord} className="text-red-500 hover:text-red-600">
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
                  onClick={() => navigate(`/patients/${record.patientId}`)}
                >
                  {patient ? patient.name : "Loading..."}
                </Button>
              </div>
              <Badge variant={record.followUpNeeded ? "outline" : "secondary"} className={
                record.followUpNeeded 
                  ? "bg-accent bg-opacity-10 text-accent border-accent" 
                  : "bg-status-success bg-opacity-10 text-status-success border-green-500"
              }>
                {record.followUpNeeded ? "Follow-up Needed" : "Completed"}
              </Badge>
            </div>
            
            {record.followUpNeeded && record.followUpDate && (
              <div className="flex items-center text-sm bg-accent/10 p-2 rounded-md">
                <Calendar className="h-4 w-4 mr-2 text-accent" />
                <span>Follow-up scheduled for: {formatDate(record.followUpDate)}</span>
              </div>
            )}
            
            {record.notes && (
              <div className="mt-4 bg-neutral-50 rounded-md p-4">
                <div className="flex items-start mb-2">
                  <FileText className="h-4 w-4 mr-2 text-neutral-500 mt-0.5" />
                  <span className="font-medium">Treatment Notes:</span>
                </div>
                <p className="text-sm pl-6 whitespace-pre-line">{record.notes}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Record Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Treatment Record</DialogTitle>
            <DialogDescription>
              Update the treatment record information.
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
                    <SelectItem value="Surgical Procedure">Surgical Procedure</SelectItem>
                    <SelectItem value="Medication Review">Medication Review</SelectItem>
                    <SelectItem value="Emergency Care">Emergency Care</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
                {form.formState.errors.treatmentType && (
                  <p className="text-red-500 text-xs">{form.formState.errors.treatmentType.message}</p>
                )}
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea 
                  id="notes" 
                  {...form.register("notes")} 
                  rows={4}
                  placeholder="Treatment details, observations, etc."
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="followUpNeeded" 
                  checked={form.watch("followUpNeeded")}
                  onCheckedChange={(checked) => {
                    form.setValue("followUpNeeded", checked as boolean);
                  }}
                />
                <Label htmlFor="followUpNeeded">Follow-up Required</Label>
              </div>
              
              {form.watch("followUpNeeded") && (
                <div className="grid grid-cols-1 gap-2">
                  <Label htmlFor="followUpDate">Follow-up Date</Label>
                  <Input 
                    id="followUpDate" 
                    type="date"
                    {...form.register("followUpDate")} 
                  />
                </div>
              )}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={updateRecordMutation.isPending || !form.formState.isDirty}
              >
                {updateRecordMutation.isPending ? "Saving..." : "Save Changes"}
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
              This action will permanently delete this treatment record.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteRecord}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteRecordMutation.isPending ? "Deleting..." : "Delete Record"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
