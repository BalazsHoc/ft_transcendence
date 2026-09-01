import styles from "./ApiLog.module.css";

export function ApiLog({ log }: { log: string }) {
  return (
    <section className={styles.logBox}>
      <h3>Log</h3>

      <pre>{log || "No log yet."}</pre>
    </section>
  );
}
