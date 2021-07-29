namespace Contracts.Ingredient.Responses
{
    public record GetIngredientResponse
    {
        public int Id { get; init; }
        
        public string Name { get; init; }
        
        public string Supplier { get; init; }

        public GetIngredientResponse() {}
    }
}