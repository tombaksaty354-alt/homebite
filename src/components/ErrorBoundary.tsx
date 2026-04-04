"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { FaExclamationTriangle, FaRedo } from "react-icons/fa";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="container py-5">
          <div className="row justify-content-center">
            <div className="col-md-6 text-center">
              <FaExclamationTriangle className="text-danger mb-3" size={60} />
              <h2 className="fw-bold mb-3">Oops! Terjadi Kesalahan</h2>
              <p className="text-muted mb-4">
                Maaf, terjadi kesalahan pada aplikasi. Silakan coba lagi.
              </p>
              {this.state.error && (
                <div className="alert alert-danger text-start" role="alert">
                  <small>{this.state.error.message}</small>
                </div>
              )}
              <button
                className="btn btn-primary"
                onClick={() => this.setState({ hasError: false, error: null })}
              >
                <FaRedo className="me-2" />
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
