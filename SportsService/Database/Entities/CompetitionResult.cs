namespace Database.Entities
{
    public class CompetitionResult
    {
        public long PersonId { get; set; }
        
        public long CompetitionId { get; set; }
        
        public long SportId { get; set; }
        
        
        public Person Person { get; set; }
        
        public Competition Competition { get; set; }
        
        public Sport Sport { get; set; }
        
        
        public float Result { get; set; }
    }
}