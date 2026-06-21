export function ApiLog({ log }: { log: string }) {
  return (
    <section className="log-box">
      <h3>Log</h3>

      <pre>{log || "No log yet."}</pre>
    </section>
  );
}
