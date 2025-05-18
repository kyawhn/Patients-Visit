import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TreatmentRecord } from "@shared/schema";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import RecordCard from "@/components/RecordCard";
import AddButton from "@/components/AddButton";
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { treatmentRecordFormSchema } from "@shared/schema";
import { createTreatmentRecord } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function Records() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [showAddRecordDialog, setShowAddRecordDialog] = useState(false);
  const { toast } = useToast();

  // Form setup
  const form = useForm({
    resolver: zodResolver(treatmentRecordFormSchema),
    defaultValues: {
      patientId: 0,
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      treatmentType: "",
      notes: "",
      followUpNeeded: false,
      followUpDate: undefined,
    },
  });

  // Fetch all records
  const { data: records = [], isLoading } = useQuery<TreatmentRecord[]>({
    queryKey: [searchQuery ? '/api/records/search' : '/api/records', searchQuery ? { q: searchQuery } : undefined],
  });
  
  // Fetch patients for the dropdown
  const { data: patients = [] } = useQuery({
    queryKey: ['/api/patients']
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleFilterChange = (filter: string) => {
    setActiveFilter(filter);
    // In a real app, this would update the query to filter records
  };

  const handleAddRecord = () => {
    setShowAddRecordDialog(true);
  };

  const onSubmit = async (data: any) => {
    try {
      // Ensure patientId is a number
      data.patientId = Number(data.patientId);
      
      // If followUpNeeded is false, remove followUpDate
      if (!data.followUpNeeded) {
        data.followUpDate = null;
      }
      
      await createTreatmentRecord(data);
      form.reset();
      setShowAddRecordDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/records'] });
      toast({
        title: "Success",
        description: "Treatment record added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add treatment record",
        variant: "destructive",
      });
    }
  };

  // Filter records based on active filter
  const filteredRecords = records;

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-neutral-800">Treatment Records</h2>
        <AddButton onClick={handleAddRecord} />
      </div>

      {/* Search and Filter */}
      <div className="mb-4">
        <div className="relative mb-3">
          <Input 
            placeholder="Search records..." 
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full bg-white pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
        </div>
        
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <Button 
            variant={activeFilter === "all" ? "default" : "outline"}
            size="sm"
            className="rounded-full text-sm whitespace-nowrap"
            onClick={() => handleFilterChange("all")}
          >
            All Records
          </Button>
          <Button 
            variant={activeFilter === "week" ? "default" : "outline"}
            size="sm"
            className="rounded-full text-sm whitespace-nowrap"
            onClick={() => handleFilterChange("week")}
          >
            This Week
          </Button>
          <Button 
            variant={activeFilter === "month" ? "default" : "outline"}
            size="sm"
            className="rounded-full text-sm whitespace-nowrap"
            onClick={() => handleFilterChange("month")}
          >
            This Month
          </Button>
          <Button 
            variant={activeFilter === "followup" ? "default" : "outline"}
            size="sm"
            className="rounded-full text-sm whitespace-nowrap"
            onClick={() => handleFilterChange("followup")}
          >
            Needs Follow-up
          </Button>
        </div>
      </div>

      {/* Records List */}
      {isLoading ? (
        <div className="text-center py-8">Loading records...</div>
      ) : (
        <div className="space-y-4">
          {filteredRecords.length > 0 ? (
            filteredRecords.map(record => (
              <RecordCard key={record.id} record={record} />
            ))
          ) : (
            <div className="text-center py-8 bg-white rounded-lg shadow">
              <p className="text-neutral-600">No treatment records found</p>
              <Button 
                variant="link" 
                className="mt-2" 
                onClick={handleAddRecord}
              >
                Add a treatment record
              </Button>
            </div>
          )}
        </div>
      )}
      
      {/* Add Record Dialog */}
      <Dialog open={showAddRecordDialog} onOpenChange={setShowAddRecordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Treatment Record</DialogTitle>
            <DialogDescription>
              Add a new treatment record for a patient.
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
              <Button type="button" variant="outline" onClick={() => setShowAddRecordDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Save Record
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
