import { TreatmentRecord } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/dateUtils";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";

interface RecordCardProps {
  record: TreatmentRecord;
}

export default function RecordCard({ record }: RecordCardProps) {
  const [_, navigate] = useLocation();
  
  // Fetch patient info
  const { data: patient } = useQuery({
    queryKey: [`/api/patients/${record.patientId}`]
  });
  
  const handleClick = () => {
    navigate(`/records/${record.id}`);
  };

  return (
    <Card className="mb-4 cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <div className="font-medium">{patient ? patient.name : "Loading..."}</div>
            <div className="text-xs text-neutral-700">{formatDate(record.date)}</div>
          </div>
          <Badge variant={record.followUpNeeded ? "outline" : "secondary"} className={
            record.followUpNeeded 
              ? "bg-accent bg-opacity-10 text-accent border-accent" 
              : "bg-status-success bg-opacity-10 text-status-success border-green-500"
          }>
            {record.followUpNeeded ? "Follow-up Needed" : "Completed"}
          </Badge>
        </div>
        <div className="text-sm mb-2">
          <span className="font-medium">Treatment: </span>
          {record.treatmentType}
        </div>
        {record.notes && (
          <div className="text-sm text-neutral-700 line-clamp-2">{record.notes}</div>
        )}
      </CardContent>
    </Card>
  );
}
