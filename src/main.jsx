import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

class AppErrorBoundary extends React.Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) return <div style={{padding: 24, color: "#fff", background: "#080a0f", minHeight: "100vh", fontFamily: "system-ui"}}><h1>HotVibe could not load</h1><p>Please refresh the page. If the problem continues, check the browser console.</p><pre style={{whiteSpace: "pre-wrap", color: "#ffb4b4"}}>{this.state.error.message}</pre></div>;
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode><AppErrorBoundary><App /></AppErrorBoundary></React.StrictMode>
);
