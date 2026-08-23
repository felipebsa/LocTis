import enum

class PropertyKind(enum.Enum):
    APARTMENT = "apartment"
    HOUSE = "house"
    COMMERCIAL_UNIT = "commercial_unit"
    WAREHOUSE = "warehouse"

class PropertyStatus(enum.Enum):
    AVAILABLE = "available"
    RENTED = "rented"
    MAINTENANCE = "maintenance"
    INACTIVE = "inactive"

class ContractStatus(enum.Enum):
    ACTIVE = "active"
    PENDING = "pending"
    EXPIRED = "expired"
    TERMINATED = "terminated"

class ServiceStatus(enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"