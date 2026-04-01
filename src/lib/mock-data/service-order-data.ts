export type Status = "Scheduled" | "InProgress" | "Completed";
export type Priority = "High" | "Medium" | "Low";
export type ServiceType = "Internal" | "3rd Party";

export interface ServiceOrder {
  id: string;
  title: string;
  description: string;
  technician: string;
  scheduledDate: string;
  priority: Priority;
  serviceType: ServiceType;
  status: Status;
  location: string;
  customer: string;
}

export const TECHNICIANS = ["J. Martinez", "A. Chen", "S. Kumar", "M. Johnson", "R. Davis"];

export const STATUS_LABELS: Record<Status, string> = {
  Scheduled: "Scheduled",
  InProgress: "In Progress",
  Completed: "Completed",
};

export const INITIAL_ORDERS: ServiceOrder[] = [
  {
    id: "SO-1001",
    title: "Quarterly inverter inspection",
    description: "Routine quarterly inspection of inverter rack A-14.",
    technician: "J. Martinez",
    scheduledDate: "2026-03-30",
    priority: "High",
    serviceType: "Internal",
    status: "Scheduled",
    location: "Denver",
    customer: "SolarEdge Corp",
  },
  {
    id: "SO-1002",
    title: "Firmware patch deployment",
    description: "Deploy firmware v3.8.1 to field controllers.",
    technician: "A. Chen",
    scheduledDate: "2026-04-01",
    priority: "Medium",
    serviceType: "Internal",
    status: "Scheduled",
    location: "Houston",
    customer: "GridSync LLC",
  },
  {
    id: "SO-1003",
    title: "Battery module replacement",
    description: "Replace degraded lithium-ion module in rack B-7.",
    technician: "S. Kumar",
    scheduledDate: "2026-04-03",
    priority: "High",
    serviceType: "3rd Party",
    status: "Scheduled",
    location: "Chicago",
    customer: "PowerVault Inc",
  },
  {
    id: "SO-1004",
    title: "Network switch reconfiguration",
    description: "Reconfigure VLAN settings on monitoring switches.",
    technician: "M. Johnson",
    scheduledDate: "2026-04-05",
    priority: "Low",
    serviceType: "Internal",
    status: "Scheduled",
    location: "Dallas",
    customer: "SolarEdge Corp",
  },
  {
    id: "SO-1005",
    title: "Emergency transformer repair",
    description: "Urgent repair of step-up transformer unit T-3.",
    technician: "J. Martinez",
    scheduledDate: "2026-03-27",
    priority: "High",
    serviceType: "3rd Party",
    status: "InProgress",
    location: "New York",
    customer: "ConEdison Solar",
  },
  {
    id: "SO-1006",
    title: "Sensor calibration — Site B",
    description: "Calibrate irradiance and temperature sensors.",
    technician: "R. Davis",
    scheduledDate: "2026-03-28",
    priority: "Medium",
    serviceType: "Internal",
    status: "InProgress",
    location: "Phoenix",
    customer: "ArizonaSun Energy",
  },
  {
    id: "SO-1007",
    title: "HVAC controller update",
    description: "Update HVAC controllers to latest protocol.",
    technician: "A. Chen",
    scheduledDate: "2026-03-25",
    priority: "Low",
    serviceType: "Internal",
    status: "InProgress",
    location: "Denver",
    customer: "SolarEdge Corp",
  },
  {
    id: "SO-1008",
    title: "Panel cleaning — Zone 4",
    description: "Scheduled cleaning of solar panels in Zone 4.",
    technician: "S. Kumar",
    scheduledDate: "2026-03-26",
    priority: "Medium",
    serviceType: "3rd Party",
    status: "InProgress",
    location: "Houston",
    customer: "GridSync LLC",
  },
  {
    id: "SO-1009",
    title: "Annual compliance audit",
    description: "Full compliance audit per NIST 800-53 controls.",
    technician: "M. Johnson",
    scheduledDate: "2026-03-20",
    priority: "High",
    serviceType: "Internal",
    status: "Completed",
    location: "Chicago",
    customer: "PowerVault Inc",
  },
  {
    id: "SO-1010",
    title: "Grounding system test",
    description: "Test grounding resistance at all junction boxes.",
    technician: "R. Davis",
    scheduledDate: "2026-03-18",
    priority: "Low",
    serviceType: "Internal",
    status: "Completed",
    location: "Dallas",
    customer: "SolarEdge Corp",
  },
  {
    id: "SO-1011",
    title: "Inverter firmware rollback",
    description: "Rollback inverter firmware due to field issue.",
    technician: "J. Martinez",
    scheduledDate: "2026-03-22",
    priority: "Medium",
    serviceType: "3rd Party",
    status: "Completed",
    location: "New York",
    customer: "ConEdison Solar",
  },
  {
    id: "SO-1012",
    title: "Thermal imaging survey",
    description: "Conduct IR thermal imaging survey of panel arrays.",
    technician: "A. Chen",
    scheduledDate: "2026-04-08",
    priority: "Low",
    serviceType: "Internal",
    status: "Scheduled",
    location: "Phoenix",
    customer: "ArizonaSun Energy",
  },
];
