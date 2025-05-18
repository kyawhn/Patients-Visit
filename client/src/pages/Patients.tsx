import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Patient } from "@shared/schema";
import { Search } from "lucide-react";
import { useLocation } from "wouter";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import PatientCard from "@/components/PatientCard";
import AddButton from "@/components/AddButton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { patientFormSchema } from "@shared/schema";
import { createPatient } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Patients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddPatientDialog, setShowAddPatientDialog] = useState(false);
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Form setup
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

  // Fetch all patients
  const { data: patients = [], isLoading } = useQuery<Patient[]>({
    queryKey: [searchQuery ? '/api/patients/search' : '/api/patients', searchQuery ? { q: searchQuery } : undefined],
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddPatient = () => {
    setShowAddPatientDialog(true);
  };

  const onSubmit = async (data: any) => {
    try {
      await createPatient(data);
      form.reset();
      setShowAddPatientDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/patients'] });
      toast({
        title: "Success",
        description: "Patient added successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add patient",
        variant: "destructive",
      });
    }
  };

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-neutral-800">Patients</h2>
        <AddButton onClick={handleAddPatient} />
      </div>

      {/* Search Box */}
      <div className="relative mb-4">
        <Input 
          placeholder="Search patients..." 
          value={searchQuery}
          onChange={handleSearchChange}
          className="w-full bg-white pl-10"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400 h-4 w-4" />
      </div>

      {/* Patient List */}
      {isLoading ? (
        <div className="text-center py-8">Loading patients...</div>
      ) : (
        <div className="divide-y divide-neutral-200">
          {patients.length > 0 ? (
            patients.map(patient => (
              <PatientCard key={patient.id} patient={patient} />
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-neutral-600">No patients found</p>
              <Button 
                variant="link" 
                className="mt-2" 
                onClick={handleAddPatient}
              >
                Add a patient
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Add Patient Dialog */}
      <Dialog open={showAddPatientDialog} onOpenChange={setShowAddPatientDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Patient</DialogTitle>
            <DialogDescription>
              Enter the patient's information below.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input 
                  id="name" 
                  {...form.register("name")} 
                  placeholder="John Doe"
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
                  placeholder="+1 (555) 123-4567"
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
                  placeholder="johndoe@example.com"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input 
                  id="dateOfBirth" 
                  {...form.register("dateOfBirth")} 
                  placeholder="MM/DD/YYYY"
                />
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address" 
                  {...form.register("address")} 
                  placeholder="123 Main St, City, State, ZIP"
                />
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
              <Button type="button" variant="outline" onClick={() => setShowAddPatientDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                Add Patient
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
