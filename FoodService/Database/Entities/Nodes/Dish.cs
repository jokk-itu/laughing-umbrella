namespace Database.Entities.Nodes
{
    public record Dish
    {
        public int Id { get; init; }
        
        public string Name { get; init; }
        
        public int Price { get; init; }

        public Dish() {}
    }
}