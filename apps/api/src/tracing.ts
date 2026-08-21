import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';

// Stage 2 story #5: OpenTelemetry bootstrap. Initialized before the NestJS app in main.ts so
// all auto-instrumentations (HTTP, Express, Mongoose) and manual spans in EmployeeAgentService
// are captured from process start. Full production observability (OTLP export to Tempo/Jaeger,
// exemplar linking) is Stage 11's job — the console exporter is enough for Stage 2's acceptance
// criterion ("traces are queryable locally").
//
// Call initTracing() from main.ts before NestFactory.create(). Calling it a second time is a
// no-op (the SDK guards against double-start).
let sdk: NodeSDK | null = null;

export function initTracing(): void {
  if (sdk) return;
  sdk = new NodeSDK({
    serviceName: 'hr-ai-platform-api',
    traceExporter: new ConsoleSpanExporter(),
  });
  sdk.start();
}
