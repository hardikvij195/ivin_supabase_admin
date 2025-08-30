import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface SearchAndFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  planFilter: string;
  onPlanFilterChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
}

export const SearchAndFilter = ({
  searchTerm,
  onSearchChange,
  planFilter,
  onPlanFilterChange,
  statusFilter,
  onStatusFilterChange,
}: SearchAndFilterProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center">
      <div className="flex-1 relative w-80 lg:w-full md:w-full">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <Input
          placeholder="Search users by name, email, or phone..."
          className="pl-10 h-10 border-gray-200 rounded-3xl bg-white"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
    </div>
  );
};
