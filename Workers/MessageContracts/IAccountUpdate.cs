namespace MessageContracts
{
    public interface IAccountUpdate
    {
        string AccountId { get; }
        string Name { get; }
        int Age { get; }
        byte Gender { get; }
    }
}