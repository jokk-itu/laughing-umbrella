using System;
using System.Threading.Tasks;
using MassTransit.Courier;

namespace Receive.Activities
{
    public class Activity : IActivity<ActivityArguments, ActivityLog>
    {
        public async Task<ExecutionResult> Execute(ExecuteContext<ActivityArguments> context)
        {
            Console.WriteLine("Activity Execute");
            return context.Completed(new { Id = Guid.NewGuid() });
        }

        public async Task<CompensationResult> Compensate(CompensateContext<ActivityLog> context)
        {
            Console.WriteLine("Activity Compensate");
            return context.Compensated();
        }
    }

    public interface ActivityLog
    {
        public Guid Id { get; set; }
    }

    public interface ActivityArguments
    {
        public Uri Uri { get; set; }
    }
}