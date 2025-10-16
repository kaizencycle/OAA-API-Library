import React, { useState, useEffect } from 'react';

interface DomainInfo {
  name: string;
  owner: string;
  ipfsHash: string;
  integrityProof: string;
  expiresAt: number;
}

interface DomainRegistrationDashboardProps {
  onDomainRegistered?: (domain: string) => void;
}

export const DomainRegistrationDashboard: React.FC<DomainRegistrationDashboardProps> = ({ onDomainRegistered }) => {
  const [domain, setDomain] = useState('');
  const [agentId, setAgentId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [domainInfo, setDomainInfo] = useState<DomainInfo | null>(null);

  // Check domain availability
  const checkAvailability = async () => {
    if (!domain) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`/agents/homepage/check/${domain}`);
      const data = await response.json();
      setIsAvailable(data.available);
      setMessage(data.available ? 'Domain is available!' : 'Domain is already taken');
    } catch (error) {
      setMessage('Error checking domain availability');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get domain info
  const getDomainInfo = async () => {
    if (!domain) return;
    
    try {
      const response = await fetch(`/agents/homepage/info/${domain}`);
      const data = await response.json();
      if (data.ok) {
        setDomainInfo(data.domain);
      }
    } catch (error) {
      console.error('Error fetching domain info:', error);
    }
  };

  // Register domain
  const registerDomain = async () => {
    if (!domain || !agentId || !title || !description || !content) {
      setMessage('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/agents/homepage/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          agentId,
          title,
          description,
          content
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        setMessage(`Success! Domain ${domain}.gic registered for agent ${agentId}`);
        setDomainInfo(data.domain);
        onDomainRegistered?.(domain);
        // Reset form
        setDomain('');
        setAgentId('');
        setTitle('');
        setDescription('');
        setContent('');
        setIsAvailable(null);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error registering domain');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update domain
  const updateDomain = async () => {
    if (!domain || !agentId || !title || !description || !content) {
      setMessage('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/agents/homepage/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          domain,
          agentId,
          title,
          description,
          content
        })
      });

      const data = await response.json();
      
      if (data.ok) {
        setMessage(`Success! Domain ${domain}.gic updated for agent ${agentId}`);
        setDomainInfo(data.domain);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error updating domain');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (domain) {
      checkAvailability();
      getDomainInfo();
    }
  }, [domain]);

  return (
    <div className="domain-registration-dashboard">
      <div className="dashboard-header">
        <h2>🌐 .GIC Domain Registration</h2>
        <p>Register and manage .gic domains for AI Companions</p>
      </div>

      <div className="dashboard-content">
        <div className="form-section">
          <h3>Domain Information</h3>
          
          <div className="form-group">
            <label htmlFor="domain">Domain Name (without .gic)</label>
            <div className="input-with-button">
              <input
                type="text"
                id="domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="myagent"
                className="domain-input"
              />
              <button 
                onClick={checkAvailability}
                disabled={!domain || isLoading}
                className="check-button"
              >
                {isLoading ? 'Checking...' : 'Check'}
              </button>
            </div>
            {isAvailable !== null && (
              <div className={`availability-status ${isAvailable ? 'available' : 'taken'}`}>
                {isAvailable ? '✅ Available' : '❌ Taken'}
              </div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="agentId">Agent ID</label>
            <input
              type="text"
              id="agentId"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="agent-001"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="title">Page Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="My AI Companion"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of this AI companion..."
              className="form-textarea"
              rows={3}
            />
          </div>

          <div className="form-group">
            <label htmlFor="content">Page Content (Markdown)</label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="# Welcome to My AI Companion

This is my AI companion's homepage. I can help you with various tasks and provide assistance.

## My Capabilities
- Natural language processing
- Code generation
- Problem solving
- Creative writing"
              className="form-textarea"
              rows={10}
            />
          </div>

          <div className="form-actions">
            <button
              onClick={registerDomain}
              disabled={!domain || !agentId || !title || !description || !content || isLoading || !isAvailable}
              className="register-button"
            >
              {isLoading ? 'Registering...' : 'Register Domain'}
            </button>
            
            {domainInfo && (
              <button
                onClick={updateDomain}
                disabled={!domain || !agentId || !title || !description || !content || isLoading}
                className="update-button"
              >
                {isLoading ? 'Updating...' : 'Update Domain'}
              </button>
            )}
          </div>

          {message && (
            <div className={`message ${message.includes('Error') ? 'error' : 'success'}`}>
              {message}
            </div>
          )}
        </div>

        {domainInfo && (
          <div className="domain-info-section">
            <h3>Domain Information</h3>
            <div className="domain-details">
              <div className="detail-item">
                <strong>Domain:</strong> {domainInfo.name}.gic
              </div>
              <div className="detail-item">
                <strong>Owner:</strong> {domainInfo.owner}
              </div>
              <div className="detail-item">
                <strong>IPFS Hash:</strong> 
                <code className="ipfs-hash">{domainInfo.ipfsHash}</code>
              </div>
              <div className="detail-item">
                <strong>Integrity Proof:</strong> 
                <code className="integrity-proof">{domainInfo.integrityProof}</code>
              </div>
              <div className="detail-item">
                <strong>Expires:</strong> {new Date(domainInfo.expiresAt * 1000).toLocaleString()}
              </div>
              <div className="detail-item">
                <strong>URL:</strong> 
                <a href={`https://${domainInfo.name}.gic`} target="_blank" rel="noopener noreferrer">
                  {domainInfo.name}.gic
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .domain-registration-dashboard {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .dashboard-header {
          text-align: center;
          margin-bottom: 30px;
        }

        .dashboard-header h2 {
          color: #333;
          margin-bottom: 10px;
        }

        .dashboard-header p {
          color: #666;
          font-size: 1.1em;
        }

        .form-section {
          background: #f8f9fa;
          padding: 25px;
          border-radius: 10px;
          margin-bottom: 20px;
        }

        .form-section h3 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #e9ecef;
          padding-bottom: 10px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
          color: #333;
        }

        .input-with-button {
          display: flex;
          gap: 10px;
        }

        .domain-input {
          flex: 1;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
        }

        .form-input, .form-textarea {
          width: 100%;
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 5px;
          font-size: 16px;
          font-family: inherit;
        }

        .form-textarea {
          resize: vertical;
          min-height: 100px;
        }

        .check-button {
          padding: 10px 20px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
        }

        .check-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .availability-status {
          margin-top: 5px;
          font-weight: 600;
        }

        .availability-status.available {
          color: #28a745;
        }

        .availability-status.taken {
          color: #dc3545;
        }

        .form-actions {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .register-button, .update-button {
          padding: 12px 24px;
          border: none;
          border-radius: 5px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
        }

        .register-button {
          background: #28a745;
          color: white;
        }

        .register-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .update-button {
          background: #ffc107;
          color: #333;
        }

        .update-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .message {
          margin-top: 15px;
          padding: 10px;
          border-radius: 5px;
          font-weight: 600;
        }

        .message.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .message.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .domain-info-section {
          background: #e9ecef;
          padding: 25px;
          border-radius: 10px;
        }

        .domain-info-section h3 {
          margin-top: 0;
          color: #333;
          border-bottom: 2px solid #dee2e6;
          padding-bottom: 10px;
        }

        .domain-details {
          display: grid;
          gap: 10px;
        }

        .detail-item {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .detail-item strong {
          min-width: 120px;
          color: #333;
        }

        .ipfs-hash, .integrity-proof {
          background: #f8f9fa;
          padding: 2px 6px;
          border-radius: 3px;
          font-family: monospace;
          font-size: 12px;
          word-break: break-all;
        }

        .detail-item a {
          color: #007bff;
          text-decoration: none;
        }

        .detail-item a:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};

export default DomainRegistrationDashboard;