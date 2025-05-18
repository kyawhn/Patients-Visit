import { Appointment } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { formatTime, formatDuration } from "@/lib/dateUtils";
import { useLocation } from "wouter";

interface AppointmentCardProps {
  appointment: Appointment;
  withPatientName?: boolean;
}

export default function AppointmentCard({ 
  appointment, 
  withPatientName = true 
}: AppointmentCardProps) {
  const [_, navigate] = useLocation();
  
  // Fetch patient info if needed
  const { data: patient } = useQuery({
    queryKey: withPatientName ? [`/api/patients/${appointment.patientId}`] : null,
    enabled: withPatientName
  });

  const handleClick = () => {
    navigate(`/appointments/${appointment.id}`);
  };

  return (
    <Card className="mb-3 cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div>
            {withPatientName && (
              <div className="font-medium">
                {patient ? patient.name : "Loading..."}
              </div>
            )}
            <div className="text-sm text-neutral-700">{appointment.treatmentType}</div>
          </div>
          <div className="text-right">
            <div className="text-primary font-medium">{formatTime(appointment.date)}</div>
            <div className="text-xs text-neutral-700">{formatDuration(appointment.duration)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
