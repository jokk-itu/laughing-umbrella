using System;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Send.Observers
{
    public class SendObserver : ISendObserver
    {
        private readonly ILogger<SendObserver> _logger;

        public SendObserver(ILogger<SendObserver> logger)
        {
            _logger = logger;
        }
        public async Task PreSend<T>(SendContext<T> context) where T : class
        {
            _logger.LogDebug("PreSend {CorrelationId}", context.CorrelationId);
        }

        public async Task PostSend<T>(SendContext<T> context) where T : class
        {
            _logger.LogDebug("PostSend {CorrelationId}", context.CorrelationId);
        }

        public async Task SendFault<T>(SendContext<T> context, Exception exception) where T : class
        {
            _logger.LogDebug("Oh no, fault {CorrelationId}", context.CorrelationId);
        }
    }
}