using System;
using System.Threading.Tasks;
using MassTransit;
using MessageContracts;

namespace Receive.Consumers
{
    public class AccountCompleteConsumer : IConsumer<IAccountUpdateComplete>
    {
        public Task Consume(ConsumeContext<IAccountUpdateComplete> context)
        {
            return Task.Run(() =>
            {
                Console.WriteLine($"Completing AccountUpdate... {context.CorrelationId}");
                return Task.CompletedTask;
            });
        }
    }
}