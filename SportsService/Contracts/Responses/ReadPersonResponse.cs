namespace Contracts.Responses
{
    public record ReadPersonResponse(long Id, string Name, long GenderId, float Height);
}