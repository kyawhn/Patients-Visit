import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import AppointmentCard from "@/components/AppointmentCard";
import PatientCard from "@/components/PatientCard";
import { Appointment, Patient } from "@shared/schema";

export default function Dashboard() {
  const [_, navigate] = useLocation();
  
  // Fetch today's appointments
  const { data: todayAppointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/today']
  });
  
  // Fetch recent patients
  const { data: allPatients = [] } = useQuery<Patient[]>({
    queryKey: ['/api/patients']
  });
  
  // Get sorted patients by last visit
  const recentPatients = [...allPatients]
    .filter(p => p.lastVisit)
    .sort((a, b) => {
      const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
      const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 3);

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-neutral-800">Dashboard</h2>
        <div className="text-sm text-neutral-700">{format(new Date(), "MMMM d, yyyy")}</div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-neutral-700">Today's Appointments</p>
          <p className="text-2xl font-medium text-primary">{todayAppointments.length}</p>
        </div>
        <div className="bg-white rounded-lg p-4 shadow">
          <p className="text-sm text-neutral-700">Pending Follow-ups</p>
          <p className="text-2xl font-medium text-accent">
            {/* This would be replaced with actual follow-up count */}
            3
          </p>
        </div>
      </div>

      {/* Today's Appointments */}
      {todayAppointments.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Today's Schedule</h3>
            <Button 
              variant="link" 
              className="text-primary text-sm p-0 h-auto"
              onClick={() => navigate('/calendar')}
            >
              View All
            </Button>
          </div>
          
          {todayAppointments.map(appointment => (
            <AppointmentCard 
              key={appointment.id} 
              appointment={appointment} 
            />
          ))}
        </div>
      )}

      {/* Recent Patients */}
      {recentPatients.length > 0 && (
        <div>
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-medium">Recent Patients</h3>
            <Button 
              variant="link" 
              className="text-primary text-sm p-0 h-auto"
              onClick={() => navigate('/patients')}
            >
              View All
            </Button>
          </div>
          
          {recentPatients.map(patient => (
            <PatientCard 
              key={patient.id} 
              patient={patient} 
              compact
            />
          ))}
        </div>
      )}
      
      {/* Empty state */}
      {todayAppointments.length === 0 && recentPatients.length === 0 && (
        <div className="text-center py-8">
          <h3 className="font-medium text-lg mb-2">Welcome to MediTrack!</h3>
          <p className="text-neutral-600 mb-4">Get started by adding patients and scheduling appointments</p>
          <div className="flex justify-center gap-2">
            <Button onClick={() => navigate('/patients')}>
              Add Patients
            </Button>
            <Button variant="outline" onClick={() => navigate('/calendar')}>
              Schedule Appointments
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
