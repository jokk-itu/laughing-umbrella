namespace Database.Entities.Nodes
{
    public record Ingredient
    {
        public int Id { get; init; }
        
        public string Name { get; init; }
        
        public int Weight { get; init; }
    }
}