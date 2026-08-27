namespace WhereIsIt.Domain.Enums;

public enum PlaceType
{
    Home = 1,
    Office = 2,
    Garage = 3,
    Storage = 4,
    Shop = 5,
    Farm = 6,
    Other = 99
}

public enum MediaType
{
    Image = 1,
    Video = 2,
    Document = 3
}

public enum ReminderType
{
    Warranty = 1,
    Expiry = 2,
    DocumentRenewal = 3,
    BatteryReplacement = 4,
    ApplianceService = 5,
    Custom = 99
}

public enum PermissionLevel
{
    View = 1,
    Edit = 2,
    Manage = 3
}

public enum SyncStatus
{
    Pending = 1,
    Synced = 2,
    Failed = 3
}

public enum SyncOperation
{
    Create = 1,
    Update = 2,
    Delete = 3
}
