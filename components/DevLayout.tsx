import { ReactNode } from "react";

interface DevLayoutProps {
  children: ReactNode;
}

export default function DevLayout({ children }: DevLayoutProps) {
  return (
    <div style={{ 
      minHeight: "100vh", 
      background: "#0a0e1a", 
      color: "#e2e8f0", 
      fontFamily: "system-ui, sans-serif",
      padding: "20px"
    }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        {children}
      </div>
    </div>
  );
}