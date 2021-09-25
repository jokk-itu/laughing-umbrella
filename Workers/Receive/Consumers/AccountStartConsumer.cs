using System;
using System.Threading.Tasks;
using MassTransit;
using MessageContracts;

namespace Receive.Consumers
{
    public class AccountStartConsumer : IConsumer<IAccountUpdateStart>
    {
        public Task Consume(ConsumeContext<IAccountUpdateStart> context)
        {
            return Task.Run(() =>
            {
                Console.WriteLine($"Starting AccountUpdate... \n {context.CorrelationId}");
                return Task.CompletedTask;
            });
        }
    }
}