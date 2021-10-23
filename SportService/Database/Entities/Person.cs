namespace Database.Entities
{
    public class Person
    {
        public long Id { get; set; }
        
        public string Name { get; set; }
        
        public long GenderId { get; set; }
        public Gender Gender { get; set; }
        
        public float Height { get; set; }
    }
}