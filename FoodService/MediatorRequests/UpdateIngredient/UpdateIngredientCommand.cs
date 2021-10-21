namespace MediatorRequests.Requests.UpdateIngredient
{
    public class UpdateIngredientCommand
    {
        public int Id { get; init; }
        
        public string Name {get; init; }
        
        public string Supplier { get; init; }
    }
}