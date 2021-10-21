namespace Contracts.Ingredient.Responses
{
    public record PostIngredientResponse
    {
        public int Id { get; init; }
        
        public string Name { get; init; }
        
        public int Weight { get; init; }
    }
}