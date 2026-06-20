import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
  errorMessage: string;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMessage: "",
  };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || "Unexpected client dashboard error",
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Client dashboard runtime error", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleClearSession = () => {
    localStorage.removeItem("client_access_token");
    localStorage.removeItem("client_refresh_token");
    localStorage.removeItem("client_user");
    window.location.href = "/";
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "24px",
          background:
            "radial-gradient(circle at top, rgba(29,78,216,0.16), transparent 35%), #020617",
          color: "#e5e7eb",
          fontFamily: "Inter, system-ui, sans-serif",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            border: "1px solid rgba(148,163,184,0.22)",
            borderRadius: "24px",
            padding: "28px",
            background: "rgba(15,23,42,0.82)",
            boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "16px",
              display: "grid",
              placeItems: "center",
              background: "rgba(239,68,68,0.12)",
              color: "#fca5a5",
              fontSize: "24px",
              marginBottom: "18px",
            }}
          >
            !
          </div>

          <h1
            style={{
              margin: "0 0 10px",
              fontSize: "24px",
              lineHeight: 1.2,
              color: "#ffffff",
            }}
          >
            Something went wrong
          </h1>

          <p
            style={{
              margin: "0 0 16px",
              color: "#cbd5e1",
              lineHeight: 1.6,
            }}
          >
            The RS Real Estate client dashboard hit a runtime error. Your data is safe.
            Try reloading the dashboard. If the issue continues, clear the saved session
            and log in again.
          </p>

          <div
            style={{
              margin: "0 0 22px",
              padding: "12px",
              borderRadius: "14px",
              background: "rgba(15,23,42,0.92)",
              border: "1px solid rgba(148,163,184,0.18)",
              color: "#94a3b8",
              fontSize: "13px",
              wordBreak: "break-word",
            }}
          >
            {this.state.errorMessage}
          </div>

          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button
              type="button"
              onClick={this.handleReload}
              style={{
                border: "0",
                borderRadius: "12px",
                padding: "10px 14px",
                background: "#1D4ED8",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Reload dashboard
            </button>

            <button
              type="button"
              onClick={this.handleClearSession}
              style={{
                border: "1px solid rgba(148,163,184,0.28)",
                borderRadius: "12px",
                padding: "10px 14px",
                background: "transparent",
                color: "#e5e7eb",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Clear session
            </button>
          </div>
        </div>
      </div>
    );
  }
}
