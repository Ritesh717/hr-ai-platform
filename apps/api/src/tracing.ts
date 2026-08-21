import { NodeSDK } from '@opentelemetry/sdk-node';
import { ConsoleSpanExporter } from '@opentelemetry/sdk-trace-node';

// OpenTelemetry bootstrap. Initialized before the NestJS app in main.ts so all
// auto-instrumentations (HTTP, Express, Mongoose) and manual spans in EmployeeAgentService
// are captured from process start.
//
// Exporter strategy:
//   - OTLP_ENDPOINT set  → use OTLP (Jaeger/Tempo in staging/production)
//   - not set            → console exporter (local dev / test environments)
//
// Full production observability (exemplar linking, dashboards) is deferred to Stage 11.
// recordInputs/recordOutputs are disabled in EmployeeAgentService's experimental_telemetry
// options — message content and tool I/O must never appear in trace attributes.
let sdk: NodeSDK | null = null;

export function initTracing(): void {
  if (sdk) return;

  const otlpEndpoint = process.env.OTLP_ENDPOINT;

  sdk = new NodeSDK({
    serviceName: 'hr-ai-platform-api',
    // When OTLP_ENDPOINT is set the SDK picks up the OtlpTraceExporter via the env-var-driven
    // auto-configuration from @opentelemetry/auto-instrumentations-node. When it isn't set we
    // fall back to ConsoleSpanExporter so local spans are visible without extra infra.
    ...(otlpEndpoint ? {} : { traceExporter: new ConsoleSpanExporter() }),
  });
  sdk.start();
}
