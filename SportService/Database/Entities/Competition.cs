using System;

namespace Database.Entities
{
    public class Competition
    {
        public long Id { get; set; }
        
        public string Place { get; set; }
        
        public DateTime Held { get; set; }
    }
}