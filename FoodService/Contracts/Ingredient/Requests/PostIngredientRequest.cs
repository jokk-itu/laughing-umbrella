namespace Contracts.Ingredient.Request
{
    public record PostIngredientRequest
    {
        public string Name {get; init; }
        
        public string Supplier { get; init; }

        public PostIngredientRequest() {}
    }
}