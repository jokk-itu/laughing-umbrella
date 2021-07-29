namespace Contracts.Ingredient.Request
{
    public record CreateIngredientRequest
    {
        public string Name {get; init; }
        
        public string Supplier { get; init; }

        public CreateIngredientRequest() {}
    }
}