import { useState, useEffect } from "react";
import { 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  format,
  addMonths,
  subMonths
} from "date-fns";
import { 
  ChevronLeft, 
  ChevronRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Appointment } from "@shared/schema";

interface CalendarGridProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

export default function CalendarGrid({ onDateSelect, selectedDate }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate);
  const [calendarDays, setCalendarDays] = useState<Date[]>([]);
  
  // Generate calendar days for the current month
  useEffect(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    setCalendarDays(days);
  }, [currentDate]);
  
  // Get appointments for the current month
  const { data: appointments = [] } = useQuery<Appointment[]>({
    queryKey: ['/api/appointments/range', { 
      start: startOfMonth(currentDate).toISOString(),
      end: endOfMonth(currentDate).toISOString()
    }]
  });
  
  // Check if a day has any appointments
  const hasAppointments = (day: Date) => {
    return appointments.some(appointment => {
      const appointmentDate = new Date(appointment.date);
      return isSameDay(appointmentDate, day);
    });
  };
  
  const handlePrevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  const handleDayClick = (day: Date) => {
    onDateSelect(day);
  };
  
  // Get day CSS classes
  const getDayClasses = (day: Date) => {
    let classes = "calendar-day aspect-square flex items-center justify-center text-sm rounded-full cursor-pointer";
    
    if (!isSameMonth(day, currentDate)) {
      classes += " text-neutral-400";
    }
    
    if (hasAppointments(day)) {
      classes += " bg-primary/10 text-primary font-medium";
    }
    
    if (isSameDay(day, new Date())) {
      classes += " border-2 border-primary font-medium";
    }
    
    if (isSameDay(day, selectedDate)) {
      classes += " bg-primary text-white font-medium";
    }
    
    return classes;
  };

  return (
    <div className="mb-6">
      {/* Month Selector */}
      <div className="flex items-center justify-between mb-4">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handlePrevMonth}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h3 className="font-medium">{format(currentDate, 'MMMM yyyy')}</h3>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleNextMonth}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      
      {/* Weekday Headers */}
      <div className="grid grid-cols-7 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
          <div key={index} className="text-center text-xs font-medium text-neutral-700">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => (
          <div
            key={index}
            className={getDayClasses(day)}
            onClick={() => handleDayClick(day)}
          >
            {format(day, 'd')}
          </div>
        ))}
      </div>
    </div>
  );
}
