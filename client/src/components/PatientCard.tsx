import { Patient } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ChevronRight, Phone } from "lucide-react";
import { formatDate } from "@/lib/dateUtils";
import { useLocation } from "wouter";

interface PatientCardProps {
  patient: Patient;
  compact?: boolean;
}

export default function PatientCard({ patient, compact = false }: PatientCardProps) {
  const [_, navigate] = useLocation();
  
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };
  
  const handleClick = () => {
    navigate(`/patients/${patient.id}`);
  };

  if (compact) {
    return (
      <div 
        className="flex items-center bg-white rounded-lg p-3 shadow mb-3 cursor-pointer hover:shadow-md transition-shadow"
        onClick={handleClick}
      >
        <Avatar className="w-12 h-12 mr-3">
          <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="font-medium">{patient.name}</div>
          <div className="text-xs text-neutral-700">
            {patient.lastVisit ? `Last visit: ${formatDate(patient.lastVisit)}` : 'No previous visits'}
          </div>
        </div>
        <ChevronRight className="text-neutral-400 h-5 w-5" />
      </div>
    );
  }

  return (
    <div 
      className="py-3 flex items-center cursor-pointer hover:bg-neutral-50 transition-colors"
      onClick={handleClick}
    >
      <Avatar className="w-12 h-12 mr-3">
        <AvatarFallback>{getInitials(patient.name)}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <div className="font-medium">{patient.name}</div>
        <div className="text-xs text-neutral-700 flex items-center">
          <Phone className="h-3 w-3 mr-1" />
          <span>{patient.phone}</span>
        </div>
      </div>
      <ChevronRight className="text-neutral-400 h-5 w-5" />
    </div>
  );
}
