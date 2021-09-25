using System;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Receive.Observers
{
    public class ReceiveObserver : IReceiveObserver
    {
        private readonly ILogger<ReceiveObserver> _logger;

        public ReceiveObserver(ILogger<ReceiveObserver> logger)
        {
            _logger = logger;
        }
        
        public async Task PreReceive(ReceiveContext context)
        {
            _logger.LogDebug("PreReceive");
        }

        public async Task PostReceive(ReceiveContext context)
        {
            _logger.LogDebug("PostReceive");
        }

        public async Task PostConsume<T>(ConsumeContext<T> context, TimeSpan duration, string consumerType) where T : class
        {
            _logger.LogDebug("PostConsume");
        }

        public async Task ConsumeFault<T>(ConsumeContext<T> context, TimeSpan duration, string consumerType, Exception exception) where T : class
        {
            _logger.LogDebug("Oh no ConsumeFault");
        }

        public async Task ReceiveFault(ReceiveContext context, Exception exception)
        {
            _logger.LogDebug("Oh no receive fault");
        }
    }
}