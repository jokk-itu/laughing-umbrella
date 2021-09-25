using System;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Receive.Observers
{
    public class ConsumeObserver : IConsumeObserver
    {
        private readonly ILogger<ConsumeObserver> _logger;

        public ConsumeObserver(ILogger<ConsumeObserver> logger)
        {
            _logger = logger;
        }
        
        public async Task PreConsume<T>(ConsumeContext<T> context) where T : class
        {
            _logger.LogDebug("PreConsume {CorrelationId}", context.CorrelationId);
        }

        public async Task PostConsume<T>(ConsumeContext<T> context) where T : class
        {
            _logger.LogDebug("PostConsume {CorrelationId}", context.CorrelationId);
        }

        public async Task ConsumeFault<T>(ConsumeContext<T> context, Exception exception) where T : class
        {
            _logger.LogDebug("Oh no fault, {CorrelationId}", context.CorrelationId);
        }
    }
}