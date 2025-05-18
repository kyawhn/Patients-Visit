import { Plus } from "lucide-react";
import { Button } from "./ui/button";

interface AddButtonProps {
  onClick: () => void;
}

export default function AddButton({ onClick }: AddButtonProps) {
  return (
    <Button 
      size="icon" 
      onClick={onClick}
      className="bg-primary text-white rounded-full h-10 w-10 shadow-md hover:bg-primary/90"
    >
      <Plus className="h-5 w-5" />
    </Button>
  );
}
